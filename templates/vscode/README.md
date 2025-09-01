# VS Code Configuration Templates

This directory contains template files for VS Code development setup. **These files are NOT tracked by Git** to prevent accidental credential exposure.

## 🚀 **Quick Setup**

1. **Copy templates to `.vscode/` directory**:
   ```bash
   mkdir -p .vscode
   cp templates/vscode/* .vscode/
   ```

2. **Edit with your real credentials**:
   ```bash
   nano .vscode/mcp.json          # Add your Jenkins credentials
   nano .vscode/launch.json       # Configure debugging
   ```

3. **Files in `.vscode/` are gitignored** - safe to add real credentials

## 📁 **Available Templates**

- **`mcp.json.template`** - MCP server configuration for Jenkins
- **`launch.json.template`** - Debug configuration  
- **`tasks.json.template`** - Build and development tasks
- **`settings.json.template`** - VS Code workspace settings

## 🔐 **Security Note**

The entire `.vscode/` directory is gitignored to prevent credential exposure. You can safely add real Jenkins credentials to files in `.vscode/` after copying from templates.

## 🎯 **Alternative: Environment Variables**

For maximum security, use environment variables instead of config files:

```bash
# .env.local (gitignored)
JENKINS_URL=https://your-jenkins.com
JENKINS_USERNAME=your-username
JENKINS_API_TOKEN=your-api-token
```
