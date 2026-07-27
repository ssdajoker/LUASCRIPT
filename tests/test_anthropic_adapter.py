from pathlib import Path
import sys

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sologit.orchestration.providers.anthropic_adapter import (
    AnthropicAdapter,
    ProviderRequestError,
)


class DummyClient:
    def __init__(self, *, response=None, error=None):
        self.response = response
        self.error = error
        self.calls = []

    def __call__(self, **kwargs):
        self.calls.append(kwargs)
        if self.error is not None:
            raise self.error
        return self.response


def test_adapter_invokes_client_with_defaults():
    client = DummyClient(response={"completion": "done"})
    adapter = AnthropicAdapter(client=client, model="claude-3-sonnet")

    result = adapter.invoke("Hello", temperature=0.2)

    assert result == "done"
    assert client.calls == [
        {"model": "claude-3-sonnet", "prompt": "Hello", "temperature": 0.2}
    ]


def test_adapter_wraps_standard_exceptions():
    client = DummyClient(error=RuntimeError("boom"))
    adapter = AnthropicAdapter(client=client, model="claude-3-haiku")

    with pytest.raises(ProviderRequestError) as excinfo:
        adapter.invoke("Hello")

    assert "Anthropic request failed" in str(excinfo.value)


def test_keyboard_interrupt_is_not_swallowed():
    client = DummyClient(error=KeyboardInterrupt())
    adapter = AnthropicAdapter(client=client, model="claude-3-haiku")

    with pytest.raises(KeyboardInterrupt):
        adapter.invoke("Hello")
