# LUASCRIPT Development Workflow
## Established by Linus Torvalds - GitHub Integration Lead

### Repository Structure
```
LUASCRIPT/
├── src/                    # Core transpiler implementation
│   ├── lexer/             # Lexical analysis
│   ├── parser/            # Syntax parsing
│   └── transpiler/        # Code generation
├── tests/                 # Test suite
├── examples/              # Example .ls files and outputs
├── docs/                  # Documentation
├── runtime/               # Runtime environment
├── web_ide/               # Web-based IDE
└── benchmarks/            # Performance testing
```

### Branching Strategy

#### Main Branches
- `main`: Production-ready code, always stable
- `develop`: Integration branch for features
- `release/*`: Release preparation branches

#### Feature Branches
- `feature/*`: New features (e.g., `feature/enhanced-parser`)
- `bugfix/*`: Bug fixes (e.g., `bugfix/lexer-memory-leak`)
- `hotfix/*`: Critical production fixes
- `linus/*`: Linus's integration and infrastructure work

#### Team Member Branches
- `donald/*`: Donald Knuth's algorithm optimizations
- `steve/*`: Steve Jobs's UX and design improvements
- `week2/*`: Week 2 core features completion

### Development Process

#### 1. Feature Development
```bash
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name
# Make changes
git add .
git commit -m "feat: descriptive commit message"
git push origin feature/your-feature-name
# Create PR to develop branch
```

#### 2. Code Review Requirements
- **Mandatory reviewers**: Donald Knuth (algorithms), Steve Jobs (UX)
- **Linus approval required** for: Core architecture, build system, CI/CD
- **Minimum 2 approvals** for any merge to develop
- **All tests must pass** before merge

#### 3. Release Process
```bash
git checkout develop
git checkout -b release/v1.x.x
# Final testing and bug fixes
git checkout main
git merge release/v1.x.x
git tag v1.x.x
git push origin main --tags
```

### Commit Message Standards
Following conventional commits:
- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Test additions/modifications
- `chore:` Build process or auxiliary tool changes

### Testing Requirements
- **Unit tests**: All new code must have >90% coverage
- **Integration tests**: End-to-end transpilation tests
- **Performance tests**: Benchmark against previous versions
- **Manual testing**: Web IDE functionality
- **IR harness**: Run `npm run harness` for fast regression coverage (determinism + timing guard, artifacts in [artifacts/harness_results.json](artifacts/harness_results.json)).

### CI/Status Bundle (local dry-run)
- Generate a local status bundle with `npm run status:bundle` (uses [scripts/status_bundle.js](scripts/status_bundle.js)).
- Populate optional env overrides before running: `WORKFLOW`, `RUN_ID` or `GITHUB_RUN_ID`, `GIT_SHA` or `GITHUB_SHA`, and test signals `TEST_STATUS`, `HARNESS_STATUS`, `IR_VALIDATE_STATUS`, `EMIT_GOLDENS_STATUS`, `PERF_STATUS`.
- Output: [artifacts/status.json](artifacts/status.json) matching [scripts/status_schema.json](scripts/status_schema.json). Fields default to `unknown` if unset.
- Keep `artifacts/` untracked; it is ignored in version control.

### Week 2 Core Features (94% Complete)
#### Remaining Tasks (6%):
1. **Memory optimization** in parser (Donald's domain)
2. **Error message improvements** (Steve's UX focus)
3. **Performance benchmarking integration** (Linus's infrastructure)
4. **Documentation updates** (Team effort)

### Emergency Protocols
- **Hotfixes**: Direct to main with immediate team notification
- **Build failures**: Automatic rollback, team alert
- **Security issues**: Private branch, security team review

### Team Responsibilities
- **Linus Torvalds**: GitHub integration, CI/CD, infrastructure
- **Donald Knuth**: Algorithm optimization, performance analysis
- **Steve Jobs**: User experience, interface design, documentation
- **Team**: Code review, testing, feature development

---
*"Talk is cheap. Show me the code." - Linus Torvalds*
