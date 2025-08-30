# MCP Server Setup Guide

This guide shows you how to configure the Jenkins MCP Server with various AI
tools and development environments.

## 🚀 Quick Setup

The MCP configuration files are ready to use! Here's what's included:

### `.vscode/` Directory Contents

- **`mcp.json`** - Core MCP server configuration
- **`claude_desktop_config.json`** - Ready-to-use Claude Desktop config
- **`settings.json`** - VS Code workspace settings for Deno
- **`tasks.json`** - VS Code tasks for development workflow
- **`launch.json`** - Debug configurations
- **`README.md`** - Detailed setup instructions

## 🎯 Integration Options

### 1. Claude Desktop Integration

**Step 1**: Copy the configuration

```bash
# macOS
cp .vscode/claude_desktop_config.json ~/Library/Application\ Support/Claude/claude_desktop_config.json

# Windows  
copy .vscode\claude_desktop_config.json %APPDATA%\Claude\claude_desktop_config.json
```

**Step 2**: Update the file path in the config to match your system:

```json
{
  "mcpServers": {
    "jenkins-mcp-server": {
      "command": "deno",
      "args": [
        "run",
        "--allow-all",
        "/YOUR/FULL/PATH/TO/jenkins-mcp/src/simple-server.ts"
      ],
      "env": {
        "JENKINS_URL": "http://jenkins1.lab.127.0.0.1.nip.io",
        "JENKINS_USERNAME": "admin",
        "JENKINS_API_TOKEN": "116ff6632677def8eed7140bf738d859ce"
      }
    }
  }
}
```

**Step 3**: Restart Claude Desktop

### 2. VS Code Development

The VS Code configuration is automatically loaded when you open this workspace.

**Available Tasks** (Ctrl/Cmd + Shift + P → "Tasks: Run Task"):

- `Start Jenkins MCP Server` - Launch the server with environment variables
- `Check TypeScript` - Validate TypeScript compilation
- `Test MCP Server` - Run server with sample request
- `Lint Code` - Run Deno linter
- `Format Code` - Format TypeScript files
- `Build Executable` - Compile to standalone binary

**Debug Configuration**:

- Press F5 to start debugging
- Breakpoints work in TypeScript files
- Environment variables are pre-configured

### 3. Other MCP Clients

For other MCP-compatible tools, use this base configuration:

```json
{
  "jenkins-mcp-server": {
    "command": "deno",
    "args": ["run", "--allow-all", "path/to/src/simple-server.ts"],
    "env": {
      "JENKINS_URL": "your-jenkins-url",
      "JENKINS_USERNAME": "your-username",
      "JENKINS_API_TOKEN": "your-token"
    }
  }
}
```

## 🔧 Environment Configuration

### Security Setup

1. **Create `.env.local`** (if not exists):
   ```bash
   cp .env.example .env.local
   ```

2. **Update your credentials**:
   ```env
   JENKINS_URL=http://your-jenkins-url
   JENKINS_USERNAME=your-username
   JENKINS_API_TOKEN=your-api-token
   ```

3. **Verify connection**:
   ```bash
   ./start-server.sh
   ```

### Production Configuration

For production deployments, consider:

1. **Environment Variables**: Use system environment variables instead of files
2. **Secure Storage**: Store credentials in secure vaults
3. **Network Security**: Use HTTPS for Jenkins connections
4. **Access Control**: Limit Jenkins user permissions to required operations

## 🧪 Testing the Configuration

### Manual Testing

1. **Start the server**:
   ```bash
   ./start-server.sh
   ```

2. **Test tools endpoint**:
   ```bash
   echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | ./start-server.sh
   ```

3. **Test actual Jenkins operation**:
   ```bash
   echo '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"jenkins_list_jobs","arguments":{}}}' | ./start-server.sh
   ```

### VS Code Testing

1. Open Command Palette (Ctrl/Cmd + Shift + P)
2. Run "Tasks: Run Task"
3. Select "Test MCP Server"
4. Check output in terminal

### Claude Desktop Testing

After setup, try these prompts in Claude Desktop:

```
"List all my Jenkins jobs"
"Show me details for the customer-api-demo job"
"Trigger a build for test-job-2"  
"Help me troubleshoot a failed build"
```

## 📚 Available Capabilities

### 🛠️ Tools (Direct Actions)

- **jenkins_list_jobs** - Get all jobs with status
- **jenkins_get_job** - Detailed job information
- **jenkins_trigger_build** - Start builds with parameters

### 📁 Resources (Live Data)

- **jenkins://jobs** - Real-time job listings
- **jenkins://nodes** - Node and executor status
- **jenkins://queue** - Current build queue

### 💬 Prompts (AI Features)

- **jenkins_troubleshoot_build_failure** - Smart failure analysis
- **jenkins_pipeline_best_practices** - Expert recommendations

## 🔍 Troubleshooting

### Common Issues

1. **"Command not found: deno"**
   ```bash
   # Install Deno
   curl -fsSL https://deno.land/install.sh | sh
   ```

2. **"Authentication failed"**
   - Verify JENKINS_URL is accessible
   - Check JENKINS_USERNAME and JENKINS_API_TOKEN
   - Test with: `curl -u username:token jenkins-url/api/json`

3. **"Connection timeout"**
   - Increase JENKINS_TIMEOUT in configuration
   - Check network connectivity
   - Verify Jenkins server is running

4. **MCP server not recognized**
   - Restart the client application (Claude Desktop, VS Code)
   - Check file paths in configuration
   - Verify configuration file syntax

### Debug Mode

Enable detailed logging:

1. **In configuration files**:
   ```json
   {
     "env": {
       "LOG_LEVEL": "debug"
     }
   }
   ```

2. **In VS Code**: Use the debug launch configuration (F5)

3. **Command line**:
   ```bash
   export LOG_LEVEL=debug
   ./start-server.sh
   ```

## 🎉 Next Steps

1. **Customize for your Jenkins**: Update URLs and credentials
2. **Extend functionality**: Add more tools or prompts in `src/simple-server.ts`
3. **Share with team**: Distribute configuration files to teammates
4. **Automate setup**: Create setup scripts for your organization

---

**Your Jenkins MCP Server is now ready for AI-powered DevOps automation!** 🚀
