# Jenkins MCP Server

A Model Context Protocol (MCP) server for Jenkins automation and management in
enterprise environments.

**Status:** ✅ MVP Complete | **Version:** 1.0.0 | **Last Updated:** August 31,
2025

# Jenkins MCP Server

A Model Context Protocol (MCP) server for Jenkins automation and management in enterprise environments.

**Status:** ✅ Production Ready | **Version:** 1.0.0 | **Last Updated:** August 31, 2025

## 🚀 Quick Start

### Installation Options

#### Option 1: Docker (Recommended) 🐳

**No Deno installation required - just Docker!**

```bash
# Pull the image
docker pull ghcr.io/your-org/jenkins-mcp-server:latest

# Run with environment variables
docker run -e JENKINS_URL=https://your-jenkins.com \
           -e JENKINS_USERNAME=your-username \
           -e JENKINS_API_TOKEN=your-api-token \
           -i ghcr.io/your-org/jenkins-mcp-server:latest

# Or use docker-compose
wget https://raw.githubusercontent.com/your-org/jenkins-mcp-server/main/docker-compose.yml
# Edit environment variables in docker-compose.yml
docker-compose up
```

#### Option 2: Standalone Binary 📦

**No runtime dependencies - self-contained executable!**

```bash
# Download for your platform from GitHub Releases
# Linux x64
curl -L -o jenkins-mcp-server https://github.com/your-org/jenkins-mcp-server/releases/latest/download/jenkins-mcp-server-linux-x64

# macOS x64
curl -L -o jenkins-mcp-server https://github.com/your-org/jenkins-mcp-server/releases/latest/download/jenkins-mcp-server-macos-x64

# macOS ARM64
curl -L -o jenkins-mcp-server https://github.com/your-org/jenkins-mcp-server/releases/latest/download/jenkins-mcp-server-macos-arm64

# Windows x64 (PowerShell)
Invoke-WebRequest -Uri https://github.com/your-org/jenkins-mcp-server/releases/latest/download/jenkins-mcp-server-windows-x64.exe -OutFile jenkins-mcp-server.exe

# Make executable (Linux/macOS)
chmod +x jenkins-mcp-server

# Run with environment variables
JENKINS_URL=https://your-jenkins.com \
JENKINS_USERNAME=your-username \
JENKINS_API_TOKEN=your-api-token \
./jenkins-mcp-server
```

#### Option 3: From Source (Development) 🛠️

**For development and customization:**

```bash
# Prerequisites: Deno runtime v1.37+
# Clone and setup
git clone <your-repo-url>
cd jenkins-mcp

# Create environment configuration
cp .env.example .env.local
# Edit .env.local with your Jenkins details

# Start the server
./start-server.sh
```

### Build & Test

```bash
# Check TypeScript compilation
deno task check

# Build executable
deno task build

# Format and lint code
deno task fmt && deno task lint
```

## 🤖 AI Integration

### With Claude Desktop

1. **Install Claude Desktop**: Download from [Anthropic](https://claude.ai/download)

2. **Configure Claude Desktop**: Add to your configuration file:
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

   **Option A: Docker Deployment**
   ```json
   {
     "mcpServers": {
       "jenkins-mcp-server": {
         "command": "docker",
         "args": [
           "run", "-i", "--rm",
           "-e", "JENKINS_URL=https://your-jenkins.com",
           "-e", "JENKINS_USERNAME=your-username",
           "-e", "JENKINS_API_TOKEN=your-api-token",
           "-e", "LOG_LEVEL=info",
           "ghcr.io/your-org/jenkins-mcp-server:latest"
         ]
       }
     }
   }
   ```

   **Option B: Standalone Binary**
   ```json
   {
     "mcpServers": {
       "jenkins-mcp-server": {
         "command": "/absolute/path/to/jenkins-mcp-server",
         "env": {
           "JENKINS_URL": "https://your-jenkins.com",
           "JENKINS_USERNAME": "your-username",
           "JENKINS_API_TOKEN": "your-api-token",
           "JENKINS_TIMEOUT": "30000",
           "JENKINS_RETRIES": "3",
           "LOG_LEVEL": "info"
         }
       }
     }
   }
   ```

   **Option C: From Source (Development)**
   ```json
   {
     "mcpServers": {
       "jenkins-mcp-server": {
         "command": "deno",
         "args": [
           "run",
           "--allow-all",
           "/absolute/path/to/jenkins-mcp/src/simple-server.ts"
         ],
         "env": {
           "JENKINS_URL": "https://your-jenkins.com",
           "JENKINS_USERNAME": "your-username",
           "JENKINS_API_TOKEN": "your-api-token",
           "JENKINS_TIMEOUT": "30000",
           "JENKINS_RETRIES": "3",
           "LOG_LEVEL": "info"
         }
       }
     }
   }
   ```

3. **Restart Claude Desktop** to load the new MCP server

### With VS Code Extensions

1. **Install MCP Extension**: Search for "MCP" or "Model Context Protocol" in VS Code extensions

2. **Configure Workspace**: The `.vscode/mcp.json` file will be automatically detected by MCP-compatible extensions

3. **Use AI Features**: Access Jenkins operations through AI chat interfaces

### Example AI Interactions

```text
"List all my Jenkins jobs"
→ Uses jenkins_list_jobs tool

"Show me the details of the customer-api-demo job"
→ Uses jenkins_get_job tool

"Trigger a build for test-job-2"
→ Uses jenkins_trigger_build tool

"Get the console logs for build #42 of customer-api-demo"
→ Uses jenkins_get_build_logs tool

"Stop the running build for my-pipeline job"
→ Uses jenkins_stop_build tool
```

## Overview

This MCP server enables AI applications to interact with Jenkins instances securely and efficiently. It provides:

- **Job Management**: List, create, trigger, and monitor Jenkins jobs
- **Build Operations**: Get build status, logs, and control execution
- **Node Management**: Monitor Jenkins infrastructure health
- **Queue Management**: View and manage build queues
- **Security Integration**: Secure authentication with API tokens
- **AI Integration**: Seamless Claude Desktop and VS Code integration

## Features

### Available MCP Tools

| Tool                        | Description                        | Status      |
| --------------------------- | ---------------------------------- | ----------- |
| `jenkins_list_jobs`         | List all accessible Jenkins jobs   | ✅ Complete |
| `jenkins_get_job`           | Get detailed job information       | ✅ Complete |
| `jenkins_create_job`        | Create new Jenkins jobs            | ✅ Complete |
| `jenkins_trigger_job`       | Trigger job builds with parameters | ✅ Complete |
| `jenkins_get_build`         | Get build information and status   | ✅ Complete |
| `jenkins_get_build_logs`    | Retrieve console logs from builds  | ✅ Complete |
| `jenkins_stop_build`        | Stop running builds                | ✅ Complete |
| `jenkins_list_nodes`        | List Jenkins nodes and status      | ✅ Complete |
| `jenkins_get_node_status`   | Get detailed node information      | ✅ Complete |
| `jenkins_get_queue`         | View current build queue           | ✅ Complete |
| `jenkins_cancel_queue_item` | Cancel queued builds               | ✅ Complete |
| `jenkins_get_version`       | Get Jenkins server information     | ✅ Complete |

### Supported Job Types

- **Freestyle Projects:** Shell commands, build steps
- **Pipeline Jobs:** Declarative and scripted pipelines
- **Multi-branch Pipelines:** (Future enhancement)
- **Organization Folders:** (Future enhancement)

## 🏗️ Architecture

```text
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   AI Assistant  │    │   VS Code IDE   │    │  Jenkins Server │
│   (Claude, etc) │◄──►│    (MCP Host)   │    │   (Target API)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                        ▲
                                ▼                        │
                       ┌─────────────────┐               │
                       │ Jenkins MCP     │               │
                       │ Server (Deno)   │───────────────┘
                       └─────────────────┘

                       MCP Protocol (JSON-RPC)
                       Authentication & Security
                       Enterprise Jenkins Integration
```

## 🛠️ Troubleshooting

### Common Issues

#### Authentication Failed
- **Verify credentials**: Check JENKINS_URL, JENKINS_USERNAME, and JENKINS_API_TOKEN
- **Test connection**: Use curl to verify credentials:
  ```bash
  curl -u username:token https://your-jenkins.com/api/json
  ```
- **API Token**: Ensure you're using a valid Jenkins API token (not password)

#### Server Not Starting
- **Check Deno**: Verify Deno installation with `deno --version`
- **Environment variables**: Ensure all required variables are set in `.env.local`
- **File paths**: Verify absolute paths in configurations

#### Connection Timeout
- **Increase timeout**: Set `JENKINS_TIMEOUT=60000` (60 seconds)
- **Network connectivity**: Test connection to Jenkins server
- **Jenkins availability**: Verify Jenkins server is running and accessible

#### MCP Client Connection Issues
- **Claude Desktop**: Restart Claude Desktop after configuration changes
- **VS Code**: Reload VS Code window after updating `.vscode/mcp.json`
- **File paths**: Use absolute paths in configuration files

### Debug Mode

Enable detailed logging by setting:

```bash
export LOG_LEVEL=debug
./start-server.sh
```

### Verification Commands

```bash
# Test basic functionality
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | ./start-server.sh

# Test Jenkins connection
echo '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"jenkins_get_version","arguments":{}}}' | ./start-server.sh

# Test job listing
echo '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"jenkins_list_jobs","arguments":{}}}' | ./start-server.sh
```

## Development

### Project Structure

```text
jenkins-mcp/
├── src/
│   ├── simple-server.ts      # Main MCP server (production)
│   ├── jenkins/              # Jenkins integration
│   │   ├── client.ts         # Jenkins API client
│   │   ├── types.ts          # Type definitions
│   │   └── auth.ts           # Authentication handling
│   └── utils/                # Utility functions
│       ├── logger.ts         # Logging utilities
│       ├── validation.ts     # Input validation
│       └── config.ts         # Configuration management
├── experimental/             # Experimental v1.1 features
│   ├── index.ts             # Advanced MCP server
│   ├── tools/               # Extended tool implementations
│   ├── resources/           # MCP resources
│   └── prompts/             # MCP prompts
├── ansible/                 # Infrastructure automation
├── .vscode/                 # VS Code configuration
│   ├── mcp.json            # MCP client configuration
│   └── tasks.json          # Build tasks
├── docs/                    # Additional documentation
├── .env.local              # Environment configuration
├── start-server.sh         # Server startup script
├── deno.json              # Deno configuration
└── README.md              # This file
```

### Running Tests

```bash
# Type checking
deno task check

# Build executable
deno task build

# Format code
deno task fmt

# Lint code
deno task lint
```

## 🔐 Security & Configuration

### Authentication Methods

- **API Tokens** (Recommended): Secure, user-specific tokens
- **Username/Password**: Basic authentication support
- **Rate Limiting**: Built-in request throttling
- **Audit Logging**: Comprehensive action logging

### Environment Configuration

```bash
# Required
JENKINS_URL=https://your-jenkins.com
JENKINS_USERNAME=your-username
JENKINS_API_TOKEN=your-api-token

# Optional
JENKINS_TIMEOUT=30000          # Request timeout (ms)
JENKINS_RETRIES=3              # Request retry count
LOG_LEVEL=info                 # Logging level (debug, info, warn, error)
```

### Security Best Practices

1. **Use API Tokens**: Always prefer API tokens over passwords
2. **Environment Variables**: Store credentials in environment variables, not config files
3. **Network Security**: Ensure secure communication with Jenkins (HTTPS)
4. **Access Control**: Verify Jenkins user has appropriate permissions
5. **Regular Rotation**: Rotate API tokens regularly

## 📚 Documentation

Additional documentation is available in the [`/docs`](docs/) directory:

- **[API Reference](docs/api/API_REFERENCE.md)**: Complete tool documentation
- **[System Architecture](docs/architecture/SYSTEM_ARCHITECTURE.md)**: Technical design
- **[Deployment Guide](docs/guides/DEPLOYMENT.md)**: Production deployment
- **[Contributing Guidelines](docs/CONTRIBUTING.md)**: Development workflow

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Ensure code quality: `deno task fmt && deno task lint && deno task check`
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/your-org/jenkins-mcp-server/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/jenkins-mcp-server/discussions)
- **Documentation**: Additional guides in [`/docs`](docs/) directory
