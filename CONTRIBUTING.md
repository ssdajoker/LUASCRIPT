
# Contributing to LUASCRIPT

Welcome to LUASCRIPT! We're thrilled that you're interested in contributing to our revolutionary JavaScript-to-Lua transpiler with AI-powered development tools.

## 🌟 Our Mission

LUASCRIPT aims to bridge JavaScript and Lua ecosystems while providing Google SRE-level quality and an intelligent, distributed development environment.

## 🚀 Quick Start

### Prerequisites
- Node.js 14+ and npm
- Git
- Basic knowledge of JavaScript and/or Lua

### Setting Up Your Development Environment

1. **Fork and Clone**
   ```bash
   git clone https://github.com/YOUR_USERNAME/LUASCRIPT.git
   cd LUASCRIPT
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Run Tests**
   ```bash
   npm test
   ```

4. **Start Development**
   ```bash
   npm run dev
   ```

## 🎯 Ways to Contribute

### 1. Code Contributions
- Bug fixes
- New features
- Performance improvements
- Test coverage
- Documentation

### 2. Documentation
- Tutorials and guides
- API documentation
- Code examples
- Translation

### 3. Community Support
- Answer questions in Discussions
- Help triage issues
- Review pull requests
- Share your projects

### 4. Testing & Quality Assurance
- Report bugs
- Test edge cases
- Performance testing
- Security audits

## 📋 Contribution Process

### Finding Something to Work On

**Good First Issues**: Look for issues labeled `good first issue` - these are perfect for newcomers!

**Help Wanted**: Issues labeled `help wanted` need community assistance.

**Feature Requests**: Check `enhancement` label for new feature ideas.

### Making Changes

1. **Create a Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Your Changes**
   - Write clean, readable code
   - Follow our coding standards
   - Add tests for new functionality
   - Update documentation

3. **Test Your Changes**
   ```bash
   npm test
   npm run lint
   ```

4. **Commit Your Changes**
   ```bash
   git add .
   git commit -m "feat: add amazing new feature"
   ```
   
   Follow [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat:` New feature
   - `fix:` Bug fix
   - `docs:` Documentation
   - `test:` Tests
   - `refactor:` Code refactoring
   - `perf:` Performance improvement

5. **Push and Create Pull Request**
   ```bash
   git push origin feature/your-feature-name
   ```
   
   Then create a PR on GitHub with:
   - Clear title and description
   - Reference related issues
   - Screenshots/examples if applicable

## 💻 Coding Standards

### JavaScript Style Guide

```javascript
// Use const/let, not var
const transpiler = new Transpiler();

// Use arrow functions for callbacks
array.map(item => item.transform());

// Use async/await over promises
async function transpile(code) {
    const result = await parser.parse(code);
    return result;
}

// Add JSDoc comments
/**
 * Transpiles JavaScript code to Lua
 * @param {string} jsCode - JavaScript source code
 * @param {Object} options - Transpilation options
 * @returns {Promise<TranspileResult>}
 */
async function transpile(jsCode, options) {
    // Implementation
}
```

### Testing Standards

```javascript
// Write comprehensive tests
describe('Transpiler', () => {
    it('should transpile simple variable declarations', async () => {
        const input = 'const x = 5;';
        const result = await transpiler.transpile(input);
        expect(result.code).toBe('local x = 5');
    });
    
    it('should handle edge cases', async () => {
        const input = '';
        const result = await transpiler.transpile(input);
        expect(result.success).toBe(true);
    });
});
```

## 🔍 Code Review Process

### What We Look For

1. **Correctness**: Does it work as intended?
2. **Tests**: Are there adequate tests?
3. **Documentation**: Is it well-documented?
4. **Performance**: Is it efficient?
5. **Style**: Does it follow our guidelines?

### Review Timeline

- Initial review: Within 48 hours
- Follow-up reviews: Within 24 hours
- Merge: After 2 approvals from maintainers

## 🐛 Reporting Bugs

### Before Reporting

1. Check existing issues
2. Try the latest version
3. Reproduce the bug

### Bug Report Template

```markdown
**Description**
Clear description of the bug

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. See error

**Expected Behavior**
What should happen

**Actual Behavior**
What actually happens

**Environment**
- OS: [e.g., Ubuntu 20.04]
- Node.js version: [e.g., 16.14.0]
- LUASCRIPT version: [e.g., 1.0.0]

**Additional Context**
Any other relevant information
```

## 💡 Feature Requests

We love new ideas! When proposing features:

1. **Check existing requests** to avoid duplicates
2. **Describe the problem** you're trying to solve
3. **Propose a solution** with examples
4. **Consider alternatives** you've thought about
5. **Discuss impact** on existing functionality

## 🏆 Recognition

Contributors are recognized in:
- Release notes
- Contributors page
- Annual contributor awards
- Special badges for significant contributions

## 📞 Getting Help

### Communication Channels

- **GitHub Discussions**: General questions and discussions
- **Discord**: Real-time chat and support
- **Email**: security@luascript.org (for security issues only)

### Community Guidelines

1. **Be Respectful**: Treat everyone with respect
2. **Be Constructive**: Provide helpful feedback
3. **Be Patient**: Maintainers are volunteers
4. **Be Inclusive**: Welcome all skill levels

## 📚 Additional Resources

- [Architecture Guide](docs/architecture.md)
- [API Documentation](docs/api.md)
- [Development Setup](docs/development.md)
- [Testing Guide](docs/testing.md)
- [Plugin Development](docs/plugins.md)

## 🎓 Learning Resources

### For Beginners
- [JavaScript Basics](docs/javascript-basics.md)
- [Lua Fundamentals](docs/lua-fundamentals.md)
- [Git Tutorial](docs/git-tutorial.md)

### For Advanced Contributors
- [Transpiler Internals](docs/transpiler-internals.md)
- [Performance Optimization](docs/performance.md)
- [Distributed Systems](docs/distributed-systems.md)

## 📜 Code of Conduct

We are committed to providing a welcoming and inclusive environment. Please read our [Code of Conduct](CODE_OF_CONDUCT.md).

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## 🙏 Thank You!

Every contribution, no matter how small, makes LUASCRIPT better. We appreciate your time and effort!

---

**Questions?** Join our [Discord](https://discord.gg/luascript) or start a [Discussion](https://github.com/luascript/LUASCRIPT/discussions)!
