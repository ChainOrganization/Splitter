# Contributing to SplitChain

Thank you for your interest in contributing to SplitChain. This project is open source and community-driven. Every contribution — whether it's a bug fix, a new feature, a documentation improvement, or a test — makes a real difference.

Please take a few minutes to read this guide before opening an issue or pull request.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How to Contribute](#how-to-contribute)
- [Development Setup](#development-setup)
- [Branch Naming](#branch-naming)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)
- [Smart Contract Contributions](#smart-contract-contributions)
- [Frontend Contributions](#frontend-contributions)
- [Documentation Contributions](#documentation-contributions)

---

## Code of Conduct

By participating in this project, you agree to uphold a respectful and inclusive environment. We follow the [Contributor Covenant](https://www.contributor-covenant.org/). Harassment, discrimination, or hostile behavior of any kind will not be tolerated.

---

## How to Contribute

There are many ways to contribute:

- Fix a bug (check the Issues tab for `bug` labels)
- Implement a feature (check `enhancement` or `good first issue` labels)
- Improve documentation
- Write or improve tests
- Review open pull requests
- Report a security vulnerability (see [docs/SECURITY.md](docs/SECURITY.md))

---

## Development Setup

### 1. Fork and Clone

```bash
git clone https://github.com/ChainOrganization/Splitter.git
cd splitchain
```

### 2. Smart Contract (Rust / Soroban)

```bash
# Install Rust
curl https://sh.rustup.rs -sSf | sh

# Add WASM target
rustup target add wasm32-unknown-unknown

# Install Soroban CLI
cargo install --locked stellar-cli

# Build the contract
cd contract/splitchain-stellar
soroban contract build

# Run tests
cargo test
```

### 3. Frontend (React + TypeScript)

```bash
cd frontend/splitchain-ui
cp .env.example .env
npm install
npm run dev
```

---

## Branch Naming

Use descriptive, prefixed branch names:

| Prefix | Use for |
| --- | --- |
| `feat/` | New features |
| `fix/` | Bug fixes |
| `docs/` | Documentation only |
| `test/` | Adding or fixing tests |
| `refactor/` | Code refactoring without behavior change |
| `chore/` | Tooling, config, CI changes |

Examples:
- `feat/debt-netting-algorithm`
- `fix/settle-overflow-check`
- `docs/improve-api-reference`

---

## Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<scope>): <short description>

[optional body]

[optional footer]
```

Examples:
```
feat(contract): add expense description field to add_expense
fix(frontend): correct balance sign display in Balances page
docs(readme): update deployment instructions for testnet
test(contract): add edge case for zero-amount settlement
```

Types: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`, `style`, `perf`

---

## Pull Request Process

1. Make sure your branch is up to date with `main`
2. Run all tests before submitting (`cargo test` and `npm test`)
3. Fill out the pull request template completely
4. Link any related issues using `Closes #<issue-number>`
5. Request a review from a maintainer
6. Address all review comments before merging

PRs that break existing tests or lack a description will not be merged.

---

## Reporting Bugs

Before opening a bug report, please:
- Search existing issues to avoid duplicates
- Confirm the bug is reproducible

When filing a bug, include:
- A clear title and description
- Steps to reproduce
- Expected vs actual behavior
- Your environment (OS, Rust version, Node version, browser)
- Any relevant logs or screenshots

---

## Suggesting Features

Open a GitHub Issue with the `enhancement` label. Include:
- A clear description of the problem you're solving
- Your proposed solution
- Any alternatives you considered
- Why this would benefit other users

---

## Smart Contract Contributions

When modifying `contract/splitchain-stellar/contracts/splitchain/src/lib.rs`:

- Every new public function must have a corresponding test in `test.rs`
- All state-mutating functions must call `require_auth()` on the relevant signer
- Use `i128` for all monetary values (amounts are in stroops: 1 XLM = 10,000,000 stroops)
- Do not introduce `std` — the contract is `#![no_std]`
- Run `cargo test` and `soroban contract build` before submitting

---

## Frontend Contributions

When modifying `frontend/splitchain-ui/src/`:

- Follow the existing component structure (pages in `src/pages/`, helpers in `src/lib/`)
- Use TypeScript strictly — no `any` types
- Keep inline styles consistent with the existing dark theme
- Mark any direct contract calls with a `// TODO: wire to contract` comment if not yet implemented
- Run `npm run build` to confirm no TypeScript errors before submitting

---

## Documentation Contributions

Documentation lives in:
- `README.md` — project overview
- `CONTRIBUTING.md` — this file
- `docs/` — detailed guides

When updating docs:
- Keep language clear and direct
- Use code blocks for all commands and code snippets
- Update the table of contents if you add new sections
- Check that all internal links still work

---

Thank you for helping make SplitChain better.
