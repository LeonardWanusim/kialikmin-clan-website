# Learning Claude Code with this project

## Tools on this computer

| Tool | Status | What it's for |
|------|--------|---------------|
| Claude Code (desktop app) | ✅ installed | Your AI pair-programmer |
| Git | ✅ installed | Tracks every change to your code |
| Node.js / npm | ✅ installed | Runs helper tools such as the local preview server |
| GitHub CLI (`gh`) | ✅ installed | Creates repos and pushes from the terminal |
| VS Code + Claude Code extension | optional | A code editor with Claude built in: `winget install Microsoft.VisualStudioCode`, then install the "Claude Code" extension |

## Skills: reusable instructions for Claude

You can use these in any session by typing a slash command:

- `/init`: writes or updates `CLAUDE.md`, which tells Claude how this project works.
- `/code-review`: Claude checks your changes for bugs.
- `/security-review`: important for this site, because it holds people's personal data.
- `/simplify`: tidies up code Claude or you wrote.
- `/ship-site`: **this project's own skill** (see `.claude/skills/ship-site/SKILL.md`). Read it to learn how skills work, then try making your own with the `skill-creator` skill.
- `setup-claude`: guided setup that suggests plugins and connectors for you.

## MCP connectors: let Claude operate your services directly (optional)

Run these in a terminal, then type `/mcp` in an interactive `claude` terminal session to log in:

```bash
claude mcp add --transport http supabase https://mcp.supabase.com/mcp
```
```bash
claude mcp add netlify -- npx -y @netlify/mcp
```

With these, you can say things like *"add a 'clan' column to members"* or *"show me the last Netlify deploy"*, and Claude can do it for you (it asks before making changes).

## Good first prompts to try

1. "Explain how a chief is stopped from seeing another place's members."
2. "Add a page listing upcoming clan meetings, editable by root."
3. "Add a 'clan / sub-clan' field to member registration."
4. "Replace the placeholder logo with assets/logo.png."
5. "/security-review"

## Habits that help

- Ask Claude to **explain before it changes** anything you don't understand.
- Commit often. Git lets you undo anything.
- Keep `CLAUDE.md` up to date. It is Claude's memory of your project.
