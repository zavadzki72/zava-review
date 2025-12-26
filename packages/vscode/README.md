# Zava Review

> 🤖 AI-powered code review for your workspace

Zava Review analyzes your code using AI (Claude, OpenAI, or Gemini) and provides actionable feedback directly in VSCode.

## Features

- **🔍 Analyze Pending Changes** - Review uncommitted changes before you commit
- **📁 Analyze All Files** - Full codebase analysis
- **🤖 Multi-AI Support** - Claude, OpenAI, and Gemini
- **📝 Markdown Reports** - Detailed findings with severity levels
- **⚙️ Configurable Rules** - Clean Code, SOLID, Performance, Security

## Quick Start

1. Create a `zava-review.yml` in your project root:

```yaml
languages:
  - typescript
  - javascript

rules:
  cleanCode: true
  solid: true
  performance: true
  security: true
  readability: true

ai:
  provider: gemini  # or: claude, openai
  model: gemini-2.0-flash
```

2. Configure your API key:
   - Open Command Palette (`Ctrl+Shift+P`)
   - Run `Zava Review: Configure`
   - Select your AI provider and enter your API key

3. Analyze your code:
   - `Ctrl+Shift+P` → `Zava Review: Analyze Pending Changes`

## Commands

| Command | Description |
|---------|-------------|
| `Zava Review: Analyze All Files` | Analyze entire workspace |
| `Zava Review: Analyze Pending Changes` | Analyze uncommitted git changes |
| `Zava Review: Configure` | Set API keys and create config |

## Configuration

### zava-review.yml

| Field | Description |
|-------|-------------|
| `languages` | Programming languages in your project |
| `rules.cleanCode` | Enable Clean Code analysis |
| `rules.solid` | Enable SOLID principles |
| `rules.performance` | Enable performance checks |
| `rules.security` | Enable security analysis |
| `rules.readability` | Enable readability checks |
| `ai.provider` | `claude`, `openai`, or `gemini` |
| `ai.model` | Model identifier |
| `customPrompt` | Additional instructions for AI |

## Requirements

- Git installed (for pending changes analysis)
- API key for your chosen AI provider

## Links

- [GitHub Repository](https://github.com/zavadzki72/zava-review)
- [Report Issues](https://github.com/zavadzki72/zava-review/issues)

## License

MIT
