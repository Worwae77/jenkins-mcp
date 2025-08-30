/**
 * Jenkins MCP Prompts
 *
 * This module implements the prompts interface for the Jenkins MCP server.
 * Prompts provide templates and guidance for common Jenkins operations.
 */

import type {
  GetPromptRequest,
  GetPromptResult,
  ListPromptsRequest,
  ListPromptsResult,
  Prompt,
} from "@modelcontextprotocol/sdk/types.js";

import { logger } from "../utils/logger.ts";
import { JenkinsClient } from "../jenkins/client.ts";

/**
 * Available Jenkins prompts
 */
const JENKINS_PROMPTS: Prompt[] = [
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
  {
    name: "jenkins_security_audit",
    description: "Generate security audit recommendations for Jenkins instance",
    arguments: [],
  },
  {
    name: "jenkins_performance_analysis",
    description:
      "Analyze Jenkins performance and provide optimization suggestions",
    arguments: [
      {
        name: "timeRange",
        description: "Time range for analysis (1d, 7d, 30d)",
        required: false,
      },
    ],
  },
  {
    name: "jenkins_job_migration",
    description: "Guide for migrating Jenkins jobs between instances",
    arguments: [
      {
        name: "sourceInstance",
        description: "Source Jenkins instance",
        required: false,
      },
      {
        name: "targetInstance",
        description: "Target Jenkins instance",
        required: false,
      },
      {
        name: "jobPattern",
        description: "Pattern of jobs to migrate",
        required: false,
      },
    ],
  },
  {
    name: "jenkins_plugin_recommendations",
    description: "Recommend Jenkins plugins based on requirements",
    arguments: [
      {
        name: "requirements",
        description: "Description of what you want to achieve",
        required: true,
      },
      {
        name: "currentPlugins",
        description: "List of currently installed plugins",
        required: false,
      },
    ],
  },
  {
    name: "jenkins_backup_strategy",
    description: "Create a backup and disaster recovery strategy",
    arguments: [
      {
        name: "environment",
        description: "Environment type (production, staging, development)",
        required: false,
      },
      {
        name: "requirements",
        description: "Specific backup requirements",
        required: false,
      },
    ],
  },
  {
    name: "jenkins_node_optimization",
    description: "Optimize Jenkins node configuration and usage",
    arguments: [
      {
        name: "nodeType",
        description: "Type of nodes (permanent, cloud, docker)",
        required: false,
      },
      {
        name: "workload",
        description: "Expected workload characteristics",
        required: false,
      },
    ],
  },
];

/**
 * Handle list prompts request
 */
export function handleListPrompts(
  _request: ListPromptsRequest,
): ListPromptsResult {
  logger.debug("Listing available Jenkins prompts");

  return {
    prompts: JENKINS_PROMPTS,
  };
}

/**
 * Handle get prompt request
 */
export async function handleGetPrompt(
  request: GetPromptRequest,
): Promise<GetPromptResult> {
  const { name, arguments: args } = request.params;

  logger.debug(`Getting Jenkins prompt: ${name}`, { arguments: args });

  try {
    switch (name) {
      case "jenkins_troubleshoot_build_failure":
        return await getTroubleshootBuildFailurePrompt(args);

      case "jenkins_pipeline_best_practices":
        return getPipelineBestPracticesPrompt(args);

      case "jenkins_security_audit":
        return await getSecurityAuditPrompt(args);

      case "jenkins_performance_analysis":
        return await getPerformanceAnalysisPrompt(args);

      case "jenkins_job_migration":
        return getJobMigrationPrompt(args);

      case "jenkins_plugin_recommendations":
        return getPluginRecommendationsPrompt(args);

      case "jenkins_backup_strategy":
        return getBackupStrategyPrompt(args);

      case "jenkins_node_optimization":
        return await getNodeOptimizationPrompt(args);

      default:
        throw new Error(`Unknown prompt: ${name}`);
    }
  } catch (error) {
    logger.error(`Error getting prompt ${name}:`, error);
    throw error;
  }
}

/**
 * Prompt implementations
 */

async function getTroubleshootBuildFailurePrompt(
  args: Record<string, unknown> = {},
): Promise<GetPromptResult> {
  const jobName = args.jobName as string;
  const buildNumber = args.buildNumber as string | number | undefined;

  if (!jobName) {
    throw new Error("jobName argument is required");
  }

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
}

function getPipelineBestPracticesPrompt(
  args: Record<string, unknown> = {},
): GetPromptResult {
  const pipelineType = args.pipelineType as string || "declarative";
  const technology = args.technology as string || "general";

  const prompt =
    `You are a Jenkins Pipeline expert. Please provide comprehensive best practices and recommendations for Jenkins Pipelines.

Context:
- Pipeline Type: ${pipelineType}
- Technology Stack: ${technology}

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
   - Best practices for ${technology} projects
   - Relevant plugins and tools
   - Common pitfalls to avoid

Please provide practical examples and code snippets where applicable.`;

  return {
    description:
      `Jenkins Pipeline best practices for ${pipelineType} pipelines with ${technology}`,
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

async function getSecurityAuditPrompt(
  _args: Record<string, unknown> = {},
): Promise<GetPromptResult> {
  let systemInfo = "";

  try {
    const client = new JenkinsClient();
    await client.initialize();

    const [version, nodes] = await Promise.all([
      client.getVersion(),
      client.listNodes(),
    ]);

    systemInfo = `
Current Jenkins Instance:
- Version: ${version.version}
- Instance Identity: ${version.instanceIdentity}
- Node Count: ${nodes.length}
- Online Nodes: ${nodes.filter((n) => !n.offline).length}
`;
  } catch (error) {
    systemInfo = `Unable to retrieve system information: ${
      error instanceof Error ? error.message : "Unknown error"
    }`;
  }

  const prompt =
    `You are a Jenkins security expert conducting a security audit. Please provide a comprehensive security assessment and recommendations.

${systemInfo}

Please analyze and provide recommendations for:

1. **Authentication & Authorization**
   - User authentication methods
   - Role-based access control (RBAC)
   - Security realm configuration
   - Matrix-based security

2. **Jenkins Configuration Security**
   - Global security settings
   - CSRF protection
   - Agent-to-master security
   - Script security

3. **Plugin Security**
   - Plugin update status
   - Security-related plugins
   - Plugin permission reviews

4. **Network Security**
   - HTTPS/TLS configuration
   - Reverse proxy setup
   - Port security
   - Firewall recommendations

5. **Credential Management**
   - Credential storage
   - Secret rotation
   - Access logging
   - Least privilege principle

6. **Audit & Monitoring**
   - Security logging
   - User activity monitoring
   - Build artifact security
   - Compliance requirements

7. **System Hardening**
   - OS-level security
   - File system permissions
   - Service configuration
   - Update management

Please provide specific action items with priority levels (High, Medium, Low) and implementation guidance.`;

  return {
    description: "Comprehensive Jenkins security audit and recommendations",
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

async function getPerformanceAnalysisPrompt(
  args: Record<string, unknown> = {},
): Promise<GetPromptResult> {
  const timeRange = args.timeRange as string || "7d";

  let systemMetrics = "";

  try {
    const client = new JenkinsClient();
    await client.initialize();

    const [nodes, queue, jobs] = await Promise.all([
      client.listNodes(),
      client.getQueue(),
      client.listJobs(),
    ]);

    systemMetrics = `
Current System Metrics:
- Total Jobs: ${jobs.length}
- Active Jobs: ${jobs.filter((j) => j.buildable).length}
- Queued Items: ${queue.length}
- Total Nodes: ${nodes.length}
- Available Executors: ${
      nodes.reduce((sum, node) => sum + node.numExecutors, 0)
    }
- Idle Nodes: ${nodes.filter((n) => n.idle).length}
- Offline Nodes: ${nodes.filter((n) => n.offline).length}
`;
  } catch (error) {
    systemMetrics = `Unable to retrieve system metrics: ${
      error instanceof Error ? error.message : "Unknown error"
    }`;
  }

  const prompt =
    `You are a Jenkins performance expert analyzing system performance over the ${timeRange} period. Please provide a comprehensive performance analysis and optimization recommendations.

${systemMetrics}

Please analyze and provide recommendations for:

1. **Build Performance**
   - Build queue analysis
   - Average build times
   - Build success rates
   - Bottleneck identification

2. **Resource Utilization**
   - Executor utilization
   - Node efficiency
   - Memory and CPU usage patterns
   - Storage optimization

3. **Queue Management**
   - Queue length analysis
   - Wait time optimization
   - Priority queue strategies
   - Load balancing

4. **Infrastructure Optimization**
   - Node scaling strategies
   - Cloud agent optimization
   - Network performance
   - Hardware recommendations

5. **Pipeline Optimization**
   - Stage parallelization opportunities
   - Caching strategies
   - Artifact management
   - Test optimization

6. **Monitoring & Alerting**
   - Key performance indicators (KPIs)
   - Monitoring setup
   - Alert thresholds
   - Dashboard recommendations

7. **Capacity Planning**
   - Growth projections
   - Scaling strategies
   - Cost optimization
   - Future requirements

Please provide specific, actionable recommendations with expected performance improvements and implementation priorities.`;

  return {
    description:
      `Jenkins performance analysis and optimization recommendations (${timeRange})`,
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

function getJobMigrationPrompt(
  args: Record<string, unknown> = {},
): GetPromptResult {
  const sourceInstance = args.sourceInstance as string || "source Jenkins";
  const targetInstance = args.targetInstance as string || "target Jenkins";
  const jobPattern = args.jobPattern as string || "all jobs";

  const prompt =
    `You are a Jenkins migration expert helping to migrate jobs between Jenkins instances. Please provide a comprehensive migration plan and guidance.

Migration Context:
- Source Instance: ${sourceInstance}
- Target Instance: ${targetInstance}
- Jobs to Migrate: ${jobPattern}

Please provide a detailed migration plan covering:

1. **Pre-Migration Assessment**
   - Version compatibility check
   - Plugin compatibility analysis
   - Dependency mapping
   - Security configuration review

2. **Migration Strategy**
   - Migration approach (big bang vs. phased)
   - Rollback strategy
   - Testing strategy
   - Timeline recommendations

3. **Job Migration Process**
   - Configuration export/import
   - Build history migration
   - Credential migration
   - Workspace migration

4. **Infrastructure Preparation**
   - Target instance setup
   - Node configuration
   - Network connectivity
   - Storage requirements

5. **Plugin & Configuration Migration**
   - Plugin installation and configuration
   - Global configuration migration
   - Security settings migration
   - System configuration

6. **Testing & Validation**
   - Migration testing checklist
   - Functionality validation
   - Performance testing
   - User acceptance testing

7. **Go-Live & Post-Migration**
   - Cutover procedures
   - User communication
   - Monitoring setup
   - Support procedures

8. **Common Issues & Solutions**
   - Known migration issues
   - Troubleshooting guide
   - Recovery procedures
   - Best practices

Please provide step-by-step instructions, scripts where applicable, and risk mitigation strategies.`;

  return {
    description:
      `Jenkins job migration guide from ${sourceInstance} to ${targetInstance}`,
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

function getPluginRecommendationsPrompt(
  args: Record<string, unknown> = {},
): GetPromptResult {
  const requirements = args.requirements as string;
  const currentPlugins = args.currentPlugins as string || "unknown";

  if (!requirements) {
    throw new Error("requirements argument is required");
  }

  const prompt =
    `You are a Jenkins plugin expert. Please recommend plugins based on the specified requirements and provide implementation guidance.

Requirements: ${requirements}
Current Plugins: ${currentPlugins}

Please provide:

1. **Recommended Plugins**
   - Essential plugins for the requirements
   - Plugin names and versions
   - Brief description of each plugin
   - Dependency information

2. **Plugin Categories**
   - Build tools and frameworks
   - Source code management
   - Deployment and delivery
   - Testing and quality assurance
   - Monitoring and notifications
   - Security and compliance

3. **Implementation Guide**
   - Installation order
   - Configuration steps
   - Best practices for each plugin
   - Integration considerations

4. **Alternative Solutions**
   - Alternative plugin options
   - Pros and cons comparison
   - Community vs. commercial plugins
   - Maintenance considerations

5. **Security Considerations**
   - Plugin security assessment
   - Permission requirements
   - Security best practices
   - Update recommendations

6. **Performance Impact**
   - Resource usage considerations
   - Performance optimization tips
   - Monitoring recommendations
   - Troubleshooting guide

7. **Migration & Updates**
   - Plugin update strategy
   - Backward compatibility
   - Migration procedures
   - Rollback plans

Please prioritize plugins by importance and provide practical implementation examples.`;

  return {
    description: `Jenkins plugin recommendations for: ${requirements}`,
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

function getBackupStrategyPrompt(
  args: Record<string, unknown> = {},
): GetPromptResult {
  const environment = args.environment as string || "production";
  const requirements = args.requirements as string ||
    "standard backup requirements";

  const prompt =
    `You are a Jenkins backup and disaster recovery expert. Please create a comprehensive backup and disaster recovery strategy.

Context:
- Environment: ${environment}
- Requirements: ${requirements}

Please provide a detailed strategy covering:

1. **Backup Strategy Overview**
   - Backup objectives (RPO/RTO)
   - Backup scope and frequency
   - Retention policies
   - Compliance requirements

2. **Data to Backup**
   - Jenkins home directory
   - Job configurations
   - Build history and artifacts
   - Plugin configurations
   - User data and credentials
   - System configurations

3. **Backup Methods**
   - File-based backups
   - Database backups (if applicable)
   - Configuration as code
   - Cloud backup solutions
   - Incremental vs. full backups

4. **Backup Tools & Technologies**
   - Recommended backup tools
   - Jenkins backup plugins
   - Automation scripts
   - Cloud storage options
   - Monitoring solutions

5. **Disaster Recovery Plan**
   - Recovery procedures
   - Priority restoration order
   - Alternative infrastructure
   - Communication plan
   - Testing procedures

6. **Implementation Steps**
   - Setup instructions
   - Automation configuration
   - Monitoring setup
   - Documentation requirements
   - Training needs

7. **Testing & Validation**
   - Backup testing procedures
   - Recovery testing
   - Validation checklists
   - Regular audit schedule
   - Performance testing

8. **Maintenance & Monitoring**
   - Backup monitoring
   - Alert configuration
   - Regular maintenance tasks
   - Update procedures
   - Capacity planning

Please provide specific implementation guidance, scripts, and best practices for the ${environment} environment.`;

  return {
    description:
      `Jenkins backup and disaster recovery strategy for ${environment} environment`,
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

async function getNodeOptimizationPrompt(
  args: Record<string, unknown> = {},
): Promise<GetPromptResult> {
  const nodeType = args.nodeType as string || "mixed";
  const workload = args.workload as string || "general development";

  let nodeInfo = "";

  try {
    const client = new JenkinsClient();
    await client.initialize();

    const nodes = await client.listNodes();

    nodeInfo = `
Current Node Configuration:
- Total Nodes: ${nodes.length}
- Online Nodes: ${nodes.filter((n) => !n.offline).length}
- Offline Nodes: ${nodes.filter((n) => n.offline).length}
- Idle Nodes: ${nodes.filter((n) => n.idle).length}
- Total Executors: ${nodes.reduce((sum, node) => sum + node.numExecutors, 0)}
`;
  } catch (error) {
    nodeInfo = `Unable to retrieve node information: ${
      error instanceof Error ? error.message : "Unknown error"
    }`;
  }

  const prompt =
    `You are a Jenkins infrastructure expert specializing in node optimization. Please provide comprehensive guidance for optimizing Jenkins node configuration and usage.

${nodeInfo}

Context:
- Node Type: ${nodeType}
- Workload: ${workload}

Please provide optimization recommendations for:

1. **Node Configuration**
   - Optimal executor count
   - Node labels and restrictions
   - Resource allocation
   - Environment setup
   - Tool installations

2. **Workload Distribution**
   - Load balancing strategies
   - Job assignment policies
   - Node utilization optimization
   - Queue management
   - Priority handling

3. **Performance Optimization**
   - Hardware recommendations
   - OS-level optimizations
   - JVM tuning
   - Network optimization
   - Storage configuration

4. **Scalability Strategies**
   - Auto-scaling configuration
   - Cloud node integration
   - Dynamic provisioning
   - Cost optimization
   - Capacity planning

5. **Node Types & Strategies**
   - Permanent nodes optimization
   - Cloud agents configuration
   - Docker-based nodes
   - Kubernetes integration
   - Hybrid environments

6. **Monitoring & Maintenance**
   - Node health monitoring
   - Performance metrics
   - Maintenance schedules
   - Update strategies
   - Troubleshooting procedures

7. **Security & Compliance**
   - Node security hardening
   - Access control
   - Compliance requirements
   - Audit procedures
   - Certificate management

8. **Troubleshooting Guide**
   - Common node issues
   - Diagnostic procedures
   - Performance troubleshooting
   - Connectivity issues
   - Recovery procedures

Please provide specific configuration examples, scripts, and implementation guidance for ${nodeType} nodes handling ${workload} workload.`;

  return {
    description:
      `Jenkins node optimization guide for ${nodeType} nodes with ${workload} workload`,
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
