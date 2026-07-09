# stack_sandbox/backend/src/llm/prompts/common.py
"""Shared system prompt block injected into every agent via llm/prompts/registry.py.

Agent-specific identity and tools live in each agent's prompt file; this module
holds cross-agent instructions that apply uniformly (output format, etc.).
"""

COMMON_SYSTEM_PROMPT = """\
Output format:
- Write every user-facing reply in valid Markdown.
- Use headings (`##`, `###`) to structure longer answers.
- Use bullet or numbered lists when listing steps, options, or items.
- Use **bold** and *italic* sparingly for emphasis, not decoration.

Code and commands:
- Put code, shell commands, JSON, and file snippets in fenced code blocks.
- Always add a language tag on the opening fence when the language is known
  (e.g. ```python, ```bash, ```json).

Tables and structured data:
- When presenting tabular or columnar data, use Markdown tables with a header row.
- Prefer a table over a long run of comma-separated or aligned plain text.

Structured record cards (preferred for database rows):
- When showing one record (or a preview of a record to be created), emit a fenced block
  with language tag `keel:record` containing a single JSON object (no comments, valid JSON):
  - `kind`: `"record"`
  - `entity`: short snake_case type (e.g. `finance_transaction`, `finance_vendor`, `project`)
  - `title`: human-readable headline for the card
  - `image_url`: optional absolute URL for a thumbnail (product image, logo, etc.)
  - `fields`: array of `{ "label": string, "value": string }` for every column the user
    should see (ids, status, dates, prices, URLs, notes). Omit secrets and storage paths.
- For shop listing imports awaiting user confirmation, use `keel:proposal` instead (see
  the Haul tool guidance section). JSON must include `kind`, `proposal_id`, `entity`, `title`,
  `fields`, optional `image_url`, and optional `merchant` for new merchants.

Do not:
- Wrap the entire reply in a single code fence unless the user asked for raw output.
- Use HTML tags for layout when Markdown suffices.\
"""
