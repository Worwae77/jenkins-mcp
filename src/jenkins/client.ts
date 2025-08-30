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
}
