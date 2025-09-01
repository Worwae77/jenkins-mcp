# 🚀 Jenkins MCP Server - Proper Release Process

## ✅ **CI/CD-First Approach: GitHub Server-Only Tagging**

This document outlines the **correct** approach for releasing new versions using automated CI/CD, following DevOps best practices.

## 🚫 **What NOT to Do (Anti-Patterns)**

❌ **Manual Version Editing in Development:**
```bash
# WRONG - Manual editing of version files
vim deno.json                    # Don't manually change version
vim src/utils/version.ts         # Don't manually change version
git commit -m "bump version"     # Don't commit version changes locally
```

❌ **Working Directly on Main Branch:**
```bash
# WRONG - Violates ground rules
git checkout main
# Make changes directly to main
git push origin main  # Bypasses PR process
```

❌ **Inconsistent Release Artifacts:**
- Building binaries locally with different versions
- Docker images and binaries having mismatched versions
- Manual release creation without CI/CD validation

## ✅ **Correct Release Process**

### **1. Development Phase**
```bash
# Always use feature branches (mandatory ground rule)
git checkout -b feature/my-feature

# Develop your features...
# Version stays at "0.0.0-dev" in development

# Create PR when ready
git push origin feature/my-feature
# Create PR through GitHub UI
```

### **2. Release Preparation**
```bash
# After PR is merged to main, prepare for release
git checkout main
git pull origin main

# Check current version status
make version-info
```

### **3. Create Release Tag (GitHub Server Only)**
```bash
# Create and push git tag - this triggers automated CI/CD
git tag v2.5.0
git push origin v2.5.0
```

### **4. Automated CI/CD Pipeline**
Once the tag is pushed, GitHub Actions automatically:

1. **Quality Assurance:**
   - Runs comprehensive tests
   - Validates code quality
   - Ensures build consistency

2. **Version Injection:**
   - Extracts version from git tag (`v2.5.0` → `2.5.0`)
   - Injects version into source code
   - Updates both `deno.json` and `src/utils/version.ts`

3. **Cross-Platform Building:**
   - Builds Linux x64 binary
   - Builds macOS x64 binary  
   - Builds macOS ARM64 binary
   - Builds Windows x64 binary
   - All binaries have **identical version**

4. **Docker Image Building:**
   - Builds Docker image with same source code
   - Tags with exact version (`v2.5.0`)
   - Pushes to GitHub Container Registry
   - **Consistent with binary versions**

5. **GitHub Release Creation:**
   - Creates GitHub release automatically
   - Uploads all binaries as release assets
   - Generates SHA256 checksums
   - Provides comprehensive release notes

## 🔍 **Version Consistency Verification**

### **All Artifacts Have Same Version:**
- ✅ `jenkins-mcp-server-linux-x64 --version` → `v2.5.0`
- ✅ `jenkins-mcp-server-macos-x64 --version` → `v2.5.0`
- ✅ `jenkins-mcp-server-macos-arm64 --version` → `v2.5.0`
- ✅ `jenkins-mcp-server-windows-x64.exe --version` → `v2.5.0`
- ✅ Docker image: `ghcr.io/worwae77/jenkins-mcp:v2.5.0`

### **Verification Commands:**
```bash
# Check version from any built binary
./jenkins-mcp-server --version

# Check Docker image version
docker run ghcr.io/worwae77/jenkins-mcp:v2.5.0 --version

# Check git tag consistency
git tag --list | tail -1
```

## 🛠️ **Local Development Guidelines**

### **Version Management:**
```bash
# Check current version (extracted from git tags)
make version-info

# Development versions show:
# Version: 0.0.0-dev (from git tags)

# Released versions show:
# Version: 2.5.0 (from git tags)
```

### **Testing Release Process Locally:**
```bash
# Test the build process (without releasing)
make build-all

# Test Docker build with current version
make docker-build

# Test version extraction
./jenkins-mcp-server --version
```

## 🚨 **Emergency Hotfix Process**

Even for critical production issues, follow proper workflow:

```bash
# Create hotfix branch (never work on main directly)
git checkout main
git pull origin main
git checkout -b hotfix/critical-security-fix

# Make minimal fix
# Test thoroughly
git commit -m "hotfix: critical security vulnerability fix"
git push origin hotfix/critical-security-fix

# Create PR for review (even if fast-tracked)
# After PR merge, create hotfix tag
git checkout main
git pull origin main
git tag v2.5.1
git push origin v2.5.1
```

## 📋 **Release Checklist**

### **Before Creating Tag:**
- [ ] All PRs merged to main
- [ ] Local main branch updated (`git pull origin main`)
- [ ] CI/CD passing on main branch
- [ ] Release notes prepared
- [ ] Version number decided (semantic versioning)

### **Tag Creation:**
- [ ] Tag follows semantic versioning (`v2.5.0`)
- [ ] Tag pushed to GitHub server (`git push origin v2.5.0`)
- [ ] GitHub Actions workflow triggered

### **After Release:**
- [ ] Verify all binaries built successfully
- [ ] Verify Docker image published
- [ ] Verify version consistency across artifacts
- [ ] Test download and execution of binaries
- [ ] Update documentation if needed

## 🎯 **Benefits of This Approach**

1. **Version Consistency:** All artifacts (binaries + Docker) have identical versions
2. **Automated Quality:** Every release goes through full CI/CD validation
3. **Audit Trail:** Complete history of releases through git tags
4. **Security:** No manual version management reduces human error
5. **Compliance:** Follows DevOps best practices and ground rules
6. **Reproducibility:** Any release can be rebuilt from the exact git tag

## 🔗 **Related Documentation**

- [GitHub Actions Workflows](../.github/workflows/)
- [Makefile Build System](../Makefile)
- [Project Ground Rules](../.github/copilot-instructions.md)
- [CI/CD Integration](CI_CD_INTEGRATION.md)

---

**Remember: Releases should only come from GitHub workflows, triggered by git tags. No manual version management in development! 🎯**
