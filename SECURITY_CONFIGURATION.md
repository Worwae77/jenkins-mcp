# 🔐 Security Configuration Guide

## ⚠️ NEVER COMMIT REAL CREDENTIALS TO GIT ⚠️

**This project uses placeholder credentials in configuration files. Real credentials should NEVER be committed to version control.**

---

## 🛡️ **Secure Configuration Setup**

### 1. **Environment Variables (Recommended)**

Create `.env.local` file (already gitignored):

```bash
# Copy the template
cp .env.example .env.local

# Edit with your real credentials
nano .env.local
```

**`.env.local` should contain:**
```bash
JENKINS_URL=https://your-actual-jenkins.com
JENKINS_USERNAME=your-real-username
JENKINS_API_TOKEN=your-real-api-token
```

### 2. **VS Code MCP Configuration**

Create `.vscode/mcp.json.local` file (already gitignored):

```bash
# Copy the template
cp .vscode/mcp.json .vscode/mcp.json.local

# Edit with your real credentials
nano .vscode/mcp.json.local
```

**VS Code will automatically use `.vscode/mcp.json.local` if it exists.**

### 3. **Docker Environment File**

Create `docker.env.local` (already gitignored):

```bash
# docker.env.local
JENKINS_URL=https://your-actual-jenkins.com
JENKINS_USERNAME=your-real-username
JENKINS_API_TOKEN=your-real-api-token
JENKINS_SSL_VERIFY=true
```

**Use with Docker:**
```bash
docker run --env-file docker.env.local jenkins-mcp-server
```

---

## ❌ **What NOT to Do**

### NEVER commit these to Git:
- ❌ Real Jenkins URLs 
- ❌ Real usernames
- ❌ Real API tokens
- ❌ Real passwords
- ❌ Private keys
- ❌ Certificate files with real data

### Files to NEVER edit with real credentials:
- ❌ `.vscode/mcp.json` (use `.vscode/mcp.json.local` instead)
- ❌ `.env.example` (this is a template)
- ❌ `docker-compose.yml` (use environment files)
- ❌ Any file tracked by Git

---

## ✅ **Security Best Practices**

### 1. **Use API Tokens, Not Passwords**
```bash
# ✅ Good - API Token
JENKINS_API_TOKEN=11abc123def456...

# ❌ Bad - Password
JENKINS_PASSWORD=my-password
```

### 2. **Use .local Files for Real Credentials**
```bash
# ✅ Good - Local files (gitignored)
.env.local
.vscode/mcp.json.local
docker.env.local

# ❌ Bad - Tracked files
.env
.vscode/mcp.json
docker-compose.yml
```

### 3. **Regular Credential Rotation**
- Rotate Jenkins API tokens every 90 days
- Use different tokens for different environments
- Monitor token usage in Jenkins

### 4. **Environment-Specific Configurations**
```bash
# Development
.env.dev.local

# Staging  
.env.staging.local

# Production
.env.prod.local
```

---

## 🚨 **If Credentials Are Accidentally Committed**

### Immediate Actions:

1. **Rotate Credentials Immediately**:
   - Generate new Jenkins API token
   - Invalidate old token in Jenkins
   - Update all local configurations

2. **Clean Git History** (if repository is private):
   ```bash
   # Remove sensitive commits
   git filter-branch --force --index-filter \
     'git rm --cached --ignore-unmatch .vscode/mcp.json' \
     --prune-empty --tag-name-filter cat -- --all
   
   # Force push (DANGEROUS - only if repository is private)
   git push origin --force --all
   ```

3. **For Public Repositories**:
   - **Consider the credentials compromised forever**
   - Rotate immediately
   - Monitor for unauthorized access
   - Consider creating new repository if needed

---

## 📖 **Configuration Templates**

### **`.env.local` Template**
```bash
# Jenkins Server Configuration
JENKINS_URL=https://your-jenkins-server.com
JENKINS_USERNAME=your-username
JENKINS_API_TOKEN=your-api-token

# Optional Configuration
JENKINS_TIMEOUT=30000
JENKINS_RETRIES=3
LOG_LEVEL=info

# SSL Configuration
JENKINS_SSL_VERIFY=true
JENKINS_SSL_ALLOW_SELF_SIGNED=false

# Corporate Networks Only (INSECURE)
# JENKINS_SSL_BYPASS_ALL=true
```

### **`.vscode/mcp.json.local` Template**
```json
{
  "servers": {
    "jenkins-mcp": {
      "command": "deno",
      "args": ["task", "start"],
      "cwd": "${workspaceFolder}",
      "env": {
        "JENKINS_URL": "https://your-jenkins-server.com",
        "JENKINS_USERNAME": "your-username",
        "JENKINS_API_TOKEN": "your-api-token",
        "LOG_LEVEL": "debug"
      }
    }
  }
}
```

---

## 🔍 **Security Checklist**

Before any Git commit:

- [ ] ✅ No real credentials in any tracked files
- [ ] ✅ All `.local` files are gitignored
- [ ] ✅ Example files contain only placeholder values
- [ ] ✅ API tokens are rotated if accidentally exposed
- [ ] ✅ All sensitive files in `.gitignore`

**Remember: When in doubt, use `.local` files!** 🔐
