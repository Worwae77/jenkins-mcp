/**
 * Jenkins MCP Resources
 *
 * This module implements the resources interface for the Jenkins MCP server.
 * Resources represent read-only data that can be retrieved from Jenkins instances.
 */

import type {
  ListResourcesRequest,
  ListResourcesResult,
  ReadResourceRequest,
  ReadResourceResult,
  Resource,
} from "@modelcontextprotocol/sdk/types.js";

import { logger } from "../utils/logger.ts";
import { validateBuildNumber, validateJobName } from "../utils/validation.ts";
import { JenkinsClient } from "../jenkins/client.ts";

/**
 * Available Jenkins resources
 */
const RESOURCE_TEMPLATES: Resource[] = [
  {
    uri: "jenkins://jobs",
    name: "All Jenkins Jobs",
    description: "List of all Jenkins jobs with their current status",
    mimeType: "application/json",
  },
  {
    uri: "jenkins://job/{jobName}",
    name: "Jenkins Job Details",
    description: "Detailed information about a specific Jenkins job",
    mimeType: "application/json",
  },
  {
    uri: "jenkins://job/{jobName}/config",
    name: "Jenkins Job Configuration",
    description: "Configuration XML for a specific Jenkins job",
    mimeType: "application/xml",
  },
  {
    uri: "jenkins://job/{jobName}/builds",
    name: "Jenkins Job Build History",
    description: "Build history for a specific Jenkins job",
    mimeType: "application/json",
  },
  {
    uri: "jenkins://job/{jobName}/build/{buildNumber}",
    name: "Jenkins Build Details",
    description: "Detailed information about a specific build",
    mimeType: "application/json",
  },
  {
    uri: "jenkins://job/{jobName}/build/{buildNumber}/logs",
    name: "Jenkins Build Logs",
    description: "Console logs for a specific build",
    mimeType: "text/plain",
  },
  {
    uri: "jenkins://job/{jobName}/build/{buildNumber}/artifacts",
    name: "Jenkins Build Artifacts",
    description: "Artifacts produced by a specific build",
    mimeType: "application/json",
  },
  {
    uri: "jenkins://nodes",
    name: "Jenkins Nodes",
    description: "List of all Jenkins nodes and their current status",
    mimeType: "application/json",
  },
  {
    uri: "jenkins://node/{nodeName}",
    name: "Jenkins Node Details",
    description: "Detailed information about a specific Jenkins node",
    mimeType: "application/json",
  },
  {
    uri: "jenkins://queue",
    name: "Jenkins Build Queue",
    description: "Current Jenkins build queue with pending jobs",
    mimeType: "application/json",
  },
  {
    uri: "jenkins://system/version",
    name: "Jenkins System Information",
    description: "Jenkins server version and system information",
    mimeType: "application/json",
  },
  {
    uri: "jenkins://system/health",
    name: "Jenkins System Health",
    description: "Current health status of the Jenkins instance",
    mimeType: "application/json",
  },
];

/**
 * Handle list resources request
 */
export function handleListResources(
  _request: ListResourcesRequest,
): ListResourcesResult {
  logger.debug("Listing available Jenkins resources");

  try {
    // For dynamic resources, we could query Jenkins to get actual job names, etc.
    // For now, return the template resources
    return {
      resources: RESOURCE_TEMPLATES,
    };
  } catch (error) {
    logger.error("Error listing resources:", error);
    throw error;
  }
}

/**
 * Handle read resource request
 */
export async function handleReadResource(
  request: ReadResourceRequest,
): Promise<ReadResourceResult> {
  const { uri } = request.params;

  logger.debug(`Reading Jenkins resource: ${uri}`);

  try {
    const client = new JenkinsClient();
    await client.initialize();

    const parsedUri = parseResourceUri(uri);

    switch (parsedUri.type) {
      case "jobs":
        return await readJobsList(client);

      case "job":
        return await readJobDetails(client, parsedUri.jobName!);

      case "job-config":
        return await readJobConfig(client, parsedUri.jobName!);

      case "job-builds":
        return readJobBuilds(client, parsedUri.jobName!);

      case "build":
        return await readBuildDetails(
          client,
          parsedUri.jobName!,
          parsedUri.buildNumber!,
        );

      case "build-logs":
        return await readBuildLogs(
          client,
          parsedUri.jobName!,
          parsedUri.buildNumber!,
        );

      case "build-artifacts":
        return await readBuildArtifacts(
          client,
          parsedUri.jobName!,
          parsedUri.buildNumber!,
        );

      case "nodes":
        return await readNodesList(client);

      case "node":
        return await readNodeDetails(client, parsedUri.nodeName!);

      case "queue":
        return await readQueue(client);

      case "system-version":
        return await readSystemVersion(client);

      case "system-health":
        return await readSystemHealth(client);

      default:
        throw new Error(`Unknown resource type: ${parsedUri.type}`);
    }
  } catch (error) {
    logger.error(`Error reading resource ${uri}:`, error);
    throw error;
  }
}

/**
 * Parse resource URI to extract type and parameters
 */
interface ParsedResourceUri {
  type: string;
  jobName?: string;
  buildNumber?: string | number;
  nodeName?: string;
}

function parseResourceUri(uri: string): ParsedResourceUri {
  const jenkinsPrefix = "jenkins://";
  if (!uri.startsWith(jenkinsPrefix)) {
    throw new Error(`Invalid Jenkins resource URI: ${uri}`);
  }

  const path = uri.slice(jenkinsPrefix.length);
  const segments = path.split("/");

  if (segments[0] === "jobs") {
    return { type: "jobs" };
  }

  if (segments[0] === "job" && segments.length >= 2) {
    const jobName = decodeURIComponent(segments[1]);

    if (segments.length === 2) {
      return { type: "job", jobName };
    }

    if (segments[2] === "config") {
      return { type: "job-config", jobName };
    }

    if (segments[2] === "builds") {
      return { type: "job-builds", jobName };
    }

    if (segments[2] === "build" && segments.length >= 4) {
      const buildNumber = segments[3];

      if (segments.length === 4) {
        return { type: "build", jobName, buildNumber };
      }

      if (segments[4] === "logs") {
        return { type: "build-logs", jobName, buildNumber };
      }

      if (segments[4] === "artifacts") {
        return { type: "build-artifacts", jobName, buildNumber };
      }
    }
  }

  if (segments[0] === "nodes") {
    return { type: "nodes" };
  }

  if (segments[0] === "node" && segments.length >= 2) {
    const nodeName = decodeURIComponent(segments[1]);
    return { type: "node", nodeName };
  }

  if (segments[0] === "queue") {
    return { type: "queue" };
  }

  if (segments[0] === "system") {
    if (segments[1] === "version") {
      return { type: "system-version" };
    }
    if (segments[1] === "health") {
      return { type: "system-health" };
    }
  }

  throw new Error(`Invalid Jenkins resource URI: ${uri}`);
}

/**
 * Resource handler implementations
 */

async function readJobsList(
  client: JenkinsClient,
): Promise<ReadResourceResult> {
  const jobs = await client.listJobs();

  return {
    contents: [
      {
        uri: "jenkins://jobs",
        mimeType: "application/json",
        text: JSON.stringify(jobs, null, 2),
      },
    ],
  };
}

async function readJobDetails(
  client: JenkinsClient,
  jobName: string,
): Promise<ReadResourceResult> {
  validateJobName(jobName);
  const job = await client.getJob(jobName);

  return {
    contents: [
      {
        uri: `jenkins://job/${encodeURIComponent(jobName)}`,
        mimeType: "application/json",
        text: JSON.stringify(job, null, 2),
      },
    ],
  };
}

async function readJobConfig(
  client: JenkinsClient,
  jobName: string,
): Promise<ReadResourceResult> {
  validateJobName(jobName);
  const config = await client.getJobConfig(jobName);

  return {
    contents: [
      {
        uri: `jenkins://job/${encodeURIComponent(jobName)}/config`,
        mimeType: "application/xml",
        text: config,
      },
    ],
  };
}

function readJobBuilds(
  _client: JenkinsClient,
  jobName: string,
): ReadResourceResult {
  validateJobName(jobName);
  // For builds list, we would need a separate API call or parse the job's builds array
  // For now, return empty array with note

  return {
    contents: [
      {
        uri: `jenkins://job/${encodeURIComponent(jobName)}/builds`,
        mimeType: "application/json",
        text: JSON.stringify([], null, 2), // Builds would need separate API call
      },
    ],
  };
}

async function readBuildDetails(
  client: JenkinsClient,
  jobName: string,
  buildNumber: string | number,
): Promise<ReadResourceResult> {
  validateJobName(jobName);
  validateBuildNumber(buildNumber);

  const build = await client.getBuild(jobName, buildNumber);

  return {
    contents: [
      {
        uri: `jenkins://job/${
          encodeURIComponent(jobName)
        }/build/${buildNumber}`,
        mimeType: "application/json",
        text: JSON.stringify(build, null, 2),
      },
    ],
  };
}

async function readBuildLogs(
  client: JenkinsClient,
  jobName: string,
  buildNumber: string | number,
): Promise<ReadResourceResult> {
  validateJobName(jobName);
  validateBuildNumber(buildNumber);

  const logs = await client.getBuildLogs({
    jobName,
    buildNumber,
    start: 0,
    progressiveLog: false,
  });

  return {
    contents: [
      {
        uri: `jenkins://job/${
          encodeURIComponent(jobName)
        }/build/${buildNumber}/logs`,
        mimeType: "text/plain",
        text: logs.text,
      },
    ],
  };
}

async function readBuildArtifacts(
  client: JenkinsClient,
  jobName: string,
  buildNumber: string | number,
): Promise<ReadResourceResult> {
  validateJobName(jobName);
  validateBuildNumber(buildNumber);

  const artifacts = await client.getBuildArtifacts(jobName, buildNumber);

  return {
    contents: [
      {
        uri: `jenkins://job/${
          encodeURIComponent(jobName)
        }/build/${buildNumber}/artifacts`,
        mimeType: "application/json",
        text: JSON.stringify(artifacts || [], null, 2),
      },
    ],
  };
}

async function readNodesList(
  client: JenkinsClient,
): Promise<ReadResourceResult> {
  const nodes = await client.listNodes();

  return {
    contents: [
      {
        uri: "jenkins://nodes",
        mimeType: "application/json",
        text: JSON.stringify(nodes, null, 2),
      },
    ],
  };
}

async function readNodeDetails(
  client: JenkinsClient,
  nodeName: string,
): Promise<ReadResourceResult> {
  const nodeStatus = await client.getNodeStatus({ nodeName });

  return {
    contents: [
      {
        uri: `jenkins://node/${encodeURIComponent(nodeName)}`,
        mimeType: "application/json",
        text: JSON.stringify(nodeStatus.nodes[0], null, 2),
      },
    ],
  };
}

async function readQueue(client: JenkinsClient): Promise<ReadResourceResult> {
  const queue = await client.getQueue();

  return {
    contents: [
      {
        uri: "jenkins://queue",
        mimeType: "application/json",
        text: JSON.stringify(queue, null, 2),
      },
    ],
  };
}

async function readSystemVersion(
  client: JenkinsClient,
): Promise<ReadResourceResult> {
  const version = await client.getVersion();

  return {
    contents: [
      {
        uri: "jenkins://system/version",
        mimeType: "application/json",
        text: JSON.stringify(version, null, 2),
      },
    ],
  };
}

async function readSystemHealth(
  client: JenkinsClient,
): Promise<ReadResourceResult> {
  // For system health, we'll combine multiple data points
  const [nodes, queue, version] = await Promise.all([
    client.listNodes(),
    client.getQueue(),
    client.getVersion(),
  ]);

  const health = {
    version: version.version,
    instanceIdentity: version.instanceIdentity,
    nodes: {
      total: nodes.length,
      online: nodes.filter((n) => !n.offline).length,
      offline: nodes.filter((n) => n.offline).length,
      idle: nodes.filter((n) => n.idle).length,
    },
    queue: {
      length: queue.length,
      items: queue.map((item) => ({
        id: item.id,
        task: item.task,
        why: item.why,
        stuck: item.stuck,
      })),
    },
    timestamp: new Date().toISOString(),
  };

  return {
    contents: [
      {
        uri: "jenkins://system/health",
        mimeType: "application/json",
        text: JSON.stringify(health, null, 2),
      },
    ],
  };
}
