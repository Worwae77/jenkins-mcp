/**
 * Jenkins MCP Tools
 *
 * This module implements the tools interface for the Jenkins MCP server.
 * Tools represent actions that can be performed against Jenkins instances.
 */

import type {
  CallToolRequest,
  CallToolResult,
  ListToolsRequest,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";

import { JenkinsClient } from "../jenkins/client.ts";
import type {
  BuildLogsRequest,
  JobStatusRequest,
  JobTriggerRequest,
  NodeStatusRequest,
} from "../jenkins/types.ts";
import { logger } from "../utils/logger.ts";
import {
  validateBuildNumber,
  validateJobName,
  validateJobParameters,
} from "../utils/validation.ts";

/**
 * Available Jenkins tools
 */
const JENKINS_TOOLS: Tool[] = [
  {
    name: "jenkins_list_jobs",
    description: "List all Jenkins jobs with their current status",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
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
      isError: false,
      additionalProperties: false,
    },
  },
  {
    name: "jenkins_create_job",
    description: "Create a new Jenkins job with the specified configuration",
    inputSchema: {
      type: "object",
      properties: {
        jobName: {
          type: "string",
          description: "Name of the new Jenkins job",
        },
        jobType: {
          type: "string",
          description: "Type of job to create",
          enum: ["freestyle", "pipeline"],
          isError: false,
          default: "freestyle",
        },
        description: {
          type: "string",
          description: "Description for the new job",
          default: "",
        },
        script: {
          type: "string",
          description: "Pipeline script (required for pipeline jobs)",
        },
        commands: {
          type: "array",
          items: {
            type: "string",
          },
          description: "Shell commands to execute (for freestyle jobs)",
        },
      },
      required: ["jobName"],
      isError: false,
      additionalProperties: false,
    },
  },
  {
    name: "jenkins_trigger_job",
    description: "Trigger a Jenkins job build with optional parameters",
    inputSchema: {
      type: "object",
      properties: {
        jobName: {
          type: "string",
          description: "Name of the Jenkins job to trigger",
        },
        parameters: {
          type: "object",
          description: "Build parameters as key-value pairs",
          additionalProperties: {
            type: ["string", "number", "boolean"],
            isError: false,
          },
        },
        delay: {
          type: "number",
          description: "Delay in seconds before starting the build",
          minimum: 0,
        },
      },
      required: ["jobName"],
      isError: false,
      additionalProperties: false,
    },
  },
  {
    name: "jenkins_get_job_status",
    description: "Get the current status of a Jenkins job and its latest build",
    inputSchema: {
      type: "object",
      properties: {
        jobName: {
          type: "string",
          description: "Name of the Jenkins job",
        },
        buildNumber: {
          type: ["string", "number"],
          isError: false,
          description: "Specific build number to check (optional)",
        },
      },
      required: ["jobName"],
      isError: false,
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
          isError: false,
          description:
            'Build number (can be number or "lastBuild", "lastSuccessfulBuild", etc.)',
        },
      },
      required: ["jobName", "buildNumber"],
      isError: false,
      additionalProperties: false,
    },
  },
  {
    name: "jenkins_get_build_logs",
    description: "Get console logs from a Jenkins build",
    inputSchema: {
      type: "object",
      properties: {
        jobName: {
          type: "string",
          description: "Name of the Jenkins job",
        },
        buildNumber: {
          type: ["string", "number"],
          isError: false,
          description: "Build number",
        },
        start: {
          type: "number",
          description: "Starting position for progressive log retrieval",
          minimum: 0,
          default: 0,
        },
        progressiveLog: {
          type: "boolean",
          description: "Whether to use progressive log retrieval",
          default: false,
        },
      },
      required: ["jobName", "buildNumber"],
      isError: false,
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
      isError: false,
      additionalProperties: false,
    },
  },
  {
    name: "jenkins_list_nodes",
    description: "List all Jenkins nodes and their current status",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: "jenkins_get_node_status",
    description: "Get detailed status information about Jenkins nodes",
    inputSchema: {
      type: "object",
      properties: {
        nodeName: {
          type: "string",
          description:
            "Name of the specific node (optional - if not provided, returns all nodes)",
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: "jenkins_get_queue",
    description: "Get the current Jenkins build queue",
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
      isError: false,
      additionalProperties: false,
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
];

/**
 * Handle list tools request
 */
export function handleListTools(_request: ListToolsRequest): Tool[] {
  logger.debug("Listing available Jenkins tools");
  return JENKINS_TOOLS;
}

/**
 * Handle call tool request
 */
export async function handleCallTool(
  request: CallToolRequest,
): Promise<CallToolResult> {
  const { name, arguments: args } = request.params;

  logger.debug(`Calling Jenkins tool: ${name}`, { arguments: args });

  try {
    const client = new JenkinsClient();
    await client.initialize();

    switch (name) {
      case "jenkins_list_jobs":
        return await handleListJobs(client);

      case "jenkins_get_job":
        return await handleGetJob(client, args as { jobName: string });

      case "jenkins_create_job":
        return await handleCreateJob(
          client,
          args as {
            jobName: string;
            jobType?: string;
            description?: string;
            script?: string;
            commands?: string[];
          },
        );

      case "jenkins_trigger_job":
        return await handleTriggerJob(
          client,
          args as unknown as JobTriggerRequest,
        );

      case "jenkins_get_job_status":
        return await handleGetJobStatus(
          client,
          args as unknown as JobStatusRequest,
        );

      case "jenkins_get_build":
        return await handleGetBuild(
          client,
          args as { jobName: string; buildNumber: string | number },
        );

      case "jenkins_get_build_logs":
        return await handleGetBuildLogs(
          client,
          args as unknown as BuildLogsRequest,
        );

      case "jenkins_stop_build":
        return await handleStopBuild(
          client,
          args as { jobName: string; buildNumber: number },
        );

      case "jenkins_list_nodes":
        return await handleListNodes(client);

      case "jenkins_get_node_status":
        return await handleGetNodeStatus(client, args as NodeStatusRequest);

      case "jenkins_get_queue":
        return await handleGetQueue(client);

      case "jenkins_cancel_queue_item":
        return await handleCancelQueueItem(client, args as { queueId: number });

      case "jenkins_get_version":
        return await handleGetVersion(client);

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    logger.error(`Error calling tool ${name}:`, error);
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
}

/**
 * Tool handler implementations
 */

async function handleListJobs(client: JenkinsClient): Promise<CallToolResult> {
  const jobs = await client.listJobs();

  const jobsTable = jobs.map((job) => ({
    name: job.name,
    displayName: job.displayName,
    status: job.color,
    buildable: job.buildable,
    inQueue: job.inQueue,
    nextBuildNumber: job.nextBuildNumber,
    description: job.description || "No description",
  }));

  return {
    content: [
      {
        type: "text",
        text: `Found ${jobs.length} Jenkins jobs:\n\n${
          JSON.stringify(jobsTable, null, 2)
        }`,
      },
    ],
    isError: false,
  };
}

async function handleGetJob(
  client: JenkinsClient,
  args: { jobName: string },
): Promise<CallToolResult> {
  validateJobName(args.jobName);

  const job = await client.getJob(args.jobName);

  return {
    content: [
      {
        type: "text",
        text: `Job Details for "${args.jobName}":\n\n${
          JSON.stringify(job, null, 2)
        }`,
      },
    ],
    isError: false,
  };
}

async function handleCreateJob(
  client: JenkinsClient,
  args: {
    jobName: string;
    jobType?: string;
    description?: string;
    script?: string;
    commands?: string[];
  },
): Promise<CallToolResult> {
  validateJobName(args.jobName);

  const jobType = args.jobType || "freestyle";
  const description = args.description || "";

  let configXml: string;

  if (jobType === "pipeline") {
    if (!args.script) {
      throw new Error("Pipeline script is required for pipeline jobs");
    }

    configXml = `<?xml version='1.1' encoding='UTF-8'?>
<flow-definition plugin="workflow-job">
  <actions/>
  <description>${description}</description>
  <keepDependencies>false</keepDependencies>
  <properties/>
  <definition class="org.jenkinsci.plugins.workflow.cps.CpsFlowDefinition" plugin="workflow-cps">
    <script>${args.script}</script>
    <sandbox>true</sandbox>
  </definition>
  <triggers/>
  <disabled>false</disabled>
</flow-definition>`;
  } else {
    // Freestyle job
    const commandsXml = args.commands
      ? args.commands.map((cmd) => `        <command>${cmd}</command>`).join(
        "\n",
      )
      : '        <command>echo "Hello World"</command>';

    configXml = `<?xml version='1.1' encoding='UTF-8'?>
<project>
  <actions/>
  <description>${description}</description>
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
    <hudson.tasks.Shell>
${commandsXml}
    </hudson.tasks.Shell>
  </builders>
  <publishers/>
  <buildWrappers/>
</project>`;
  }

  await client.createJob(args.jobName, configXml);

  return {
    content: [
      {
        type: "text",
        text:
          `✅ Jenkins job "${args.jobName}" created successfully!\n\nType: ${jobType}\nDescription: ${
            description || "No description"
          }`,
      },
    ],
    isError: false,
  };
}

async function handleTriggerJob(
  client: JenkinsClient,
  args: JobTriggerRequest,
): Promise<CallToolResult> {
  validateJobName(args.jobName);

  if (args.parameters) {
    validateJobParameters(args.parameters);
  }

  const result = await client.triggerJob(args);

  return {
    content: [
      {
        type: "text",
        text:
          `Build triggered successfully for job "${args.jobName}"\n\nResponse: ${
            JSON.stringify(result, null, 2)
          }`,
      },
    ],
    isError: false,
  };
}

async function handleGetJobStatus(
  client: JenkinsClient,
  args: JobStatusRequest,
): Promise<CallToolResult> {
  validateJobName(args.jobName);

  if (args.buildNumber) {
    validateBuildNumber(args.buildNumber);
  }

  const status = await client.getJobStatus(args);

  return {
    content: [
      {
        type: "text",
        text: `Job Status for "${args.jobName}":\n\n${
          JSON.stringify(status, null, 2)
        }`,
      },
    ],
    isError: false,
  };
}

async function handleGetBuild(
  client: JenkinsClient,
  args: { jobName: string; buildNumber: string | number },
): Promise<CallToolResult> {
  validateJobName(args.jobName);
  validateBuildNumber(args.buildNumber);

  const build = await client.getBuild(args.jobName, args.buildNumber);

  return {
    content: [
      {
        type: "text",
        text: `Build Details for "${args.jobName}" #${args.buildNumber}:\n\n${
          JSON.stringify(build, null, 2)
        }`,
      },
    ],
    isError: false,
  };
}

async function handleGetBuildLogs(
  client: JenkinsClient,
  args: BuildLogsRequest,
): Promise<CallToolResult> {
  validateJobName(args.jobName);
  validateBuildNumber(args.buildNumber);

  const logs = await client.getBuildLogs(args);

  return {
    content: [
      {
        type: "text",
        text:
          `Build Logs for "${args.jobName}" #${args.buildNumber}:\n\n${logs.text}`,
      },
    ],
    isError: false,
  };
}

async function handleStopBuild(
  client: JenkinsClient,
  args: { jobName: string; buildNumber: number },
): Promise<CallToolResult> {
  validateJobName(args.jobName);
  validateBuildNumber(args.buildNumber);

  await client.stopBuild(args.jobName, args.buildNumber);

  return {
    content: [
      {
        type: "text",
        text:
          `Build #${args.buildNumber} for job "${args.jobName}" has been stopped.`,
      },
    ],
    isError: false,
  };
}

async function handleListNodes(client: JenkinsClient): Promise<CallToolResult> {
  const nodes = await client.listNodes();

  const nodesTable = nodes.map((node) => ({
    displayName: node.displayName,
    offline: node.offline,
    idle: node.idle,
    temporarilyOffline: node.temporarilyOffline,
    numExecutors: node.numExecutors,
    busyExecutors: node.executors?.filter((e) => !e.idle).length || 0,
    loadStatistics: node.loadStatistics,
  }));

  return {
    content: [
      {
        type: "text",
        text: `Found ${nodes.length} Jenkins nodes:\n\n${
          JSON.stringify(nodesTable, null, 2)
        }`,
      },
    ],
    isError: false,
  };
}

async function handleGetNodeStatus(
  client: JenkinsClient,
  args: NodeStatusRequest,
): Promise<CallToolResult> {
  const result = await client.getNodeStatus(args);

  return {
    content: [
      {
        type: "text",
        text: `Node Status ${
          args.nodeName ? `for "${args.nodeName}"` : "(All Nodes)"
        }:\n\n${JSON.stringify(result, null, 2)}`,
      },
    ],
    isError: false,
  };
}

async function handleGetQueue(client: JenkinsClient): Promise<CallToolResult> {
  const queue = await client.getQueue();

  return {
    content: [
      {
        type: "text",
        text: `Jenkins Build Queue (${queue.length} items):\n\n${
          JSON.stringify(queue, null, 2)
        }`,
      },
    ],
    isError: false,
  };
}

async function handleCancelQueueItem(
  client: JenkinsClient,
  args: { queueId: number },
): Promise<CallToolResult> {
  await client.cancelQueueItem(args.queueId);

  return {
    content: [
      {
        type: "text",
        text: `Queue item #${args.queueId} has been cancelled.`,
      },
    ],
    isError: false,
  };
}

async function handleGetVersion(
  client: JenkinsClient,
): Promise<CallToolResult> {
  const version = await client.getVersion();

  return {
    content: [
      {
        type: "text",
        text: `Jenkins Server Information:\n\n${
          JSON.stringify(version, null, 2)
        }`,
      },
    ],
    isError: false,
  };
}
