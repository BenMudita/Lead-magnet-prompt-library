# Send-to-Model Spike

Date: 2026-06-15

## Question

Can V1 safely prefill a prompt into ChatGPT or Claude through a stable official web URL?

## Sources checked

- OpenAI Help Center: ChatGPT Search and browser default search behavior.
- OpenAI Help Center: Prompt management in Playground.
- Anthropic Support: Claude Workbench.
- Anthropic Docs: Claude Code deep links.
- Anthropic Docs: Claude API prompt/prefill guidance.

## Finding

I did not find an official, stable consumer ChatGPT or Claude web URL contract that lets a third-party product prefill arbitrary prompt text into the normal chat UI.

Anthropic documents a Claude Code VS Code deep link with a `prompt` parameter, but that is for Claude Code/VS Code, not the consumer Claude web chat. API prompt-prefill references are also API-specific and do not establish a `claude.ai` web handoff.

OpenAI documents ChatGPT browser/search behavior and Playground prompt management, but not a supported third-party ChatGPT web prompt-prefill URL for this product use case.

## V1 decision

Use the PRD fallback:

1. Copy the prompt.
2. Open ChatGPT or Claude.
3. Show confirmation: "Prompt copied. Paste it into ChatGPT/Claude."

This is less magical than a prefilled URL, but it is reliable, clear, and avoids binding V1 to undocumented provider behavior.

