/**
 * Jenkins API Client
 */

import { config } from "../utils/config.ts";
import { logger } from "../utils/logger.ts";
import { JenkinsAuth } from "./auth.ts";
import type {
  BuildLogsRequest,
  BuildLogsResponse,
  JenkinsBuild,
  JenkinsConfig,
  JenkinsJob,
  JenkinsNode,
  JobStatusRequest,
  JobStatusResponse,
  JobTriggerRequest,
  JobTriggerResponse,
  NodeStatusRequest,
  NodeStatusResponse,
  QueueItem,
  AgentRestartRequest,
  AgentRestartResponse,
  AgentDiagnosticsRequest,
  AgentDiagnosticsResponse,
  AgentRecoveryRequest,
  AgentRecoveryResponse,
  AgentIssueDetection,
  AuditLogEntry,
} from "./types.ts";

/**
 * Jenkins API Client for handling all Jenkins operations
 */
export class JenkinsClient {
  private jenkinsUrl: string;
  private auth: JenkinsAuth;
  private timeout: number;
  private retries: number;

  constructor(jenkinsConfig?: Partial<JenkinsConfig>) {
    this.jenkinsUrl = jenkinsConfig?.url || config.jenkinsUrl;
    this.timeout = jenkinsConfig?.timeout || 30000; // 30 seconds default
    this.retries = jenkinsConfig?.retries || 3;

    this.auth = new JenkinsAuth({
      username: jenkinsConfig?.username,
      apiToken: jenkinsConfig?.apiToken,
      password: jenkinsConfig?.password,
    });
  }

  /**
   * Initialize the client - test connection and fetch CSRF crumb
   */
  async initialize(): Promise<void> {
    logger.info("Initializing Jenkins client...");

    if (!this.auth.isConfigured()) {
      throw new Error("Jenkins authentication not configured");
    }

    // Fetch CSRF crumb for security
    await this.auth.fetchCrumb(this.jenkinsUrl);

    // Test authentication
    const isAuthenticated = await this.auth.testAuthentication(this.jenkinsUrl);
    if (!isAuthenticated) {
      throw new Error("Jenkins authentication failed");
    }

    logger.info(
      `Jenkins client initialized successfully - Auth method: ${this.auth.getAuthMethod()}`,
    );
  }

  /**
   * Get authentication status and debug information
   */
  getAuthStatus(): {
    method: string;
    cookieJar: { count: number; cookies: string[] };
    hasCredentials: boolean;
  } {
    return {
      method: this.auth.getAuthMethod(),
      cookieJar: this.auth.getCookieJarInfo(),
      hasCredentials: this.auth.isConfigured(),
    };
  }

  /**
   * Make HTTP request to Jenkins API with retry logic
   */
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.jenkinsUrl}${endpoint}`;

    const requestOptions: RequestInit = {
      ...options,
      signal: AbortSignal.timeout(this.timeout),
    };

    let lastError: Error;

    for (let attempt = 1; attempt <= this.retries; attempt++) {
      try {
        logger.debug(
          `Making request to Jenkins: ${
            options.method || "GET"
          } ${url} (attempt ${attempt})`,
        );

        // Use the auth class's authenticated request method
        const response = await this.auth.makeAuthenticatedRequest(url, requestOptions);

        if (!response.ok) {
          // If we get 403 and don't have a fresh crumb, try to refresh it
          if (response.status === 403 && attempt === 1) {
            logger.info("Got 403, refreshing CSRF crumb...");
            await this.auth.fetchCrumb(this.jenkinsUrl);
            continue; // Retry with fresh crumb
          }
          
          throw new Error(
            `Jenkins API error: ${response.status} ${response.statusText}`,
          );
        }

        const contentType = response.headers.get("content-type");
        if (contentType?.includes("application/json")) {
          return await response.json() as T;
        } else {
          return await response.text() as T;
        }
      } catch (error) {
        lastError = error as Error;
        logger.warn(`Request attempt ${attempt} failed:`, error);

        if (attempt < this.retries) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          logger.debug(`Retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    logger.error(`All ${this.retries} request attempts failed`);
    throw lastError!;
  }

  /**
   * Get Jenkins version and instance information
   */
  async getVersion(): Promise<{ version: string; instanceIdentity: string }> {
    const response = await this.makeRequest<
      { version: string; instanceIdentity: string }
    >("/api/json");
    return response;
  }

  /**
   * List all jobs
   */
  async listJobs(): Promise<JenkinsJob[]> {
    const response = await this.makeRequest<{ jobs: JenkinsJob[] }>(
      "/api/json?tree=jobs[name,url,color,buildable,displayName,description,inQueue,nextBuildNumber]",
    );
    return response.jobs;
  }

  /**
   * Get specific job details
   */
  async getJob(jobName: string): Promise<JenkinsJob> {
    // Handle folder-based job names
    const jobPath = jobName.includes('/') 
      ? jobName.split('/').map(encodeURIComponent).join('/job/')
      : encodeURIComponent(jobName);
    
    return await this.makeRequest<JenkinsJob>(
      `/job/${jobPath}/api/json`,
    );
  }

  /**
   * Trigger a job build
   */
  async triggerJob(request: JobTriggerRequest): Promise<JobTriggerResponse> {
    // Handle folder-based job names
    const jobPath = request.jobName.includes('/') 
      ? request.jobName.split('/').map(encodeURIComponent).join('/job/')
      : encodeURIComponent(request.jobName);
    
    let endpoint = `/job/${jobPath}/build`;

    const params = new URLSearchParams();

    if (request.parameters && Object.keys(request.parameters).length > 0) {
      endpoint = `/job/${jobPath}/buildWithParameters`;
      Object.entries(request.parameters).forEach(([key, value]) => {
        params.append(key, String(value));
      });
    }

    if (request.delay) {
      params.append("delay", String(request.delay));
    }

    const queryString = params.toString();
    const fullEndpoint = queryString ? `${endpoint}?${queryString}` : endpoint;

    logger.audit("Job triggered", {
      jobName: request.jobName,
      parameters: request.parameters,
      endpoint: fullEndpoint,
    });

    await this.makeRequest(fullEndpoint, { method: "POST" });

    // Jenkins returns 201 with Location header pointing to queue item
    // For now, return a success message
    return {
      queueItem: {} as QueueItem, // Would need to parse Location header
      message: `Job ${request.jobName} triggered successfully`,
    };
  }

  /**
   * Get job status
   */
  async getJobStatus(request: JobStatusRequest): Promise<JobStatusResponse> {
    const job = await this.getJob(request.jobName);

    let lastBuild: JenkinsBuild | undefined;
    if (request.buildNumber) {
      lastBuild = await this.getBuild(request.jobName, request.buildNumber);
    } else if (job.nextBuildNumber > 1) {
      // Get the last build
      lastBuild = await this.getBuild(request.jobName, job.nextBuildNumber - 1);
    }

    return {
      job,
      lastBuild,
      isBuilding: Boolean(lastBuild?.building),
      queueItem: job.queueItem,
    };
  }

  /**
   * Get build details
   */
  async getBuild(
    jobName: string,
    buildNumber: number | string,
  ): Promise<JenkinsBuild> {
    // Handle folder-based job names
    const jobPath = jobName.includes('/') 
      ? jobName.split('/').map(encodeURIComponent).join('/job/')
      : encodeURIComponent(jobName);
    
    const endpoint = `/job/${jobPath}/${buildNumber}/api/json`;
    return await this.makeRequest<JenkinsBuild>(endpoint);
  }

  /**
   * Get build logs
   */
  async getBuildLogs(request: BuildLogsRequest): Promise<BuildLogsResponse> {
    // Handle folder-based job names
    const jobPath = request.jobName.includes('/') 
      ? request.jobName.split('/').map(encodeURIComponent).join('/job/')
      : encodeURIComponent(request.jobName);
    
    const { buildNumber, start = 0, progressiveLog = false } = request;

    let endpoint = `/job/${jobPath}/${buildNumber}/consoleText`;

    if (progressiveLog) {
      endpoint =
        `/job/${jobPath}/${buildNumber}/logText/progressiveText`;
      if (start > 0) {
        endpoint += `?start=${start}`;
      }
    }

    const text = await this.makeRequest<string>(endpoint);

    return {
      text,
      hasMore: false, // Would need to check response headers for progressive logs
      size: text.length,
    };
  }

  /**
   * Get build artifacts
   */
  async getBuildArtifacts(jobName: string, buildNumber: number | string) {
    const build = await this.getBuild(jobName, buildNumber);
    return build.artifacts;
  }

  /**
   * List all nodes
   */
  async listNodes(): Promise<JenkinsNode[]> {
    const response = await this.makeRequest<{ computer: JenkinsNode[] }>(
      "/computer/api/json?depth=1",
    );
    return response.computer;
  }

  /**
   * Get node status
   */
  async getNodeStatus(request: NodeStatusRequest): Promise<NodeStatusResponse> {
    if (request.nodeName) {
      const encodedNodeName = encodeURIComponent(request.nodeName);
      const node = await this.makeRequest<JenkinsNode>(
        `/computer/${encodedNodeName}/api/json`,
      );
      return { nodes: [node] };
    } else {
      const nodes = await this.listNodes();
      return { nodes };
    }
  }

  /**
   * Get queue information
   */
  async getQueue(): Promise<QueueItem[]> {
    const response = await this.makeRequest<{ items: QueueItem[] }>(
      "/queue/api/json",
    );
    return response.items;
  }

  /**
   * Cancel queue item
   */
  async cancelQueueItem(queueId: number): Promise<void> {
    await this.makeRequest(`/queue/cancelItem?id=${queueId}`, {
      method: "POST",
    });
    logger.audit("Queue item cancelled", { queueId });
  }

  /**
   * Stop a running build
   */
  async stopBuild(jobName: string, buildNumber: number): Promise<void> {
    const encodedJobName = encodeURIComponent(jobName);
    await this.makeRequest(`/job/${encodedJobName}/${buildNumber}/stop`, {
      method: "POST",
    });
    logger.audit("Build stopped", { jobName, buildNumber });
  }

  /**
   * Create a new job
   */
  async createJob(jobName: string, configXml: string): Promise<void> {
    let endpoint: string;
    let actualJobName: string;

    // Check if job name contains folder path
    if (jobName.includes('/')) {
      const parts = jobName.split('/');
      actualJobName = parts.pop()!; // Last part is the job name
      
      // Build correct folder path for Jenkins API
      // For nested folders: /job/folder1/job/subfolder/createItem?name=jobName
      const folderParts = parts.map(part => `job/${encodeURIComponent(part)}`).join('/');
      endpoint = `/${folderParts}/createItem?name=${encodeURIComponent(actualJobName)}`;
      
      logger.debug(`Creating job in folder path: ${parts.join('/')}, job name: ${actualJobName}`);
      logger.debug(`Using endpoint: ${endpoint}`);
    } else {
      // Root level job creation
      endpoint = `/createItem?name=${encodeURIComponent(jobName)}`;
      actualJobName = jobName;
      logger.debug(`Creating root level job: ${jobName}`);
    }

    // Try simple auth without CSRF first
    const url = `${this.jenkinsUrl}${endpoint}`;
    
    // Get basic auth headers without CSRF
    const basicAuthHeaders: Record<string, string> = {
      "Content-Type": "application/xml"
    };
    
    // Add authentication header only
    if (this.auth.getAuthMethod() !== "None") {
      const authData = this.auth.getAuthHeaders();
      if (authData.Authorization) {
        basicAuthHeaders.Authorization = authData.Authorization;
      }
    }

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: basicAuthHeaders,
        body: configXml,
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!response.ok) {
        throw new Error(`Jenkins API error: ${response.status} ${response.statusText}`);
      }

      logger.audit("Job created successfully", { jobName, actualJobName, endpoint });
    } catch (error) {
      logger.error("Job creation failed:", error);
      throw error;
    }
  }

  /**
   * Update job configuration
   */
  async updateJob(jobName: string, configXml: string): Promise<void> {
    // Handle folder-based job names
    const jobPath = jobName.includes('/') 
      ? jobName.split('/').map(encodeURIComponent).join('/job/')
      : encodeURIComponent(jobName);
    
    await this.makeRequest(`/job/${jobPath}/config.xml`, {
      method: "POST",
      headers: {
        "Content-Type": "application/xml",
      },
      body: configXml,
    });
    logger.audit("Job updated", { jobName });
  }

  /**
   * Delete a job
   */
  async deleteJob(jobName: string): Promise<void> {
    // Handle folder-based job names
    const jobPath = jobName.includes('/') 
      ? jobName.split('/').map(encodeURIComponent).join('/job/')
      : encodeURIComponent(jobName);
    
    await this.makeRequest(`/job/${jobPath}/doDelete`, {
      method: "POST",
    });
    logger.audit("Job deleted", { jobName });
  }

  /**
   * Get job configuration XML
   */
  async getJobConfig(jobName: string): Promise<string> {
    // Handle folder-based job names
    const jobPath = jobName.includes('/') 
      ? jobName.split('/').map(encodeURIComponent).join('/job/')
      : encodeURIComponent(jobName);
    
    return await this.makeRequest<string>(`/job/${jobPath}/config.xml`);
  }

  // ==========================================
  // AGENT MANAGEMENT METHODS (Admin Required)
  // ==========================================

  /**
   * Restart Jenkins agent service (requires admin privileges)
   */
  async restartAgent(request: AgentRestartRequest): Promise<AgentRestartResponse> {
    logger.info(`Attempting to restart agent: ${request.nodeName}`);
    
    // First, verify we have admin privileges
    await this.verifyAdminAccess("restart_agent", request.nodeName);
    
    // Get node information to determine platform if auto-detect
    const nodeInfo = await this.getNodeStatus({ nodeName: request.nodeName });
    const node = nodeInfo.nodes.find(n => n.displayName === request.nodeName);
    
    if (!node) {
      throw new Error(`Node ${request.nodeName} not found`);
    }

    let platform = request.platform;
    if (platform === "auto") {
      // Auto-detect platform based on node labels or OS info
      platform = this.detectNodePlatform(node);
    }

    // Prepare restart command based on platform
    let command: string;
    if (request.serviceCommand) {
      command = request.serviceCommand;
    } else {
      command = this.getDefaultRestartCommand(platform);
    }

    try {
      // Execute restart command via Jenkins Script Console
      const scriptResult = await this.executeNodeScript(request.nodeName, command, platform);
      
      // Log the admin action
      await this.auditLog({
        action: "restart_agent",
        target: request.nodeName,
        result: "success",
        details: { platform, command, force: request.force }
      });

      return {
        success: true,
        message: `Agent ${request.nodeName} restart initiated successfully`,
        nodeName: request.nodeName,
        platform,
        commandExecuted: command,
        output: scriptResult.output
      };

    } catch (error) {
      // Log the failed action
      await this.auditLog({
        action: "restart_agent",
        target: request.nodeName,
        result: "failed",
        details: { platform, command, error: error instanceof Error ? error.message : String(error) }
      });

      return {
        success: false,
        message: `Failed to restart agent ${request.nodeName}: ${error instanceof Error ? error.message : String(error)}`,
        nodeName: request.nodeName,
        platform,
        commandExecuted: command,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Get comprehensive agent diagnostics
   */
  async getAgentDiagnostics(request: AgentDiagnosticsRequest): Promise<AgentDiagnosticsResponse> {
    logger.info(`Getting diagnostics for agent: ${request.nodeName}`);

    // Get basic node status
    const nodeStatus = await this.getNodeStatus({ nodeName: request.nodeName });
    const node = nodeStatus.nodes.find(n => n.displayName === request.nodeName);

    if (!node) {
      throw new Error(`Node ${request.nodeName} not found`);
    }

    const response: AgentDiagnosticsResponse = {
      nodeName: request.nodeName,
      status: node.offline ? "offline" : "online",
      platform: this.detectNodePlatform(node)
    };

    if (request.includeSystemInfo) {
      try {
        response.systemInfo = await this.getNodeSystemInfo(request.nodeName);
      } catch (error) {
        logger.warn(`Failed to get system info for ${request.nodeName}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    if (request.includeLogs) {
      try {
        response.recentErrors = await this.getNodeRecentErrors(request.nodeName);
      } catch (error) {
        logger.warn(`Failed to get logs for ${request.nodeName}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // Get build history for the node
    try {
      response.buildHistory = await this.getNodeBuildHistory(request.nodeName);
    } catch (error) {
      logger.warn(`Failed to get build history for ${request.nodeName}: ${error instanceof Error ? error.message : String(error)}`);
    }

    return response;
  }

  /**
   * Automated agent recovery workflow
   */
  async recoverAgent(request: AgentRecoveryRequest): Promise<AgentRecoveryResponse> {
    logger.info(`Starting recovery for agent: ${request.nodeName} with strategy: ${request.strategy}`);
    
    const response: AgentRecoveryResponse = {
      success: false,
      nodeName: request.nodeName,
      strategy: request.strategy,
      steps: [],
      finalStatus: "failed"
    };

    const maxRetries = request.maxRetries || 3;
    let retryCount = 0;

    // Step 1: Check current status
    response.steps.push({
      step: "status_check",
      status: "success",
      message: "Checking agent status",
      timestamp: new Date().toISOString()
    });

    try {
      // Get current diagnostics
      const diagnostics = await this.getAgentDiagnostics({ nodeName: request.nodeName });
      
      if (diagnostics.status === "online") {
        response.steps.push({
          step: "already_online",
          status: "success", 
          message: "Agent is already online",
          timestamp: new Date().toISOString()
        });
        response.success = true;
        response.finalStatus = "recovered";
        return response;
      }

      // Step 2: Soft recovery (disconnect/reconnect)
      if (request.strategy === "soft" || request.strategy === "auto") {
        while (retryCount < maxRetries) {
          try {
            await this.disconnectNode(request.nodeName);
            await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
            await this.connectNode(request.nodeName);
            
            response.steps.push({
              step: "soft_restart",
              status: "success",
              message: `Soft restart attempt ${retryCount + 1} completed`,
              timestamp: new Date().toISOString()
            });

            // Check if recovery worked
            const postCheck = await this.getAgentDiagnostics({ nodeName: request.nodeName });
            if (postCheck.status === "online") {
              response.success = true;
              response.finalStatus = "recovered";
              return response;
            }
            
          } catch (error) {
            response.steps.push({
              step: "soft_restart",
              status: "failed",
              message: `Soft restart attempt ${retryCount + 1} failed: ${error instanceof Error ? error.message : String(error)}`,
              timestamp: new Date().toISOString()
            });
          }
          retryCount++;
        }
      }

      // Step 3: Hard recovery (service restart)
      if (request.strategy === "hard" || request.strategy === "auto") {
        try {
          const restartResult = await this.restartAgent({
            nodeName: request.nodeName,
            platform: "auto"
          });

          response.steps.push({
            step: "service_restart",
            status: restartResult.success ? "success" : "failed",
            message: restartResult.message,
            timestamp: new Date().toISOString()
          });

          if (restartResult.success) {
            // Wait for service to start and check status
            await new Promise(resolve => setTimeout(resolve, 15000)); // Wait 15 seconds
            
            const finalCheck = await this.getAgentDiagnostics({ nodeName: request.nodeName });
            if (finalCheck.status === "online") {
              response.success = true;
              response.finalStatus = "recovered";
            } else {
              response.finalStatus = "partial";
            }
          }

        } catch (error) {
          response.steps.push({
            step: "service_restart",
            status: "failed",
            message: `Service restart failed: ${error instanceof Error ? error.message : String(error)}`,
            timestamp: new Date().toISOString()
          });
        }
      }

    } catch (error) {
      response.steps.push({
        step: "recovery_error",
        status: "failed",
        message: `Recovery process failed: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date().toISOString()
      });
    }

    // Log the recovery attempt
    await this.auditLog({
      action: "agent_recovery",
      target: request.nodeName,
      result: response.success ? "success" : "failed",
      details: { strategy: request.strategy, steps: response.steps.length, finalStatus: response.finalStatus }
    });

    return response;
  }

  /**
   * Detect agent issues automatically
   */
  async detectAgentIssues(nodeName: string): Promise<AgentIssueDetection> {
    const diagnostics = await this.getAgentDiagnostics({ 
      nodeName, 
      includeSystemInfo: true, 
      includeLogs: true 
    });

    const issues: AgentIssueDetection["issues"] = [];

    // Check connection status
    if (diagnostics.status === "offline" || diagnostics.status === "disconnected") {
      issues.push({
        type: "connection",
        severity: "high",
        description: `Agent is ${diagnostics.status}`,
        detected: new Date().toISOString(),
        suggestion: "Try soft restart (disconnect/reconnect) first, then service restart if needed"
      });
    }

    // Check system resources
    if (diagnostics.systemInfo) {
      if (diagnostics.systemInfo.cpu > 90) {
        issues.push({
          type: "performance",
          severity: "high",
          description: `High CPU usage: ${diagnostics.systemInfo.cpu}%`,
          detected: new Date().toISOString(),
          suggestion: "Check for hung processes or resource-intensive builds"
        });
      }

      if (diagnostics.systemInfo.memory.used / diagnostics.systemInfo.memory.total > 0.9) {
        issues.push({
          type: "resource",
          severity: "medium",
          description: "High memory usage (>90%)",
          detected: new Date().toISOString(),
          suggestion: "Consider restarting agent or increasing memory allocation"
        });
      }

      if (diagnostics.systemInfo.disk.used / diagnostics.systemInfo.disk.total > 0.9) {
        issues.push({
          type: "resource",
          severity: "high",
          description: "Low disk space (<10% available)",
          detected: new Date().toISOString(),
          suggestion: "Clean up workspace or increase disk space"
        });
      }
    }

    // Check build failures
    if (diagnostics.buildHistory && diagnostics.buildHistory.recentFailures > 3) {
      issues.push({
        type: "build_failure",
        severity: "medium",
        description: `High number of recent build failures: ${diagnostics.buildHistory.recentFailures}`,
        detected: new Date().toISOString(),
        suggestion: "Investigate build failures and consider agent restart"
      });
    }

    // Determine recommended action
    let recommendedAction: AgentIssueDetection["recommendedAction"] = "monitor";
    let confidence = 0.5;

    if (issues.some(i => i.severity === "critical")) {
      recommendedAction = "reboot";
      confidence = 0.9;
    } else if (issues.some(i => i.severity === "high")) {
      recommendedAction = "restart_service";
      confidence = 0.8;
    } else if (issues.some(i => i.type === "connection")) {
      recommendedAction = "restart_service";
      confidence = 0.7;
    } else if (issues.length > 0) {
      recommendedAction = "investigate";
      confidence = 0.6;
    }

    return {
      nodeName,
      issues,
      recommendedAction,
      confidence
    };
  }

  // ==========================================
  // PRIVATE HELPER METHODS
  // ==========================================

  private async verifyAdminAccess(action: string, target?: string): Promise<void> {
    // Check if current user has admin privileges
    const userInfo = await this.makeRequest<any>("/me/api/json");
    
    if (!userInfo.authorities?.includes("authenticated") || 
        !userInfo.authorities?.includes("jenkins.model.Jenkins.Administer")) {
      throw new Error("Administrative privileges required for this operation");
    }
  }

  private detectNodePlatform(node: JenkinsNode): "linux" | "windows" {
    // Try to detect platform from node properties or description
    const nodeInfo = node.description?.toLowerCase() || "";
    const nodeName = node.displayName?.toLowerCase() || "";
    
    if (nodeInfo.includes("windows") || nodeName.includes("windows") || nodeName.includes("win")) {
      return "windows";
    }
    
    return "linux"; // Default to Linux
  }

  private getDefaultRestartCommand(platform: "linux" | "windows"): string {
    if (platform === "windows") {
      return 'powershell -Command "Restart-Service \\"Jenkins Agent\\" -Force"';
    } else {
      return "sudo systemctl restart jenkins-agent || sudo service jenkins-agent restart";
    }
  }

  private async executeNodeScript(nodeName: string, command: string, platform: string): Promise<{ output: string }> {
    // Use Jenkins Script Console to execute command on specific node
    const script = platform === "windows" 
      ? `
        def node = Jenkins.instance.getNode('${nodeName}')
        def channel = node.getChannel()
        def proc = channel.call(new hudson.util.RemotingDiagnostics.VM())
        def result = channel.call(new hudson.Proc.RemoteProc(['cmd', '/c', '${command}'] as String[], [:] as String[], System.in, System.out, System.err))
        return result
      `
      : `
        def node = Jenkins.instance.getNode('${nodeName}')
        def channel = node.getChannel()
        def result = channel.call(new hudson.Proc.RemoteProc(['bash', '-c', '${command}'] as String[], [:] as String[], System.in, System.out, System.err))
        return result
      `;

    const response = await this.makeRequest<string>("/scriptText", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `script=${encodeURIComponent(script)}`,
    });

    return { output: response };
  }

  private async getNodeSystemInfo(nodeName: string): Promise<AgentDiagnosticsResponse["systemInfo"]> {
    // This would require script console access to get system information
    // For now, return mock data - in real implementation, execute system commands
    return {
      cpu: Math.random() * 100,
      memory: {
        total: 8 * 1024 * 1024 * 1024, // 8GB
        used: Math.random() * 6 * 1024 * 1024 * 1024,
        available: 2 * 1024 * 1024 * 1024
      },
      disk: {
        total: 100 * 1024 * 1024 * 1024, // 100GB
        used: Math.random() * 80 * 1024 * 1024 * 1024,
        available: 20 * 1024 * 1024 * 1024
      }
    };
  }

  private async getNodeRecentErrors(nodeName: string): Promise<string[]> {
    // In real implementation, this would fetch recent error logs
    return [
      "Connection timeout after 30 seconds",
      "Build workspace cleanup failed",
      "Agent disconnected unexpectedly"
    ];
  }

  private async getNodeBuildHistory(nodeName: string): Promise<AgentDiagnosticsResponse["buildHistory"]> {
    // In real implementation, query builds executed on this node
    return {
      totalBuilds: 150,
      failedBuilds: 12,
      recentFailures: 3
    };
  }

  private async disconnectNode(nodeName: string): Promise<void> {
    await this.makeRequest(`/computer/${encodeURIComponent(nodeName)}/doDisconnect`, {
      method: "POST"
    });
  }

  private async connectNode(nodeName: string): Promise<void> {
    await this.makeRequest(`/computer/${encodeURIComponent(nodeName)}/launchSlaveAgent`, {
      method: "POST"
    });
  }

  private async auditLog(entry: Partial<AuditLogEntry>): Promise<void> {
    const auditEntry: AuditLogEntry = {
      timestamp: new Date().toISOString(),
      userId: "current_user", // In real implementation, get from auth context
      action: entry.action || "unknown",
      target: entry.target || "unknown",
      result: entry.result || "failed",
      details: entry.details || {}
    };

    logger.audit("Admin action performed", { 
      timestamp: auditEntry.timestamp,
      userId: auditEntry.userId,
      action: auditEntry.action,
      target: auditEntry.target,
      result: auditEntry.result,
      details: auditEntry.details
    });
  }
}
