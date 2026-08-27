# Issue tracker: Linear

Issues and PRDs for this repo live in Linear. Access it via the `mcp__claude_ai_Linear` MCP connector available in this session — do not shell out to a CLI or REST API.

## Conventions

- No specific Linear team/project has been pinned for barbooks yet. When creating an issue for the first time in a session, ask the user which Linear team/project it belongs to, then reuse that choice for the rest of the session.
- **Create an issue**: use the Linear MCP tool for issue creation, with a clear title and full body/description (spec, acceptance criteria, etc.).
- **Read an issue**: use the Linear MCP tool for fetching an issue by ID/URL, including its comments and labels.
- **List issues**: use the Linear MCP tool for listing/searching issues, filtered by team/project, label, or state as needed.
- **Comment on an issue**: use the Linear MCP tool for adding a comment.
- **Apply / remove labels**: use the Linear MCP tool for updating an issue's labels — match label names against `triage-labels.md`.
- **Close / change status**: use the Linear MCP tool for updating issue state.

If the Linear MCP connector isn't authenticated in a given session, run its `authenticate` tool first.

## When a skill says "publish to the issue tracker"

Create a Linear issue via the MCP connector.

## When a skill says "fetch the relevant ticket"

Fetch the issue from Linear via the MCP connector, using the issue ID or URL the user provided.
