# Manual Job Creation Guide

Since the API user doesn't have job creation permissions, here's how to manually create sample jobs:

## Method 1: Using Jenkins Web Interface

### 1. Simple Hello World Job
1. Navigate to: `http://jenkins-dev-http.172.30.145.159.nip.io:443`
2. Login with username: `[REDACTED]`
3. Click "New Item"
4. Enter name: `hello-world-test`
5. Select "Freestyle project"
6. Click "OK"
7. In configuration:
   - Description: `Simple hello world test job`
   - Build Steps → Add build step → Execute shell
   - Command:
     ```bash
     echo "Hello World!"
     echo "Current date: $(date)"
     echo "Build number: ${BUILD_NUMBER}"
     ```
8. Save

### 2. Docker Pipeline Job
1. Click "New Item"
2. Enter name: `sample-docker-app`
3. Select "Pipeline"
4. Click "OK"
5. In configuration:
   - Description: `Sample Docker application pipeline`
   - Pipeline Definition: "Pipeline script"
   - Script: Copy content from `sample-docker-pipeline.groovy`
6. Save

## Method 2: Using Configuration Files

If you have admin access, you can import the XML configurations:

1. **hello-world-job.xml** - Simple freestyle job
2. **sample-docker-pipeline.xml** - Docker pipeline job

## After Manual Creation

Once jobs are created manually, you can use the MCP server to:

```bash
# List all jobs
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"jenkins_list_jobs"}}' | ./start-server.sh

# Trigger a build
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"jenkins_trigger_build","arguments":{"jobName":"hello-world-test"}}}' | ./start-server.sh

# Get job details
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"jenkins_get_job","arguments":{"jobName":"hello-world-test"}}}' | ./start-server.sh

# Monitor build progress
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"jenkins_get_build","arguments":{"jobName":"hello-world-test","buildNumber":"lastBuild"}}}' | ./start-server.sh

# Get build logs
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"jenkins_get_build_logs","arguments":{"jobName":"hello-world-test","buildNumber":"lastBuild"}}}' | ./start-server.sh
```

## Permission Issue

The 403 Forbidden error indicates user `[REDACTED]` needs additional permissions:
- **Job/Create** - To create new jobs
- **Job/Configure** - To modify job configurations  
- **Job/Build** - To trigger builds (this might work)
- **Job/Read** - To view jobs (this works)

Contact your Jenkins administrator to request these permissions.
