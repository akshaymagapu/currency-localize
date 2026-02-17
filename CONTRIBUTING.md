# Contributing to currency-localize

Thanks for contributing.

## Ground Rules

- Keep changes small and focused.
- Write tests for behavior changes.
- Avoid breaking public APIs without prior discussion.
- Use Conventional Commits.

## Development Setup

```bash
npm install
npm test
npm run lint
```

## Pull Request Process

1. Open an issue first for large features.
2. Create a branch from `main`.
3. Add tests and docs with code changes.
4. Ensure CI is green.
5. Request review.

## Commit Message Rule

All commits on this repository should follow the Conventional Commits format:

```text
type(scope): short summary
```

Examples:
- `fix(parse): validate strict locale grouping`
- `feat(api): add deterministic trace metadata`
- `docs(readme): clarify strictParse behavior`
- `chore(ci): update actions/setup-node version`

## Coding Guidelines

- Prefer simple and explicit APIs.
- Use immutable money operations.
- Preserve locale-safe behavior via `Intl.NumberFormat`.
- Keep core package free from network calls (FX belongs in plugins).

## Release Policy

- Follow semver.
- Patch: bug fixes.
- Minor: backward-compatible features.
- Major: breaking API changes.

## Reporting Security Issues

Please do not open public issues for security vulnerabilities.
Email maintainers directly.
