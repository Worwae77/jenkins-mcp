# Jenkins MCP Server

A Model Context Protocol (MCP) server for Jenkins automation and management in enterprise environments.

**Status:** ✅ Production Ready | **Version:** 2.0.0 | **Last Updated:** August 31, 2025  
**Build System:** Makefile (Modern) + Shell Scripts (Legacy) | **CI/CD:** GitHub Actions ✅

## 🚀 Quick Start

### 1. Clone and Setup
```bash
git clone https://github.com/Worwae77/jenkins-mcp.git
cd jenkins-mcp
make install        # Setup dependencies and environment
```

### 2. Configure Environment
```bash
# Edit .env.local with your Jenkins details
JENKINS_URL=https://your-jenkins.com
JENKINS_USERNAME=your-username  
JENKINS_API_TOKEN=your-api-token
```

### 3. Start the Server
```bash
make start          # Start the MCP server
```

### 4. Integrate with AI Tools
- **Claude Desktop**: Copy configuration from `.vscode/claude_desktop_config.json`
- **VS Code**: Open workspace - MCP configuration auto-detected
- **Other Tools**: Use Docker image or standalone binary

---

## 📦 Alternative Installation Options

#### Option 1: Docker (Recommended) 🐳

**No Deno installation required - just Docker!**

```bash
# Pull the image
docker pull ghcr.io/worwae77/jenkins-mcp:latest

# Run with environment variables
docker run -e JENKINS_URL=https://your-jenkins.com \
           -e JENKINS_USERNAME=your-username \
           -e JENKINS_API_TOKEN=your-api-token \
           -i ghcr.io/worwae77/jenkins-mcp:latest

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
# Prerequisites: Deno runtime v2.0+ and make
# Clone and setup
git clone https://github.com/Worwae77/jenkins-mcp.git
cd jenkins-mcp

# Quick setup (installs dependencies and creates .env.local)
make install

# Edit .env.local with your Jenkins details
# Start the server
make start
```

### Development Commands

```bash
# Show all available commands
make help

# Development workflow
make install        # Setup dependencies and environment
make dev           # Start with auto-reload
make start         # Start the server

# Code quality
make check         # TypeScript compilation check
make fmt           # Format code
make lint          # Lint code  
make quality       # Run all quality checks

# Building
make build         # Build for current platform
make build-all     # Build for all platforms
make release       # Quality checks + all builds

# Docker operations
make docker-build  # Build Docker image
make docker-test   # Test Docker deployment
make docker-run    # Run Docker container

# Testing
make test          # Run unit tests
make deploy-test   # Test all deployment methods
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
           "ghcr.io/worwae77/jenkins-mcp:latest"
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

3. **VS Code Development Setup**: This workspace includes pre-configured VS Code integration:
   - **Ready-to-use tasks**: `Ctrl/Cmd + Shift + P` → "Tasks: Run Task"
     - Start Jenkins MCP Server
     - Check TypeScript compilation  
     - Test MCP Server with sample requests
     - Build executable
     - Format and lint code
   - **Debug configuration**: Press `F5` to start debugging with breakpoints
   - **Environment auto-loading**: Credentials from `.env.local` automatically loaded

4. **Quick VS Code Setup**: 
   ```bash
   # Copy pre-configured settings (if needed)
   cp .vscode/claude_desktop_config.json ~/Library/Application\ Support/Claude/claude_desktop_config.json
   
   # Update paths in the configuration to match your system
   # Then restart Claude Desktop
   ```

5. **Use AI Features**: Access Jenkins operations through AI chat interfaces

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
make start
```

### Verification Commands

```bash
# Quick testing with Makefile
make help           # Show all available commands with descriptions
make test           # Run the test suite  
make deploy-test    # Comprehensive deployment testing

# Manual JSON-RPC testing (if needed)
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | make start

# VS Code integration testing
# Use Ctrl/Cmd + Shift + P → "Tasks: Run Task" → "Test MCP Server"
```

## Development

### Project Structure

```text
jenkins-mcp/
├── src/                      # Main source code
│   ├── simple-server.ts      # Main MCP server (production v1.0)
│   ├── jenkins/              # Jenkins integration
│   │   ├── client.ts         # Jenkins API client
│   │   ├── types.ts          # Type definitions
│   │   └── auth.ts           # Authentication handling
│   └── utils/                # Utility functions
│       ├── logger.ts         # Logging utilities
│       ├── validation.ts     # Input validation
│       └── config.ts         # Configuration management
├── tests/                    # Test suite
│   ├── basic.test.ts         # Basic functionality tests
│   ├── config.test.ts        # Configuration tests
│   ├── validation.test.ts    # Validation tests
│   └── README.md             # Test documentation
├── .vscode/                  # VS Code configuration
│   ├── mcp.json              # MCP client configuration
│   ├── claude_desktop_config.json # Ready-to-use Claude config
│   ├── tasks.json            # VS Code development tasks
│   ├── launch.json           # Debug configurations
│   └── SETUP.md              # Detailed VS Code setup guide
├── .github/workflows/        # GitHub Actions CI/CD
├── docs/                     # Additional documentation
├── experimental/             # Experimental v1.1 features
├── ansible/                  # Infrastructure automation
├── .env.local                # Environment configuration
├── Makefile                  # Modern build system
├── MIGRATION.md              # Shell script → Makefile migration guide
├── deno.json                 # Deno configuration
└── README.md                 # This file
```

### Running Tests

```bash
# Using Makefile (recommended)
make test          # Run test suite
make check         # TypeScript compilation check  
make fmt           # Format code
make lint          # Lint code
make quality       # Run all quality checks (fmt + lint + check + test)
make build         # Build executable
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

### 🏗️ Build System

This project uses a **modern Makefile-based build system** for consistency and ease of use:

### 🔄 CI/CD Integration

This project uses **Makefile-based CI/CD** for consistency across all platforms:

```bash
# Basic CI pipeline for any CI/CD system
make install    # Setup environment  
make quality    # Run all quality checks
make build-all  # Build all platforms
```

**📖 [Complete CI/CD Integration Guide](docs/CI_CD_INTEGRATION.md)** - Examples for GitHub Actions, GitLab CI, Jenkins, Azure DevOps, CircleCI, and more!

- **✅ Makefile**: Unified build system with 20+ targets
- **📋 Migration Guide**: See `MIGRATION.md` for shell script migration details
- **🎯 Benefits**: Standardized commands, cross-platform builds, environment validation

**Common Commands:**
```bash
make install       # Setup environment
make start         # Start server
make build         # Build executable
make quality       # All quality checks
make test          # Run test suite
```

### Additional Documentation

Additional documentation is available in the [`/docs`](docs/) directory:

- **[API Reference](docs/api/API_REFERENCE.md)**: Complete tool documentation
- **[System Architecture](docs/architecture/SYSTEM_ARCHITECTURE.md)**: Technical design
- **[Deployment Guide](docs/guides/DEPLOYMENT.md)**: Production deployment
- **[Contributing Guidelines](docs/CONTRIBUTING.md)**: Development workflow
- **[VS Code Setup Guide](.vscode/SETUP.md)**: Comprehensive VS Code integration

### 🚀 CI/CD Pipeline

**GitHub Actions Status**: ✅ **Fully Operational**

Our CI/CD pipeline automatically builds and tests across multiple platforms:

- **✅ Multi-Platform Builds**: Linux x64, macOS x64/ARM64, Windows x64
- **✅ Docker Multi-Architecture**: `linux/amd64`, `linux/arm64`
- **✅ Automated Testing**: TypeScript compilation, linting, formatting
- **✅ Artifact Generation**: Standalone binaries for all platforms
- **✅ Container Registry**: Docker images published to GitHub Container Registry

**Recent Improvements:**
- Upgraded to Deno 2.0.0 for lockfile v4 compatibility
- Fixed ARM64 cross-compilation issues
- Enhanced build caching and performance

**Workflow Triggers:**
- Push to `main` branch
- Pull requests
- Manual workflow dispatch

## 🤝 Contributing

### Development Workflow

1. **Fork and Clone**: Fork the repository and clone your fork
   ```bash
   git clone https://github.com/your-username/jenkins-mcp.git
   cd jenkins-mcp
   ```

2. **Setup Development Environment**: 
   ```bash
   make install        # Install dependencies and setup .env.local
   make dev           # Start development server with auto-reload
   ```

3. **Create Feature Branch**: 
   ```bash
   git checkout -b feature/amazing-feature
   ```

4. **Make Changes and Test**:
   ```bash
   make quality       # Run all quality checks (format, lint, check)
   make test          # Run unit tests
   make build         # Verify build works
   ```

5. **Commit Changes**:
   ```bash
   git add .
   git commit -m 'Add amazing feature'
   ```

6. **Push and Create PR**:
   ```bash
   git push origin feature/amazing-feature
   # Then create Pull Request on GitHub
   ```

### Code Quality Standards

- **TypeScript**: Strict typing with Deno's built-in checker
- **Formatting**: Use `make fmt` (enforced by CI)
- **Linting**: Use `make lint` (enforced by CI)
- **Testing**: Add tests for new features
- **Documentation**: Update relevant docs

### Available Development Commands

```bash
make help          # Show all available commands
make install       # Setup development environment
make dev           # Development server with auto-reload
make start         # Start the server
make quality       # All quality checks (fmt + lint + check + test)
make test          # Run test suite
make build         # Build executable
make docker-build  # Build Docker image
make clean         # Clean build artifacts
```

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/your-org/jenkins-mcp-server/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/jenkins-mcp-server/discussions)
- **Documentation**: Additional guides in [`/docs`](docs/) directory
