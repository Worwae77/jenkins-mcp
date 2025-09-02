/**
 * Authentication handling for Jenkins API
 */

import { config } from "../utils/config.ts";
import { logger } from "../utils/logger.ts";

export interface AuthConfig {
  username?: string;
  apiToken?: string;
  password?: string;
}

export interface AuthHeaders {
  "Authorization"?: string;
  "Cookie"?: string;
  [key: string]: string | undefined; // Allow index signature for CSRF headers
}

/**
 * Jenkins Authentication Manager
 */
export class JenkinsAuth {
  private username?: string;
  private apiToken?: string;
  private password?: string;
  private crumb?: string;
  private crumbRequestField?: string;
  private cookies: Map<string, string> = new Map(); // Cookie jar for session management
  private sslOptions: {
    caCerts?: string[];
    cert?: string;
    key?: string;
  } | null = null;

  constructor(authConfig?: AuthConfig) {
    // Read environment variables directly if no config provided
    this.username = authConfig?.username ?? 
                   config.jenkinsUsername ?? 
                   Deno.env.get("JENKINS_USERNAME");
    this.apiToken = authConfig?.apiToken ?? 
                   config.jenkinsApiToken ?? 
                   Deno.env.get("JENKINS_API_TOKEN");
    this.password = authConfig?.password ?? 
                   config.jenkinsPassword ?? 
                   Deno.env.get("JENKINS_API_PASSWORD");
  }

  /**
   * Set SSL options for HTTP requests
   */
  setSSLOptions(
    sslOptions: {
      caCerts?: string[];
      cert?: string;
      key?: string;
    } | null,
  ): void {
    this.sslOptions = sslOptions;
  }

  /**
   * Get authentication headers for Jenkins API requests
   */
  getAuthHeaders(): AuthHeaders {
    const headers: AuthHeaders = {};

    // Add authentication header
    if (this.apiToken && this.username) {
      // Use API token authentication (recommended)
      const credentials = btoa(`${this.username}:${this.apiToken}`);
      headers.Authorization = `Basic ${credentials}`;
      logger.debug("Using API token authentication");
    } else if (this.password && this.username) {
      // Use password authentication (less secure)
      const credentials = btoa(`${this.username}:${this.password}`);
      headers.Authorization = `Basic ${credentials}`;
      logger.debug("Using password authentication");
      logger.warn(
        "Consider using API token instead of password for better security",
      );
    } else {
      logger.warn("No authentication credentials provided");
    }

    // Add CSRF protection crumb if available
    if (this.crumb && this.crumbRequestField) {
      headers["Jenkins-Crumb"] = this.crumb;
      headers[this.crumbRequestField] = this.crumb;
    }

    // Add cookies for session management
    if (this.cookies.size > 0) {
      const cookieString = Array.from(this.cookies.entries())
        .map(([name, value]) => `${name}=${value}`)
        .join("; ");
      headers.Cookie = cookieString;
    }

    return headers;
  }

  /**
   * Process response cookies and store them
   */
  private processCookies(response: Response): void {
    const setCookieHeaders = response.headers.get("set-cookie");
    if (setCookieHeaders) {
      // Parse cookies from set-cookie header
      const cookies = setCookieHeaders.split(",").map((cookie) =>
        cookie.trim()
      );

      for (const cookie of cookies) {
        const [nameValue] = cookie.split(";");
        const [name, value] = nameValue.split("=");
        if (name && value) {
          this.cookies.set(name.trim(), value.trim());
          logger.debug(`Stored cookie: ${name.trim()}`);
        }
      }
    }
  }

  /**
   * Fetch CSRF protection crumb from Jenkins
   */
  async fetchCrumb(jenkinsUrl: string): Promise<void> {
    try {
      const crumbUrl = `${jenkinsUrl}/crumbIssuer/api/json`;
      const authHeaders = this.getAuthHeaders();

      const requestOptions: RequestInit = {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
      };

      // Add SSL options if available (Deno-specific)
      // Skip SSL configuration if bypassAllSSL is enabled
      if (
        this.sslOptions &&
        "Deno" in globalThis &&
        config.ssl.verifySSL &&
        !config.ssl.bypassAllSSL
      ) {
        (requestOptions as RequestInit & { client?: unknown }).client =
          this.sslOptions;
      }

      const response = await fetch(crumbUrl, requestOptions);

      // Process cookies from response
      this.processCookies(response);

      if (response.ok) {
        const crumbData = await response.json() as {
          crumb: string;
          crumbRequestField: string;
        };

        this.crumb = crumbData.crumb;
        this.crumbRequestField = crumbData.crumbRequestField;

        logger.debug("CSRF crumb fetched successfully", {
          crumbRequestField: this.crumbRequestField,
          cookieCount: this.cookies.size,
        });
      } else {
        logger.warn(
          `Failed to fetch CSRF crumb: ${response.status} ${response.statusText}`,
        );
      }
    } catch (error) {
      logger.warn("Error fetching CSRF crumb:", error);
    }
  }

  /**
   * Test authentication with Jenkins
   */
  async testAuthentication(jenkinsUrl: string): Promise<boolean> {
    try {
      const whoAmIUrl = `${jenkinsUrl}/whoAmI/api/json`;
      const authHeaders = this.getAuthHeaders();

      const requestOptions: RequestInit = {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
      };

      // Add SSL options if available (Deno-specific)
      // Skip SSL configuration if bypassAllSSL is enabled
      if (
        this.sslOptions &&
        "Deno" in globalThis &&
        config.ssl.verifySSL &&
        !config.ssl.bypassAllSSL
      ) {
        (requestOptions as RequestInit & { client?: unknown }).client =
          this.sslOptions;
      }

      const response = await fetch(whoAmIUrl, requestOptions);

      // Process cookies from response
      this.processCookies(response);

      if (response.ok) {
        const userData = await response.json() as {
          name: string;
          anonymous: boolean;
          authenticated: boolean;
          authorities: string[];
        };

        logger.info(`Authenticated as: ${userData.name}`, {
          anonymous: userData.anonymous,
          authenticated: userData.authenticated,
          authorities: userData.authorities,
        });

        return userData.authenticated;
      } else {
        logger.error(
          `Authentication failed: ${response.status} ${response.statusText}`,
        );
        return false;
      }
    } catch (error) {
      logger.error("Error testing authentication:", error);
      return false;
    }
  }

  /**
   * Check if authentication is configured
   */
  isConfigured(): boolean {
    return Boolean(
      (this.username && this.apiToken) ||
        (this.username && this.password),
    );
  }

  /**
   * Get authentication method being used
   */
  getAuthMethod(): string {
    if (this.username && this.apiToken) {
      return "API Token";
    } else if (this.username && this.password) {
      return "Password";
    } else {
      return "None";
    }
  }

  /**
   * Update authentication credentials
   */
  updateCredentials(authConfig: AuthConfig): void {
    this.username = authConfig.username || this.username;
    this.apiToken = authConfig.apiToken || this.apiToken;
    this.password = authConfig.password || this.password;

    // Clear crumb when credentials change
    this.crumb = undefined;
    this.crumbRequestField = undefined;
  }

  /**
   * Clear stored credentials and tokens
   */
  clearCredentials(): void {
    this.username = undefined;
    this.apiToken = undefined;
    this.password = undefined;
    this.crumb = undefined;
    this.crumbRequestField = undefined;
    this.cookies.clear(); // Clear cookie jar
  }

  /**
   * Get current cookie jar status
   */
  getCookieJarInfo(): { count: number; cookies: string[] } {
    return {
      count: this.cookies.size,
      cookies: Array.from(this.cookies.keys()),
    };
  }

  /**
   * Make authenticated request with cookie and crumb handling
   */
  async makeAuthenticatedRequest(
    url: string,
    options: RequestInit = {},
  ): Promise<Response> {
    const authHeaders = this.getAuthHeaders();

    const requestOptions: RequestInit = {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
        ...options.headers,
      },
    };

    // Add SSL options if available (Deno-specific)
    // For disabled SSL verification, we don't add client options
    if (this.sslOptions && "Deno" in globalThis && config.ssl.verifySSL) {
      (requestOptions as RequestInit & { client?: unknown }).client =
        this.sslOptions;
    }

    const response = await fetch(url, requestOptions);

    // Always process cookies from response to maintain session
    this.processCookies(response);

    return response;
  }
}
