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

  constructor(authConfig?: AuthConfig) {
    this.username = authConfig?.username || config.jenkinsUsername;
    this.apiToken = authConfig?.apiToken || config.jenkinsApiToken;
    this.password = authConfig?.password || config.jenkinsPassword;
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

    return headers;
  }

  /**
   * Fetch CSRF protection crumb from Jenkins
   */
  async fetchCrumb(jenkinsUrl: string): Promise<void> {
    try {
      const crumbUrl = `${jenkinsUrl}/crumbIssuer/api/json`;
      const authHeaders = this.getAuthHeaders();

      const response = await fetch(crumbUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
      });

      if (response.ok) {
        const crumbData = await response.json() as {
          crumb: string;
          crumbRequestField: string;
        };

        this.crumb = crumbData.crumb;
        this.crumbRequestField = crumbData.crumbRequestField;

        logger.debug("CSRF crumb fetched successfully");
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

      const response = await fetch(whoAmIUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
      });

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
  }
}
