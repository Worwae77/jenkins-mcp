# Jenkins MCP Server

A Model Context Protocol (MCP) server for Jenkins automation and management in
enterprise environments.

**Status:** ✅ MVP Complete | **Version:** 1.0.0 | **Last Updated:** August 30,
2025

## 📚 Documentation

**Complete documentation is available in the [`/docs`](docs/) directory:**

| Document                                                               | Purpose                            | Audience                 |
| ---------------------------------------------------------------------- | ---------------------------------- | ------------------------ |
| **[📋 Documentation Index](docs/README.md)**                           | Complete documentation overview    | All users                |
| **[📖 Software Requirements](docs/SRS.md)**                            | Formal requirements specification  | PM, Stakeholders         |
| **[🏗️ System Architecture](docs/architecture/SYSTEM_ARCHITECTURE.md)** | Technical design and architecture  | Developers, Architects   |
| **[🔧 API Reference](docs/api/API_REFERENCE.md)**                      | Complete API documentation         | Developers, Integrators  |
| **[🚀 Deployment Guide](docs/guides/DEPLOYMENT.md)**                   | Installation and deployment        | DevOps, SysAdmins        |
| **[🛠️ Troubleshooting Guide](docs/guides/TROUBLESHOOTING.md)**         | Problem diagnosis and solutions    | Support, Operations      |
| **[🤝 Contributing Guidelines](docs/CONTRIBUTING.md)**                 | Development workflow and standards | Contributors, Developers |

## Overview

This MCP server enables AI applications to interact with Jenkins instances
securely and efficiently. It provides:

- **Job Management**: List, create, trigger, and monitor Jenkins jobs
- **Build Operations**: Get build status, logs, and control execution
- **Node Management**: Monitor Jenkins infrastructure health
- **Queue Management**: View and manage build queues
- **Security Integration**: Secure authentication with API tokens
- **VS Code Integration**: Seamless AI assistant interaction

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

## Architecture

```
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
```

    │                        │                        │
    ▼                        ▼                        ▼

┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ │ MCP Protocol │ │
Authentication │ │ Enterprise │ │ (JSON-RPC) │ │ & Security │ │ Jenkins │
└─────────────────┘ └─────────────────┘ └─────────────────┘

````
## Quick Start

### Prerequisites

- Deno runtime (v1.37+)
- Jenkins server access
- Valid Jenkins API token or credentials

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/jenkins-mcp-server.git
cd jenkins-mcp-server

# Run the server
deno task dev
````

### Configuration

Create a `.env` file:

```env
# Jenkins Configuration
JENKINS_URL=https://jenkins.example.com
JENKINS_USERNAME=your-username
JENKINS_API_TOKEN=your-api-token

# MCP Server Configuration
MCP_SERVER_NAME=jenkins-enterprise
MCP_SERVER_VERSION=1.0.0

# Security Settings (optional)
ALLOWED_DOMAINS=example.com,internal.company.com
RATE_LIMIT_PER_MINUTE=60
```

### Usage with Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "jenkins": {
      "command": "deno",
      "args": [
        "run",
        "--allow-net",
        "--allow-env",
        "--allow-read",
        "/path/to/jenkins-mcp-server/src/index.ts"
      ],
      "env": {
        "JENKINS_URL": "https://jenkins.example.com",
        "JENKINS_API_TOKEN": "your-token"
      }
    }
  }
}
```

## Security

- **Authentication**: Supports Jenkins API tokens and username/password
- **Authorization**: Role-based access control integration
- **Rate Limiting**: Built-in request throttling
- **Audit Logging**: Comprehensive action logging
- **HTTPS Support**: Secure communication with Jenkins

## Development

### Project Structure

```
jenkins-mcp-server/
├── src/
│   ├── index.ts              # Main entry point
│   ├── server.ts             # MCP server implementation
│   ├── jenkins/              # Jenkins integration
│   │   ├── client.ts         # Jenkins API client
│   │   ├── types.ts          # Type definitions
│   │   └── auth.ts           # Authentication handling
│   ├── tools/                # MCP tools implementation
│   │   ├── job.ts            # Job management tools
│   │   ├── build.ts          # Build management tools
│   │   ├── pipeline.ts       # Pipeline tools
│   │   └── monitoring.ts     # Monitoring tools
│   ├── resources/            # MCP resources
│   │   ├── configs.ts        # Configuration resources
│   │   ├── logs.ts           # Log resources
│   │   └── metrics.ts        # Metrics resources
│   ├── prompts/              # MCP prompts
│   │   ├── troubleshooting.ts
│   │   ├── best-practices.ts
│   │   └── security.ts
│   └── utils/                # Utility functions
│       ├── logger.ts         # Logging utilities
│       ├── validation.ts     # Input validation
│       └── config.ts         # Configuration management
├── tests/                    # Test files
├── docs/                     # Documentation
├── .env.example              # Environment variables template
├── deno.json                 # Deno configuration
└── README.md                 # This file
```

### Running Tests

```bash
deno task test
```

### Code Quality

```bash
# Format code
deno task fmt

# Lint code
deno task lint

# Type checking
deno task check
```

## Enterprise Features

### Multi-Instance Support

- Connect to multiple Jenkins instances
- Instance-specific configurations
- Cross-instance job orchestration

### Monitoring & Observability

- Comprehensive logging
- Performance metrics
- Health checks
- Error tracking

### Security & Compliance

- Audit trail for all actions
- Role-based access control
- Secure credential management
- Compliance reporting

## API Reference

### Tools

#### jenkins:job:trigger

Trigger a Jenkins job with optional parameters.

**Parameters:**

- `jobName`: Name of the Jenkins job
- `parameters`: Job parameters (optional)
- `branch`: Branch to build (for pipeline jobs)

#### jenkins:build:logs

Retrieve build logs for a specific build.

**Parameters:**

- `jobName`: Name of the Jenkins job
- `buildNumber`: Build number to retrieve logs for

### Resources

#### Jenkins Job Configuration

Access Jenkins job XML configurations.

#### Build History

Historical build data and metrics.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

- Documentation: [Wiki](https://github.com/your-org/jenkins-mcp-server/wiki)
- Issues: [GitHub Issues](https://github.com/your-org/jenkins-mcp-server/issues)
- Discussions:
  [GitHub Discussions](https://github.com/your-org/jenkins-mcp-server/discussions)
