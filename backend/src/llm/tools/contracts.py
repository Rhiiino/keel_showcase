# stack_sandbox/backend/src/llm/tools/contracts.py
"""Types describing a tool: its schema, category, and async executor."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Awaitable, Callable


@dataclass(frozen=True)
class ToolContext:
    """Request-scoped context passed to every tool executor."""

    user_id: int
    project_id: int | None = None
    conversation_id: int | None = None


# A tool executor receives parsed JSON arguments plus request context.
ToolExecutor = Callable[[dict[str, Any], ToolContext], Awaitable[dict[str, Any]]]


@dataclass(frozen=True)
class ToolDefinition:
    """One tool: function schema (for the model) plus its server-side executor.

    The model only ever sees the function schema, so usage docs and the return
    format must live in `description` / `parameters` / `returns` (all folded into
    the schema by `to_openai_schema`), not in unreachable side metadata.
    """

    name: str
    category: str
    description: str  # what it does + when to use it
    parameters: dict[str, Any]  # JSON Schema; every property documented; required listed
    returns: str  # human-readable description of the return shape
    executor: ToolExecutor
    examples: list[str] | None = None  # optional short usage examples

    def to_openai_schema(self) -> dict[str, Any]:
        """Render this tool as an OpenAI function-tool schema.

        Folds `returns` and `examples` into the description so the model receives
        the full usage contract.
        """
        description = self.description
        if self.returns:
            description += f"\n\nReturns: {self.returns}"
        if self.examples:
            description += "\n\nExamples:\n" + "\n".join(f"- {e}" for e in self.examples)
        return {
            "type": "function",
            "function": {
                "name": self.name,
                "description": description,
                "parameters": self.parameters,
            },
        }
