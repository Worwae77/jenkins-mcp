/**
 * SSL/TLS Configuration for Jenkins MCP Server
 * Handles SSL certificate validation for internal networks and organizational CA certificates
 */

/**
 * Simple logging function to avoid circular dependency with config
 */
function logDebug(message: string, data?: unknown): void {
  if (Deno.env.get("JENKINS_SSL_DEBUG") === "true") {
    console.log(
      `[SSL DEBUG] ${message}`,
      data ? JSON.stringify(data, null, 2) : "",
    );
  }
}

function logWarn(message: string): void {
  console.warn(`[SSL WARN] ${message}`);
}

function logError(message: string, error: unknown): void {
  console.error(`[SSL ERROR] ${message}`, error);
}

export interface SSLConfig {
  // SSL verification settings
  verifySSL: boolean;
  allowSelfSigned: boolean;

  // ⚠️ INSECURE - Corporate environments only
  bypassAllSSL: boolean;

  // Custom CA certificates
  caCertPath?: string;
  caCertContent?: string;

  // Client certificates for mutual TLS
  clientCertPath?: string;
  clientKeyPath?: string;
  clientCertContent?: string;
  clientKeyContent?: string;

  // SSL debugging
  debugSSL: boolean;
}

/**
 * Default SSL configuration - SECURE by default
 */
export const defaultSSLConfig: SSLConfig = {
  verifySSL: true,
  allowSelfSigned: false,
  bypassAllSSL: false,
  debugSSL: false,
};

/**
 * Get SSL configuration from environment variables
 */
export function getSSLConfig(): SSLConfig {
  // Check for insecure SSL bypass - warn user
  const bypassAllSSL = ["true", "1", "yes", "on"].includes(
    Deno.env.get("JENKINS_SSL_BYPASS_ALL")?.toLowerCase() || "",
  );

  if (bypassAllSSL) {
    logWarn("⚠️  SSL BYPASS ENABLED - ALL SSL VALIDATION DISABLED ⚠️");
    logWarn(
      "This is INSECURE and should only be used in corporate environments!",
    );
  }

  const config: SSLConfig = {
    verifySSL: !["false", "0", "no", "off"].includes(
      Deno.env.get("JENKINS_SSL_VERIFY")?.toLowerCase() || "",
    ),
    allowSelfSigned: ["true", "1", "yes", "on"].includes(
      Deno.env.get("JENKINS_SSL_ALLOW_SELF_SIGNED")?.toLowerCase() || "",
    ),
    bypassAllSSL,
    caCertPath: Deno.env.get("JENKINS_CA_CERT_PATH"),
    caCertContent: Deno.env.get("JENKINS_CA_CERT_CONTENT"),
    clientCertPath: Deno.env.get("JENKINS_CLIENT_CERT_PATH"),
    clientKeyPath: Deno.env.get("JENKINS_CLIENT_KEY_PATH"),
    clientCertContent: Deno.env.get("JENKINS_CLIENT_CERT_CONTENT"),
    clientKeyContent: Deno.env.get("JENKINS_CLIENT_KEY_CONTENT"),
    debugSSL: ["true", "1", "yes", "on"].includes(
      Deno.env.get("JENKINS_SSL_DEBUG")?.toLowerCase() || "",
    ),
  };

  if (config.debugSSL) {
    logDebug("SSL Configuration:", {
      verifySSL: config.verifySSL,
      allowSelfSigned: config.allowSelfSigned,
      bypassAllSSL: config.bypassAllSSL,
      hasCaCert: !!(config.caCertPath || config.caCertContent),
      hasClientCert: !!(config.clientCertPath || config.clientCertContent),
    });
  }

  return config;
}

/**
 * Load CA certificate content from file or environment
 */
export async function loadCACertificate(
  config: SSLConfig,
): Promise<string | undefined> {
  try {
    if (config.caCertContent) {
      logDebug("Using CA certificate from environment variable");
      return config.caCertContent;
    }

    if (config.caCertPath) {
      logDebug(`Loading CA certificate from file: ${config.caCertPath}`);
      const certContent = await Deno.readTextFile(config.caCertPath);
      return certContent;
    }

    return undefined;
  } catch (error) {
    logError("Failed to load CA certificate:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to load CA certificate: ${errorMessage}`);
  }
}

/**
 * Load client certificate and key for mutual TLS
 */
export async function loadClientCertificate(config: SSLConfig): Promise<{
  cert?: string;
  key?: string;
}> {
  try {
    const result: { cert?: string; key?: string } = {};

    // Load certificate
    if (config.clientCertContent) {
      logDebug("Using client certificate from environment variable");
      result.cert = config.clientCertContent;
    } else if (config.clientCertPath) {
      logDebug(
        `Loading client certificate from file: ${config.clientCertPath}`,
      );
      result.cert = await Deno.readTextFile(config.clientCertPath);
    }

    // Load private key
    if (config.clientKeyContent) {
      logDebug("Using client key from environment variable");
      result.key = config.clientKeyContent;
    } else if (config.clientKeyPath) {
      logDebug(`Loading client key from file: ${config.clientKeyPath}`);
      result.key = await Deno.readTextFile(config.clientKeyPath);
    }

    // Validate that both cert and key are provided if either is provided
    if ((result.cert && !result.key) || (!result.cert && result.key)) {
      throw new Error(
        "Both client certificate and key must be provided for mutual TLS",
      );
    }

    return result;
  } catch (error) {
    logError("Failed to load client certificate:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to load client certificate: ${errorMessage}`);
  }
}

/**
 * Create fetch options with SSL configuration for Deno
 */
export async function createSSLFetchOptions(sslConfig: SSLConfig): Promise<{
  caCerts?: string[];
  cert?: string;
  key?: string;
}> {
  const options: {
    caCerts?: string[];
    cert?: string;
    key?: string;
  } = {};

  // Handle SSL verification - for Deno, we need to use different approach
  if (
    !sslConfig.verifySSL || sslConfig.allowSelfSigned || sslConfig.bypassAllSSL
  ) {
    logDebug(
      "SSL verification disabled, self-signed certificates allowed, or SSL bypass enabled",
    );
    // Note: Deno's fetch doesn't support rejectUnauthorized directly
    // We'll handle this at the fetch level by not adding any caCerts
    // and relying on environment variable DENO_TLS_CA_STORE=system if needed
    return options; // Return empty options to use system default (less strict)
  }

  // Load CA certificate if provided AND SSL verification is enabled
  if (sslConfig.verifySSL && !sslConfig.allowSelfSigned) {
    const caCert = await loadCACertificate(sslConfig);
    if (caCert) {
      options.caCerts = [caCert];
      logDebug("Added custom CA certificate to fetch options");
    }
  }

  // Load client certificate and key for mutual TLS
  const clientCerts = await loadClientCertificate(sslConfig);
  if (clientCerts.cert && clientCerts.key) {
    options.cert = clientCerts.cert;
    options.key = clientCerts.key;
    logDebug("Added client certificate to fetch options for mutual TLS");
  }

  return options;
}

/**
 * Validate SSL configuration
 */
export function validateSSLConfig(config: SSLConfig): void {
  // Warn about insecure configurations
  if (!config.verifySSL) {
    logWarn(
      "⚠️  SSL verification is disabled. This is insecure for production use.",
    );
  }

  if (config.allowSelfSigned) {
    logWarn("⚠️  Self-signed certificates are allowed. Use with caution.");
  }

  // Validate file paths exist
  const filesToCheck = [
    { path: config.caCertPath, name: "CA certificate" },
    { path: config.clientCertPath, name: "Client certificate" },
    { path: config.clientKeyPath, name: "Client key" },
  ];

  for (const file of filesToCheck) {
    if (file.path) {
      try {
        const stat = Deno.statSync(file.path);
        if (!stat.isFile) {
          throw new Error(`${file.name} path is not a file: ${file.path}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error
          ? error.message
          : String(error);
        throw new Error(
          `${file.name} file not found or not accessible: ${file.path} - ${errorMessage}`,
        );
      }
    }
  }

  logDebug("SSL configuration validation completed");
}

/**
 * Get common SSL troubleshooting information
 */
export function getSSLTroubleshootingInfo(): string {
  return `
SSL/TLS Troubleshooting for Jenkins MCP Server:

1. Certificate Verification Issues:
   - Set JENKINS_SSL_VERIFY=false to disable SSL verification (NOT recommended for production)
   - Add your organization's CA certificate using JENKINS_CA_CERT_PATH or JENKINS_CA_CERT_CONTENT

2. Self-Signed Certificates:
   - Set JENKINS_SSL_ALLOW_SELF_SIGNED=true (use with caution)
   
3. Mutual TLS (Client Certificates):
   - Set JENKINS_CLIENT_CERT_PATH and JENKINS_CLIENT_KEY_PATH
   - Or use JENKINS_CLIENT_CERT_CONTENT and JENKINS_CLIENT_KEY_CONTENT

4. Debugging SSL Issues:
   - Set JENKINS_SSL_DEBUG=true for detailed SSL logging
   - Check certificate validity: openssl x509 -in cert.pem -text -noout
   - Test connection: openssl s_client -connect your-jenkins:443 -servername your-jenkins

5. Common Enterprise Setup:
   export JENKINS_URL=https://jenkins.company.com
   export JENKINS_CA_CERT_PATH=/path/to/company-ca.pem
   export JENKINS_SSL_VERIFY=true
   export JENKINS_SSL_DEBUG=true

Environment Variables:
- JENKINS_SSL_VERIFY: Enable/disable SSL verification (default: true)
- JENKINS_SSL_ALLOW_SELF_SIGNED: Allow self-signed certificates (default: false)
- JENKINS_CA_CERT_PATH: Path to CA certificate file
- JENKINS_CA_CERT_CONTENT: CA certificate content as string
- JENKINS_CLIENT_CERT_PATH: Path to client certificate file
- JENKINS_CLIENT_KEY_PATH: Path to client private key file
- JENKINS_CLIENT_CERT_CONTENT: Client certificate content as string
- JENKINS_CLIENT_KEY_CONTENT: Client private key content as string
- JENKINS_SSL_DEBUG: Enable SSL debugging (default: false)
`;
}
