# Deployment Guide

## Jenkins Model Context Protocol Server

**Version:** 1.0\
**Last Updated:** August 30, 2025\
**Target Audience:** DevOps Engineers, System Administrators

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Installation Methods](#installation-methods)
4. [Configuration](#configuration)
5. [VS Code Integration](#vs-code-integration)
6. [Security Configuration](#security-configuration)
7. [Production Deployment](#production-deployment)
8. [Monitoring and Maintenance](#monitoring-and-maintenance)
9. [Backup and Recovery](#backup-and-recovery)
10. [Scaling and Performance](#scaling-and-performance)

---

## Prerequisites

### System Requirements

| Component            | Minimum                                  | Recommended            |
| -------------------- | ---------------------------------------- | ---------------------- |
| **Operating System** | macOS 10.15+, Ubuntu 18.04+, Windows 10+ | Latest stable versions |
| **Memory**           | 512MB RAM                                | 1GB+ RAM               |
| **Storage**          | 100MB free space                         | 500MB+ free space      |
| **Network**          | Internet connectivity                    | Reliable broadband     |
| **CPU**              | 1 core                                   | 2+ cores               |

### Software Dependencies

#### Required

- **Deno Runtime:** v1.40 or later
- **Git:** For source code management
- **VS Code:** With MCP extension support

#### Optional

- **Docker:** For containerized deployment
- **Node.js:** For npm package management (if needed)
- **Jenkins CLI:** For additional Jenkins operations

### Installation Commands

```bash
# Install Deno (macOS/Linux)
curl -fsSL https://deno.land/install.sh | sh

# Install Deno (Windows)
irm https://deno.land/install.ps1 | iex

# Verify installation
deno --version

# Install Git (if not already installed)
# macOS
brew install git

# Ubuntu
sudo apt update && sudo apt install git

# Windows
winget install Git.Git
```

---

## Environment Setup

### 1. Clone Repository

```bash
# Clone the project
git clone https://github.com/your-org/jenkins-mcp-server.git
cd jenkins-mcp-server

# Verify project structure
ls -la
```

### 2. Environment Configuration

```bash
# Copy environment template
cp .env.example .env.local

# Edit configuration file
nano .env.local
```

**Required Environment Variables:**

```bash
# Jenkins Connection
JENKINS_URL=http://your-jenkins-server.com
JENKINS_USERNAME=your-username
JENKINS_API_TOKEN=your-api-token

# Optional Configuration
JENKINS_TIMEOUT=30000
JENKINS_RETRIES=3
LOG_LEVEL=info
```

### 3. Verify Dependencies

```bash
# Check TypeScript compilation
deno check src/**/*.ts

# Test basic functionality
deno run --allow-all src/index.ts --test

# Verify Jenkins connectivity
curl "$JENKINS_URL/api/json" --user "$JENKINS_USERNAME:$JENKINS_API_TOKEN"
```

---

## Installation Methods

### Method 1: VS Code Integrated (Recommended)

This method integrates the MCP server directly with VS Code for seamless AI
assistant interaction.

#### Step 1: Configure VS Code MCP

Create or update `.vscode/mcp.json`:

```json
{
  "servers": {
    "jenkins-mcp-server": {
      "command": "deno",
      "args": [
        "run",
        "--allow-net",
        "--allow-env",
        "--allow-read",
        "--allow-write",
        "src/simple-server.ts"
      ],
      "cwd": "${workspaceFolder}",
      "env": {
        "JENKINS_URL": "http://your-jenkins-server.com",
        "JENKINS_USERNAME": "your-username",
        "JENKINS_API_TOKEN": "your-api-token",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

#### Step 2: Install VS Code Extensions

```bash
# Install required extensions
code --install-extension ms-vscode.vscode-json
code --install-extension bradlc.vscode-tailwindcss
```

#### Step 3: Reload VS Code

```bash
# Reload VS Code window
# Command Palette (Ctrl/Cmd+Shift+P) → "Developer: Reload Window"
```

### Method 2: Standalone Executable

Build a standalone executable for deployment without Deno runtime.

```bash
# Build executable
deno compile \
  --allow-net \
  --allow-env \
  --allow-read \
  --allow-write \
  --output jenkins-mcp-server \
  src/simple-server.ts

# Test executable
./jenkins-mcp-server

# Move to system path (optional)
sudo mv jenkins-mcp-server /usr/local/bin/
```

### Method 3: Docker Deployment

Create a containerized deployment for consistent environments.

#### Dockerfile

```dockerfile
FROM denoland/deno:1.40.0

WORKDIR /app

# Copy source code
COPY src/ ./src/
COPY deno.json ./
COPY deno.lock ./

# Cache dependencies
RUN deno cache src/index.ts

# Create non-root user
RUN useradd -r -s /bin/false jenkins-mcp
USER jenkins-mcp

# Expose health check endpoint (if implemented)
EXPOSE 8080

# Start server
CMD ["deno", "run", "--allow-all", "src/simple-server.ts"]
```

#### Build and Run

```bash
# Build Docker image
docker build -t jenkins-mcp-server:latest .

# Run container
docker run -d \
  --name jenkins-mcp \
  --env-file .env.local \
  --restart unless-stopped \
  jenkins-mcp-server:latest

# Check logs
docker logs jenkins-mcp
```

### Method 4: systemd Service (Linux)

Deploy as a system service for automatic startup and management.

#### Service File

Create `/etc/systemd/system/jenkins-mcp.service`:

```ini
[Unit]
Description=Jenkins MCP Server
After=network.target
Wants=network.target

[Service]
Type=simple
User=jenkins-mcp
Group=jenkins-mcp
WorkingDirectory=/opt/jenkins-mcp
ExecStart=/usr/local/bin/deno run --allow-all src/simple-server.ts
EnvironmentFile=/opt/jenkins-mcp/.env.local
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

#### Installation

```bash
# Create service user
sudo useradd -r -s /bin/false jenkins-mcp

# Deploy application
sudo mkdir -p /opt/jenkins-mcp
sudo cp -r . /opt/jenkins-mcp/
sudo chown -R jenkins-mcp:jenkins-mcp /opt/jenkins-mcp

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable jenkins-mcp
sudo systemctl start jenkins-mcp

# Check status
sudo systemctl status jenkins-mcp
```

---

## Configuration

### Security Configuration

#### API Token Generation

1. **Log into Jenkins:**
   ```
   Navigate to: Jenkins → User → Configure → API Token
   ```

2. **Generate Token:**
   ```
   Click "Add new Token" → Enter description → Generate
   ```

3. **Store Securely:**
   ```bash
   # Add to environment file
   echo "JENKINS_API_TOKEN=your-generated-token" >> .env.local

   # Set proper permissions
   chmod 600 .env.local
   ```

#### SSL/TLS Configuration

```bash
# For HTTPS Jenkins instances
export JENKINS_URL=https://your-jenkins-server.com

# For custom certificates
export NODE_EXTRA_CA_CERTS=/path/to/ca-certificates.crt
```

### Network Configuration

#### Firewall Rules

```bash
# Allow outbound HTTPS to Jenkins (Linux/iptables)
sudo iptables -A OUTPUT -p tcp --dport 443 -d your-jenkins-server.com -j ACCEPT

# Allow outbound HTTP to Jenkins (if using HTTP)
sudo iptables -A OUTPUT -p tcp --dport 80 -d your-jenkins-server.com -j ACCEPT
```

#### Proxy Configuration

```bash
# HTTP Proxy
export HTTP_PROXY=http://proxy.company.com:8080
export HTTPS_PROXY=http://proxy.company.com:8080

# Bypass proxy for local services
export NO_PROXY=localhost,127.0.0.1,.local,your-jenkins-server.local
```

### Logging Configuration

```bash
# Set log level
export LOG_LEVEL=info  # debug, info, warn, error

# Configure log rotation (Linux)
sudo tee /etc/logrotate.d/jenkins-mcp << EOF
/var/log/jenkins-mcp/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    copytruncate
}
EOF
```

---

## VS Code Integration

### Extension Configuration

Install and configure required VS Code extensions:

```json
// .vscode/extensions.json
{
  "recommendations": [
    "ms-vscode.vscode-json",
    "denoland.vscode-deno"
  ]
}
```

### Workspace Settings

Configure VS Code workspace settings:

```json
// .vscode/settings.json
{
  "deno.enable": true,
  "deno.unstable": false,
  "deno.suggest.imports.hosts": {
    "https://deno.land": true
  },
  "files.associations": {
    "*.ts": "typescript"
  }
}
```

### Tasks Configuration

Set up build and run tasks:

```json
// .vscode/tasks.json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Start Jenkins MCP Server",
      "type": "shell",
      "command": "deno",
      "args": ["run", "--allow-all", "src/simple-server.ts"],
      "group": {
        "kind": "build",
        "isDefault": true
      },
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "shared"
      },
      "options": {
        "env": {
          "LOG_LEVEL": "debug"
        }
      }
    },
    {
      "label": "Check TypeScript",
      "type": "shell",
      "command": "deno",
      "args": ["check", "src/**/*.ts"],
      "group": "build"
    }
  ]
}
```

---

## Production Deployment

### High Availability Setup

#### Load Balancer Configuration

```nginx
# nginx.conf
upstream jenkins_mcp_servers {
    server mcp-server-1:8080;
    server mcp-server-2:8080;
    server mcp-server-3:8080;
}

server {
    listen 80;
    server_name jenkins-mcp.company.com;
    
    location / {
        proxy_pass http://jenkins_mcp_servers;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

#### Health Check Endpoint

Add health check to your deployment:

```typescript
// src/health.ts
export function healthCheck(): { status: string; timestamp: string } {
  return {
    status: "healthy",
    timestamp: new Date().toISOString(),
  };
}
```

### SSL Termination

```bash
# Generate SSL certificate (Let's Encrypt)
sudo certbot --nginx -d jenkins-mcp.company.com

# Update nginx configuration for HTTPS
server {
    listen 443 ssl;
    server_name jenkins-mcp.company.com;
    
    ssl_certificate /etc/letsencrypt/live/jenkins-mcp.company.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/jenkins-mcp.company.com/privkey.pem;
    
    location / {
        proxy_pass http://jenkins_mcp_servers;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }
}
```

### Environment-Specific Configurations

#### Development

```bash
# .env.development
JENKINS_URL=http://jenkins-dev.company.local
LOG_LEVEL=debug
JENKINS_TIMEOUT=10000
```

#### Staging

```bash
# .env.staging
JENKINS_URL=https://jenkins-staging.company.com
LOG_LEVEL=info
JENKINS_TIMEOUT=30000
```

#### Production

```bash
# .env.production
JENKINS_URL=https://jenkins.company.com
LOG_LEVEL=warn
JENKINS_TIMEOUT=30000
JENKINS_RETRIES=5
```

---

## Monitoring and Maintenance

### Health Monitoring

```bash
# Health check script
#!/bin/bash
# /usr/local/bin/jenkins-mcp-health-check.sh

SERVER_URL="http://localhost:8080/health"
LOG_FILE="/var/log/jenkins-mcp/health.log"

if curl -f -s "$SERVER_URL" > /dev/null; then
    echo "$(date): ✅ Health check passed" >> "$LOG_FILE"
    exit 0
else
    echo "$(date): ❌ Health check failed" >> "$LOG_FILE"
    # Send alert
    echo "Jenkins MCP Server health check failed" | mail -s "Alert: MCP Server Down" ops-team@company.com
    exit 1
fi
```

### Log Monitoring

```bash
# Monitor logs for errors
tail -f /var/log/jenkins-mcp/server.log | grep -i error

# Set up log alerts
grep -i "error\|fatal\|critical" /var/log/jenkins-mcp/server.log | mail -s "MCP Server Errors" ops-team@company.com
```

### Performance Monitoring

```bash
# Monitor resource usage
#!/bin/bash
# /usr/local/bin/monitor-jenkins-mcp.sh

PID=$(pgrep -f "jenkins-mcp")
if [ -n "$PID" ]; then
    CPU=$(ps -p $PID -o %cpu --no-headers)
    MEM=$(ps -p $PID -o %mem --no-headers)
    echo "$(date): CPU: ${CPU}%, Memory: ${MEM}%" >> /var/log/jenkins-mcp/performance.log
fi
```

### Automated Updates

```bash
# Update script
#!/bin/bash
# /usr/local/bin/update-jenkins-mcp.sh

cd /opt/jenkins-mcp
git fetch origin
if [ $(git rev-list HEAD...origin/main --count) -gt 0 ]; then
    echo "Updates available, deploying..."
    systemctl stop jenkins-mcp
    git pull origin main
    deno cache --reload src/index.ts
    systemctl start jenkins-mcp
    echo "Update completed"
fi
```

---

## Backup and Recovery

### Configuration Backup

```bash
# Backup script
#!/bin/bash
# /usr/local/bin/backup-jenkins-mcp.sh

BACKUP_DIR="/backup/jenkins-mcp/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Backup configuration files
cp .env.local "$BACKUP_DIR/"
cp .vscode/mcp.json "$BACKUP_DIR/"
cp -r src/ "$BACKUP_DIR/"

# Backup logs
cp /var/log/jenkins-mcp/*.log "$BACKUP_DIR/" 2>/dev/null || true

# Create archive
tar -czf "${BACKUP_DIR}.tar.gz" -C "$BACKUP_DIR" .
rm -rf "$BACKUP_DIR"

echo "Backup created: ${BACKUP_DIR}.tar.gz"
```

### Recovery Procedures

```bash
# Recovery script
#!/bin/bash
# /usr/local/bin/recover-jenkins-mcp.sh

BACKUP_FILE="$1"
if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup-file.tar.gz>"
    exit 1
fi

# Stop service
systemctl stop jenkins-mcp

# Extract backup
TEMP_DIR="/tmp/jenkins-mcp-recovery"
mkdir -p "$TEMP_DIR"
tar -xzf "$BACKUP_FILE" -C "$TEMP_DIR"

# Restore files
cp "$TEMP_DIR/.env.local" /opt/jenkins-mcp/
cp "$TEMP_DIR/.vscode/mcp.json" /opt/jenkins-mcp/.vscode/
cp -r "$TEMP_DIR/src/"* /opt/jenkins-mcp/src/

# Set permissions
chown -R jenkins-mcp:jenkins-mcp /opt/jenkins-mcp

# Start service
systemctl start jenkins-mcp

echo "Recovery completed from $BACKUP_FILE"
```

---

## Scaling and Performance

### Horizontal Scaling

```yaml
# docker-compose.yml for multiple instances
version: "3.8"
services:
  jenkins-mcp-1:
    build: .
    environment:
      - INSTANCE_ID=1
    env_file: .env.local
    restart: unless-stopped

  jenkins-mcp-2:
    build: .
    environment:
      - INSTANCE_ID=2
    env_file: .env.local
    restart: unless-stopped

  jenkins-mcp-3:
    build: .
    environment:
      - INSTANCE_ID=3
    env_file: .env.local
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - jenkins-mcp-1
      - jenkins-mcp-2
      - jenkins-mcp-3
```

### Performance Tuning

```bash
# Optimize Deno runtime
export DENO_V8_FLAGS="--max-old-space-size=2048 --optimize-for-size"

# Configure OS limits
echo "jenkins-mcp soft nofile 65536" >> /etc/security/limits.conf
echo "jenkins-mcp hard nofile 65536" >> /etc/security/limits.conf

# System tuning
echo 'net.core.rmem_max = 134217728' >> /etc/sysctl.conf
echo 'net.core.wmem_max = 134217728' >> /etc/sysctl.conf
sysctl -p
```

### Load Testing

```bash
# Simple load test script
#!/bin/bash
# /usr/local/bin/load-test-jenkins-mcp.sh

CONCURRENT_USERS=10
REQUESTS_PER_USER=100

for i in $(seq 1 $CONCURRENT_USERS); do
    (
        for j in $(seq 1 $REQUESTS_PER_USER); do
            echo '{"jsonrpc":"2.0","id":'$j',"method":"tools/list","params":{}}' | \
                nc localhost 8080
        done
    ) &
done

wait
echo "Load test completed"
```

---

## Troubleshooting Deployment

### Common Deployment Issues

1. **Permission Errors:**
   ```bash
   sudo chown -R jenkins-mcp:jenkins-mcp /opt/jenkins-mcp
   sudo chmod +x /opt/jenkins-mcp/jenkins-mcp-server
   ```

2. **Port Conflicts:**
   ```bash
   # Check port usage
   sudo netstat -tlnp | grep :8080

   # Change port if needed
   export MCP_SERVER_PORT=8081
   ```

3. **Memory Issues:**
   ```bash
   # Increase memory limits
   export DENO_V8_FLAGS="--max-old-space-size=4096"
   ```

### Validation Checklist

- [ ] Deno runtime installed and accessible
- [ ] Environment variables configured
- [ ] Jenkins connectivity verified
- [ ] TypeScript compilation successful
- [ ] VS Code MCP configuration valid
- [ ] Service starts without errors
- [ ] Health checks passing
- [ ] Logs being generated
- [ ] Backup procedures tested

---

_This deployment guide should be customized for your specific infrastructure and
requirements._
