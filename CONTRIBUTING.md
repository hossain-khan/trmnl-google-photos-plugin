# Contributing to TRMNL Google Photos Plugin

Thank you for your interest in contributing! This document provides guidelines for contributing to this project.

## 🚀 Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/trmnl-google-photos-plugin.git`
3. Create a feature branch: `git checkout -b feature/my-feature`
4. Install dependencies: `npm install`
5. Make your changes
6. Run tests: `npm test`
7. Commit and push your changes
8. Open a Pull Request

## 📋 Code Standards

This project follows strict TypeScript and code quality standards:

### TypeScript Requirements

- **100% TypeScript** - All code must be written in TypeScript (no JavaScript files)
- **Strict Mode** - We use `strict: true` in `tsconfig.json`
- **No `any` Types** - Avoid using `any`. Use proper types, generics, or `unknown` with type guards
- **Explicit Return Types** - All exported functions must have explicit return types
- **Type Annotations** - Add type annotations for function parameters

### Code Quality

- **Prettier** - All code must be formatted with Prettier
  - Run: `npm run format`
  - Check: `npm run format:check`
- **ESLint** - Code must pass ESLint checks
  - Run: `npm run lint`
  - Fix: `npm run lint:fix`
- **Tests** - All tests must pass
  - Run: `npm test`

### Before Submitting

Run these commands before submitting your PR:

```bash
# Format code
npm run format

# Run linter
npm run lint

# Run tests
npm test

# TypeScript type check
npx tsc --noEmit
```

All checks must pass before your PR can be merged.

## 🧪 Testing

- Write tests for new functionality
- Ensure existing tests pass
- Use `tsx --test` for running TypeScript tests
- Tests are located in `src/tests/test-*.ts`

## 📝 Commit Messages

Use clear, descriptive commit messages:

- `feat: Add new feature`
- `fix: Fix bug in photo fetching`
- `docs: Update README`
- `test: Add tests for URL parser`
- `refactor: Improve type safety`
- `style: Format code with Prettier`

## 🔍 Code Review

All submissions require code review. We'll review:

- TypeScript type safety
- Code quality and formatting
- Test coverage
- Documentation updates
- Performance implications

## 📚 Resources

- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Prettier Documentation](https://prettier.io/docs/en/)
- [ESLint Documentation](https://eslint.org/docs/latest/)
- [TRMNL Framework](https://usetrmnl.com/docs)

## ❓ Questions?

If you have questions, please:

1. Check existing issues and discussions
2. Read the [QUICKSTART.md](docs/QUICKSTART.md) guide
3. Open a new issue with your question

Thank you for contributing! 🎉
