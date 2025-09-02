/**
 * Jenkins API Client - Core Functionality Only (v1.0)
 * F001-F004: Job Management, Build Operations, Node Management, Queue Management
 * F005 Agent Management moved to experimental for v1.1
 */

import { config } from "../utils/config.ts";
import { logger } from "../utils/logger.ts";
import { createSSLFetchOptions, validateSSLConfig } from "../utils/ssl.ts";
import { JenkinsAuth } from "./auth.ts";
import type {
  BuildLogsRequest,
  BuildLogsResponse,
  JenkinsBuild,
  JenkinsConfig,
  JenkinsJob,
  JenkinsNode,
  JobTriggerRequest,
  JobTriggerResponse,
  QueueItem,
} from "./types.ts";

/**
 * Jenkins API Client for handling core Jenkins operations
 */
export class JenkinsClient {
  private jenkinsUrl: string;
  private auth: JenkinsAuth;
  private timeout: number;
  private retries: number;
  private sslOptions: {
    caCerts?: string[];
    cert?: string;
    key?: string;
  } | null = null;

  constructor(jenkinsConfig?: Partial<JenkinsConfig>) {
    // Read Jenkins URL from environment if not in config
    this.jenkinsUrl = jenkinsConfig?.url ||
      config.jenkinsUrl ||
      Deno.env.get("JENKINS_URL") || "";
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

    // Validate and setup SSL configuration
    try {
      validateSSLConfig(config.ssl);
      this.sslOptions = await createSSLFetchOptions(config.ssl);

      // Pass SSL options to auth module
      this.auth.setSSLOptions(this.sslOptions);

      if (config.ssl.debugSSL) {
        logger.debug("SSL configuration applied:", {
          hasCaCerts: !!this.sslOptions.caCerts?.length,
          hasClientCert: !!this.sslOptions.cert,
          sslVerifyDisabled: !config.ssl.verifySSL,
          jenkinsUrl: this.jenkinsUrl,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : String(error);
      logger.error("SSL configuration failed:", errorMessage);
      throw new Error(`SSL configuration failed: ${errorMessage}`);
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
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.retries; attempt++) {
      try {
        const requestOptions: RequestInit = {
          method: "GET",
          ...options,
          headers: {
            Accept: "application/json",
            ...this.auth.getAuthHeaders(),
            ...options.headers,
          },
          signal: AbortSignal.timeout(this.timeout),
        };

        // Add SSL options if available (Deno-specific)
        // For disabled SSL verification, we don't add client options
        // which allows Deno to use its default (more permissive) behavior
        if (this.sslOptions && "Deno" in globalThis && config.ssl.verifySSL) {
          (requestOptions as RequestInit & { client?: unknown }).client =
            this.sslOptions;
        }

        logger.debug(
          `Making Jenkins API request: ${requestOptions.method} ${url}`,
        );

        const response = await fetch(url, requestOptions);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Jenkins API error: ${response.status} ${response.statusText} - ${errorText}`,
          );
        }

        const contentType = response.headers.get("content-type") || "";

        if (contentType.includes("application/json")) {
          return await response.json();
        } else {
          return await response.text() as T;
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        logger.warn(`Request attempt ${attempt} failed: ${lastError.message}`);

        if (attempt < this.retries) {
          const delay = Math.pow(2, attempt - 1) * 1000; // Exponential backoff
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error("All retry attempts failed");
  }

  // ==========================================
  // F001: JOB MANAGEMENT METHODS
  // ==========================================

  /**
   * List all Jenkins jobs
   */
  async listJobs(): Promise<JenkinsJob[]> {
    logger.info("Fetching Jenkins jobs list");
    const data = await this.makeRequest<{ jobs: JenkinsJob[] }>("/api/json");
    logger.audit("Jobs listed", { count: data.jobs?.length || 0 });
    return data.jobs || [];
  }

  /**
   * Get detailed information about a specific job
   */
  async getJob(jobName: string): Promise<JenkinsJob> {
    logger.info(`Fetching job details: ${jobName}`);

    // Handle folder-based job names by encoding each segment
    const jobPath = jobName.includes("/")
      ? jobName.split("/").map(encodeURIComponent).join("/job/")
      : encodeURIComponent(jobName);

    const job = await this.makeRequest<JenkinsJob>(`/job/${jobPath}/api/json`);
    logger.audit("Job details fetched", { jobName, buildable: job.buildable });
    return job;
  }

  /**
   * Create a new Jenkins job
   */
  async createJob(
    jobName: string,
    config: string,
    options: { folderPath?: string } = {},
  ): Promise<void> {
    logger.info(`Creating job: ${jobName}`);

    const endpoint = options.folderPath
      ? `/job/${encodeURIComponent(options.folderPath)}/createItem`
      : "/createItem";

    await this.makeRequest(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "text/xml",
      },
      body: `name=${encodeURIComponent(jobName)}&${config}`,
    });

    logger.audit("Job created", { jobName, folderPath: options.folderPath });
  }

  /**
   * Delete a Jenkins job
   */
  async deleteJob(jobName: string): Promise<void> {
    logger.info(`Deleting job: ${jobName}`);

    // Handle folder-based job names
    const jobPath = jobName.includes("/")
      ? jobName.split("/").map(encodeURIComponent).join("/job/")
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
    const jobPath = jobName.includes("/")
      ? jobName.split("/").map(encodeURIComponent).join("/job/")
      : encodeURIComponent(jobName);

    return await this.makeRequest<string>(`/job/${jobPath}/config.xml`);
  }

  // ==========================================
  // F002: BUILD OPERATIONS METHODS
  // ==========================================

  /**
   * Trigger a build for a job
   */
  async triggerBuild(request: JobTriggerRequest): Promise<JobTriggerResponse> {
    logger.info(`Triggering build for job: ${request.jobName}`);

    const jobPath = request.jobName.includes("/")
      ? request.jobName.split("/").map(encodeURIComponent).join("/job/")
      : encodeURIComponent(request.jobName);

    const endpoint =
      request.parameters && Object.keys(request.parameters).length > 0
        ? `/job/${jobPath}/buildWithParameters`
        : `/job/${jobPath}/build`;

    const body =
      request.parameters && Object.keys(request.parameters).length > 0
        ? new URLSearchParams(
          Object.entries(request.parameters).map(([k, v]) => [k, String(v)]),
        ).toString()
        : "";

    await this.makeRequest(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    const queueItem = await this.getQueuedBuild(request.jobName);

    logger.audit("Build triggered", {
      jobName: request.jobName,
      queueId: queueItem?.id,
      parameters: request.parameters,
    });

    return {
      success: true,
      jobName: request.jobName,
      queueItem: queueItem || undefined,
      message: "Build queued successfully",
    };
  }

  /**
   * Get build status and details
   */
  async getBuild(
    jobName: string,
    buildNumber: number | string,
  ): Promise<JenkinsBuild> {
    logger.info(`Fetching build: ${jobName}#${buildNumber}`);

    const jobPath = jobName.includes("/")
      ? jobName.split("/").map(encodeURIComponent).join("/job/")
      : encodeURIComponent(jobName);

    const build = await this.makeRequest<JenkinsBuild>(
      `/job/${jobPath}/${buildNumber}/api/json`,
    );

    logger.audit("Build details fetched", {
      jobName,
      buildNumber,
      result: build.result,
      duration: build.duration,
    });

    return build;
  }

  /**
   * Stop a running build
   */
  async stopBuild(jobName: string, buildNumber: number): Promise<void> {
    logger.info(`Stopping build: ${jobName}#${buildNumber}`);

    const jobPath = jobName.includes("/")
      ? jobName.split("/").map(encodeURIComponent).join("/job/")
      : encodeURIComponent(jobName);

    await this.makeRequest(`/job/${jobPath}/${buildNumber}/stop`, {
      method: "POST",
    });

    logger.audit("Build stopped", { jobName, buildNumber });
  }

  /**
   * Get build console logs
   */
  async getBuildLogs(request: BuildLogsRequest): Promise<BuildLogsResponse> {
    logger.info(
      `Fetching build logs: ${request.jobName}#${request.buildNumber}`,
    );

    const jobPath = request.jobName.includes("/")
      ? request.jobName.split("/").map(encodeURIComponent).join("/job/")
      : encodeURIComponent(request.jobName);

    let endpoint = `/job/${jobPath}/${request.buildNumber}/consoleText`;

    if (request.start !== undefined) {
      endpoint += `?start=${request.start}`;
    }

    const logs = await this.makeRequest<string>(endpoint);

    logger.audit("Build logs fetched", {
      jobName: request.jobName,
      buildNumber: request.buildNumber,
      logSize: logs.length,
    });

    return {
      text: logs,
      hasMore: false, // For simplicity, assume no pagination
      size: logs.length,
    };
  }

  /**
   * Get queued build for a job (helper method)
   */
  private async getQueuedBuild(jobName: string): Promise<QueueItem | null> {
    try {
      const queue = await this.getBuildQueue();
      return queue.find((item) =>
        item.task?.name === jobName ||
        item.task?.url?.includes(`/job/${encodeURIComponent(jobName)}/`)
      ) || null;
    } catch (error) {
      logger.warn(`Could not fetch queued build for ${jobName}: ${error}`);
      return null;
    }
  }

  // ==========================================
  // F003: NODE MANAGEMENT METHODS
  // ==========================================

  /**
   * List all Jenkins nodes
   */
  async listNodes(): Promise<JenkinsNode[]> {
    logger.info("Fetching Jenkins nodes list");
    const data = await this.makeRequest<{ computer: JenkinsNode[] }>(
      "/computer/api/json",
    );
    logger.audit("Nodes listed", { count: data.computer?.length || 0 });
    return data.computer || [];
  }

  /**
   * Get detailed status of a specific node
   */
  async getNodeStatus(nodeName?: string): Promise<JenkinsNode> {
    const endpoint = nodeName
      ? `/computer/${encodeURIComponent(nodeName)}/api/json`
      : "/computer/(master)/api/json";

    logger.info(`Fetching node status: ${nodeName || "master"}`);

    const node = await this.makeRequest<JenkinsNode>(endpoint);
    logger.audit("Node status fetched", {
      nodeName: nodeName || "master",
      online: node.offline === false,
      idle: node.idle,
    });

    return node;
  }

  // ==========================================
  // F004: QUEUE MANAGEMENT METHODS
  // ==========================================

  /**
   * Get current build queue
   */
  async getBuildQueue(): Promise<QueueItem[]> {
    logger.info("Fetching build queue");
    const data = await this.makeRequest<{ items: QueueItem[] }>(
      "/queue/api/json",
    );
    logger.audit("Queue fetched", { queueLength: data.items?.length || 0 });
    return data.items || [];
  }

  /**
   * Cancel a queued build item
   */
  async cancelQueueItem(queueId: number): Promise<void> {
    logger.info(`Cancelling queue item: ${queueId}`);

    await this.makeRequest(`/queue/cancelItem?id=${queueId}`, {
      method: "POST",
    });

    logger.audit("Queue item cancelled", { queueId });
  }

  // ==========================================
  // SYSTEM INFORMATION METHODS
  // ==========================================

  /**
   * Get Jenkins version and system information
   */
  async getVersion(): Promise<
    { version: string; [key: string]: string | number | boolean }
  > {
    logger.info("Fetching Jenkins version");

    try {
      const response = await fetch(`${this.jenkinsUrl}/api/json`, {
        method: "HEAD",
        headers: this.auth.getAuthHeaders() as HeadersInit,
      });

      const version = response.headers.get("X-Jenkins") || "unknown";

      logger.audit("Version fetched", { version });

      return {
        version,
        url: this.jenkinsUrl,
        authMethod: this.auth.getAuthMethod(),
      };
    } catch (error) {
      logger.error(`Failed to fetch Jenkins version: ${error}`);
      throw error;
    }
  }
}
