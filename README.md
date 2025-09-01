# Jenkins MCP Server

A Model Context Protocol (MCP) server for Jenkins automation and management in
enterprise environments.

**Status:** ✅ Production Ready | **Version:** 2.1.0 | **Last Updated:**
September 1, 2025\
**Build System:** Makefile (Modern) + Shell Scripts (Legacy) | **CI/CD:** GitHub
Actions ✅

## 🚀 Quick Start

Choose your preferred installation method:

### ⚡ Fastest: Docker (No setup required)

```bash
# 1. Pull and run (replace with your Jenkins details)
docker run -e JENKINS_URL=https://your-jenkins.com \
           -e JENKINS_USERNAME=your-username \
           -e JENKINS_API_TOKEN=your-api-token \
           -i ghcr.io/worwae77/jenkins-mcp:latest

# Note: If you get "denied" error, visit https://github.com/Worwae77/jenkins-mcp/packages 
# to make the package public, or authenticate with GitHub
```

### 🛠️ Development: From Source

```bash
# 1. Clone and setup
git clone https://github.com/Worwae77/jenkins-mcp.git
cd jenkins-mcp
make install        # Setup dependencies and environment

# 2. Configure environment (secure - uses gitignored files)
cp .env.example .env.local
nano .env.local     # Add your real Jenkins details

# 3. Optional: Setup VS Code (templates only - safe)
make setup-vscode   # Creates .vscode/ config from templates
nano .vscode/mcp.json  # Add your real credentials (gitignored)

# 4. Start the server
make start          # Start the MCP server
```

### 📦 Production: Standalone Binary

```bash
# 1. Download (example for Linux x64)
curl -L -o jenkins-mcp-server https://github.com/Worwae77/jenkins-mcp/releases/latest/download/jenkins-mcp-server-linux-x64
chmod +x jenkins-mcp-server

# 2. Run with environment variables
JENKINS_URL=https://your-jenkins.com \
JENKINS_USERNAME=your-username \
JENKINS_API_TOKEN=your-api-token \
./jenkins-mcp-server
```

### 🤖 AI Integration

- **Claude Desktop**: Copy configuration from
  `.vscode/claude_desktop_config.json`
- **VS Code**: Open workspace - MCP configuration auto-detected
- **Other Tools**: Use any installation method above

---

## 📖 Detailed Installation Options

### Option 1: Docker (Recommended) 🐳

**No Deno installation required - just Docker!**

```bash
# Pull the image
docker pull ghcr.io/worwae77/jenkins-mcp:latest

# Note: If you get "denied" error, the package might be private
# Visit https://github.com/Worwae77/jenkins-mcp/packages to make it public
# Or authenticate: echo $GITHUB_TOKEN | docker login ghcr.io -u username --password-stdin

# Run with environment variables
docker run -e JENKINS_URL=https://your-jenkins.com \
           -e JENKINS_USERNAME=your-username \
           -e JENKINS_API_TOKEN=your-api-token \
           -i ghcr.io/worwae77/jenkins-mcp:latest

# Or use docker-compose (easier environment management)
wget https://raw.githubusercontent.com/Worwae77/jenkins-mcp/main/docker-compose.yml
# Create .env file with your Jenkins details
cat > .env << EOF
JENKINS_URL=https://your-jenkins.com
JENKINS_USERNAME=your-username
JENKINS_API_TOKEN=your-api-token
JENKINS_TIMEOUT=30000
JENKINS_RETRIES=3
LOG_LEVEL=info
EOF
docker-compose up
```

#### Corporate Environment Docker 🏢

**For corporate environments with SSL restrictions or proxy issues:**

If you encounter SSL certificate errors during Docker builds (common in corporate
environments), use the corporate-friendly approach:

```bash
# 1. Clone the repository and build locally
git clone https://github.com/Worwae77/jenkins-mcp.git
cd jenkins-mcp

# 2. Build Linux binary locally (avoids SSL downloads during Docker build)
make build-linux

# 3. Build corporate Docker image (uses pre-built binary)
docker build -f Dockerfile.corporate -t jenkins-mcp-server:corporate .

# 4. Run the corporate image
docker run -e JENKINS_URL=https://your-jenkins.com \
           -e JENKINS_USERNAME=your-username \
           -e JENKINS_API_TOKEN=your-api-token \
           -i jenkins-mcp-server:corporate

# Alternative: Use environment file for easier management
cp .env.example .env.local
# Edit .env.local with your Jenkins details
docker run --env-file .env.local -i jenkins-mcp-server:corporate
```

**Corporate Docker Benefits:**

- ✅ No SSL certificate downloads during build
- ✅ Works behind corporate proxies  
- ✅ Pre-built binary approach avoids network dependencies
- ✅ Platform-specific builds (AMD64 for enterprise compatibility)
- ✅ Tested in restricted corporate environments

### Option 2: Standalone Binary 📦

**No runtime dependencies - self-contained executable!**

```bash
# Download for your platform from GitHub Releases
# Linux x64
curl -L -o jenkins-mcp-server https://github.com/Worwae77/jenkins-mcp/releases/latest/download/jenkins-mcp-server-linux-x64

# macOS x64
curl -L -o jenkins-mcp-server https://github.com/Worwae77/jenkins-mcp/releases/latest/download/jenkins-mcp-server-macos-x64

# macOS ARM64
curl -L -o jenkins-mcp-server https://github.com/Worwae77/jenkins-mcp/releases/latest/download/jenkins-mcp-server-macos-arm64

# Windows x64 (PowerShell)
Invoke-WebRequest -Uri https://github.com/Worwae77/jenkins-mcp/releases/latest/download/jenkins-mcp-server-windows-x64.exe -OutFile jenkins-mcp-server.exe

# Make executable (Linux/macOS)
chmod +x jenkins-mcp-server

# Run with environment variables
JENKINS_URL=https://your-jenkins.com \
JENKINS_USERNAME=your-username \
JENKINS_API_TOKEN=your-api-token \
./jenkins-mcp-server
```

### Option 3: Development Setup 🛠️

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
make test          # Run tests
make deploy-test   # Test all deployment methods
```

## 🤖 AI Tool Integration

### With Claude Desktop

1. **Install Claude Desktop**: Download from
   [Anthropic](https://claude.ai/download)

2. **Configure Claude Desktop**: Add to your configuration file:
   - **macOS**:
     `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

   **Option A: Docker Deployment**

   ```json
   {
     "mcpServers": {
       "jenkins-mcp-server": {
         "command": "docker",
         "args": [
           "run",
           "-i",
           "--rm",
           "-e",
           "JENKINS_URL=https://your-jenkins.com",
           "-e",
           "JENKINS_USERNAME=your-username",
           "-e",
           "JENKINS_API_TOKEN=your-api-token",
           "-e",
           "LOG_LEVEL=info",
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

1. **Install MCP Extension**: Search for "MCP" or "Model Context Protocol" in VS
   Code extensions

2. **Configure Workspace**: The `.vscode/mcp.json` file will be automatically
   detected by MCP-compatible extensions

3. **VS Code Development Setup**: This workspace includes pre-configured VS Code
   integration:
   - **Ready-to-use tasks**: `Ctrl/Cmd + Shift + P` → "Tasks: Run Task"
     - Start Jenkins MCP Server
     - Check TypeScript compilation
     - Test MCP Server with sample requests
     - Build executable
     - Format and lint code
   - **Debug configuration**: Press `F5` to start debugging with breakpoints
   - **Environment auto-loading**: Credentials from `.env.local` automatically
     loaded

4. **Quick VS Code Setup**:

   ```bash
   # Copy pre-configured settings (if needed)
   cp .vscode/claude_desktop_config.json ~/Library/Application\ Support/Claude/claude_desktop_config.json

   # Update paths in the configuration to match your system
   # Then restart Claude Desktop
   ```

5. **Use AI Features**: Access Jenkins operations through AI chat interfaces

### Example AI Interactions

#### 🔍 **Job Discovery & Management**

```text
"What Jenkins jobs do I have access to?"
→ Uses jenkins_list_jobs tool to show all available jobs

"Show me all the details about the customer-api-build job"
→ Uses jenkins_get_job tool to get configuration, recent builds, parameters

"Can you help me create a new job called 'test-automation' with a basic pipeline?"
→ Uses jenkins_create_job tool with pipeline configuration

"What are the build parameters for the deployment-prod job?"
→ Uses jenkins_get_job tool to show configurable parameters
```

#### 🚀 **Build Operations & Monitoring**

```text
"Start a build for the customer-api-build job"
→ Uses jenkins_trigger_job tool to start build immediately

"Trigger the deployment-staging job with environment=staging and version=2.1.0"
→ Uses jenkins_trigger_job tool with specific parameters

"What's the status of build #156 for the customer-api-build job?"
→ Uses jenkins_get_build tool to check build status, duration, result

"Show me the console logs for the latest build of test-suite-integration"
→ Uses jenkins_get_build_logs tool to retrieve and display logs

"Get the console output for build #42 of the customer-api-demo job"
→ Uses jenkins_get_build_logs tool with specific build number
```

#### ⚠️ **Build Control & Troubleshooting**

```text
"Stop the currently running build for my-pipeline job"
→ Uses jenkins_stop_build tool to cancel active build

"The deployment-prod job has been running for 2 hours, can you stop it?"
→ Uses jenkins_stop_build tool to halt long-running build

"Why did build #89 of the test-suite fail? Show me the logs"
→ Uses jenkins_get_build + jenkins_get_build_logs to investigate failure

"Cancel all builds in the queue for the load-testing job"
→ Uses jenkins_get_queue + jenkins_cancel_queue_item tools
```

#### 🖥️ **Infrastructure & Node Management**

```text
"What Jenkins nodes are available and what's their status?"
→ Uses jenkins_list_nodes tool to show all agents and their health

"Is the linux-build-agent-01 node online and ready?"
→ Uses jenkins_get_node_status tool to check specific agent

"Show me the details of the docker-agent-pool node"
→ Uses jenkins_get_node_status tool for detailed node information

"Which builds are currently running on the windows-agent-02?"
→ Uses jenkins_get_node_status tool to see active builds on specific node
```

#### 📋 **Queue Management & Planning**

```text
"What builds are waiting in the queue right now?"
→ Uses jenkins_get_queue tool to show pending builds

"How many jobs are queued for the main build agents?"
→ Uses jenkins_get_queue tool to analyze queue depth

"Cancel the queued build #1234 for test-performance job"
→ Uses jenkins_cancel_queue_item tool to remove specific queue item

"Why is my build stuck in the queue for so long?"
→ Uses jenkins_get_queue + jenkins_list_nodes to diagnose capacity issues
```

#### 🎯 **Advanced Workflow Examples**

```text
"Deploy version 3.2.1 to staging environment with database migration enabled"
→ Uses jenkins_trigger_job with parameters: version=3.2.1, environment=staging, migrate_db=true

"Show me a summary of all failed builds from the last 24 hours"
→ Uses jenkins_list_jobs + jenkins_get_job to analyze recent build failures

"I need to restart all builds that failed due to network timeout"
→ Uses jenkins_get_build to identify failed builds + jenkins_trigger_job to restart them

"Check if the nightly-backup job ran successfully and show me the results"
→ Uses jenkins_get_job + jenkins_get_build + jenkins_get_build_logs for comprehensive check

"What's the overall health of my Jenkins environment?"
→ Uses jenkins_get_version + jenkins_list_nodes + jenkins_get_queue for system overview
```

#### 🔧 **DevOps Scenarios**

```text
"The production deployment failed at step 3, can you show me what went wrong?"
→ Uses jenkins_get_build_logs to analyze specific failure point

"Trigger a hotfix deployment with branch=hotfix/critical-bug and skip_tests=true"
→ Uses jenkins_trigger_job with emergency deployment parameters

"Check if all microservices builds completed successfully before I trigger integration tests"
→ Uses jenkins_get_build across multiple jobs to verify readiness

"Our load testing is taking too long, show me what's running and stop non-critical builds"
→ Uses jenkins_get_queue + jenkins_list_nodes + jenkins_stop_build for resource management
```

#### 📊 **Monitoring & Reporting**

```text
"Give me a report on build success rates for all jobs this week"
→ Uses jenkins_list_jobs + jenkins_get_job to analyze build statistics

"Which agent nodes have the highest utilization right now?"
→ Uses jenkins_list_nodes + jenkins_get_node_status for capacity analysis

"Show me all jobs that have builds currently running"
→ Uses jenkins_list_jobs + jenkins_get_build to find active builds

"What's the Jenkins server version and any system information?"
→ Uses jenkins_get_version tool for server details
```

## Overview

This MCP server enables AI applications to interact with Jenkins instances
securely and efficiently. It provides:

- **Job Management**: List, create, trigger, and monitor Jenkins jobs
- **Build Operations**: Get build status, logs, and control execution
- **Node Management**: Monitor Jenkins infrastructure health
- **Queue Management**: View and manage build queues
- **Security Integration**: Secure authentication with API tokens
- **AI Integration**: Seamless Claude Desktop and VS Code integration

## Features 🌟

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
| `jenkins_ssl_diagnostics`   | SSL/TLS configuration diagnostics  | ✅ Complete |

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

- **Verify credentials**: Check JENKINS_URL, JENKINS_USERNAME, and
  JENKINS_API_TOKEN
- **Test connection**: Use curl to verify credentials:

  ```bash
  curl -u username:token https://your-jenkins.com/api/json
  ```

- **API Token**: Ensure you're using a valid Jenkins API token (not password)

#### Server Not Starting

- **Check Deno**: Verify Deno installation with `deno --version`
- **Environment variables**: Ensure all required variables are set in
  `.env.local`
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
make test           # Run tests
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
make test          # Run comprehensive test suite
make check         # TypeScript compilation check  
make fmt           # Format code
make lint          # Lint code
make quality       # Run all quality checks (fmt + lint + check + test)
make build         # Build executable

# Direct Deno commands
deno test --allow-read --allow-env --allow-write --allow-net   # Full test suite
deno test tests/basic.test.ts tests/validation.test.ts --allow-read --allow-env  # Basic tests only
```

### Test Coverage

✅ **Comprehensive Unit Tests**: 55+ tests across all modules

- **`tests/basic.test.ts`** - Project structure and environment validation
- **`tests/validation.test.ts`** - Input validation for Jenkins API calls
- **`tests/ssl.test.ts`** - SSL/TLS configuration and certificate handling
- **`tests/jenkins-auth.test.ts`** - Authentication mechanisms (token/password)
- **`tests/jenkins-client.test.ts`** - Jenkins API client functionality
- **`tests/logger.test.ts`** - Logging system comprehensive testing

**Test Environment Setup**:

```bash
# For full test suite, create .env.local with test values:
JENKINS_URL=https://test-jenkins.example.com
JENKINS_USERNAME=test-user
JENKINS_API_TOKEN=test-token-placeholder
JENKINS_SSL_VERIFY=false
```

See [`tests/TEST_COVERAGE_REPORT.md`](tests/TEST_COVERAGE_REPORT.md) for
detailed coverage information.

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

# SSL/TLS Configuration (SECURE by default)
JENKINS_SSL_VERIFY=true                    # SSL verification enabled (SECURE - default)
JENKINS_SSL_ALLOW_SELF_SIGNED=false       # Disallow self-signed certs (SECURE - default)
JENKINS_CA_CERT_PATH=/path/to/ca.pem      # Custom CA certificate file
JENKINS_SSL_DEBUG=false                    # Enable SSL debugging (default: false)

# ⚠️ CORPORATE ENVIRONMENTS ONLY - INSECURE SSL BYPASS ⚠️
# JENKINS_SSL_BYPASS_ALL=true             # Bypass ALL SSL validation (VERY INSECURE)

# For mutual TLS (client certificates)
JENKINS_CLIENT_CERT_PATH=/path/to/client.pem  # Client certificate file
JENKINS_CLIENT_KEY_PATH=/path/to/client.key   # Client private key file
```

### SSL/TLS Support 🔒

**Security-First Approach**: SSL certificate validation is **enabled by
default** for maximum security.

Enterprise-ready SSL configuration for internal networks and organizational CA
certificates:

- **🟢 Secure by Default**: SSL verification enabled - no configuration needed
- **🟡 Custom CA Certificates**: Support for organizational certificate
  authorities
- **🟡 Self-Signed Certificates**: Development environment support (use with
  caution)
- **🔴 SSL Bypass**: Corporate emergency option (INSECURE - use only when
  necessary)
- **🔧 Mutual TLS**: Client certificate authentication support
- **🔍 SSL Debugging**: Detailed logging for troubleshooting SSL issues

**Production Configuration (Secure - Default):**

```bash
# Secure configuration - no special setup needed
JENKINS_URL=https://jenkins.company.com
JENKINS_SSL_VERIFY=true          # Default - SSL verification enabled
```

**Corporate CA Configuration:**

```bash
# Corporate Jenkins with organizational CA certificate
JENKINS_URL=https://jenkins.company.com
JENKINS_CA_CERT_PATH=/etc/ssl/certs/company-ca.pem
JENKINS_SSL_VERIFY=true          # Still secure with custom CA
```

**⚠️ Corporate Emergency Configuration (INSECURE):**

```bash
# Only for corporate networks with SSL proxy issues
JENKINS_URL=https://jenkins.company.com
JENKINS_SSL_BYPASS_ALL=true     # ⚠️ DISABLES ALL SSL SECURITY
JENKINS_SSL_DEBUG=true          # Help diagnose SSL issues
```

🔗 **For complete SSL security guide:**
[SSL_SECURITY_GUIDE.md](SSL_SECURITY_GUIDE.md)

### Build Commands

**Secure Builds (Default - Recommended):**

```bash
make start          # Secure SSL verification enabled
make build          # Build secure binary
make test           # Test with SSL verification
```

**Corporate Emergency Builds (INSECURE):**

```bash
make start-corporate    # ⚠️ Start with SSL bypass (INSECURE)
make build-corporate    # ⚠️ Build with SSL bypass (INSECURE) 
make test-corporate     # ⚠️ Test with SSL bypass (INSECURE)
```

📖 **For detailed SSL configuration guide, see:**
[docs/SSL_CONFIGURATION.md](docs/SSL_CONFIGURATION.md)

### Security Best Practices

⚠️ **CRITICAL: Never commit real credentials to Git!**

1. **Use Local Configuration Files**: Copy templates to `.local` files
   ```bash
   cp .env.example .env.local                    # For environment variables
   cp .vscode/mcp.json .vscode/mcp.json.local   # For VS Code MCP config
   ```

2. **Use API Tokens**: Always prefer API tokens over passwords
3. **Environment Variables**: Store credentials in environment variables, not
   config files
4. **Network Security**: Ensure secure communication with Jenkins (HTTPS)
5. **Access Control**: Verify Jenkins user has appropriate permissions
6. **Regular Rotation**: Rotate API tokens regularly

📖 **Complete Security Guide**:
[SECURITY_CONFIGURATION.md](SECURITY_CONFIGURATION.md)

## 📚 Documentation

### 🏗️ Build System

This project uses a **modern Makefile-based build system** for consistency and
ease of use:

### 🔄 CI/CD Integration

This project uses **Makefile-based CI/CD** for consistency across all platforms:

```bash
# Basic CI pipeline for any CI/CD system
make install    # Setup environment  
make quality    # Run all quality checks
make build-all  # Build all platforms
```

**📖 [Complete CI/CD Integration Guide](docs/CI_CD_INTEGRATION.md)** - Examples
for GitHub Actions, GitLab CI, Jenkins, Azure DevOps, CircleCI, and more!

- **✅ Makefile**: Unified build system with 20+ targets
- **📋 Migration Guide**: See `MIGRATION.md` for shell script migration details
- **🎯 Benefits**: Standardized commands, cross-platform builds, environment
  validation

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
- **[System Architecture](docs/architecture/SYSTEM_ARCHITECTURE.md)**: Technical
  design
- **[Deployment Guide](docs/guides/DEPLOYMENT.md)**: Production deployment
- **[Contributing Guidelines](CONTRIBUTING.md)**: Quick start for contributors
- **[Detailed Contributing Guide](docs/CONTRIBUTING.md)**: Comprehensive
  development workflow
- **[VS Code Setup Guide](.vscode/SETUP.md)**: Comprehensive VS Code integration

### 🚀 CI/CD Pipeline

**GitHub Actions Status**: ✅ **Fully Operational**

Our CI/CD pipeline automatically builds and tests across multiple platforms:

- **✅ Multi-Platform Builds**: Linux x64, macOS x64/ARM64, Windows x64
- **✅ Docker Multi-Architecture**: `linux/amd64`, `linux/arm64`
- **✅ Automated Testing**: TypeScript compilation, linting, formatting
- **✅ Artifact Generation**: Standalone binaries for all platforms
- **✅ Container Registry**: Docker images published to GitHub Container
  Registry

**Recent Improvements:**

- Upgraded to Deno 2.0.0 for lockfile v4 compatibility
- Fixed ARM64 cross-compilation issues
- Enhanced build caching and performance

**Workflow Triggers:**

- Push to `main` branch
- Pull requests
- Manual workflow dispatch

## 🤝 Contributing

We welcome contributions from developers of all skill levels! Whether you're
fixing bugs, adding features, improving documentation, or helping with testing,
your contributions make this project better.

### GitHub Contribution Workflow

**Step 1: Create GitHub Issue** 📝

```bash
# Before coding, open a GitHub issue to discuss your idea:
# 🐛 Bug Report: Use bug_report.md template
# ✨ Feature Request: Use feature_request.md template
# 🔧 SSL/TLS Issues: Use ssl-support.md template
```

**Step 2: Create Development Branch** 🌿

```bash
# 1. Fork and clone the repository
git clone https://github.com/your-username/jenkins-mcp.git
cd jenkins-mcp

# 2. Create feature branch (reference the issue number)
git checkout -b feature/issue-123-amazing-feature
# or for bug fixes
git checkout -b fix/issue-456-critical-bug
```

**Step 3: Build and Test** 🧪

```bash
# 1. Setup development environment
make install

# 2. Make your changes, then run quality checks
make quality    # TypeScript check + lint + format
make test       # Run comprehensive test suite
make build      # Verify build works

# 3. Test deployment methods
make deploy-test  # Test Docker and binary deployments
```

**Step 4: Open Pull Request** 🚀

```bash
# 1. Commit with conventional commit format
git add .
git commit -m "feat: add amazing feature (fixes #123)"

# 2. Push branch and create PR
git push origin feature/issue-123-amazing-feature

# 3. Open PR with:
#    - Clear title: "feat: add amazing feature"
#    - Description linking to issue: "Closes #123"
#    - Completed checklist from PR template
```

**📋 [Contributing Guide](CONTRIBUTING.md)** - Complete guide with setup,
workflow, and coding standards

**🚀 [Quick Contribution Guide](docs/QUICK_CONTRIBUTION_GUIDE.md)** - 4-step
GitHub workflow for contributors

### GitHub Issue Templates

We provide templates to help you create better issues:

- **🐛 [Bug Report](.github/ISSUE_TEMPLATE/bug_report.md)** - Report bugs with
  reproduction steps
- **✨ [Feature Request](.github/ISSUE_TEMPLATE/feature_request.md)** - Suggest
  new features or improvements
- **🔧 [SSL Implementation](.github/ISSUE_TEMPLATE/ssl-implementation.md)** -
  SSL/TLS related development
- **🔒 [SSL Support](.github/ISSUE_TEMPLATE/ssl-support.md)** - SSL
  configuration help

### What We're Looking For

- **🔧 New Jenkins Tools**: Expand MCP tool capabilities
- **🐛 Bug Fixes**: Improve reliability and user experience
- **📚 Documentation**: Better guides, examples, and API docs
- **🧪 Testing**: Increase test coverage and quality
- **🚀 Performance**: Optimize existing functionality
- **🎨 Developer Experience**: Improve tooling and workflows

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
make test          # Run tests
make build         # Build executable
make docker-build  # Build Docker image
make clean         # Clean build artifacts
```

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/Worwae77/jenkins-mcp/issues)
- **Discussions**:
  [GitHub Discussions](https://github.com/Worwae77/jenkins-mcp/discussions)
- **Documentation**: Additional guides in [`/docs`](docs/) directory
