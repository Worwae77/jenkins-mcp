# Contributing to Jenkins MCP Server - Organizational Use

This document outlines the contribution guidelines for the Jenkins MCP Server used within Kasikorn Bank for internal automation.

## 🏢 Organizational Development Guidelines

### Code Standards

#### TypeScript Standards
- Follow Deno TypeScript conventions
- Use strict type checking
- Document all public interfaces
- Include comprehensive error handling

#### Code Quality Requirements
```bash
# Run before committing
make quality          # Format, lint, type check
make test-unit        # Unit tests
make test-integration # Integration tests
```

### Security Requirements

#### Credential Handling
- **Never commit credentials** to version control
- Use `.env.org` for organizational configuration
- Rotate service account credentials quarterly
- Follow principle of least privilege

#### SSL/TLS Configuration
- SSL verification disabled for corporate environment
- Document any security exceptions
- Regular security review required

### Development Workflow

#### Setting Up Development Environment
```bash
# 1. Set up organizational environment
make check-org-env

# 2. Configure VS Code
cp templates/vscode/settings.json.template .vscode/settings.json
cp templates/vscode/launch.json.template .vscode/launch.json

# 3. Run tests
make test-all
```

#### Branch Strategy
- `main` branch for production-ready code
- `develop` branch for integration testing
- Feature branches: `feature/description`
- Hotfix branches: `hotfix/issue-description`

#### Pull Request Process
1. Create feature branch from `develop`
2. Implement changes with tests
3. Run full quality checks
4. Submit PR with detailed description
5. Code review by team lead
6. Integration testing
7. Merge to `develop`

### Testing Guidelines

#### Test Coverage Requirements
- Minimum 80% test coverage
- Unit tests for all business logic
- Integration tests for Jenkins API calls
- End-to-end tests for critical workflows

#### Test Categories
```bash
# Unit tests (fast)
make test-unit

# Integration tests (requires Jenkins access)
make test-integration

# End-to-end tests (full deployment)
make test-e2e
```

#### Mock Testing
- Mock Jenkins API calls in unit tests
- Use test doubles for external dependencies
- Maintain realistic test data

### Code Review Standards

#### Review Checklist
- [ ] Code follows TypeScript best practices
- [ ] All tests pass
- [ ] Security considerations addressed
- [ ] Documentation updated
- [ ] No hardcoded credentials
- [ ] Error handling implemented
- [ ] Performance considerations reviewed

#### Security Review
- [ ] No credentials in code
- [ ] Proper input validation
- [ ] SSL configuration documented
- [ ] Audit logging in place
- [ ] Access controls verified

### Documentation Requirements

#### Code Documentation
- JSDoc comments for all public functions
- README updates for new features
- API documentation for new endpoints
- Configuration examples

#### Organizational Documentation
- Deployment procedures
- Troubleshooting guides
- Security compliance notes
- Change log maintenance

### Release Process

#### Version Management
- Semantic versioning (MAJOR.MINOR.PATCH)
- Tag releases in Git
- Maintain CHANGELOG.md
- Document breaking changes

#### Deployment Process
```bash
# 1. Version bump
npm version patch  # or minor/major

# 2. Build organizational version
make docker-build-org

# 3. Run comprehensive tests
make test-comprehensive

# 4. Deploy to staging
make deploy-staging

# 5. Production deployment
make deploy-org
```

### Infrastructure & DevOps

#### Docker Best Practices
- Multi-stage builds for optimization
- Non-root user execution
- Health checks implementation
- Resource limits configuration

#### Monitoring & Logging
- Structured logging with timestamps
- Performance metrics collection
- Error tracking and alerting
- Audit trail maintenance

### Troubleshooting & Support

#### Common Development Issues

##### SSL/TLS Issues
```bash
# Debug SSL configuration
export JENKINS_SSL_DEBUG=true
make test-integration
```

##### Authentication Problems
```bash
# Verify credentials
make debug-auth
```

##### Build Failures
```bash
# Check TypeScript compilation
deno check src/**/*.ts

# Verify dependencies
deno task check
```

### Environment-Specific Guidelines

#### Development Environment
- Use local Jenkins instance when possible
- Mock external dependencies
- Enable debug logging
- Use development certificates

#### Staging Environment
- Mirror production configuration
- Use staging Jenkins instance
- Comprehensive testing
- Performance validation

#### Production Environment
- Organizational SSL configuration
- Service account credentials
- Audit logging enabled
- Resource monitoring

### Team Communication

#### Issue Reporting
- Use detailed issue templates
- Include environment information
- Provide reproduction steps
- Attach relevant logs

#### Feature Requests
- Business justification required
- Impact assessment
- Implementation timeline
- Testing requirements

### Compliance & Governance

#### Security Compliance
- Regular security scans
- Vulnerability assessments
- Compliance audit support
- Security training requirements

#### Change Management
- Change request documentation
- Impact assessment
- Rollback procedures
- Stakeholder notification

### Contact Information

#### Technical Support
- Primary: DevOps Team (devops@kasikornbank.com)
- Secondary: IT Infrastructure (it-infra@kasikornbank.com)

#### Security Issues
- Security Team: security@kasikornbank.com
- Emergency: security-emergency@kasikornbank.com

---

## Quick Reference

### Frequently Used Commands
```bash
# Development
make setup           # Initial setup
make test-all        # Run all tests
make quality         # Code quality checks

# Deployment
make deploy-org      # Organizational deployment
make stop-org        # Stop deployment
make clean-org       # Clean artifacts

# Debugging
make debug-auth      # Test authentication
make debug-ssl       # SSL diagnostics
make logs-org        # View deployment logs
```

### Code Style Examples

#### Error Handling
```typescript
async function jenkinAPICall(): Promise<Result<JobInfo, Error>> {
  try {
    const response = await this.client.get('/api/job/info');
    return Ok(response.data);
  } catch (error) {
    logger.error('Jenkins API call failed', { error: error.message });
    return Err(new Error(`Jenkins API error: ${error.message}`));
  }
}
```

#### Configuration
```typescript
const config = {
  jenkinsUrl: getRequiredEnv('JENKINS_URL'),
  username: getRequiredEnv('JENKINS_USERNAME'),
  token: getRequiredEnv('JENKINS_API_TOKEN'),
  sslVerify: parseBooleanEnv('JENKINS_SSL_VERIFY', false),
};
```

---

*Jenkins MCP Server - Kasikorn Bank Internal Development*  
*Last Updated: September 2025*