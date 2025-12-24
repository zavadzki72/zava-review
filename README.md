# zava-review

> AI-powered code review for VSCode and CI/CD pipelines

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)

**zava-review** analyzes code diffs using AI and provides actionable feedback. It works both as a **VSCode extension** for local development and as a **CLI tool** for pull request pipelines.

## Features

- 🤖 **Multi-AI Support** - Claude, OpenAI, and Gemini
- 📝 **Inline PR Comments** - Azure DevOps and GitHub
- 🔍 **Diff-focused Analysis** - Only reviews changed code
- 📊 **Markdown Reports** - Detailed findings with severity levels
- ⚙️ **Configurable Rules** - Clean Code, SOLID, Performance, Security

## Quick Start

### Installation

```bash
# Clone and install
git clone https://github.com/your-org/zava-review.git
cd zava-review
npm install
npm run build
```

### Configuration

Create a `zava-review.yml` in your project root:

```yaml
languages:
  - typescript
  - csharp

rules:
  cleanCode: true
  solid: true
  performance: true
  security: true
  readability: true

ai:
  provider: claude
  model: claude-sonnet-4-20250514
```

### Environment Variables

Set your AI provider API key:

```bash
# Claude
export ANTHROPIC_API_KEY=your-key-here

# OpenAI
export OPENAI_API_KEY=your-key-here

# Gemini
export GOOGLE_API_KEY=your-key-here
```

## Usage

### CLI

```bash
# Analyze a diff file
zava-review analyze --config ./zava-review.yml --diff ./changes.diff

# Analyze and post to GitHub PR
zava-review analyze --platform github --pr 123

# Analyze and post to Azure DevOps PR
zava-review analyze --platform azure-devops --pr 456

# Output to markdown report
zava-review analyze --diff ./changes.diff --output report.md

# Dry run (analyze without posting comments)
zava-review analyze --platform github --pr 123 --dry-run
```

### VSCode Extension

1. Open Command Palette (`Ctrl+Shift+P`)
2. Run one of:
   - `Zava Review: Analyze All Files`
   - `Zava Review: Analyze Pending Changes`
   - `Zava Review: Configure`

## Project Structure

```
zava-review/
├── packages/
│   ├── core/          # Shared analysis engine
│   ├── cli/           # Pipeline CLI
│   └── vscode/        # VSCode extension
├── examples/
│   └── zava-review.yml
└── package.json
```

### Packages

| Package | Description |
|---------|-------------|
| `@zava-review/core` | Diff parsing, AI providers, analysis engine |
| `@zava-review/cli` | CLI for pipelines with GitHub/Azure DevOps |
| `zava-review-vscode` | VSCode extension |

## Configuration Reference

| Field | Description |
|-------|-------------|
| `languages` | Programming languages in your project |
| `rules.cleanCode` | Enable Clean Code analysis |
| `rules.solid` | Enable SOLID principles analysis |
| `rules.performance` | Enable performance analysis |
| `rules.security` | Enable security analysis |
| `rules.readability` | Enable readability analysis |
| `documentation.project` | Path to project docs (optional) |
| `documentation.architecture` | Path to architecture docs (optional) |
| `ai.provider` | AI provider: `claude`, `openai`, `gemini` |
| `ai.model` | Model identifier |
| `customPrompt` | Additional instructions for AI (optional) |

## Pipeline Integration

### GitHub Actions

```yaml
- name: Run zava-review
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
  run: |
    npx zava-review analyze \
      --platform github \
      --pr ${{ github.event.pull_request.number }}
```

### Azure DevOps Pipeline

```yaml
- script: |
    npx zava-review analyze \
      --platform azure-devops \
      --pr $(System.PullRequest.PullRequestId)
  env:
    AZURE_DEVOPS_TOKEN: $(System.AccessToken)
    ANTHROPIC_API_KEY: $(ANTHROPIC_API_KEY)
```

## Development

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Watch mode (core)
cd packages/core && npm run watch

# Run CLI locally
node packages/cli/dist/index.js analyze --help
```

## License

MIT
