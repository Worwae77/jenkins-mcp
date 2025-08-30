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
          description: "Build number (or 'lastBuild', 'lastSuccessfulBuild', etc.)",
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
      const result = await jenkinsClient.triggerJob({
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
      const { jobName, buildNumber, start = 0, progressiveLog = false } = args as {
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
