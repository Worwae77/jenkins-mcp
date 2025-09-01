#!/usr/bin/env deno run --allow-net --allow-env --allow-read --allow-write

/**
 * Jenkins MCP Server - Simple Implementation
 *
 * A straightforward Model Context Protocol server for Jenkins automation.
 */

// Types for MCP
interface Tool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

interface Resource {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
}

interface Prompt {
  name: string;
  description: string;
  arguments?: Array<{
    name: string;
    description: string;
    required: boolean;
  }>;
}

// Request/Response types
interface MCPRequest {
  jsonrpc: string;
  id: string | number;
  method: string;
  params?: unknown;
}

interface MCPResponse {
  jsonrpc: string;
  id: string | number;
  result?: unknown;
  error?: {
    code: number;
    message: string;
  };
}

// Import Jenkins modules
import { JenkinsClient } from "./jenkins/client.ts";
import { logger } from "./utils/logger.ts";
import { validateJobName } from "./utils/validation.ts";
import { getSSLTroubleshootingInfo } from "./utils/ssl.ts";
import { config } from "./utils/config.ts";

// Jenkins client instance
const jenkinsClient = new JenkinsClient();

// Define tools
const TOOLS: Tool[] = [
  {
    name: "jenkins_list_jobs",
    description: "List all Jenkins jobs with their current status",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "jenkins_get_job",
    description: "Get detailed information about a specific Jenkins job",
    inputSchema: {
      type: "object",
      properties: {
        jobName: {
          type: "string",
          description: "Name of the Jenkins job",
        },
      },
      required: ["jobName"],
    },
  },
  {
    name: "jenkins_trigger_build",
    description: "Trigger a build for a specific Jenkins job",
    inputSchema: {
      type: "object",
      properties: {
        jobName: {
          type: "string",
          description: "Name of the Jenkins job",
        },
        parameters: {
          type: "object",
          description: "Build parameters",
          additionalProperties: {
            type: ["string", "number", "boolean"],
          },
        },
      },
      required: ["jobName"],
    },
  },
  {
    name: "jenkins_get_version",
    description: "Get Jenkins server version and instance information",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: "jenkins_get_build_logs",
    description: "Get console logs from a specific Jenkins build",
    inputSchema: {
      type: "object",
      properties: {
        jobName: {
          type: "string",
          description: "Name of the Jenkins job",
        },
        buildNumber: {
          type: ["string", "number"],
          description:
            "Build number (or 'lastBuild', 'lastSuccessfulBuild', etc.)",
        },
        start: {
          type: "number",
          description: "Starting byte offset for logs",
        },
        progressiveLog: {
          type: "boolean",
          description: "Whether to use progressive log retrieval",
        },
      },
      required: ["jobName", "buildNumber"],
      additionalProperties: false,
    },
  },
  {
    name: "jenkins_create_job",
    description: "Create a new Jenkins job",
    inputSchema: {
      type: "object",
      properties: {
        jobName: {
          type: "string",
          description: "Name of the new Jenkins job",
        },
        jobType: {
          type: "string",
          description: "Type of job (freestyle, pipeline)",
          enum: ["freestyle", "pipeline"],
        },
        description: {
          type: "string",
          description: "Job description",
        },
        script: {
          type: "string",
          description: "Pipeline script (for pipeline jobs)",
        },
        commands: {
          type: "array",
          items: { type: "string" },
          description: "Shell commands (for freestyle jobs)",
        },
      },
      required: ["jobName", "jobType"],
      additionalProperties: false,
    },
  },
  {
    name: "jenkins_get_build",
    description: "Get detailed information about a specific build",
    inputSchema: {
      type: "object",
      properties: {
        jobName: {
          type: "string",
          description: "Name of the Jenkins job",
        },
        buildNumber: {
          type: ["string", "number"],
          description:
            "Build number (or 'lastBuild', 'lastSuccessfulBuild', etc.)",
        },
      },
      required: ["jobName", "buildNumber"],
      additionalProperties: false,
    },
  },
  {
    name: "jenkins_stop_build",
    description: "Stop a running Jenkins build",
    inputSchema: {
      type: "object",
      properties: {
        jobName: {
          type: "string",
          description: "Name of the Jenkins job",
        },
        buildNumber: {
          type: "number",
          description: "Build number to stop",
        },
      },
      required: ["jobName", "buildNumber"],
      additionalProperties: false,
    },
  },
  {
    name: "jenkins_list_nodes",
    description: "List all Jenkins nodes and their status",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: "jenkins_get_node_status",
    description: "Get detailed status of a specific Jenkins node",
    inputSchema: {
      type: "object",
      properties: {
        nodeName: {
          type: "string",
          description:
            "Name of the Jenkins node (optional, defaults to master)",
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: "jenkins_get_queue",
    description: "Get current Jenkins build queue",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: "jenkins_cancel_queue_item",
    description: "Cancel a queued Jenkins build",
    inputSchema: {
      type: "object",
      properties: {
        queueId: {
          type: "number",
          description: "Queue item ID to cancel",
        },
      },
      required: ["queueId"],
      additionalProperties: false,
    },
  },
  {
    name: "jenkins_ssl_diagnostics",
    description: "Get SSL/TLS configuration and troubleshooting information",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
  // TODO: F005 EXPERIMENTAL FEATURES - DISABLED FOR v1.0 RELEASE
  // These agent management tools have been moved to experimental status for v1.1
  // Uncomment and complete implementation in next release
  /*
  {
    name: "jenkins_restart_agent",
    description: "Restart a Jenkins agent service with support for Ansible playbooks and user-specified privilege handling",
    inputSchema: {
      type: "object",
      properties: {
        nodeName: {
          type: "string",
          description: "Name of the Jenkins node/agent to restart",
        },
        platform: {
          type: "string",
          enum: ["linux", "windows", "auto"],
          description: "Platform of the agent (linux, windows, or auto-detect)",
        },
        forceRestart: {
          type: "boolean",
          description: "Force restart even if agent appears healthy",
        },
        useAnsible: {
          type: "boolean",
          description: "Use Ansible playbooks for declarative restart (recommended for production)",
        },
        ansiblePlaybook: {
          type: "string",
          description: "Custom Ansible playbook path (relative to ansible/playbooks/)",
        },
        ansibleInventory: {
          type: "string",
          description: "Custom Ansible inventory file path (defaults to ansible/inventory.ini)",
        },
        ansibleVariables: {
          type: "object",
          description: "Additional variables to pass to Ansible playbook",
          additionalProperties: true,
        },
        templateName: {
          type: "string",
          enum: ["graceful_restart", "emergency_restart", "build_env_restart", "production_restart", "memory_recovery_restart"],
          description: "Predefined restart template for common scenarios",
        },
        templateVariables: {
          type: "object",
          description: "Variables to override in the selected template",
          additionalProperties: true,
        },
        bypassPrivilegeCheck: {
          type: "boolean",
          description: "Bypass automatic privilege checking - let Jenkins handle authorization",
        },
        userRole: {
          type: "string",
          enum: ["admin", "user", "operator"],
          description: "Specify user role for audit logging and privilege context",
        },
        requireConfirmation: {
          type: "boolean",
          description: "Require explicit confirmation before executing restart",
        },
        dryRun: {
          type: "boolean",
          description: "Simulate the restart operation without actually executing it",
        },
      },
      required: ["nodeName"],
      additionalProperties: false,
    },
  },
  */
  /*
  {
    name: "jenkins_agent_diagnostics",
    description: "Run diagnostics on a Jenkins agent to detect issues (requires admin role)",
    inputSchema: {
      type: "object",
      properties: {
        nodeName: {
          type: "string",
          description: "Name of the Jenkins node/agent to diagnose",
        },
        includeSystemInfo: {
          type: "boolean",
          description: "Include system information in diagnostics",
        },
        includeLogs: {
          type: "boolean",
          description: "Include logs and process information in diagnostics",
        },
      },
      required: ["nodeName"],
      additionalProperties: false,
    },
  },
  */
  /*
  {
    name: "jenkins_auto_recovery",
    description: "Attempt automatic recovery of a problematic Jenkins agent (requires admin role)",
    inputSchema: {
      type: "object",
      properties: {
        nodeName: {
          type: "string",
          description: "Name of the Jenkins node/agent to recover",
        },
        recoveryStrategy: {
          type: "string",
          enum: ["soft", "hard", "auto"],
          description: "Recovery strategy to use",
        },
        maxRetries: {
          type: "number",
          description: "Maximum number of recovery attempts",
          minimum: 1,
          maximum: 5,
        },
      },
      required: ["nodeName"],
      additionalProperties: false,
    },
  },
  */
];

// Define resources
const RESOURCES: Resource[] = [
  {
    uri: "jenkins://jobs",
    name: "Jenkins Jobs",
    description: "List of all Jenkins jobs with their current status",
    mimeType: "application/json",
  },
];

// Define prompts
const PROMPTS: Prompt[] = [
  {
    name: "jenkins_troubleshoot_build_failure",
    description: "Help troubleshoot a failed Jenkins build",
    arguments: [
      {
        name: "jobName",
        description: "Name of the failed Jenkins job",
        required: true,
      },
      {
        name: "buildNumber",
        description: "Build number that failed (optional)",
        required: false,
      },
    ],
  },
  {
    name: "jenkins_pipeline_best_practices",
    description: "Provide Jenkins Pipeline best practices and recommendations",
    arguments: [
      {
        name: "pipelineType",
        description: "Type of pipeline (declarative, scripted, multibranch)",
        required: false,
      },
      {
        name: "technology",
        description: "Technology stack (java, node, python, docker, etc.)",
        required: false,
      },
    ],
  },
];

// Handle tool calls
async function handleTool(
  name: string,
  args: Record<string, unknown>,
): Promise<unknown> {
  switch (name) {
    case "jenkins_list_jobs": {
      await jenkinsClient.initialize();
      const jobs = await jenkinsClient.listJobs();
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(jobs, null, 2),
          },
        ],
      };
    }

    case "jenkins_get_job": {
      const { jobName } = args as { jobName: string };
      validateJobName(jobName);

      await jenkinsClient.initialize();
      const job = await jenkinsClient.getJob(jobName);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(job, null, 2),
          },
        ],
      };
    }

    case "jenkins_trigger_build": {
      const { jobName, parameters } = args as {
        jobName: string;
        parameters?: Record<string, string | number | boolean>;
      };
      validateJobName(jobName);

      await jenkinsClient.initialize();
      const result = await jenkinsClient.triggerBuild({
        jobName,
        parameters,
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                message: result.message,
                queueItem: result.queueItem,
                status: "queued",
              },
              null,
              2,
            ),
          },
        ],
      };
    }

    case "jenkins_get_version": {
      await jenkinsClient.initialize();
      const version = await jenkinsClient.getVersion();

      return {
        content: [
          {
            type: "text",
            text: `Jenkins Server Information:\n\n${
              JSON.stringify(version, null, 2)
            }`,
          },
        ],
      };
    }

    case "jenkins_get_build_logs": {
      const { jobName, buildNumber, start = 0, progressiveLog = false } =
        args as {
          jobName: string;
          buildNumber: string | number;
          start?: number;
          progressiveLog?: boolean;
        };
      validateJobName(jobName);

      await jenkinsClient.initialize();
      const logs = await jenkinsClient.getBuildLogs({
        jobName,
        buildNumber: buildNumber.toString(),
        start,
        progressiveLog,
      });

      return {
        content: [
          {
            type: "text",
            text: `Build Logs for ${jobName} #${buildNumber}:\n\n${logs.text}`,
          },
        ],
      };
    }

    case "jenkins_create_job": {
      const { jobName, jobType, description, script, commands } = args as {
        jobName: string;
        jobType: "freestyle" | "pipeline";
        description?: string;
        script?: string;
        commands?: string[];
      };
      validateJobName(jobName);

      await jenkinsClient.initialize();

      // Generate XML configuration
      let configXml: string;

      if (jobType === "freestyle") {
        const escapedDescription =
          (description || `Created via MCP - ${new Date().toISOString()}`)
            .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        const buildSteps = (commands || []).map((cmd) =>
          `    <hudson.tasks.Shell><command>${
            cmd.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(
              />/g,
              "&gt;",
            )
          }</command></hudson.tasks.Shell>`
        ).join("\n");

        configXml = `<?xml version='1.1' encoding='UTF-8'?>
<project>
  <description>${escapedDescription}</description>
  <keepDependencies>false</keepDependencies>
  <properties/>
  <scm class="hudson.scm.NullSCM"/>
  <canRoam>true</canRoam>
  <disabled>false</disabled>
  <blockBuildWhenDownstreamBuilding>false</blockBuildWhenDownstreamBuilding>
  <blockBuildWhenUpstreamBuilding>false</blockBuildWhenUpstreamBuilding>
  <triggers/>
  <concurrentBuild>false</concurrentBuild>
  <builders>
${buildSteps}
  </builders>
  <publishers/>
  <buildWrappers/>
</project>`;
      } else {
        const escapedDescription =
          (description || `Created via MCP - ${new Date().toISOString()}`)
            .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        const escapedScript = (script || "echo 'Hello from pipeline'").replace(
          /&/g,
          "&amp;",
        ).replace(/</g, "&lt;").replace(/>/g, "&gt;");

        configXml = `<?xml version='1.1' encoding='UTF-8'?>
<flow-definition plugin="workflow-job">
  <description>${escapedDescription}</description>
  <keepDependencies>false</keepDependencies>
  <properties/>
  <definition class="org.jenkinsci.plugins.workflow.cps.CpsFlowDefinition" plugin="workflow-cps">
    <script>${escapedScript}</script>
    <sandbox>true</sandbox>
  </definition>
  <triggers/>
  <disabled>false</disabled>
</flow-definition>`;
      }

      const result = await jenkinsClient.createJob(jobName, configXml);

      return {
        content: [
          {
            type: "text",
            text: `Job '${jobName}' created successfully: ${
              JSON.stringify(result, null, 2)
            }`,
          },
        ],
      };
    }

    case "jenkins_get_build": {
      const { jobName, buildNumber } = args as {
        jobName: string;
        buildNumber: string | number;
      };
      validateJobName(jobName);

      await jenkinsClient.initialize();
      const build = await jenkinsClient.getBuild(jobName, buildNumber);

      return {
        content: [
          {
            type: "text",
            text: `Build Information:\n\n${JSON.stringify(build, null, 2)}`,
          },
        ],
      };
    }

    case "jenkins_stop_build": {
      const { jobName, buildNumber } = args as {
        jobName: string;
        buildNumber: number;
      };
      validateJobName(jobName);

      await jenkinsClient.initialize();
      const result = await jenkinsClient.stopBuild(jobName, buildNumber);

      return {
        content: [
          {
            type: "text",
            text: `Build ${buildNumber} for job '${jobName}' stopped: ${
              JSON.stringify(result, null, 2)
            }`,
          },
        ],
      };
    }

    case "jenkins_list_nodes": {
      await jenkinsClient.initialize();
      const nodes = await jenkinsClient.listNodes();

      return {
        content: [
          {
            type: "text",
            text: `Jenkins Nodes:\n\n${JSON.stringify(nodes, null, 2)}`,
          },
        ],
      };
    }

    case "jenkins_get_node_status": {
      const { nodeName } = args as { nodeName?: string };

      await jenkinsClient.initialize();
      const nodeStatus = await jenkinsClient.getNodeStatus(
        nodeName || undefined,
      );

      return {
        content: [
          {
            type: "text",
            text: `Node Status:\n\n${JSON.stringify(nodeStatus, null, 2)}`,
          },
        ],
      };
    }

    case "jenkins_get_queue": {
      await jenkinsClient.initialize();
      const queue = await jenkinsClient.getBuildQueue();

      return {
        content: [
          {
            type: "text",
            text: `Build Queue:\n\n${JSON.stringify(queue, null, 2)}`,
          },
        ],
      };
    }

    case "jenkins_cancel_queue_item": {
      const { queueId } = args as { queueId: number };

      await jenkinsClient.initialize();
      const result = await jenkinsClient.cancelQueueItem(queueId);

      return {
        content: [
          {
            type: "text",
            text: `Queue item ${queueId} cancelled: ${
              JSON.stringify(result, null, 2)
            }`,
          },
        ],
      };
    }

    case "jenkins_ssl_diagnostics": {
      const sslInfo = {
        jenkinsUrl: config.jenkinsUrl,
        sslConfig: config.ssl,
        troubleshootingGuide: getSSLTroubleshootingInfo(),
        currentEnvironment: {
          JENKINS_SSL_VERIFY: Deno.env.get("JENKINS_SSL_VERIFY") || "true",
          JENKINS_SSL_ALLOW_SELF_SIGNED:
            Deno.env.get("JENKINS_SSL_ALLOW_SELF_SIGNED") || "false",
          JENKINS_CA_CERT_PATH: Deno.env.get("JENKINS_CA_CERT_PATH") ||
            "not set",
          JENKINS_SSL_DEBUG: Deno.env.get("JENKINS_SSL_DEBUG") || "false",
        },
      };

      return {
        content: [
          {
            type: "text",
            text: `SSL/TLS Configuration and Diagnostics:\n\n${
              JSON.stringify(sslInfo, null, 2)
            }`,
          },
        ],
      };
    }

    // TODO: F005 EXPERIMENTAL CASE HANDLERS - DISABLED FOR v1.0 RELEASE
    // These case handlers are for experimental agent management features
    // Uncomment and complete implementation in next release (v1.1)
    /*
    case "jenkins_restart_agent": {
      const {
        nodeName,
        platform = "auto",
        forceRestart,
        useAnsible,
        ansiblePlaybook,
        ansibleInventory,
        ansibleVariables,
        templateName,
        templateVariables,
        bypassPrivilegeCheck = true,
        userRole,
        requireConfirmation,
        dryRun = false
      } = args as {
        nodeName: string;
        platform?: "linux" | "windows" | "auto";
        forceRestart?: boolean;
        useAnsible?: boolean;
        ansiblePlaybook?: string;
        ansibleInventory?: string;
        ansibleVariables?: Record<string, any>;
      };

      await jenkinsClient.initialize();

      // Build request object
      const restartRequest: any = {
        nodeName,
        platform,
        force: forceRestart || false,
        bypassPrivilegeCheck,
        userRole,
        requireConfirmation,
        dryRun
      };

      // Add Ansible support if requested
      if (useAnsible || ansiblePlaybook || templateName) {
        restartRequest.useAnsible = true;

        if (ansiblePlaybook) {
          restartRequest.ansiblePlaybook = ansiblePlaybook;
        }

        if (ansibleInventory) {
          restartRequest.ansibleInventory = ansibleInventory;
        }

        if (ansibleVariables) {
          restartRequest.ansibleVariables = ansibleVariables;
        }

        if (templateName) {
          restartRequest.templateConfig = {
            templateName,
            variables: templateVariables || {}
          };
        }
      }

      const result = await jenkinsClient.restartAgent(restartRequest);

      return {
        content: [
          {
            type: "text",
            text: `Agent Restart Result:\n\n${JSON.stringify(result, null, 2)}`,
          },
        ],
        isError: !result.success,
      };
    }

    case "jenkins_agent_diagnostics": {
      const { nodeName, includeSystemInfo, includeLogs } = args as {
        nodeName: string;
        includeSystemInfo?: boolean;
        includeLogs?: boolean;
      };

      await jenkinsClient.initialize();
      const result = await jenkinsClient.getAgentDiagnostics({
        nodeName,
        includeSystemInfo: includeSystemInfo ?? true,
        includeLogs: includeLogs ?? true,
      });

      return {
        content: [
          {
            type: "text",
            text: `Agent Diagnostics:\n\n${JSON.stringify(result, null, 2)}`,
          },
        ],
      };
    }

    case "jenkins_auto_recovery": {
      const { nodeName, recoveryStrategy, maxRetries } = args as {
        nodeName: string;
        recoveryStrategy?: "soft" | "hard" | "auto";
        maxRetries?: number;
      };

      await jenkinsClient.initialize();
      const result = await jenkinsClient.recoverAgent({
        nodeName,
        strategy: recoveryStrategy || "auto",
        maxRetries: maxRetries || 3,
      });

      return {
        content: [
          {
            type: "text",
            text: `Agent Recovery Result:\n\n${JSON.stringify(result, null, 2)}`,
          },
        ],
        isError: !result.success,
      };
    }
    */

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// Handle resource reads
async function handleResource(uri: string): Promise<unknown> {
  switch (uri) {
    case "jenkins://jobs": {
      await jenkinsClient.initialize();
      const jobs = await jenkinsClient.listJobs();
      return {
        contents: [
          {
            uri,
            mimeType: "application/json",
            text: JSON.stringify(jobs, null, 2),
          },
        ],
      };
    }

    default:
      throw new Error(`Unknown resource: ${uri}`);
  }
}

// Handle prompt requests
async function handlePrompt(
  name: string,
  args: Record<string, unknown>,
): Promise<unknown> {
  switch (name) {
    case "jenkins_troubleshoot_build_failure": {
      const { jobName, buildNumber } = args as {
        jobName: string;
        buildNumber?: string | number;
      };

      await jenkinsClient.initialize();

      // Get build info
      const targetBuildNumber = buildNumber || "lastBuild";
      const build = await jenkinsClient.getBuild(jobName, targetBuildNumber);

      // Get build logs (first 2000 chars)
      const logsResponse = await jenkinsClient.getBuildLogs({
        jobName,
        buildNumber: targetBuildNumber,
        start: 0,
        progressiveLog: false,
      });

      const prompt =
        `You are a Jenkins troubleshooting expert. Please analyze this failed build and provide actionable recommendations.

Build Information:
- Job: ${jobName}
- Build Number: ${build.number}
- Status: ${build.result}
- Duration: ${build.duration}ms
- Started: ${new Date(build.timestamp).toISOString()}

Build Console Logs (last 2000 characters):
\`\`\`
${logsResponse.text.slice(-2000)}
\`\`\`

Please provide:
1. Root cause analysis of the failure
2. Specific steps to fix the issue 
3. Preventive measures for the future
4. Related Jenkins best practices`;

      return {
        description: "Jenkins build troubleshooting analysis",
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: prompt,
            },
          },
        ],
      };
    }

    case "jenkins_pipeline_best_practices": {
      const { pipelineType, technology } = args as {
        pipelineType?: string;
        technology?: string;
      };

      const pipelineTypeStr = pipelineType || "declarative";
      const technologyStr = technology || "general";

      const prompt =
        `You are a Jenkins Pipeline expert. Please provide comprehensive best practices and recommendations for Jenkins Pipelines.

Context:
- Pipeline Type: ${pipelineTypeStr}
- Technology Stack: ${technologyStr}

Please provide guidance on:

1. **Pipeline Structure & Design**
   - Recommended pipeline structure
   - Stage organization best practices
   - Error handling strategies

2. **Performance Optimization**
   - Build time optimization techniques
   - Resource usage optimization
   - Parallel execution strategies

3. **Security Best Practices**
   - Credential management
   - Secret handling
   - Access control

4. **Maintainability**
   - Code organization
   - Shared libraries usage
   - Documentation practices

5. **Monitoring & Observability**
   - Logging best practices
   - Metrics collection
   - Alerting strategies

6. **Technology-Specific Recommendations**
   - Best practices for ${technologyStr} projects
   - Relevant plugins and tools
   - Common pitfalls to avoid

Please provide practical examples and code snippets where applicable.`;

      return {
        description:
          `Jenkins Pipeline best practices for ${pipelineTypeStr} pipelines with ${technologyStr}`,
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: prompt,
            },
          },
        ],
      };
    }

    default:
      throw new Error(`Unknown prompt: ${name}`);
  }
}

// Main request handler
async function handleRequest(request: MCPRequest): Promise<MCPResponse> {
  try {
    switch (request.method) {
      case "tools/list":
        return {
          jsonrpc: "2.0",
          id: request.id,
          result: { tools: TOOLS },
        };

      case "tools/call": {
        const { name, arguments: args } = request.params as {
          name: string;
          arguments: Record<string, unknown>;
        };
        const result = await handleTool(name, args);
        return {
          jsonrpc: "2.0",
          id: request.id,
          result,
        };
      }

      case "resources/list":
        return {
          jsonrpc: "2.0",
          id: request.id,
          result: { resources: RESOURCES },
        };

      case "resources/read": {
        const { uri } = request.params as { uri: string };
        const result = await handleResource(uri);
        return {
          jsonrpc: "2.0",
          id: request.id,
          result,
        };
      }

      case "prompts/list":
        return {
          jsonrpc: "2.0",
          id: request.id,
          result: { prompts: PROMPTS },
        };

      case "prompts/get": {
        const { name, arguments: args } = request.params as {
          name: string;
          arguments: Record<string, unknown>;
        };
        const result = await handlePrompt(name, args);
        return {
          jsonrpc: "2.0",
          id: request.id,
          result,
        };
      }

      case "initialize":
        return {
          jsonrpc: "2.0",
          id: request.id,
          result: {
            protocolVersion: "2024-11-05",
            capabilities: {
              tools: {},
              resources: {},
              prompts: {},
            },
            serverInfo: {
              name: "jenkins-mcp-server",
              version: "1.0.0",
            },
          },
        };

      default:
        return {
          jsonrpc: "2.0",
          id: request.id,
          error: {
            code: -32601,
            message: `Method not found: ${request.method}`,
          },
        };
    }
  } catch (error) {
    logger.error(`Request failed:`, error);
    return {
      jsonrpc: "2.0",
      id: request.id,
      error: {
        code: -32603,
        message: error instanceof Error ? error.message : "Internal error",
      },
    };
  }
}

// Main function - handle stdio
async function main() {
  logger.info("Starting Jenkins MCP Server...");

  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  try {
    // Read from stdin line by line
    for await (const chunk of Deno.stdin.readable) {
      const text = decoder.decode(chunk).trim();
      if (!text) continue;

      try {
        const request: MCPRequest = JSON.parse(text);
        const response = await handleRequest(request);

        // Write response to stdout
        const responseText = JSON.stringify(response);
        await Deno.stdout.write(encoder.encode(responseText + "\n"));
      } catch (parseError) {
        logger.error("Failed to parse request:", parseError);
        // Send error response if we can extract an ID
        const errorResponse = {
          jsonrpc: "2.0",
          id: null,
          error: {
            code: -32700,
            message: "Parse error",
          },
        };
        await Deno.stdout.write(
          encoder.encode(JSON.stringify(errorResponse) + "\n"),
        );
      }
    }
  } catch (error) {
    logger.error("Server error:", error);
    Deno.exit(1);
  }
}

// Only run if this is the main module
if (import.meta.main) {
  main().catch((error) => {
    logger.error("Unhandled error:", error);
    Deno.exit(1);
  });
}
