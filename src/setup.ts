/**
 * Jenkins MCP Server setup with tools, resources, and prompts
 */

import { z } from "zod";
import { Server as McpServer } from "npm:@modelcontextprotocol/sdk@0.4.0/server/index.js";
import { logger } from "./utils/logger.ts";
import { validateBuildNumber, validateJobName } from "./utils/validation.ts";
import { JenkinsClient } from "./jenkins/client.ts";

/**
 * Setup Jenkins tools in McpServer
 */
export function setupJenkinsTools(server: McpServer) {
  logger.debug("Setting up Jenkins tools...");

  // List all Jenkins jobs
  server.tool(
    "jenkins_list_jobs",
    "List all Jenkins jobs with their current status",
    async () => {
      try {
        const client = new JenkinsClient();
        await client.initialize();
        const jobs = await client.listJobs();

        return {
          content: [
            {
              type: "text",
              text: `Found ${jobs.length} Jenkins jobs:\n\n${
                JSON.stringify(jobs, null, 2)
              }`,
            },
          ],
        };
      } catch (error) {
        logger.error("Error listing Jenkins jobs:", error);
        return {
          content: [
            {
              type: "text",
              text: `Error: ${
                error instanceof Error
                  ? error.message
                  : "Unknown error occurred"
              }`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  // Get specific job details
  server.tool(
    "jenkins_get_job",
    "Get detailed information about a specific Jenkins job",
    {
      jobName: z.string().describe("Name of the Jenkins job"),
    },
    async (args: { jobName: string }) => {
      const { jobName } = args;
      try {
        validateJobName(jobName);
        const client = new JenkinsClient();
        await client.initialize();
        const job = await client.getJob(jobName);

        return {
          content: [
            {
              type: "text",
              text: `Job Details for "${jobName}":\n\n${
                JSON.stringify(job, null, 2)
              }`,
            },
          ],
        };
      } catch (error) {
        logger.error(`Error getting job ${jobName}:`, error);
        return {
          content: [
            {
              type: "text",
              text: `Error: ${
                error instanceof Error
                  ? error.message
                  : "Unknown error occurred"
              }`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  // Trigger a job build with parameters
  server.tool(
    "jenkins_trigger_build",
    "Trigger a build for a specific Jenkins job",
    {
      jobName: z.string().describe("Name of the Jenkins job"),
      parameters: z.record(
        z.string(),
        z.union([z.string(), z.number(), z.boolean()]),
      ).optional().describe("Build parameters"),
      delay: z.number().optional().describe(
        "Delay in seconds before starting the build",
      ),
    },
    async (
      args: {
        jobName: string;
        parameters?: Record<string, string | number | boolean>;
        delay?: number;
      },
    ) => {
      const { jobName, parameters, delay } = args;
      try {
        validateJobName(jobName);
        const client = new JenkinsClient();
        await client.initialize();

        const result = await client.triggerJob({
          jobName,
          parameters,
          delay,
        });

        return {
          content: [
            {
              type: "text",
              text:
                `Build triggered successfully for job "${jobName}"\n\nResponse: ${
                  JSON.stringify(result, null, 2)
                }`,
            },
          ],
        };
      } catch (error) {
        logger.error(`Error triggering job ${jobName}:`, error);
        return {
          content: [
            {
              type: "text",
              text: `Error: ${
                error instanceof Error
                  ? error.message
                  : "Unknown error occurred"
              }`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  // Get job status
  server.tool(
    "jenkins_get_job_status",
    "Get the current status of a Jenkins job and its latest build",
    {
      jobName: z.string().describe("Name of the Jenkins job"),
      buildNumber: z.union([z.string(), z.number()]).optional().describe(
        "Specific build number to check (optional)",
      ),
    },
    async (args: { jobName: string; buildNumber?: string | number }) => {
      const { jobName, buildNumber } = args;
      try {
        validateJobName(jobName);
        if (buildNumber) {
          validateBuildNumber(buildNumber);
        }

        const client = new JenkinsClient();
        await client.initialize();

        const status = await client.getJobStatus({
          jobName,
          buildNumber,
        });

        return {
          content: [
            {
              type: "text",
              text: `Job Status for "${jobName}":\n\n${
                JSON.stringify(status, null, 2)
              }`,
            },
          ],
        };
      } catch (error) {
        logger.error(`Error getting job status ${jobName}:`, error);
        return {
          content: [
            {
              type: "text",
              text: `Error: ${
                error instanceof Error
                  ? error.message
                  : "Unknown error occurred"
              }`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  // Get build details
  server.tool(
    "jenkins_get_build",
    "Get detailed information about a specific build",
    {
      jobName: z.string().describe("Name of the Jenkins job"),
      buildNumber: z.union([z.string(), z.number()]).describe(
        "Build number (can be number or 'lastBuild', 'lastSuccessfulBuild', etc.)",
      ),
    },
    async (args: { jobName: string; buildNumber: string | number }) => {
      const { jobName, buildNumber } = args;
      try {
        validateJobName(jobName);
        validateBuildNumber(buildNumber);

        const client = new JenkinsClient();
        await client.initialize();

        const build = await client.getBuild(jobName, buildNumber);

        return {
          content: [
            {
              type: "text",
              text: `Build Details for "${jobName}" #${buildNumber}:\n\n${
                JSON.stringify(build, null, 2)
              }`,
            },
          ],
        };
      } catch (error) {
        logger.error(`Error getting build ${jobName}#${buildNumber}:`, error);
        return {
          content: [
            {
              type: "text",
              text: `Error: ${
                error instanceof Error
                  ? error.message
                  : "Unknown error occurred"
              }`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  // Get build logs
  server.tool(
    "jenkins_get_build_logs",
    "Get console logs from a Jenkins build",
    {
      jobName: z.string().describe("Name of the Jenkins job"),
      buildNumber: z.union([z.string(), z.number()]).describe("Build number"),
      start: z.number().min(0).optional().default(0).describe(
        "Starting position for progressive log retrieval",
      ),
      progressiveLog: z.boolean().optional().default(false).describe(
        "Whether to use progressive log retrieval",
      ),
    },
    async (
      args: {
        jobName: string;
        buildNumber: string | number;
        start?: number;
        progressiveLog?: boolean;
      },
    ) => {
      const { jobName, buildNumber, start, progressiveLog } = args;
      try {
        validateJobName(jobName);
        validateBuildNumber(buildNumber);

        const client = new JenkinsClient();
        await client.initialize();

        const logs = await client.getBuildLogs({
          jobName,
          buildNumber,
          start: start || 0,
          progressiveLog: progressiveLog || false,
        });

        return {
          content: [
            {
              type: "text",
              text:
                `Build Logs for "${jobName}" #${buildNumber}:\n\n${logs.text}`,
            },
          ],
        };
      } catch (error) {
        logger.error(
          `Error getting build logs ${jobName}#${buildNumber}:`,
          error,
        );
        return {
          content: [
            {
              type: "text",
              text: `Error: ${
                error instanceof Error
                  ? error.message
                  : "Unknown error occurred"
              }`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  // Get Jenkins version
  server.tool(
    "jenkins_get_version",
    "Get Jenkins server version and instance information",
    async () => {
      try {
        const client = new JenkinsClient();
        await client.initialize();
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
        };
      } catch (error) {
        logger.error("Error getting Jenkins version:", error);
        return {
          content: [
            {
              type: "text",
              text: `Error: ${
                error instanceof Error
                  ? error.message
                  : "Unknown error occurred"
              }`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  logger.info("Jenkins tools setup completed");
}

/**
 * Setup Jenkins resources in McpServer
 */
export function setupJenkinsResources(server: McpServer) {
  logger.debug("Setting up Jenkins resources...");

  // Jenkins jobs resource
  server.resource("jenkins-jobs", "jenkins://jobs", {
    name: "All Jenkins Jobs",
    description: "List of all Jenkins jobs with their current status",
    mimeType: "application/json",
  }, async () => {
    try {
      const client = new JenkinsClient();
      await client.initialize();
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
    } catch (error) {
      logger.error("Error reading Jenkins jobs resource:", error);
      throw error;
    }
  });

  // Jenkins nodes resource
  server.resource("jenkins-nodes", "jenkins://nodes", {
    name: "Jenkins Nodes",
    description: "List of all Jenkins nodes and their current status",
    mimeType: "application/json",
  }, async () => {
    try {
      const client = new JenkinsClient();
      await client.initialize();
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
    } catch (error) {
      logger.error("Error reading Jenkins nodes resource:", error);
      throw error;
    }
  });

  // Jenkins queue resource
  server.resource("jenkins-queue", "jenkins://queue", {
    name: "Jenkins Build Queue",
    description: "Current Jenkins build queue with pending jobs",
    mimeType: "application/json",
  }, async () => {
    try {
      const client = new JenkinsClient();
      await client.initialize();
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
    } catch (error) {
      logger.error("Error reading Jenkins queue resource:", error);
      throw error;
    }
  });

  logger.info("Jenkins resources setup completed");
}

/**
 * Setup Jenkins prompts in McpServer
 */
export function setupJenkinsPrompts(server: McpServer) {
  logger.debug("Setting up Jenkins prompts...");

  // Troubleshoot build failure prompt
  server.prompt(
    "jenkins_troubleshoot_build_failure",
    "Help troubleshoot a failed Jenkins build",
    {
      jobName: z.string().describe("Name of the failed Jenkins job"),
      buildNumber: z.union([z.string(), z.number()]).optional().describe(
        "Build number that failed (optional, defaults to last build)",
      ),
    },
    async (args: { jobName: string; buildNumber?: string | number }) => {
      const { jobName, buildNumber } = args;
      let context = "";
      let buildInfo = "";
      let logs = "";

      try {
        const client = new JenkinsClient();
        await client.initialize();

        // Get build information
        const targetBuildNumber = buildNumber || "lastBuild";
        const build = await client.getBuild(jobName, targetBuildNumber);

        buildInfo = `
Build Information:
- Job: ${jobName}
- Build Number: ${build.number}
- Result: ${build.result}
- Duration: ${build.duration}ms
- Built On: ${build.builtOn}
- Timestamp: ${new Date(build.timestamp).toISOString()}
`;

        // Get build logs
        const buildLogs = await client.getBuildLogs({
          jobName,
          buildNumber: build.number,
          start: 0,
          progressiveLog: false,
        });

        logs = `
Build Logs:
${buildLogs.text}
`;

        context = buildInfo + logs;
      } catch (error) {
        context = `Error retrieving build information: ${
          error instanceof Error ? error.message : "Unknown error"
        }`;
      }

      const prompt =
        `You are a Jenkins expert helping to troubleshoot a failed build. Please analyze the following build failure and provide actionable recommendations.

${context}

Please provide:
1. Root cause analysis of the build failure
2. Step-by-step troubleshooting guide
3. Preventive measures to avoid similar failures
4. Any relevant Jenkins best practices

Focus on practical, actionable solutions that can be implemented immediately.`;

      return {
        description: `Troubleshooting guidance for failed build: ${jobName}${
          buildNumber ? ` #${buildNumber}` : ""
        }`,
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
    },
  );

  // Pipeline best practices prompt
  server.prompt(
    "jenkins_pipeline_best_practices",
    "Provide Jenkins Pipeline best practices and recommendations",
    {
      pipelineType: z.string().optional().describe(
        "Type of pipeline (declarative, scripted, multibranch)",
      ),
      technology: z.string().optional().describe(
        "Technology stack (java, node, python, docker, etc.)",
      ),
    },
    (args: { pipelineType?: string; technology?: string }) => {
      const { pipelineType, technology } = args;
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

5. **Technology-Specific Recommendations**
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
    },
  );

  logger.info("Jenkins prompts setup completed");
}
