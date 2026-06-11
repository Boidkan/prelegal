"""Thin LiteLLM wrapper for structured-output completions.

Isolated here so the rest of the chat code depends on a small, testable seam
(`complete_structured`) rather than on LiteLLM directly.
"""

from __future__ import annotations

from typing import TypeVar

from litellm import completion
from pydantic import BaseModel

from ..config import settings

T = TypeVar("T", bound=BaseModel)


def complete_structured(messages: list[dict[str, str]], schema: type[T]) -> T:
    """Call the configured model and parse its reply into ``schema``.

    LiteLLM reads ``OPENAI_API_KEY`` from the environment. The model is asked to
    respond as JSON matching ``schema`` (OpenAI Structured Outputs).
    """
    response = completion(
        model=settings.llm_model,
        messages=messages,
        response_format=schema,
    )
    message = response.choices[0].message

    # Some LiteLLM/provider combinations return an already-parsed object.
    parsed = getattr(message, "parsed", None)
    if parsed is not None:
        return parsed if isinstance(parsed, schema) else schema.model_validate(parsed)

    content = message.content
    if not content:
        # Empty content (e.g. a refusal or non-stop finish) — fail loudly so the
        # router surfaces a 502 rather than a silently empty reply.
        raise ValueError("LLM returned no content for a structured-output request")
    return schema.model_validate_json(content)
