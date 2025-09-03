# Jenkins MCP Server - Organizational Use

A Model Context Protocol (MCP) server for internal Jenkins automation at Kasikorn Bank.

[![Internal Use](https://img.shields.io/badge/Status-Internal%20Use-red.svg)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Deno](https://img.shields.io/badge/Deno-2.0+-black.svg)](https://deno.land/)

## 🏢 Organizational Quick Start

### Prerequisites

- [Deno](https://deno.land/) 2.0 or later
- Access to Kasikorn Bank Jenkins (`jenkins-ops.kasikornbank.com`)
- Service account credentials (contact IT for setup)
- Docker for containerized deployment

### Installation & Setup

```bash
# 1. Clone from internal repository
git clone <internal-repo-url>
cd jenkins-mcp

# 2. Create organizational configuration
make check-org-env
# Edit .env.org with organizational settings

# 3. Deploy organizational version
make deploy-org
```

## 🐳 Docker Deployment (Recommended)

### Quick Deploy
```bash
# Build and deploy organizational version
make deploy-org

# Check status
docker-compose -f docker-compose.org.yml logs
```

### Manual Docker Commands
```bash
# Build organizational image
docker build -f Dockerfile.org -t jenkins-mcp-server:org .

# Run with organizational settings
docker run --rm -i --env-file .env.org jenkins-mcp-server:org
```

## 🔧 Configuration

### Organizational Environment (`.env.org`)
```bash
# Jenkins Configuration
JENKINS_URL=https://jenkins-ops.kasikornbank.com
JENKINS_USERNAME=your-service-account
JENKINS_API_TOKEN=your-service-account-token

# SSL Configuration (corporate environment)
JENKINS_SSL_VERIFY=false
JENKINS_SSL_BYPASS_ALL=true
JENKINS_SSL_ALLOW_SELF_SIGNED=true

# Logging & Monitoring
LOG_LEVEL=debug
ENABLE_AUDIT_LOG=true
```

### VS Code Integration
The VS Code MCP configuration is pre-configured for organizational use:
```json
{
  "servers": {
    "jenkins-mcp-org": {
      "command": "docker",
      "args": ["run", "--rm", "-i", "--env-file", ".env.org", "jenkins-mcp-server:org"]
    }
  }
}
```

## 🔒 Security & Compliance

### SSL Configuration
- SSL verification **DISABLED** for corporate environment
- Self-signed certificates **ALLOWED** for internal CA
- SSL bypass **ENABLED** for corporate proxy/firewall

### Credential Management
- **Service accounts only** - no personal credentials
- Credentials stored in `.env.org` (never committed)
- Regular credential rotation required (quarterly)

### Audit & Monitoring
- All API calls logged with timestamps
- User activity tracking enabled
- Resource usage monitoring
- Compliance logging for security reviews

## 🛠️ Available Commands

### Deployment
```bash
make deploy-org          # Deploy organizational version
make stop-org           # Stop organizational deployment
make clean-org          # Clean organizational artifacts
```

### Development & Testing
```bash
make docker-build-org   # Build organizational Docker image
make test-unit          # Run unit tests
make test-integration   # Run integration tests
make quality            # Run all quality checks
```

### Monitoring
```bash
# View logs
docker-compose -f docker-compose.org.yml logs

# Check health
docker-compose -f docker-compose.org.yml ps

# Monitor resources
docker stats jenkins-mcp-server-org
```

## 📋 Jenkins Tools Available

The MCP server provides these Jenkins automation tools:

### Job Management
- `jenkins_list_jobs` - List all Jenkins jobs
- `jenkins_get_job` - Get job details
- `jenkins_trigger_build` - Start a build
- `jenkins_create_job` - Create new job

### Build Operations
- `jenkins_get_build` - Get build information
- `jenkins_get_build_logs` - Retrieve build logs
- `jenkins_stop_build` - Stop running build

### Infrastructure
- `jenkins_list_nodes` - List Jenkins nodes
- `jenkins_get_node_status` - Check node status
- `jenkins_get_queue` - View build queue
- `jenkins_cancel_queue_item` - Cancel queued build

### Diagnostics
- `jenkins_get_version` - Get Jenkins version
- `jenkins_ssl_diagnostics` - SSL troubleshooting

## 🔍 Troubleshooting

### Common Issues

#### SSL Certificate Errors
```bash
# Check SSL configuration
docker-compose -f docker-compose.org.yml exec jenkins-mcp-server printenv | grep SSL
```

#### Connection Timeouts
```bash
# Test Jenkins connectivity
docker-compose -f docker-compose.org.yml exec jenkins-mcp-server \
  curl -k -v https://jenkins-ops.kasikornbank.com
```

#### Authentication Failures
- Verify service account credentials are current
- Check if service account has necessary Jenkins permissions
- Ensure API token is valid and not expired

### Debug Mode
Enable detailed logging:
```bash
# Edit .env.org
LOG_LEVEL=debug
JENKINS_SSL_DEBUG=true

# Redeploy
make stop-org && make deploy-org
```

## 📊 Performance & Monitoring

### Resource Usage
- Memory: 256-512MB typical usage
- CPU: Low usage, spikes during API calls
- Network: Minimal bandwidth requirements

### Health Monitoring
- Automated health checks every 15 seconds
- Failure detection and restart capabilities
- Resource limit enforcement

## 📚 Documentation

- [Organizational Deployment Guide](docs/ORGANIZATIONAL_DEPLOYMENT.md)
- [Environment Variable Configuration](docs/ENV_VARIABLE_FIXES.md)
- [Testing Guide](docs/TESTING_GUIDE.md)
- [API Reference](docs/api/API_REFERENCE.md)

## 🆘 Support

For organizational deployment issues:
1. Check troubleshooting section above
2. Review container logs for error details
3. Verify network connectivity to Jenkins
4. Contact IT support team for infrastructure issues

## 🔐 Security Notice

**FOR INTERNAL USE ONLY**
- This deployment is configured for Kasikorn Bank internal networks
- SSL verification is disabled for corporate environment compatibility
- All usage is logged and monitored for compliance
- Credentials must be managed according to organizational security policy

---

*Jenkins MCP Server - Kasikorn Bank Internal Use*  
*Last Updated: September 2025*