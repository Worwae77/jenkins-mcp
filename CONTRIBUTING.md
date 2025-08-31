# Contributing to Jenkins MCP Server

Thank you for your interest in contributing to the Jenkins MCP Server! 🚀

This project enables AI assistants to interact with Jenkins CI/CD systems through the Model Context Protocol,
making Jenkins automation more accessible and intuitive.

## 🚀 Quick Start

### Prerequisites

- **Deno 2.0+**: [Install Deno](https://deno.land/manual/getting_started/installation)
- **Git**: Version control
- **Make**: Build system (usually pre-installed on macOS/Linux)
- **Docker** (optional): For containerized testing

### Setup Development Environment

```bash
# 1. Fork and clone the repository
git clone https://github.com/your-username/jenkins-mcp.git
cd jenkins-mcp

# 2. Install dependencies and setup environment
make install

# 3. Configure your Jenkins connection
cp .env.example .env.local
# Edit .env.local with your Jenkins details

# 4. Start development server
make dev

# 5. Run tests to verify setup
make test
```

## 🛠️ Development Workflow

### 1. Create a Branch

```bash
git checkout -b feature/amazing-feature
# or
git checkout -b fix/important-bug
```

### 2. Make Changes

Follow our coding standards:

- **TypeScript**: Strict typing with Deno's built-in checker
- **Formatting**: Run `make fmt` before committing
- **Linting**: Run `make lint` to check code quality
- **Testing**: Add tests for new features

### 3. Test Your Changes

```bash
# Run all quality checks
make quality

# Test all deployment methods
make deploy-test

# Build to ensure compilation works
make build
```

### 4. Commit and Push

```bash
git add .
git commit -m "feat: add amazing new feature"
git push origin feature/amazing-feature
```

### 5. Create Pull Request

- Use descriptive titles and detailed descriptions
- Reference any related issues
- Include screenshots for UI changes
- Ensure all CI checks pass

## 🎯 Contribution Types

We welcome all types of contributions:

### 🔧 **Code Contributions**

- **New Jenkins Tools**: Add more MCP tools for Jenkins operations
- **Bug Fixes**: Fix issues and improve reliability
- **Performance**: Optimize existing functionality
- **Security**: Improve authentication and security measures

### 📚 **Documentation**

- **API Documentation**: Improve tool documentation
- **User Guides**: Create tutorials and how-to guides
- **Examples**: Add real-world usage examples
- **README Improvements**: Enhance project documentation

### 🧪 **Testing**

- **Unit Tests**: Add test coverage for new features
- **Integration Tests**: Test real Jenkins integrations
- **Bug Reports**: Report issues with detailed reproduction steps
- **Performance Testing**: Benchmark and optimize performance

### 🎨 **Other Contributions**

- **CI/CD**: Improve GitHub Actions workflows
- **Docker**: Enhance containerization
- **Infrastructure**: Improve deployment and scaling
- **Community**: Help other users, answer questions

## 📋 Coding Standards

### TypeScript Guidelines

```typescript
// ✅ Good: Use strict typing
interface JenkinsJob {
  name: string;
  buildable: boolean;
  builds?: JenkinsBuild[];
}

// ✅ Good: Use descriptive names
async function getJobDetails(jobName: string): Promise<JenkinsJob> {
  // Implementation
}

// ❌ Avoid: Any types and unclear names
function getData(x: any): any {
  // Avoid this
}
```

### Error Handling

```typescript
// ✅ Good: Comprehensive error handling
try {
  const result = await jenkinsClient.getJob(jobName);
  return { success: true, data: result };
} catch (error) {
  console.error(`Failed to get job ${jobName}:`, error);
  return { 
    success: false, 
    error: `Job not found: ${jobName}` 
  };
}
```

### Documentation Comments

```typescript
/**
 * Triggers a Jenkins job build with optional parameters
 * @param jobName - The name of the Jenkins job to trigger
 * @param parameters - Optional build parameters
 * @returns Promise resolving to build information
 */
async function triggerJobBuild(
  jobName: string, 
  parameters?: Record<string, string>
): Promise<BuildResult> {
  // Implementation
}
```

## 🧪 Testing Guidelines

### Writing Tests

```typescript
// tests/jenkins-tools.test.ts
import { assertEquals } from "@std/testing/asserts";
import { JenkinsClient } from "../src/jenkins/client.ts";

Deno.test("Jenkins job listing", async () => {
  const client = new JenkinsClient({
    url: "http://test-jenkins",
    username: "test",
    apiToken: "test"
  });
  
  const jobs = await client.listJobs();
  assertEquals(Array.isArray(jobs), true);
});
```

### Running Tests

```bash
# Run all tests
make test

# Run specific test file
deno test --allow-net tests/specific-test.test.ts

# Run tests with coverage
deno test --coverage=coverage tests/
```

## 📝 Commit Message Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Feature
git commit -m "feat: add jenkins_get_pipeline_logs tool"

# Bug fix
git commit -m "fix: handle authentication timeout properly"

# Documentation
git commit -m "docs: add troubleshooting guide for Docker setup"

# Refactor
git commit -m "refactor: improve error handling in jenkins client"

# Test
git commit -m "test: add integration tests for build triggers"
```

### Types

- `feat`: New features
- `fix`: Bug fixes
- `docs`: Documentation changes
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements
- `style`: Code style changes

## 🔍 Pull Request Guidelines

### PR Title Format

```text
type(scope): brief description

Examples:
feat(tools): add jenkins_cancel_build tool
fix(auth): resolve API token validation issue
docs(readme): update installation instructions
```

### PR Description Template

```markdown
## Description
Brief description of what this PR does.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] Tests pass locally with `make test`
- [ ] Added tests for new functionality
- [ ] Manual testing completed

## Checklist
- [ ] Code follows project style guidelines (`make lint`)
- [ ] Code is properly formatted (`make fmt`)
- [ ] Self-review completed
- [ ] Documentation updated if needed
- [ ] No breaking changes (or clearly documented)
```

## 🚨 Issue Reporting

### Bug Reports

Use our bug report template:

```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Set up environment with '...'
2. Run command '...'
3. See error

**Expected behavior**
What you expected to happen.

**Environment:**
- OS: [e.g. macOS 13.0]
- Deno version: [e.g. 2.0.0]
- Jenkins version: [e.g. 2.400.0]

**Additional context**
Any other context about the problem.
```

### Feature Requests

Use our feature request template:

```markdown
**Is your feature request related to a problem?**
A clear description of what the problem is.

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
Alternative solutions or features you've considered.

**Additional context**
Any other context about the feature request.
```

## 🏗️ Build System

We use a modern Makefile-based build system:

```bash
# Show all available commands
make help

# Development workflow
make install       # Setup environment
make dev          # Start with auto-reload
make quality      # Run all quality checks
make test         # Run test suite

# Building
make build        # Build for current platform
make build-all    # Build for all platforms
make docker-build # Build Docker image

# Testing deployments
make docker-test  # Test Docker deployment
make deploy-test  # Test all deployment methods
```

## 📋 Release Process

### Version Numbering

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Checklist

1. **Update version** in `deno.json`
2. **Run quality checks**: `make quality`
3. **Build all platforms**: `make build-all`
4. **Test deployments**: `make deploy-test`
5. **Update CHANGELOG.md**
6. **Create GitHub release**
7. **Update Docker images**

## 🎉 Getting Help

### Communication Channels

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: Questions and community discussions
- **Pull Request Reviews**: Code-specific discussions

### Resources

- **📖 [Detailed Contributing Guide](docs/CONTRIBUTING.md)**: Comprehensive guide with all details
- **🏗️ [System Architecture](docs/architecture/SYSTEM_ARCHITECTURE.md)**: Technical design overview
- **📚 [API Reference](docs/api/API_REFERENCE.md)**: Complete tool documentation
- **🛠️ [VS Code Setup](.vscode/SETUP.md)**: IDE integration guide

## 🙏 Recognition

Contributors are recognized in:

- **Project README**: Contributors section
- **Release Notes**: Major contribution highlights
- **GitHub**: Automatic contributor recognition
- **Annual Reports**: Community highlights

## 📄 License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).

---

## 🌟 Thank You

Every contribution, no matter how small, makes this project better. Whether you're:

- 🐛 Fixing a typo
- 🚀 Adding a major feature  
- 📚 Improving documentation
- 🧪 Writing tests
- 💡 Suggesting improvements

**You're helping make Jenkins automation more accessible to everyone!**

---

### Happy Contributing! 🚀

*For detailed guidelines, see [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md)*
