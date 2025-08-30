# Troubleshooting Guide

## Jenkins Model Context Protocol Server

**Version:** 1.0\
**Last Updated:** August 30, 2025\
**Audience:** DevOps Engineers, System Administrators, Developers

---

## Table of Contents

1. [Quick Diagnostics](#quick-diagnostics)
2. [Common Issues](#common-issues)
3. [Authentication Problems](#authentication-problems)
4. [Connection Issues](#connection-issues)
5. [Configuration Problems](#configuration-problems)
6. [Performance Issues](#performance-issues)
7. [Logging and Debugging](#logging-and-debugging)
8. [Error Reference](#error-reference)
9. [Recovery Procedures](#recovery-procedures)
10. [Getting Help](#getting-help)

---

## Quick Diagnostics

### Health Check Checklist

Run through this checklist to quickly identify the issue category:

```bash
# 1. Check if Deno is installed and accessible
deno --version

# 2. Verify environment variables are set
echo "JENKINS_URL: $JENKINS_URL"
echo "JENKINS_USERNAME: $JENKINS_USERNAME"
echo "JENKINS_API_TOKEN: ${JENKINS_API_TOKEN:0:8}..." # Shows first 8 chars

# 3. Test Jenkins connectivity
curl -i "$JENKINS_URL/api/json" --user "$JENKINS_USERNAME:$JENKINS_API_TOKEN"

# 4. Check TypeScript compilation
cd /path/to/jenkins-mcp && deno check src/index.ts

# 5. Test MCP server startup
deno run --allow-all src/index.ts
```

### Quick Status Indicators

| Status          | Indicator         | Next Steps                         |
| --------------- | ----------------- | ---------------------------------- |
| ✅ **Healthy**  | All checks pass   | Continue with normal operations    |
| ⚠️ **Warning**  | Some checks fail  | Review specific failing components |
| ❌ **Critical** | Multiple failures | Follow recovery procedures         |

---

## Common Issues

### Issue 1: "Cannot find name 'handleCreateJob'"

**Symptoms:**

```
TS2304 [ERROR]: Cannot find name 'handleCreateJob'
```

**Cause:** Missing function implementation in tools module

**Solution:**

```bash
# Check if the function is properly exported
grep -n "handleCreateJob" src/tools/index.ts

# Verify function implementation exists
grep -A 10 "async function handleCreateJob" src/tools/index.ts
```

**Fix:** Ensure the `handleCreateJob` function is implemented and referenced
correctly in the switch statement.

---

### Issue 2: "MCP Tool Not Available"

**Symptoms:**

```
ERROR: The tool "mcp_jenkins-mcp-s_jenkins_create_job" does not exist
```

**Cause:** MCP server needs restart or tool not properly registered

**Solution:**

1. Restart VS Code
2. Reload MCP configuration
3. Verify tool registration in `src/tools/index.ts`

**Fix:**

```bash
# Check if tool is in JENKINS_TOOLS array
grep -A 5 -B 5 "jenkins_create_job" src/tools/index.ts

# Restart the MCP server
# In VS Code: Reload window or restart MCP extension
```

---

### Issue 3: "Connection Refused"

**Symptoms:**

```
Error: Connection refused to Jenkins server
```

**Cause:** Jenkins server unavailable or URL incorrect

**Solution:**

```bash
# Test basic connectivity
ping jenkins.example.com

# Test HTTP connectivity
curl -I "$JENKINS_URL"

# Check if Jenkins is running
curl "$JENKINS_URL/api/json"
```

**Fix:**

1. Verify Jenkins server is running
2. Check firewall settings
3. Confirm Jenkins URL in environment variables

---

### Issue 4: "Authentication Failed"

**Symptoms:**

```
Jenkins API error: 401 Unauthorized
```

**Cause:** Invalid credentials or expired tokens

**Solution:**

```bash
# Test credentials manually
curl -u "$JENKINS_USERNAME:$JENKINS_API_TOKEN" "$JENKINS_URL/api/json"

# Check token validity
curl -u "$JENKINS_USERNAME:$JENKINS_API_TOKEN" "$JENKINS_URL/me/api/json"
```

**Fix:**

1. Regenerate API token in Jenkins
2. Update environment variables
3. Verify username spelling

---

## Authentication Problems

### Problem: API Token Invalid

**Diagnostic Steps:**

1. Log into Jenkins web interface
2. Navigate to User → Configure → API Token
3. Verify token exists and is correct

**Resolution:**

```bash
# Generate new API token
# 1. Jenkins → User → Configure → API Token → Add new Token
# 2. Copy the generated token
# 3. Update environment variable
export JENKINS_API_TOKEN="new-token-here"
```

### Problem: CSRF Protection Issues

**Symptoms:**

```
Error: 403 No valid crumb was included in the request
```

**Diagnostic Steps:**

```bash
# Check if CSRF protection is enabled
curl "$JENKINS_URL/crumbIssuer/api/json" --user "$JENKINS_USERNAME:$JENKINS_API_TOKEN"
```

**Resolution:** The MCP server handles CSRF automatically. If issues persist:

1. Verify Jenkins CSRF settings
2. Check if proxy is interfering
3. Review Jenkins security configuration

### Problem: Permission Denied

**Symptoms:**

```
Error: 403 Forbidden - Insufficient permissions
```

**Diagnostic Steps:**

```bash
# Check user permissions
curl "$JENKINS_URL/me/api/json" --user "$JENKINS_USERNAME:$JENKINS_API_TOKEN"
```

**Resolution:**

1. Grant necessary permissions in Jenkins
2. Verify user is in correct groups
3. Check global security settings

---

## Connection Issues

### Problem: Network Timeouts

**Symptoms:**

```
Error: Request timeout after 30000ms
```

**Diagnostic Steps:**

```bash
# Test network latency
ping -c 4 jenkins.example.com

# Test HTTP response time
curl -w "@curl-format.txt" -o /dev/null -s "$JENKINS_URL/api/json"
```

**Resolution:**

```bash
# Increase timeout in environment
export JENKINS_TIMEOUT=60000  # 60 seconds

# Or configure in VS Code MCP settings
{
  "env": {
    "JENKINS_TIMEOUT": "60000"
  }
}
```

### Problem: SSL Certificate Issues

**Symptoms:**

```
Error: SSL certificate verification failed
```

**Diagnostic Steps:**

```bash
# Check SSL certificate
openssl s_client -connect jenkins.example.com:443 -servername jenkins.example.com

# Test with curl ignoring SSL
curl -k "$JENKINS_URL/api/json"
```

**Resolution:**

1. **Production:** Fix SSL certificate
2. **Development:** Use HTTP instead of HTTPS
3. **Testing:** Add certificate to trust store

### Problem: Proxy Configuration

**Symptoms:**

```
Error: Connection failed through proxy
```

**Diagnostic Steps:**

```bash
# Check proxy environment variables
echo "HTTP_PROXY: $HTTP_PROXY"
echo "HTTPS_PROXY: $HTTPS_PROXY"
echo "NO_PROXY: $NO_PROXY"
```

**Resolution:**

```bash
# Configure proxy for Jenkins MCP
export HTTP_PROXY="http://proxy.company.com:8080"
export HTTPS_PROXY="http://proxy.company.com:8080"
export NO_PROXY="localhost,127.0.0.1,.local"
```

---

## Configuration Problems

### Problem: Environment Variables Not Loaded

**Symptoms:**

```
Error: JENKINS_URL not configured
```

**Diagnostic Steps:**

```bash
# Check if .env.local exists
ls -la .env.local

# Verify environment variables
env | grep JENKINS
```

**Resolution:**

```bash
# Create .env.local file
cp .env.example .env.local

# Edit with correct values
nano .env.local

# Reload environment
source .env.local
```

### Problem: VS Code MCP Configuration

**Symptoms:**

- MCP tools not appearing in VS Code
- Server not starting automatically

**Diagnostic Steps:**

```bash
# Check VS Code MCP configuration
cat .vscode/mcp.json

# Verify workspace folder path
pwd
```

**Resolution:**

```json
{
  "servers": {
    "jenkins-mcp-server": {
      "command": "deno",
      "args": ["run", "--allow-all", "src/simple-server.ts"],
      "cwd": "${workspaceFolder}",
      "env": {
        "JENKINS_URL": "http://your-jenkins-url",
        "JENKINS_USERNAME": "your-username",
        "JENKINS_API_TOKEN": "your-token"
      }
    }
  }
}
```

### Problem: TypeScript Compilation Errors

**Symptoms:**

```
TS2345 [ERROR]: Argument of type 'unknown' is not assignable to parameter
```

**Diagnostic Steps:**

```bash
# Check TypeScript configuration
cat deno.json

# Run type checking
deno check src/**/*.ts
```

**Resolution:**

```bash
# Fix type issues
deno check --reload src/**/*.ts

# Update dependencies if needed
deno cache --reload src/index.ts
```

---

## Performance Issues

### Problem: Slow Response Times

**Symptoms:**

- Operations taking > 10 seconds
- Timeouts on large Jenkins instances

**Diagnostic Steps:**

```bash
# Test Jenkins API response time
time curl "$JENKINS_URL/api/json" --user "$JENKINS_USERNAME:$JENKINS_API_TOKEN"

# Check Jenkins server load
curl "$JENKINS_URL/systemInfo/api/json" --user "$JENKINS_USERNAME:$JENKINS_API_TOKEN"
```

**Resolution:**

1. **Increase Timeouts:**
   ```bash
   export JENKINS_TIMEOUT=60000
   ```

2. **Optimize Requests:**
   - Use specific endpoints instead of broad queries
   - Implement request caching
   - Batch related operations

3. **Jenkins Optimization:**
   - Review Jenkins plugin performance
   - Check available memory
   - Monitor system resources

### Problem: Memory Usage

**Symptoms:**

- High memory consumption
- Out of memory errors

**Diagnostic Steps:**

```bash
# Monitor memory usage
ps aux | grep deno

# Check Deno memory limits
deno run --v8-flags=--help | grep memory
```

**Resolution:**

```bash
# Increase memory limit
deno run --v8-flags=--max-old-space-size=4096 --allow-all src/index.ts

# Optimize code for memory usage
# - Use streaming for large responses
# - Implement garbage collection triggers
# - Reduce object retention
```

---

## Logging and Debugging

### Enable Debug Logging

```bash
# Set log level to debug
export LOG_LEVEL=debug

# Start server with debug output
deno run --allow-all src/index.ts 2>&1 | tee jenkins-mcp.log
```

### Log Analysis

```bash
# Search for errors in logs
grep -i error jenkins-mcp.log

# Find authentication issues
grep -i "auth\|401\|403" jenkins-mcp.log

# Check network problems
grep -i "timeout\|connection\|network" jenkins-mcp.log
```

### Debug MCP Communication

```bash
# Test MCP protocol directly
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | deno run --allow-all src/index.ts

# Trace JSON-RPC messages
export DEBUG_MCP=true
deno run --allow-all src/index.ts
```

### Advanced Debugging

```bash
# Run with Deno debugger
deno run --inspect --allow-all src/index.ts

# Enable V8 profiling
deno run --allow-all --v8-flags=--prof src/index.ts
```

---

## Error Reference

### Error Code Dictionary

| Error Code     | Severity | Description           | Action                            |
| -------------- | -------- | --------------------- | --------------------------------- |
| `ECONNREFUSED` | Critical | Connection refused    | Check Jenkins server status       |
| `ENOTFOUND`    | Critical | DNS resolution failed | Verify Jenkins URL                |
| `ETIMEDOUT`    | Warning  | Request timeout       | Increase timeout or check network |
| `401`          | High     | Authentication failed | Check credentials                 |
| `403`          | High     | Permission denied     | Review user permissions           |
| `404`          | Medium   | Resource not found    | Verify job/build names            |
| `500`          | High     | Jenkins server error  | Check Jenkins logs                |
| `503`          | Medium   | Service unavailable   | Wait and retry                    |

### Common Error Patterns

```bash
# Pattern: Authentication Loop
# Symptom: Repeated 401 errors
# Cause: Invalid token being cached
# Fix: Clear credentials and regenerate

# Pattern: Intermittent Failures
# Symptom: Random connection errors
# Cause: Network instability or Jenkins overload
# Fix: Implement retry logic, check infrastructure

# Pattern: Permission Escalation
# Symptom: 403 errors for previously working operations
# Cause: Jenkins permissions changed
# Fix: Review and restore user permissions
```

---

## Recovery Procedures

### Complete System Recovery

1. **Stop all processes:**
   ```bash
   pkill -f "jenkins-mcp"
   ```

2. **Clear cache and temporary files:**
   ```bash
   rm -rf /tmp/deno-*
   deno cache --reload src/index.ts
   ```

3. **Verify configuration:**
   ```bash
   deno check src/**/*.ts
   ```

4. **Test connectivity:**
   ```bash
   curl "$JENKINS_URL/api/json" --user "$JENKINS_USERNAME:$JENKINS_API_TOKEN"
   ```

5. **Restart services:**
   ```bash
   deno run --allow-all src/index.ts
   ```

### Rollback Procedures

```bash
# Revert to last known good configuration
git checkout HEAD~1 -- .vscode/mcp.json
git checkout HEAD~1 -- .env.local

# Restore from backup
cp .env.local.backup .env.local
cp .vscode/mcp.json.backup .vscode/mcp.json
```

### Emergency Contacts

- **Jenkins Admin:** Contact system administrator
- **Network Team:** For connectivity issues
- **Development Team:** For code-related problems

---

## Getting Help

### Information to Collect

When reporting issues, include:

1. **Environment Information:**
   ```bash
   deno --version
   echo "OS: $(uname -a)"
   echo "Jenkins MCP Version: $(cat package.json | grep version)"
   ```

2. **Configuration (sanitized):**
   ```bash
   # Remove sensitive data before sharing
   env | grep JENKINS | sed 's/TOKEN=.*/TOKEN=***/'
   ```

3. **Error Logs:**
   ```bash
   # Last 50 lines of logs
   tail -n 50 jenkins-mcp.log
   ```

4. **Steps to Reproduce:**
   - Exact commands used
   - Expected vs actual behavior
   - Frequency of occurrence

### Support Channels

- **Documentation:** Check project README and wiki
- **Issue Tracker:** GitHub Issues for bug reports
- **Community:** Discord/Slack channels for general help
- **Enterprise:** Support ticket for enterprise installations

### Self-Help Resources

- **API Documentation:** `/docs/api/API_REFERENCE.md`
- **Architecture Guide:** `/docs/architecture/SYSTEM_ARCHITECTURE.md`
- **Configuration Examples:** `/docs/guides/`
- **Community Wiki:** Project wiki pages

---

## Preventive Measures

### Regular Maintenance

```bash
# Weekly health check script
#!/bin/bash
echo "=== Jenkins MCP Health Check ==="
deno check src/**/*.ts
curl -s "$JENKINS_URL/api/json" > /dev/null && echo "✅ Jenkins accessible" || echo "❌ Jenkins unreachable"
echo "Log file size: $(du -h jenkins-mcp.log 2>/dev/null || echo 'No log file')"
```

### Monitoring Setup

```bash
# Monitor script for continuous operation
while true; do
  if ! pgrep -f "jenkins-mcp" > /dev/null; then
    echo "$(date): MCP server not running, restarting..."
    deno run --allow-all src/index.ts &
  fi
  sleep 60
done
```

### Backup Procedures

```bash
# Daily backup script
#!/bin/bash
backup_dir="/backup/jenkins-mcp/$(date +%Y%m%d)"
mkdir -p "$backup_dir"
cp .env.local "$backup_dir/"
cp .vscode/mcp.json "$backup_dir/"
cp jenkins-mcp.log "$backup_dir/" 2>/dev/null || true
```

---

_This troubleshooting guide should be updated as new issues are discovered and
resolved._
