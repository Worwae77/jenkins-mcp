# Jenkins MCP Server Configuration

This directory contains the MCP (Model Context Protocol) configuration for
integrating the Jenkins MCP Server with VS Code and AI assistants.

## Files

- `mcp.json` - MCP server configuration for AI assistants and tools

## Usage

### With Claude Desktop

1. **Install Claude Desktop**: Download from
   [Anthropic](https://claude.ai/download)

2. **Configure Claude Desktop**: Add the Jenkins MCP server to your Claude
   Desktop configuration file:

   **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   **Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

   ```json
   {
     "mcpServers": {
       "jenkins-mcp-server": {
         "command": "deno",
         "args": [
           "run",
           "--allow-all",
           "/path/to/jenkins-mcp/src/simple-server.ts"
         ],
         "env": {
           "JENKINS_URL": "http://jenkins1.lab.127.0.0.1.nip.io",
           "JENKINS_USERNAME": "admin",
           "JENKINS_API_TOKEN": "116ff6632677def8eed7140bf738d859ce",
           "LOG_LEVEL": "info"
         }
       }
     }
   }
   ```

3. **Restart Claude Desktop** to load the new MCP server.

### With VS Code Extensions

1. **Install MCP Extension**: Search for "MCP" or "Model Context Protocol" in VS
   Code extensions

2. **Configure Workspace**: The `mcp.json` file in this directory will be
   automatically detected

3. **Use AI Features**: Access Jenkins operations through AI chat interfaces

### Environment Variables

Make sure to update the environment variables in the configuration:

```json
{
  "env": {
    "JENKINS_URL": "your-jenkins-url",
    "JENKINS_USERNAME": "your-username",
    "JENKINS_API_TOKEN": "your-api-token",
    "JENKINS_TIMEOUT": "30000",
    "JENKINS_RETRIES": "3",
    "LOG_LEVEL": "info"
  }
}
```

## Available Capabilities

### Tools

- `jenkins_list_jobs` - List all Jenkins jobs with status
- `jenkins_get_job` - Get detailed job information
- `jenkins_trigger_build` - Trigger job builds with parameters
- `jenkins_get_build` - Get build details and status
- `jenkins_get_build_logs` - Retrieve console logs
- `jenkins_get_job_status` - Get current job/build status
- `jenkins_get_version` - Get Jenkins server information

### Resources

- `jenkins://jobs` - Live job listings
- `jenkins://nodes` - Node and executor status
- `jenkins://queue` - Build queue information

### Prompts

- `jenkins_troubleshoot_build_failure` - AI-powered build analysis
- `jenkins_pipeline_best_practices` - Pipeline recommendations

## Example AI Interactions

Once configured, you can interact with Jenkins through natural language:

```
"List all my Jenkins jobs"
→ Uses jenkins_list_jobs tool

"Show me the details of the customer-api-demo job"
→ Uses jenkins_get_job tool

"Trigger a build for test-job-2"
→ Uses jenkins_trigger_build tool

"Help me troubleshoot the failed build #42 for customer-api-demo"
→ Uses jenkins_troubleshoot_build_failure prompt

"What are the best practices for Jenkins pipelines?"
→ Uses jenkins_pipeline_best_practices prompt
```

## Security Considerations

1. **API Tokens**: Use Jenkins API tokens instead of passwords
2. **Environment Variables**: Store credentials in environment variables, not in
   config files
3. **Network Access**: Ensure the MCP server can reach your Jenkins instance
4. **Permissions**: Verify Jenkins user has appropriate permissions for intended
   operations

## Troubleshooting

### Common Issues

1. **Authentication Failed**
   - Verify JENKINS_URL, JENKINS_USERNAME, and JENKINS_API_TOKEN
   - Test credentials with: `curl -u username:token jenkins-url/api/json`

2. **Server Not Starting**
   - Check Deno installation: `deno --version`
   - Verify file paths in configuration
   - Check environment variables are set

3. **Connection Timeout**
   - Increase JENKINS_TIMEOUT value
   - Check network connectivity to Jenkins server
   - Verify Jenkins server is running

### Debug Mode

Enable debug logging by setting:

```json
{
  "env": {
    "LOG_LEVEL": "debug"
  }
}
```

## Support

For issues and questions:

1. Check the main project README.md
2. Review Jenkins server logs
3. Enable debug logging for detailed output
4. Verify Jenkins API accessibility
