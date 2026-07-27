# Repocalypse synchronization

LUASCRIPT uses Repocalypse 1.5.1 as a local verification and guarded Git
transport layer. GitHub pull-request administration remains the responsibility
of the connected GitHub app.

## One-time setup

1. Install Python 3.11 and create the Repocalypse virtual environment from the
   active combined source.
2. Set `REPOCALYPSE_HOME` to that active checkout. Do not point it at an
   archived IVC-only or No-Git-only checkout.
3. Authenticate GitHub CLI and configure Git credentials.
4. Initialize the sibling `LUASCRIPT.ivc-mirror` repository.

Example for this workstation:

```powershell
$env:REPOCALYPSE_HOME = 'C:\Users\ssdaj\Desktop\ACE-9\Repocalypse-beta.1-clean\Repocalypse'
```

## Operator commands

```powershell
.\scripts\repocalypse-sync.ps1 status
.\scripts\repocalypse-sync.ps1 doctor
.\scripts\repocalypse-sync.ps1 verify
.\scripts\repocalypse-sync.ps1 prefetch
.\scripts\repocalypse-sync.ps1 push-dry-run
.\scripts\repocalypse-sync.ps1 push
.\scripts\repocalypse-sync.ps1 mirror-update
```

`npm run repocalypse:verify` is the shared required gate. The wrapper refuses
to run unless both IVC and No-Git report version 1.5.1.

The tracked `nogit_state.yaml` is stable project configuration. Mutable
`.nogit` caches, bridge packets, locks, and local receipts are intentionally
ignored.

## Safety boundaries

- No-Git verifies and transports the current Git branch; it does not call
  GitHub APIs.
- Pull requests begin as drafts and are merged only after their checks and
  review threads are inspected.
- Auto-merge remains disabled.
- Write-capable historical workflows are retained under
  `.github/workflows-disabled` for audit and cannot execute there.
- The IVC bridge is advisory because its sibling mirror is machine-local.
- No branch deletion, tag rewriting, force-push, release creation, or
  repository-setting change is part of this workflow.
