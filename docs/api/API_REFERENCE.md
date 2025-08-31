# API Documentation

## Jenkins Model Context Protocol Server

**Version:** 1.0\
**Protocol:** Model Context Protocol (MCP)\
**Transport:** JSON-RPC 2.0 over stdio\
**Date:** August 30, 2025

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Tools Reference](#tools-reference)
4. [Resources Reference](#resources-reference)
5. [Error Handling](#error-handling)
6. [Examples](#examples)

---

## Overview

The Jenkins MCP Server provides a comprehensive interface for managing Jenkins
CI/CD operations through the Model Context Protocol. All communication follows
the JSON-RPC 2.0 specification.

### Protocol Information

- **Protocol Version:** MCP 1.0
- **Transport:** Standard Input/Output (stdio)
- **Message Format:** JSON-RPC 2.0
- **Character Encoding:** UTF-8

### Base URL Structure

The server connects to Jenkins instances using the configured base URL:

```
JENKINS_URL/api/json
```

---

## Authentication

### Supported Authentication Methods

#### 1. API Token (Recommended)

```bash
export JENKINS_USERNAME="your-username"
export JENKINS_API_TOKEN="your-api-token"
```

#### 2. Username/Password

```bash
export JENKINS_USERNAME="your-username"
export JENKINS_PASSWORD="your-password"
```

### Security Features

- **CSRF Protection:** Automatic CSRF crumb handling
- **Secure Headers:** Proper authorization headers
- **Connection Security:** HTTPS support
- **Credential Management:** Environment-based configuration

---

## Tools Reference

### Job Management

#### jenkins_list_jobs

List all accessible Jenkins jobs with their current status.

**Input Schema:**

```json
{}
```

**Response:**

```json
{
  "content": [{
    "type": "text",
    "text": "[{\"name\": \"job-name\", \"color\": \"blue\", \"url\": \"...\"}]"
  }],
  "isError": false
}
```

**Example:**

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"jenkins_list_jobs","arguments":{}}}' | jenkins-mcp-server
```

---

#### jenkins_get_job

Get detailed information about a specific Jenkins job.

**Input Schema:**

```json
{
  "type": "object",
  "properties": {
    "jobName": {
      "type": "string",
      "description": "Name of the Jenkins job"
    }
  },
  "required": ["jobName"]
}
```

**Parameters:**

- `jobName` (string, required): The name of the Jenkins job

**Response:**

```json
{
  "content": [{
    "type": "text",
    "text": "Job Details for \"job-name\":\n\n{...detailed job info...}"
  }],
  "isError": false
}
```

**Example:**

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"jenkins_get_job","arguments":{"jobName":"my-job"}}}' | jenkins-mcp-server
```

---

#### jenkins_create_job

Create a new Jenkins job with specified configuration.

**Input Schema:**

```json
{
  "type": "object",
  "properties": {
    "jobName": {
      "type": "string",
      "description": "Name of the new Jenkins job"
    },
    "jobType": {
      "type": "string",
      "description": "Type of job to create",
      "enum": ["freestyle", "pipeline"],
      "default": "freestyle"
    },
    "description": {
      "type": "string",
      "description": "Description for the new job",
      "default": ""
    },
    "script": {
      "type": "string",
      "description": "Pipeline script (required for pipeline jobs)"
    },
    "commands": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Shell commands to execute (for freestyle jobs)"
    }
  },
  "required": ["jobName"]
}
```

**Parameters:**

- `jobName` (string, required): Name of the new job
- `jobType` (string, optional): "freestyle" or "pipeline" (default: "freestyle")
- `description` (string, optional): Job description
- `script` (string, required for pipeline): Pipeline script content
- `commands` (array, optional for freestyle): Shell commands to execute

**Response:**

```json
{
  "content": [{
    "type": "text",
    "text": "✅ Jenkins job \"job-name\" created successfully!\n\nType: freestyle\nDescription: Job description"
  }],
  "isError": false
}
```

**Example - Freestyle Job:**

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"jenkins_create_job","arguments":{"jobName":"test-job","jobType":"freestyle","description":"Test job","commands":["echo Hello","date"]}}}' | jenkins-mcp-server
```

**Example - Pipeline Job:**

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"jenkins_create_job","arguments":{"jobName":"pipeline-job","jobType":"pipeline","description":"Pipeline job","script":"pipeline { agent any; stages { stage(\"Build\") { steps { echo \"Building...\" } } } }"}}}' | jenkins-mcp-server
```

---

### Build Operations

#### jenkins_trigger_job

Trigger a build for a specific Jenkins job.

**Input Schema:**

```json
{
  "type": "object",
  "properties": {
    "jobName": {
      "type": "string",
      "description": "Name of the Jenkins job to trigger"
    },
    "parameters": {
      "type": "object",
      "description": "Build parameters as key-value pairs",
      "additionalProperties": {
        "type": ["string", "number", "boolean"]
      }
    },
    "delay": {
      "type": "number",
      "description": "Delay in seconds before starting the build",
      "minimum": 0
    }
  },
  "required": ["jobName"]
}
```

**Parameters:**

- `jobName` (string, required): Name of the job to trigger
- `parameters` (object, optional): Build parameters
- `delay` (number, optional): Delay before starting build

**Response:**

```json
{
  "content": [{
    "type": "text",
    "text": "Build triggered successfully for job \"job-name\"\n\nResponse: {...}"
  }],
  "isError": false
}
```

---

#### jenkins_get_build

Get detailed information about a specific build.

**Input Schema:**

```json
{
  "type": "object",
  "properties": {
    "jobName": {
      "type": "string",
      "description": "Name of the Jenkins job"
    },
    "buildNumber": {
      "type": ["string", "number"],
      "description": "Build number (can be number or \"lastBuild\", \"lastSuccessfulBuild\", etc.)"
    }
  },
  "required": ["jobName", "buildNumber"]
}
```

**Parameters:**

- `jobName` (string, required): Name of the Jenkins job
- `buildNumber` (string|number, required): Build number or alias (e.g.,
  "lastBuild")

**Response:**

```json
{
  "content": [{
    "type": "text",
    "text": "Build Information for job-name #1:\n\n{...build details...}"
  }],
  "isError": false
}
```

---

#### jenkins_get_build_logs

Retrieve console logs from a Jenkins build.

**Input Schema:**

```json
{
  "type": "object",
  "properties": {
    "jobName": {
      "type": "string",
      "description": "Name of the Jenkins job"
    },
    "buildNumber": {
      "type": ["string", "number"],
      "description": "Build number"
    },
    "start": {
      "type": "number",
      "description": "Starting position for progressive log retrieval",
      "minimum": 0,
      "default": 0
    },
    "progressiveLog": {
      "type": "boolean",
      "description": "Whether to use progressive log retrieval",
      "default": false
    }
  },
  "required": ["jobName", "buildNumber"]
}
```

**Parameters:**

- `jobName` (string, required): Name of the Jenkins job
- `buildNumber` (string|number, required): Build number
- `start` (number, optional): Starting byte position (default: 0)
- `progressiveLog` (boolean, optional): Progressive log retrieval (default:
  false)

**Response:**

```json
{
  "content": [{
    "type": "text",
    "text": "Build Logs for job-name #1:\n\nConsole Output:\n[logs content...]"
  }],
  "isError": false
}
```

---

#### jenkins_stop_build

Stop a running Jenkins build.

**Input Schema:**

```json
{
  "type": "object",
  "properties": {
    "jobName": {
      "type": "string",
      "description": "Name of the Jenkins job"
    },
    "buildNumber": {
      "type": "number",
      "description": "Build number to stop"
    }
  },
  "required": ["jobName", "buildNumber"]
}
```

**Parameters:**

- `jobName` (string, required): Name of the Jenkins job
- `buildNumber` (number, required): Build number to stop

**Response:**

```json
{
  "content": [{
    "type": "text",
    "text": "Build job-name #1 stopped successfully"
  }],
  "isError": false
}
```

---

### Node Management

#### jenkins_list_nodes

List all Jenkins nodes and their current status.

**Input Schema:**

```json
{}
```

**Response:**

```json
{
  "content": [{
    "type": "text",
    "text": "Jenkins Nodes:\n\n[{\"displayName\": \"master\", \"offline\": false, ...}]"
  }],
  "isError": false
}
```

---

#### jenkins_get_node_status

Get detailed status information about Jenkins nodes.

**Input Schema:**

```json
{
  "type": "object",
  "properties": {
    "nodeName": {
      "type": "string",
      "description": "Name of the specific node (optional)"
    }
  }
}
```

**Parameters:**

- `nodeName` (string, optional): Specific node name, if not provided returns all
  nodes

**Response:**

```json
{
  "content": [{
    "type": "text",
    "text": "Node Status:\n\n{...node details...}"
  }],
  "isError": false
}
```

---

### Queue Management

#### jenkins_get_queue

Get the current Jenkins build queue.

**Input Schema:**

```json
{}
```

**Response:**

```json
{
  "content": [{
    "type": "text",
    "text": "Jenkins Build Queue:\n\n[{\"id\": 123, \"task\": {...}, ...}]"
  }],
  "isError": false
}
```

---

#### jenkins_cancel_queue_item

Cancel a specific item in the Jenkins build queue.

**Input Schema:**

```json
{
  "type": "object",
  "properties": {
    "queueId": {
      "type": "number",
      "description": "Queue item ID to cancel"
    }
  },
  "required": ["queueId"]
}
```

**Parameters:**

- `queueId` (number, required): Queue item ID to cancel

**Response:**

```json
{
  "content": [{
    "type": "text",
    "text": "Queue item 123 cancelled successfully"
  }],
  "isError": false
}
```

---

### System Information

#### jenkins_get_version

Get Jenkins server version and system information.

**Input Schema:**

```json
{}
```

**Response:**

```json
{
  "content": [{
    "type": "text",
    "text": "Jenkins Version: 2.401.3\nSystem Info: {...}"
  }],
  "isError": false
}
```

---

## Resources Reference

Currently, the server focuses on tools and does not expose resources. Future
versions may include:

- Job configurations as resources
- Build artifacts as resources
- Plugin information as resources

---

## Error Handling

### Error Response Format

All errors follow this consistent format:

```json
{
  "content": [{
    "type": "text",
    "text": "Error: [Human-readable error message]"
  }],
  "isError": true,
  "_meta": {
    "errorCode": "ERROR_CODE",
    "details": {...}
  }
}
```

### Common Error Codes

| Error Code          | Description              | Resolution                         |
| ------------------- | ------------------------ | ---------------------------------- |
| `AUTH_FAILED`       | Authentication failure   | Check credentials                  |
| `PERMISSION_DENIED` | Insufficient permissions | Verify Jenkins user permissions    |
| `JOB_NOT_FOUND`     | Job does not exist       | Verify job name                    |
| `BUILD_NOT_FOUND`   | Build does not exist     | Check build number                 |
| `NETWORK_ERROR`     | Connection issues        | Check Jenkins URL and connectivity |
| `VALIDATION_ERROR`  | Invalid input parameters | Review parameter format            |
| `SERVER_ERROR`      | Jenkins server error     | Check Jenkins server status        |

### HTTP Status Code Mapping

| HTTP Status | MCP Error           | Description                      |
| ----------- | ------------------- | -------------------------------- |
| 200         | Success             | Operation completed successfully |
| 401         | AUTH_FAILED         | Unauthorized access              |
| 403         | PERMISSION_DENIED   | Forbidden operation              |
| 404         | NOT_FOUND           | Resource not found               |
| 500         | SERVER_ERROR        | Internal server error            |
| 503         | SERVICE_UNAVAILABLE | Jenkins temporarily unavailable  |

---

## Examples

### Complete Workflow Example

```bash
# 1. List all jobs
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"jenkins_list_jobs","arguments":{}}}' | jenkins-mcp-server

# 2. Create a new job
echo '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"jenkins_create_job","arguments":{"jobName":"demo-job","jobType":"freestyle","description":"Demo job","commands":["echo Starting build","sleep 5","echo Build complete"]}}}' | jenkins-mcp-server

# 3. Trigger the job
echo '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"jenkins_trigger_job","arguments":{"jobName":"demo-job"}}}' | jenkins-mcp-server

# 4. Get job details
echo '{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"jenkins_get_job","arguments":{"jobName":"demo-job"}}}' | jenkins-mcp-server

# 5. Get build logs
echo '{"jsonrpc":"2.0","id":5,"method":"tools/call","params":{"name":"jenkins_get_build_logs","arguments":{"jobName":"demo-job","buildNumber":"lastBuild"}}}' | jenkins-mcp-server
```

### Pipeline Job Creation Example

```bash
# Create a pipeline job with Jenkinsfile script
PIPELINE_SCRIPT='pipeline {
  agent any
  stages {
    stage("Checkout") {
      steps {
        echo "Checking out code..."
      }
    }
    stage("Build") {
      steps {
        echo "Building application..."
        sh "make build"
      }
    }
    stage("Test") {
      steps {
        echo "Running tests..."
        sh "make test"
      }
    }
    stage("Deploy") {
      when {
        branch "main"
      }
      steps {
        echo "Deploying to production..."
        sh "make deploy"
      }
    }
  }
  post {
    always {
      echo "Pipeline completed"
    }
  }
}'

echo "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"tools/call\",\"params\":{\"name\":\"jenkins_create_job\",\"arguments\":{\"jobName\":\"ci-pipeline\",\"jobType\":\"pipeline\",\"description\":\"CI/CD Pipeline\",\"script\":\"$PIPELINE_SCRIPT\"}}}" | jenkins-mcp-server
```

---

## Rate Limiting and Best Practices

### Request Limits

- **Default Timeout:** 30 seconds per request
- **Retry Logic:** Up to 3 retries with exponential backoff
- **Concurrent Requests:** Limited by Jenkins server capacity

### Best Practices

1. **Authentication:** Use API tokens instead of passwords
2. **Error Handling:** Always check `isError` field in responses
3. **Timeouts:** Configure appropriate timeouts for long-running operations
4. **Logging:** Enable logging for debugging and audit purposes
5. **Security:** Use HTTPS in production environments
6. **Resource Management:** Close connections properly

### Performance Optimization

- **Connection Reuse:** HTTP keep-alive is enabled
- **Request Batching:** Combine multiple operations when possible
- **Caching:** Consider caching frequently accessed data
- **Monitoring:** Monitor response times and error rates

---

## Version History

| Version | Date       | Changes                                 |
| ------- | ---------- | --------------------------------------- |
| 1.0     | 2025-08-30 | Initial release with core functionality |

---

_This documentation is maintained alongside the codebase and should be updated
with any API changes._
