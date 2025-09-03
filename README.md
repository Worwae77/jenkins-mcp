# Jenkins MCP Server

A Model Context Protocol (MCP) server that enables AI assistants to interact
with Jenkins through a secure, standardized API.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Deno](https://img.shields.io/badge/Deno-1.37+-black.svg)](https://deno.land/)

## 🚀 Quick Start

### Prerequisites

- [Deno](https://deno.land/) 1.37 or later
- Access to a Jenkins server
- Jenkins API token (recommended) or username/password

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Worwae77/jenkins-mcp.git
cd jenkins-mcp

# 2. Install dependencies and setup
make install

# 3. Configure your Jenkins connection
cp .env.example .env.local
# Edit .env.local with your Jenkins server details
```

### Configuration

Edit `.env.local` with your Jenkins server information:

```bash
# Required: Jenkins server URL
JENKINS_URL=https://your-jenkins-server.com

# Recommended: API Token authentication
JENKINS_USERNAME=your-username
JENKINS_API_TOKEN=your-api-token

# Optional: SSL settings
JENKINS_SSL_VERIFY=true
```

### Running

```bash
# Development mode (with auto-reload)
make dev

# Production mode
make start

# Build standalone executable
make build
./jenkins-mcp-server
```

## 🐳 Docker Usage

```bash
# Using docker-compose (recommended)
cp .env.example .env.local
# Edit .env.local with your settings
docker-compose up

# Direct docker run
docker run -e JENKINS_URL=https://your-jenkins.com \
           -e JENKINS_USERNAME=your-username \
           -e JENKINS_API_TOKEN=your-token \
           jenkins-mcp-server:latest
```

## 🤖 AI Integration

### Claude Desktop

Add to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "jenkins": {
      "command": "/path/to/jenkins-mcp-server",
      "env": {
        "JENKINS_URL": "https://your-jenkins.com",
        "JENKINS_USERNAME": "your-username",
        "JENKINS_API_TOKEN": "your-token"
      }
    }
  }
}
```

### VS Code with MCP Extensions

The server automatically integrates with VS Code MCP extensions when
`make install` creates the configuration files.

## 🛠️ Available Tools

The Jenkins MCP Server provides **13 production-ready tools** for Jenkins
automation:

### Core Job Management

- **jenkins_list_jobs** - List all Jenkins jobs with their current status
- **jenkins_get_job** - Get detailed information about a specific job
- **jenkins_create_job** - Create new freestyle or pipeline jobs
- **jenkins_trigger_build** - Trigger a new build for a job
- **jenkins_get_build** - Get build information and status
- **jenkins_stop_build** - Stop a running build

### Build Operations & Debugging

- **jenkins_get_build_logs** - Retrieve console logs from builds

### Infrastructure Management

- **jenkins_list_nodes** - List all Jenkins nodes and their status
- **jenkins_get_node_status** - Get detailed status of a specific node

### Queue Management

- **jenkins_get_queue** - Get current build queue
- **jenkins_cancel_queue_item** - Cancel queued builds

### System Information & Diagnostics

- **jenkins_get_version** - Get Jenkins server version and info
- **jenkins_ssl_diagnostics** - Troubleshoot SSL/TLS configuration

### AI-Powered Features

- **Prompts**: 2 intelligent prompts for troubleshooting and best practices
- **Resources**: 1 resource for job discovery and monitoring

## 🧪 Testing

```bash
# Run all tests
make test

# Check TypeScript compilation
make check

# Format and lint code
make fmt lint
```

## 📚 Documentation

- [SSL Configuration Guide](docs/SSL_CONFIGURATION.md) - Enterprise SSL setup
- [API Reference](docs/api/API_REFERENCE.md) - Complete tool documentation

## 🔧 Development

### Project Structure

```text
jenkins-mcp/
├── src/
│   ├── simple-server.ts      # Main MCP server
│   ├── jenkins/              # Jenkins client & auth
│   └── utils/                # Configuration & utilities
├── tests/                    # Unit tests
├── docs/                     # Documentation
└── experimental/             # Experimental features
```

### Commands

```bash
make help      # Show all available commands
make examples  # Show usage examples
make clean     # Clean build artifacts
```

## 🔒 Security

- **Credentials**: Never commit real credentials. Use `.env.local` (gitignored)
- **SSL/TLS**: Proper certificate validation enabled by default
- **API Tokens**: Recommended over username/password authentication
- **Access Control**: Respects Jenkins user permissions and security realms

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Ensure tests pass: `make test`
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file
for details.

## 🙏 Acknowledgments

- Built with [Model Context Protocol](https://modelcontextprotocol.io/)
- Powered by [Deno](https://deno.land/) runtime
- Jenkins automation via
  [Jenkins REST API](https://www.jenkins.io/doc/book/using/remote-access-api/)

---

**Note**: This is a community project and is not officially affiliated with
Jenkins or the Jenkins project.
