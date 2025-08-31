#!/usr/bin/env deno run --allow-net --allow-env --allow-read --allow-write

/**
 * Jenkins MCP Server - Alternative Implementation
 *
 * This is an alternative implementation using standard MCP patterns.
 */

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ReadResourceRequestSchema,
  ToolSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { JenkinsClient } from "./jenkins/client.ts";
import { validateBuildNumber, validateJobName } from "./utils/validation.ts";
import { logger } from "./utils/logger.ts";

const server = new StdioServerTransport();

// Jenkins client instance
const jenkinsClient = new JenkinsClient();

// Tool definitions
const JENKINS_TOOLS: ToolSchema[] = [
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
        delay: {
          type: "number",
          description: "Delay in seconds before starting the build",
        },
      },
      required: ["jobName"],
    },
  },
];

// Handle list tools request
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: JENKINS_TOOLS,
  };
});

// Handle call tool request
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "jenkins_list_jobs": {
        await jenkinsClient.initialize();
        const jobs = await jenkinsClient.getJobs();
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
        const { jobName, parameters, delay } = args as {
          jobName: string;
          parameters?: Record<string, string | number | boolean>;
          delay?: number;
        };
        validateJobName(jobName);

        await jenkinsClient.initialize();
        const result = await jenkinsClient.triggerBuild({
          jobName,
          parameters,
          delay,
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      default:
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${name}`,
        );
    }
  } catch (error) {
    logger.error(`Tool ${name} failed:`, error);
    return {
      content: [
        {
          type: "text",
          text: `Error: ${
            error instanceof Error ? error.message : "Unknown error occurred"
          }`,
        },
      ],
      isError: true,
    };
  }
});

// Handle list resources request
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: "jenkins://jobs",
        name: "Jenkins Jobs",
        description: "List of all Jenkins jobs with their current status",
        mimeType: "application/json",
      },
    ],
  };
});

// Handle read resource request
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  try {
    switch (uri) {
      case "jenkins://jobs": {
        await jenkinsClient.initialize();
        const jobs = await jenkinsClient.getJobs();
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
        throw new McpError(
          ErrorCode.InvalidRequest,
          `Unknown resource: ${uri}`,
        );
    }
  } catch (error) {
    logger.error(`Resource ${uri} failed:`, error);
    throw new McpError(
      ErrorCode.InternalError,
      `Failed to read resource: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    );
  }
});

// Handle list prompts request
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: [
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
            description:
              "Build number that failed (optional, defaults to last build)",
            required: false,
          },
        ],
      },
    ],
  };
});

// Handle get prompt request
server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "jenkins_troubleshoot_build_failure": {
        const { jobName, buildNumber } = args as {
          jobName: string;
          buildNumber?: string | number;
        };

        await jenkinsClient.initialize();

        // Get build information
        const targetBuildNumber = buildNumber || "lastBuild";
        const build = await jenkinsClient.getBuild(jobName, targetBuildNumber);

        // Get build logs
        const logs = await jenkinsClient.getBuildLogs({
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
${logs.content.slice(-2000)}
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
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown prompt: ${name}`,
        );
    }
  } catch (error) {
    logger.error(`Prompt ${name} failed:`, error);
    throw new McpError(
      ErrorCode.InternalError,
      `Failed to get prompt: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    );
  }
});

// Start the server
async function main() {
  logger.info("Starting Jenkins MCP Server...");

  // Handle process termination gracefully
  process.on("SIGINT", async () => {
    logger.info("Received SIGINT, shutting down gracefully...");
    await server.close();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    logger.info("Received SIGTERM, shutting down gracefully...");
    await server.close();
    process.exit(0);
  });

  try {
    // Connect to stdio transport
    await server.connect();
    logger.info("Jenkins MCP Server started successfully");
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
}

// Only run if this is the main module
if (import.meta.main) {
  main().catch((error) => {
    logger.error("Unhandled error:", error);
    process.exit(1);
  });
}
