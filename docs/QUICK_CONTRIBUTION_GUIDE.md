# Quick Contribution Guide 🚀

**4-Step GitHub Workflow for Jenkins MCP Server**

## 📝 Step 1: Open GitHub Issue

**Before coding, always create or claim an issue:**

### Issue Types & Templates
- 🐛 **Bug Report** → Use `.github/ISSUE_TEMPLATE/bug_report.md`
- ✨ **Feature Request** → Use `.github/ISSUE_TEMPLATE/feature_request.md`  
- 🔧 **SSL Implementation** → Use `.github/ISSUE_TEMPLATE/ssl-implementation.md`
- 🔒 **SSL Support** → Use `.github/ISSUE_TEMPLATE/ssl-support.md`

### Example Issue Creation
```text
Title: "Add jenkins_get_pipeline_logs tool"
Labels: enhancement, tools, good-first-issue
Template: feature_request.md

Description:
✅ Problem: Users need to access Jenkins pipeline logs through MCP
✅ Solution: New tool to fetch pipeline-specific logs  
✅ Use Case: AI assistants helping debug pipeline failures
✅ Acceptance Criteria: Tool returns formatted pipeline logs
```

**📍 Create Issue**: https://github.com/Worwae77/jenkins-mcp/issues/new/choose

---

## 🌿 Step 2: Create Development Branch  

```bash
# 1. Fork and clone repository
git clone https://github.com/your-username/jenkins-mcp.git
cd jenkins-mcp

# 2. Create branch referencing issue number
git checkout -b feature/issue-123-pipeline-logs-tool

# Branch naming convention:
# feature/issue-XXX-short-description
# fix/issue-XXX-short-description  
# docs/issue-XXX-short-description
```

---

## 🧪 Step 3: Build and Test

```bash
# 1. Setup development environment
make install

# 2. Make your changes following our patterns
# See .github/copilot-instructions.md for workflow

# 3. Run comprehensive testing
make quality     # TypeScript + lint + format
make test        # Run test suite  
make build       # Verify compilation
make deploy-test # Test all deployment methods

# 4. Add tests for new features
# See tests/ directory for examples
```

### Test Requirements
- ✅ Unit tests for new functions
- ✅ Integration tests for MCP tools
- ✅ Error handling tests
- ✅ Documentation tests

---

## 🚀 Step 4: Open Pull Request

```bash  
# 1. Commit with conventional format + issue reference
git add .
git commit -m "feat: add jenkins_get_pipeline_logs tool (fixes #123)"

# 2. Push branch
git push origin feature/issue-123-pipeline-logs-tool

# 3. Create PR via GitHub UI
```

### PR Requirements Checklist
- ✅ **Title**: `feat: add jenkins_get_pipeline_logs tool`
- ✅ **Description**: Include `Closes #123` or `Fixes #123`
- ✅ **Template**: Complete PR template checklist
- ✅ **Tests**: All CI checks passing
- ✅ **Documentation**: Update README.md if needed
- ✅ **Review**: Request review from maintainers

### PR Title Examples
```text
feat: add jenkins_get_pipeline_logs tool (closes #123)
fix: resolve authentication timeout issue (fixes #456)
docs: add SSL setup troubleshooting guide (closes #789)
test: add comprehensive SSL module testing (closes #101)
refactor: improve error handling in jenkins client (closes #202)
```

### Linking Issues in PR Description
```markdown
## Description
This PR adds a new MCP tool for fetching Jenkins pipeline logs.

## Closes Issues
Closes #123

## Type of Change
- [x] New feature (non-breaking change which adds functionality)

## Testing
- [x] Tests pass locally with `make test`
- [x] Added unit tests for new functionality
- [x] Manual testing completed with real Jenkins instance

## Documentation
- [x] Updated README.md tool list
- [x] Added JSDoc comments for new functions
- [x] Updated API documentation
```

---

## 🎯 Quick Commands Reference

```bash
# Quality checks (run before committing)
make quality

# Full test suite
make test  

# Build verification
make build

# Test all deployment methods
make deploy-test

# Format code
make fmt

# Lint code  
make lint

# Show all available commands
make help
```

---

## 🔗 Important Links

- **🏠 [Main Repository](https://github.com/Worwae77/jenkins-mcp)**
- **📝 [Create Issue](https://github.com/Worwae77/jenkins-mcp/issues/new/choose)**  
- **📋 [Contributing Guide](../CONTRIBUTING.md)** - Detailed guide
- **🏗️ [Implementation Workflow](../.github/copilot-instructions.md)** - Development patterns
- **🧪 [Test Coverage Report](../tests/TEST_COVERAGE_REPORT.md)** - Testing guidelines

---

## 💡 Tips for Success

### For First-Time Contributors
1. **Start Small**: Look for `good-first-issue` labels
2. **Ask Questions**: Comment on issues before starting work
3. **Follow Patterns**: Study existing code for consistent style
4. **Test Thoroughly**: Our CI is strict but helpful

### For Experienced Contributors  
1. **Check Roadmap**: See what features are planned
2. **Review Architecture**: Understand the MCP protocol implementation
3. **Consider Security**: Follow our security-first development approach
4. **Help Others**: Review PRs and answer questions

### Common Pitfalls to Avoid
- ❌ Starting work without creating/claiming an issue
- ❌ Not following branch naming convention
- ❌ Skipping tests or quality checks
- ❌ Not linking PR to issue properly
- ❌ Including credentials in code (use .env.local)

---

**🌟 Every contribution matters! Thank you for helping make Jenkins automation more accessible.**
