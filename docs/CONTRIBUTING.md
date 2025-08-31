# Contributing Guidelines

## Jenkins Model Context Protocol Server

**Version:** 1.0\
**Last Updated:** August 30, 2025\
**Target Audience:** Developers, Contributors, Maintainers

---

## Table of Contents

1. [Welcome](#welcome)
2. [Code of Conduct](#code-of-conduct)
3. [Getting Started](#getting-started)
4. [Development Setup](#development-setup)
5. [Contribution Types](#contribution-types)
6. [Development Workflow](#development-workflow)
7. [Coding Standards](#coding-standards)
8. [Testing Guidelines](#testing-guidelines)
9. [Documentation Standards](#documentation-standards)
10. [Review Process](#review-process)
11. [Release Process](#release-process)

---

## Welcome

Thank you for your interest in contributing to the Jenkins MCP Server! This
project enables AI assistants to interact with Jenkins CI/CD systems through the
Model Context Protocol.

### Project Goals

- **Reliability:** Provide stable, predictable Jenkins automation
- **Security:** Maintain secure access to Jenkins instances
- **Usability:** Enable intuitive AI-driven Jenkins interactions
- **Performance:** Ensure responsive operations at scale
- **Maintainability:** Keep codebase clean and well-documented

---

## Code of Conduct

### Our Standards

- **Be Respectful:** Treat all contributors with respect and professionalism
- **Be Inclusive:** Welcome contributors from all backgrounds and experience
  levels
- **Be Collaborative:** Work together to solve problems and improve the project
- **Be Constructive:** Provide helpful feedback and suggestions
- **Be Patient:** Understand that everyone is learning and improving

### Unacceptable Behavior

- Harassment, discrimination, or offensive language
- Personal attacks or trolling
- Publishing private information without permission
- Any conduct that creates an unwelcoming environment

### Reporting Issues

Report Code of Conduct violations to:
[maintainers@example.com](mailto:maintainers@example.com)

---

## Getting Started

### Prerequisites

Before contributing, ensure you have:

- **Deno Runtime:** v1.40 or later
- **Git:** For version control
- **VS Code:** Recommended IDE with Deno extension
- **Jenkins Access:** For testing (development instance recommended)

### Quick Start

```bash
# 1. Fork the repository on GitHub
# 2. Clone your fork
git clone https://github.com/YOUR-USERNAME/jenkins-mcp-server.git
cd jenkins-mcp-server

# 3. Set up remote upstream
git remote add upstream https://github.com/ORIGINAL-OWNER/jenkins-mcp-server.git

# 4. Install dependencies and verify setup
deno check src/**/*.ts

# 5. Create a feature branch
git checkout -b feature/your-feature-name
```

---

## Development Setup

### Environment Configuration

```bash
# Copy environment template
cp .env.example .env.local

# Configure for development
cat > .env.local << EOF
JENKINS_URL=http://jenkins-dev.example.com
JENKINS_USERNAME=dev-user
JENKINS_API_TOKEN=your-dev-token
LOG_LEVEL=debug
EOF
```

### VS Code Configuration

Install recommended extensions:

```bash
# Install Deno extension
code --install-extension denoland.vscode-deno

# Install additional helpful extensions
code --install-extension ms-vscode.vscode-json
code --install-extension bradlc.vscode-tailwindcss
```

Configure workspace settings in `.vscode/settings.json`:

```json
{
  "deno.enable": true,
  "deno.unstable": false,
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "denoland.vscode-deno",
  "typescript.suggest.autoImports": true
}
```

### Development Scripts

```bash
# Check TypeScript compilation
deno task check

# Format code
deno task fmt

# Run linter
deno task lint

# Start development server
deno task dev

# Run tests
deno task test
```

---

## Contribution Types

### Bug Fixes

- Fix functional issues
- Resolve security vulnerabilities
- Improve error handling
- Performance optimizations

### New Features

- Add new MCP tools
- Enhance existing functionality
- Improve user experience
- Add configuration options

### Documentation

- Update API documentation
- Improve code comments
- Create tutorials and guides
- Fix documentation errors

### Testing

- Add unit tests
- Create integration tests
- Improve test coverage
- Add performance tests

### Infrastructure

- CI/CD improvements
- Build process enhancements
- Development tooling
- Deployment automation

---

## Development Workflow

### 1. Planning

Before starting work:

1. **Check existing issues** for similar requests
2. **Create an issue** to discuss your proposal
3. **Get feedback** from maintainers
4. **Plan your approach** and timeline

### 2. Implementation

```bash
# Create feature branch
git checkout -b feature/short-description

# Make your changes
# - Write code
# - Add tests
# - Update documentation

# Commit frequently with descriptive messages
git add .
git commit -m "feat: add jenkins job creation functionality"
```

### 3. Testing

```bash
# Run full test suite
deno task test

# Check type safety
deno task check

# Verify formatting
deno task fmt --check

# Run linter
deno task lint
```

### 4. Documentation

- Update relevant documentation files
- Add/update inline code comments
- Create examples for new features
- Update changelog if applicable

### 5. Submission

```bash
# Push to your fork
git push origin feature/short-description

# Create Pull Request on GitHub
# - Use descriptive title
# - Fill out PR template
# - Link related issues
```

---

## Coding Standards

### TypeScript Guidelines

#### Type Safety

```typescript
// ✅ Good: Explicit types
interface JobConfig {
  name: string;
  type: "freestyle" | "pipeline";
  description?: string;
}

// ❌ Bad: Any types
function createJob(config: any): any {
  // ...
}

// ✅ Good: Proper typing
function createJob(config: JobConfig): Promise<JobResponse> {
  // ...
}
```

#### Error Handling

```typescript
// ✅ Good: Proper error handling
async function getJob(name: string): Promise<JobInfo> {
  try {
    validateJobName(name);
    const response = await client.getJob(name);
    return response;
  } catch (error) {
    logger.error("Failed to get job", { jobName: name, error });
    throw new Error(`Failed to retrieve job "${name}": ${error.message}`);
  }
}

// ❌ Bad: Silent failures
async function getJob(name: string): Promise<JobInfo | null> {
  try {
    return await client.getJob(name);
  } catch {
    return null; // Lost error context
  }
}
```

#### Async/Await

```typescript
// ✅ Good: Consistent async/await
async function processJobs(): Promise<void> {
  const jobs = await listJobs();
  await Promise.all(jobs.map((job) => processJob(job)));
}

// ❌ Bad: Mixing promises and async/await
async function processJobs(): Promise<void> {
  listJobs().then((jobs) => {
    jobs.forEach((job) => processJob(job)); // Not awaited
  });
}
```

### Code Organization

#### File Structure

```
src/
├── index.ts           # Main entry point
├── server.ts          # MCP server implementation
├── tools/
│   ├── index.ts       # Tool definitions and handlers
│   └── types.ts       # Tool-specific types
├── jenkins/
│   ├── client.ts      # Jenkins API client
│   ├── auth.ts        # Authentication handling
│   └── types.ts       # Jenkins-specific types
└── utils/
    ├── config.ts      # Configuration management
    ├── logger.ts      # Logging utilities
    └── validation.ts  # Input validation
```

#### Import Organization

```typescript
// Standard library imports first
import { serve } from "@std/http/server";

// Third-party imports
import { Server } from "@modelcontextprotocol/sdk/server/index.js";

// Local imports (absolute paths)
import { JenkinsClient } from "./jenkins/client.ts";
import { logger } from "./utils/logger.ts";
```

### Naming Conventions

- **Functions:** camelCase (`getUserInfo`)
- **Classes:** PascalCase (`JenkinsClient`)
- **Constants:** SCREAMING_SNAKE_CASE (`MAX_RETRIES`)
- **Interfaces:** PascalCase with descriptive names (`JobConfiguration`)
- **Files:** kebab-case (`job-manager.ts`)

### Documentation

````typescript
/**
 * Creates a new Jenkins job with the specified configuration.
 *
 * @param jobName - The name of the job to create
 * @param config - Job configuration object
 * @returns Promise that resolves to job creation result
 * @throws {ValidationError} When job name is invalid
 * @throws {AuthenticationError} When credentials are invalid
 * @throws {ConflictError} When job already exists
 *
 * @example
 * ```typescript
 * const result = await createJob('my-job', {
 *   type: 'freestyle',
 *   description: 'My test job'
 * });
 * ```
 */
async function createJob(
  jobName: string,
  config: JobConfiguration,
): Promise<JobCreationResult> {
  // Implementation
}
````

---

## Testing Guidelines

### Test Structure

```typescript
// tests/jenkins-client.test.ts
import { assertEquals, assertRejects } from "@std/testing/asserts";
import { JenkinsClient } from "../src/jenkins/client.ts";

Deno.test("JenkinsClient", async (t) => {
  await t.step("should authenticate with valid credentials", async () => {
    const client = new JenkinsClient({
      url: "http://test-jenkins",
      username: "test",
      apiToken: "valid-token",
    });

    // Test implementation
  });

  await t.step("should reject invalid credentials", async () => {
    const client = new JenkinsClient({
      url: "http://test-jenkins",
      username: "test",
      apiToken: "invalid-token",
    });

    await assertRejects(
      () => client.initialize(),
      Error,
      "Authentication failed",
    );
  });
});
```

### Test Categories

#### Unit Tests

- Test individual functions
- Mock external dependencies
- Focus on business logic
- Fast execution

#### Integration Tests

- Test component interactions
- Use test Jenkins instance
- Verify end-to-end workflows
- Realistic scenarios

#### Performance Tests

- Measure response times
- Test under load
- Memory usage validation
- Concurrent operation testing

### Mocking Guidelines

```typescript
// Mock Jenkins API responses
const mockJenkinsResponse = {
  jobs: [
    { name: "test-job", color: "blue", url: "http://jenkins/job/test-job/" },
  ],
};

// Use dependency injection for testability
class JenkinsClient {
  constructor(
    private config: JenkinsConfig,
    private httpClient: HttpClient = new DefaultHttpClient(),
  ) {}
}
```

---

## Documentation Standards

### Code Documentation

#### Functions and Methods

````typescript
/**
 * Brief description of what the function does.
 *
 * More detailed explanation if needed, including:
 * - Algorithm details
 * - Performance considerations
 * - Side effects
 *
 * @param paramName - Description of parameter
 * @param optionalParam - Description of optional parameter (default: value)
 * @returns Description of return value
 * @throws {ErrorType} Description of when this error is thrown
 *
 * @example
 * ```typescript
 * const result = await functionName('example');
 * console.log(result);
 * ```
 */
````

#### Classes and Interfaces

````typescript
/**
 * Represents a Jenkins API client for automation operations.
 *
 * This class handles:
 * - Authentication with Jenkins servers
 * - Request/response processing
 * - Error handling and retries
 * - CSRF protection
 *
 * @example
 * ```typescript
 * const client = new JenkinsClient({
 *   url: 'https://jenkins.example.com',
 *   username: 'user',
 *   apiToken: 'token'
 * });
 *
 * await client.initialize();
 * const jobs = await client.listJobs();
 * ```
 */
class JenkinsClient {
  // Implementation
}
````

### README Updates

When adding features, update relevant sections:

- **Features:** List new capabilities
- **Installation:** New dependencies or steps
- **Configuration:** New environment variables
- **Usage:** Examples of new functionality
- **API Reference:** Link to detailed docs

### Changelog

Follow [Keep a Changelog](https://keepachangelog.com/) format:

```markdown
## [1.1.0] - 2025-08-30

### Added

- New `jenkins_create_job` tool for job creation
- Support for pipeline job configuration
- Enhanced error handling for authentication

### Changed

- Improved performance of job listing operations
- Updated TypeScript to version 5.0

### Fixed

- Fixed CSRF token handling for newer Jenkins versions
- Resolved memory leak in long-running operations

### Security

- Updated dependencies to address security vulnerabilities
```

---

## Review Process

### Pull Request Requirements

Before submitting a pull request:

- [ ] All tests pass
- [ ] Code follows style guidelines
- [ ] Documentation is updated
- [ ] No breaking changes (or properly documented)
- [ ] Performance impact assessed
- [ ] Security implications considered

### Review Checklist

Reviewers will check:

#### Code Quality

- [ ] TypeScript types are correct and complete
- [ ] Error handling is comprehensive
- [ ] Code is readable and well-organized
- [ ] No code duplication

#### Testing

- [ ] Appropriate test coverage
- [ ] Tests actually verify expected behavior
- [ ] Edge cases are covered
- [ ] Performance tests for significant changes

#### Documentation

- [ ] Code comments are helpful and accurate
- [ ] Public APIs are documented
- [ ] README and guides are updated
- [ ] Examples work as shown

#### Security

- [ ] Input validation is proper
- [ ] No credential leaks
- [ ] Authentication is handled correctly
- [ ] Dependencies are secure

### Feedback Process

1. **Timely Reviews:** Maintainers aim to review PRs within 2-3 business days
2. **Constructive Feedback:** Reviews focus on improving code quality
3. **Collaborative Discussion:** Questions and suggestions are welcome
4. **Learning Opportunity:** Reviews help all participants learn

---

## Release Process

### Version Numbering

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR:** Breaking changes
- **MINOR:** New features (backward compatible)
- **PATCH:** Bug fixes (backward compatible)

### Release Workflow

1. **Feature Freeze:** No new features for release branch
2. **Testing:** Comprehensive testing of release candidate
3. **Documentation:** Update all relevant documentation
4. **Changelog:** Document all changes since last release
5. **Tagging:** Create git tag with version number
6. **Deployment:** Deploy to production environments
7. **Announcement:** Notify community of new release

### Release Responsibilities

#### Maintainers

- Review and approve releases
- Coordinate deployment
- Communicate with stakeholders

#### Contributors

- Test release candidates
- Report issues promptly
- Update dependent projects

---

## Getting Help

### Communication Channels

- **GitHub Issues:** Bug reports and feature requests
- **GitHub Discussions:** General questions and ideas
- **Discord/Slack:** Real-time chat (if available)
- **Email:** Direct contact with maintainers

### Mentorship

New contributors can get help with:

- Understanding the codebase
- Setting up development environment
- Learning TypeScript and Deno
- Contributing best practices

### Resources

- **Deno Documentation:** https://deno.land/manual
- **Model Context Protocol:** https://modelcontextprotocol.io/
- **Jenkins API:** https://www.jenkins.io/doc/book/using/remote-access-api/
- **TypeScript Handbook:** https://www.typescriptlang.org/docs/

---

## Recognition

### Contributors

All contributors are recognized in:

- Project README
- Release notes
- GitHub contributors page
- Annual contributor highlights

### Types of Contributions

We value all types of contributions:

- **Code:** Features, bug fixes, performance improvements
- **Documentation:** Guides, API docs, examples
- **Testing:** Test cases, bug reports, quality assurance
- **Community:** Helping other users, organizing events
- **Design:** UI/UX improvements, graphics, branding

---

## License

By contributing to this project, you agree that your contributions will be
licensed under the same license as the project (MIT License).

---

**Thank you for contributing to the Jenkins MCP Server project! 🚀**

_These guidelines are living documents and may be updated based on community
feedback and project evolution._
