#!/usr/bin/env python3
"""
MCP bootstrapper:
- Start MCP server (optional)
- Wait for readiness
- Health-check endpoints
- Run copilot context refresh (+ optional launch)
Works on macOS/Linux/Windows with only stdlib.

Usage:
  python tools/mcp_bootstrap.py
  python tools/mcp_bootstrap.py --no-serve
  python tools/mcp_bootstrap.py --launch
  python tools/mcp_bootstrap.py --host 127.0.0.1 --port 8787 --timeout 60
"""

from __future__ import annotations

import argparse
import os
import re
import shutil
import signal
import subprocess
import sys
import time
import urllib.parse
import urllib.request
from typing import Dict, Optional, Tuple


def eprint(*args: object) -> None:
    print(*args, file=sys.stderr)


def which(cmd: str) -> Optional[str]:
    """Cross-platform command finder (prefers npm.cmd on Windows)."""
    if os.name == "nt":
        for candidate in (f"{cmd}.cmd", f"{cmd}.exe", f"{cmd}.bat", cmd):
            path = shutil.which(candidate)
            if path:
                return path
        return None
    return shutil.which(cmd)


def http_get(url: str, timeout: float) -> Tuple[int, str]:
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "mcp-bootstrap/1.0",
            "Accept": "*/*",
        },
        method="GET",
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        status = getattr(resp, "status", 200)
        body_bytes = resp.read()
        try:
            body = body_bytes.decode("utf-8", errors="replace")
        except Exception:
            body = repr(body_bytes[:2000])
        return status, body


def ensure_query_param(url: str, key: str, value: str) -> str:
    parts = urllib.parse.urlsplit(url)
    q = urllib.parse.parse_qs(parts.query, keep_blank_values=True)
    if key not in q or not q[key]:
        q[key] = [value]
    query = urllib.parse.urlencode({k: v[0] for k, v in q.items()})
    return urllib.parse.urlunsplit((parts.scheme, parts.netloc, parts.path, query, parts.fragment))


def default_endpoints(host: str, port: int) -> Dict[str, str]:
    base = f"http://{host}:{port}"
    return {
        "MCP_DOC_INDEX_ENDPOINT": f"{base}/doc-index/search",
        "MCP_FLAKE_DB_ENDPOINT": f"{base}/flake-db/flakes",
        "MCP_IR_SCHEMA_ENDPOINT": f"{base}/ir-schema",
    }


def run_cmd(cmd: list, cwd: str, env: Dict[str, str], check: bool = True, capture: bool = False) -> subprocess.CompletedProcess:
    if capture:
        return subprocess.run(
            cmd, cwd=cwd, env=env, text=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, check=check
        )
    return subprocess.run(cmd, cwd=cwd, env=env, check=check)


def start_server(npm_path: str, cwd: str, env: Dict[str, str]) -> subprocess.Popen:
    # Create a process group so we can terminate the whole thing cleanly.
    if os.name == "nt":
        creationflags = subprocess.CREATE_NEW_PROCESS_GROUP  # type: ignore[attr-defined]
        return subprocess.Popen(
            [npm_path, "run", "mcp:serve"],
            cwd=cwd,
            env=env,
            creationflags=creationflags,
        )
    else:
        return subprocess.Popen(
            [npm_path, "run", "mcp:serve"],
            cwd=cwd,
            env=env,
            preexec_fn=os.setsid,  # new process group
        )


def stop_server(proc: subprocess.Popen, grace: float = 6.0) -> None:
    if proc.poll() is not None:
        return

    try:
        if os.name == "nt":
            # Best-effort gentle stop
            try:
                proc.send_signal(signal.CTRL_BREAK_EVENT)  # type: ignore[attr-defined]
            except Exception:
                proc.terminate()
        else:
            os.killpg(os.getpgid(proc.pid), signal.SIGTERM)
    except Exception:
        try:
            proc.terminate()
        except Exception:
            pass

    deadline = time.time() + grace
    while time.time() < deadline:
        if proc.poll() is not None:
            return
        time.sleep(0.15)

    # Escalate
    try:
        if os.name == "nt":
            proc.kill()
        else:
            os.killpg(os.getpgid(proc.pid), signal.SIGKILL)
    except Exception:
        try:
            proc.kill()
        except Exception:
            pass


def wait_until_ready(url: str, timeout_s: float, interval_s: float, req_timeout_s: float) -> None:
    start = time.time()
    last_err = None
    while True:
        if time.time() - start > timeout_s:
            raise TimeoutError(f"Timed out waiting for server readiness at {url}. Last error: {last_err}")

        try:
            status, _ = http_get(url, timeout=req_timeout_s)
            if 200 <= status < 300:
                return
            last_err = f"HTTP {status}"
        except Exception as ex:
            last_err = repr(ex)

        time.sleep(interval_s)


def extract_copilot_mcp_endpoints(output: str) -> Optional[str]:
    # Looks for: COPILOT_MCP_ENDPOINTS=...
    m = re.search(r"\bCOPILOT_MCP_ENDPOINTS\s*=\s*(.+)", output)
    if not m:
        return None
    val = m.group(1).strip()

    # Strip wrapping quotes if present
    if (val.startswith("'") and val.endswith("'")) or (val.startswith('"') and val.endswith('"')):
        val = val[1:-1]

    return val


def extract_gemini_mcp_endpoints(output: str) -> Optional[str]:
    # Looks for: GEMINI_MCP_ENDPOINTS=...
    m = re.search(r"\bGEMINI_MCP_ENDPOINTS\s*=\s*(.+)", output)
    if not m:
        return None
    val = m.group(1).strip()

    # Strip wrapping quotes if present
    if (val.startswith("'") and val.endswith("'")) or (val.startswith('"') and val.endswith('"')):
        val = val[1:-1]

    return val


def main() -> int:
    ap = argparse.ArgumentParser(description="Bootstrap MCP server + refresh Copilot context.")
    ap.add_argument("--cwd", default=os.getcwd(), help="Repo root (default: current directory).")
    ap.add_argument("--host", default=os.environ.get("MCP_HOST", "localhost"))
    ap.add_argument("--port", type=int, default=int(os.environ.get("MCP_PORT", "8787")))
    ap.add_argument("--timeout", type=float, default=60.0, help="Max seconds to wait for server readiness.")
    ap.add_argument("--interval", type=float, default=0.5, help="Polling interval while waiting.")
    ap.add_argument("--req-timeout", type=float, default=3.0, help="HTTP request timeout for health checks.")
    ap.add_argument("--no-serve", action="store_true", help="Do not start the server (assume already running).")
    ap.add_argument("--launch", action="store_true", help="Also run npm run copilot:launch and extract COPILOT_MCP_ENDPOINTS.")
    ap.add_argument("--gemini", action="store_true", help="Also run npm run gemini:launch and extract GEMINI_MCP_ENDPOINTS.")
    ap.add_argument("--print-exports", action="store_true", help="Print shell export lines for the MCP endpoints.")
    args = ap.parse_args()

    npm = which("npm")
    if not npm:
        eprint("Could not find 'npm' on PATH. Install Node.js/npm, then try again.")
        return 2

    repo_cwd = os.path.abspath(args.cwd)

    # Endpoints: use env if set, else defaults.
    endpoints = default_endpoints(args.host, args.port)
    for k in list(endpoints.keys()):
        if os.environ.get(k):
            endpoints[k] = os.environ[k]

    # Ensure doc search has a q parameter for the health check call.
    doc_check_url = ensure_query_param(endpoints["MCP_DOC_INDEX_ENDPOINT"], "q", "test")

    if args.print_exports:
        if os.name == "nt":
            print(f'$env:MCP_DOC_INDEX_ENDPOINT="{endpoints["MCP_DOC_INDEX_ENDPOINT"]}"')
            print(f'$env:MCP_FLAKE_DB_ENDPOINT="{endpoints["MCP_FLAKE_DB_ENDPOINT"]}"')
            print(f'$env:MCP_IR_SCHEMA_ENDPOINT="{endpoints["MCP_IR_SCHEMA_ENDPOINT"]}"')
        else:
            print(f'export MCP_DOC_INDEX_ENDPOINT="{endpoints["MCP_DOC_INDEX_ENDPOINT"]}"')
            print(f'export MCP_FLAKE_DB_ENDPOINT="{endpoints["MCP_FLAKE_DB_ENDPOINT"]}"')
            print(f'export MCP_IR_SCHEMA_ENDPOINT="{endpoints["MCP_IR_SCHEMA_ENDPOINT"]}"')

    # Build subprocess env
    child_env = os.environ.copy()
    child_env.update(endpoints)

    server_proc: Optional[subprocess.Popen] = None

    def _handle_exit(signum, frame) -> None:  # noqa: ANN001
        if server_proc:
            stop_server(server_proc)
        raise SystemExit(130)

    signal.signal(signal.SIGINT, _handle_exit)
    if hasattr(signal, "SIGTERM"):
        signal.signal(signal.SIGTERM, _handle_exit)

    try:
        if not args.no_serve:
            print(f"Starting MCP server: npm run mcp:serve (cwd={repo_cwd})")
            server_proc = start_server(npm, repo_cwd, child_env)

        # Wait until IR schema endpoint is reachable (best readiness signal you gave).
        print(f"Waiting for MCP server readiness: {endpoints['MCP_IR_SCHEMA_ENDPOINT']}")
        wait_until_ready(
            endpoints["MCP_IR_SCHEMA_ENDPOINT"],
            timeout_s=args.timeout,
            interval_s=args.interval,
            req_timeout_s=args.req_timeout,
        )

        # Health checks
        print("Health-checking endpoints...")
        checks = [
            ("IR schema", endpoints["MCP_IR_SCHEMA_ENDPOINT"]),
            ("Doc search", doc_check_url),
            ("Flake DB", endpoints["MCP_FLAKE_DB_ENDPOINT"]),
        ]
        for name, url in checks:
            status, body = http_get(url, timeout=args.req_timeout)
            ok = 200 <= status < 300
            print(f"  - {name}: {status} {'OK' if ok else 'FAIL'} :: {url}")
            if not ok:
                snippet = body[:800].strip().replace("\n", "\\n")
                raise RuntimeError(f"{name} failed with HTTP {status}. Body (first 800 chars): {snippet}")

        # Refresh Copilot context
        print("Refreshing Copilot context: npm run copilot:context")
        run_cmd([npm, "run", "copilot:context"], cwd=repo_cwd, env=child_env, check=True)

        # Optional launch
        if args.launch:
            print("Running: npm run copilot:launch")
            cp = run_cmd([npm, "run", "copilot:launch"], cwd=repo_cwd, env=child_env, check=True, capture=True)
            out = cp.stdout or ""
            val = extract_copilot_mcp_endpoints(out)
            if val:
                if os.name == "nt":
                    print(f'$env:COPILOT_MCP_ENDPOINTS="{val}"')
                else:
                    print(f'export COPILOT_MCP_ENDPOINTS="{val}"')
            else:
                eprint("copilot:launch ran, but I couldn't find a COPILOT_MCP_ENDPOINTS=... line in its output.")
                eprint("Raw output (truncated):")
                eprint((out[:2000] + ("..." if len(out) > 2000 else "")))

        if args.gemini:
            print("Running: npm run gemini:launch")
            cp = run_cmd([npm, "run", "gemini:launch"], cwd=repo_cwd, env=child_env, check=True, capture=True)
            out = cp.stdout or ""
            val = extract_gemini_mcp_endpoints(out)
            if val:
                if os.name == "nt":
                    print(f'$env:GEMINI_MCP_ENDPOINTS="{val}"')
                else:
                    print(f'export GEMINI_MCP_ENDPOINTS="{val}"')
            else:
                eprint("gemini:launch ran, but I couldn't find a GEMINI_MCP_ENDPOINTS=... line in its output.")
                eprint("Raw output (truncated):")
                eprint((out[:2000] + ("..." if len(out) > 2000 else "")))

        print("Done.")
        return 0

    except Exception as ex:
        eprint(f"ERROR: {ex}")
        # If server died, surface that fact
        if server_proc and server_proc.poll() is not None:
            eprint(f"MCP server process exited with code {server_proc.returncode}.")
        return 1

    finally:
        # In local dev you might want the server to keep running; but “robust” means “clean exit”.
        if server_proc:
            stop_server(server_proc)


if __name__ == "__main__":
    raise SystemExit(main())
