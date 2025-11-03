"""Anthropic provider adapter used by the orchestration layer.

This module intentionally avoids catching :class:`BaseException` in the request
loop so that critical interpreter exceptions such as ``KeyboardInterrupt`` and
``SystemExit`` can propagate.  Only ``Exception`` subclasses are handled, which
is the behaviour expected by the audit feedback referenced in the task.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Any, Callable, Dict, Mapping, MutableMapping, Optional

logger = logging.getLogger(__name__)


class ProviderRequestError(RuntimeError):
    """Represents a failure while calling the Anthropic provider."""


@dataclass
class AnthropicAdapter:
    """Thin wrapper around an Anthropic-compatible client.

    Parameters
    ----------
    client:
        Callable that performs the Anthropic API request.  The callable is
        expected to accept keyword arguments compatible with the Anthropic
        ``messages.create`` or ``completions.create`` method and return the raw
        response payload.
    model:
        Default model identifier.
    default_params:
        Optional dictionary with default keyword arguments that should be
        applied to each request.
    response_parser:
        Optional callable that transforms the raw provider response into the
        value returned to the caller.  The default parser extracts the
        ``completion`` field when present.
    """

    client: Callable[..., Any]
    model: str
    default_params: Optional[Mapping[str, Any]] = None
    response_parser: Optional[Callable[[Any], Any]] = None
    _mutable_defaults: MutableMapping[str, Any] = field(init=False, repr=False)

    def __post_init__(self) -> None:  # pragma: no cover - simple data setup
        self._mutable_defaults = dict(self.default_params or {})
        if "model" not in self._mutable_defaults:
            self._mutable_defaults["model"] = self.model

    def with_default(self, **params: Any) -> "AnthropicAdapter":
        """Return a shallow copy of the adapter with extended defaults."""

        merged = dict(self._mutable_defaults)
        merged.update(params)
        return AnthropicAdapter(
            client=self.client,
            model=self.model,
            default_params=merged,
            response_parser=self.response_parser,
        )

    def invoke(self, prompt: str, **params: Any) -> Any:
        """Execute a prompt using the configured Anthropic client.

        Any ``Exception`` raised by the underlying client is wrapped in a
        :class:`ProviderRequestError`.  Exceptions inheriting directly from
        :class:`BaseException` (for example ``KeyboardInterrupt``) are allowed to
        propagate so the host application can handle them appropriately.
        """

        payload: Dict[str, Any] = dict(self._mutable_defaults)
        payload.update(params)
        payload.setdefault("prompt", prompt)

        try:
            response = self.client(**payload)
        except Exception as exc:  # noqa: BLE001 - deliberate choice
            logger.exception("Anthropic provider call failed")
            raise ProviderRequestError("Anthropic request failed") from exc

        parser = self.response_parser or _default_response_parser
        return parser(response)


def _default_response_parser(response: Any) -> Any:
    """Default logic for extracting the textual completion from a response."""

    if isinstance(response, Mapping) and "completion" in response:
        return response["completion"]
    return response
