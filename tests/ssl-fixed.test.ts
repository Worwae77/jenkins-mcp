/**
 * SSL/TLS Configuration Tests
 * Comprehensive test suite for SSL configuration module
 */

import { assertEquals, assertThrows } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { 
  getSSLConfig,
  createSSLFetchOptions,
  validateSSLConfig,
  type SSLConfig 
} from "../src/utils/ssl.ts";

// Test environment setup
const originalEnv = {
  JENKINS_SSL_VERIFY: Deno.env.get("JENKINS_SSL_VERIFY"),
  JENKINS_CA_CERT_PATH: Deno.env.get("JENKINS_CA_CERT_PATH"),
  JENKINS_CLIENT_CERT_PATH: Deno.env.get("JENKINS_CLIENT_CERT_PATH"),
  JENKINS_CLIENT_KEY_PATH: Deno.env.get("JENKINS_CLIENT_KEY_PATH"),
  JENKINS_SSL_DEBUG: Deno.env.get("JENKINS_SSL_DEBUG"),
};

function resetEnv() {
  for (const [key, value] of Object.entries(originalEnv)) {
    if (value === undefined) {
      Deno.env.delete(key);
    } else {
      Deno.env.set(key, value);
    }
  }
}

function setTestEnv(envVars: Record<string, string>) {
  for (const [key, value] of Object.entries(envVars)) {
    Deno.env.set(key, value);
  }
}

Deno.test("SSL Config - Default Configuration", () => {
  resetEnv();
  
  const config = getSSLConfig();
  
  assertEquals(config.verifySSL, true, "SSL verification should be enabled by default");
  assertEquals(config.allowSelfSigned, false, "Self-signed certs should not be allowed by default");
  assertEquals(config.caCertPath, undefined, "CA cert path should be undefined by default");
  assertEquals(config.clientCertPath, undefined, "Client cert path should be undefined by default");
  assertEquals(config.clientKeyPath, undefined, "Client key path should be undefined by default");
  assertEquals(config.debugSSL, false, "SSL debug should be false by default");
});

Deno.test("SSL Config - SSL Verification Disabled", () => {
  setTestEnv({
    JENKINS_SSL_VERIFY: "false"
  });
  
  const config = getSSLConfig();
  
  assertEquals(config.verifySSL, false, "SSL verification should be disabled");
  
  resetEnv();
});

Deno.test("SSL Config - SSL Verification Case Insensitive", () => {
  const testCases = ["FALSE", "False", "false", "0"];
  
  for (const testValue of testCases) {
    setTestEnv({
      JENKINS_SSL_VERIFY: testValue
    });
    
    const config = getSSLConfig();
    assertEquals(config.verifySSL, false, `SSL verification should be disabled for "${testValue}"`);
  }
  
  resetEnv();
});

Deno.test("SSL Config - CA Certificate Path", () => {
  setTestEnv({
    JENKINS_CA_CERT_PATH: "/path/to/ca-cert.pem"
  });
  
  const config = getSSLConfig();
  
  assertEquals(config.caCertPath, "/path/to/ca-cert.pem", "CA cert path should be set");
  
  resetEnv();
});

Deno.test("SSL Config - Client Certificate Configuration", () => {
  setTestEnv({
    JENKINS_CLIENT_CERT_PATH: "/path/to/client.pem",
    JENKINS_CLIENT_KEY_PATH: "/path/to/client-key.pem"
  });
  
  const config = getSSLConfig();
  
  assertEquals(config.clientCertPath, "/path/to/client.pem", "Client cert path should be set");
  assertEquals(config.clientKeyPath, "/path/to/client-key.pem", "Client key path should be set");
  
  resetEnv();
});

Deno.test("SSL Config - Debug Mode", () => {
  setTestEnv({
    JENKINS_SSL_DEBUG: "true"
  });
  
  const config = getSSLConfig();
  
  assertEquals(config.debugSSL, true, "SSL debug should be enabled");
  
  resetEnv();
});

Deno.test("SSL Config - Complete Configuration", () => {
  setTestEnv({
    JENKINS_SSL_VERIFY: "false",
    JENKINS_CA_CERT_PATH: "/etc/ssl/ca.pem",
    JENKINS_CLIENT_CERT_PATH: "/etc/ssl/client.pem",
    JENKINS_CLIENT_KEY_PATH: "/etc/ssl/client-key.pem",
    JENKINS_SSL_DEBUG: "true"
  });
  
  const config = getSSLConfig();
  
  assertEquals(config.verifySSL, false);
  assertEquals(config.caCertPath, "/etc/ssl/ca.pem");
  assertEquals(config.clientCertPath, "/etc/ssl/client.pem");
  assertEquals(config.clientKeyPath, "/etc/ssl/client-key.pem");
  assertEquals(config.debugSSL, true);
  
  resetEnv();
});

Deno.test("SSL Config - Validation Success", () => {
  const validConfig: SSLConfig = {
    verifySSL: true,
    allowSelfSigned: false,
    caCertPath: "/valid/path/ca.pem",
    clientCertPath: "/valid/path/client.pem",
    clientKeyPath: "/valid/path/client-key.pem",
    debugSSL: false
  };
  
  // Should not throw
  validateSSLConfig(validConfig);
});

Deno.test("SSL Fetch Options - SSL Verification Disabled", async () => {
  const config: SSLConfig = {
    verifySSL: false,
    allowSelfSigned: false,
    debugSSL: false
  };
  
  const options = await createSSLFetchOptions(config);
  
  assertEquals(typeof options, "object", "Should return options object");
  assertEquals(options.caCerts, undefined, "Should not have CA certs when verification disabled");
});

Deno.test("SSL Fetch Options - CA Certificate Only", async () => {
  // Create a temporary CA certificate file for testing
  const tempDir = await Deno.makeTempDir();
  const caCertPath = `${tempDir}/ca.pem`;
  const mockCertContent = "-----BEGIN CERTIFICATE-----\nMOCK_CERT_CONTENT\n-----END CERTIFICATE-----";
  
  await Deno.writeTextFile(caCertPath, mockCertContent);
  
  try {
    const config: SSLConfig = {
      verifySSL: true,
      allowSelfSigned: false,
      caCertPath: caCertPath,
      debugSSL: false
    };
    
    const options = await createSSLFetchOptions(config);
    
    assertEquals(typeof options, "object", "Should return SSL options object");
    assertEquals(options.caCerts?.length, 1, "Should have one CA certificate");
    assertEquals(options.caCerts?.[0], mockCertContent, "Should load CA certificate content");
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("SSL Fetch Options - Client Certificate Configuration", async () => {
  // Create temporary certificate files for testing
  const tempDir = await Deno.makeTempDir();
  const clientCertPath = `${tempDir}/client.pem`;
  const clientKeyPath = `${tempDir}/client-key.pem`;
  const mockCertContent = "-----BEGIN CERTIFICATE-----\nMOCK_CLIENT_CERT\n-----END CERTIFICATE-----";
  const mockKeyContent = "-----BEGIN PRIVATE KEY-----\nMOCK_CLIENT_KEY\n-----END PRIVATE KEY-----";
  
  await Deno.writeTextFile(clientCertPath, mockCertContent);
  await Deno.writeTextFile(clientKeyPath, mockKeyContent);
  
  try {
    const config: SSLConfig = {
      verifySSL: true,
      allowSelfSigned: false,
      clientCertPath: clientCertPath,
      clientKeyPath: clientKeyPath,
      debugSSL: false
    };
    
    const options = await createSSLFetchOptions(config);
    
    assertEquals(typeof options, "object", "Should return SSL options object");
    assertEquals(options.cert, mockCertContent, "Should load client certificate content");
    assertEquals(options.key, mockKeyContent, "Should load client key content");
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("SSL Fetch Options - File Not Found Error", async () => {
  const config: SSLConfig = {
    verifySSL: true,
    allowSelfSigned: false,
    caCertPath: "/nonexistent/path/ca.pem",
    debugSSL: false
  };
  
  await assertThrows(
    () => createSSLFetchOptions(config),
    Error,
    "Failed to load CA certificate",
    "Should throw error when CA certificate file is not found"
  );
});

Deno.test("SSL Fetch Options - Complete Configuration", async () => {
  // Create temporary certificate files for testing
  const tempDir = await Deno.makeTempDir();
  const caCertPath = `${tempDir}/ca.pem`;
  const clientCertPath = `${tempDir}/client.pem`;
  const clientKeyPath = `${tempDir}/client-key.pem`;
  
  const mockCaCert = "-----BEGIN CERTIFICATE-----\nMOCK_CA_CERT\n-----END CERTIFICATE-----";
  const mockClientCert = "-----BEGIN CERTIFICATE-----\nMOCK_CLIENT_CERT\n-----END CERTIFICATE-----";
  const mockClientKey = "-----BEGIN PRIVATE KEY-----\nMOCK_CLIENT_KEY\n-----END PRIVATE KEY-----";
  
  await Deno.writeTextFile(caCertPath, mockCaCert);
  await Deno.writeTextFile(clientCertPath, mockClientCert);
  await Deno.writeTextFile(clientKeyPath, mockClientKey);
  
  try {
    const config: SSLConfig = {
      verifySSL: true,
      allowSelfSigned: false,
      caCertPath: caCertPath,
      clientCertPath: clientCertPath,
      clientKeyPath: clientKeyPath,
      debugSSL: true
    };
    
    const options = await createSSLFetchOptions(config);
    
    assertEquals(typeof options, "object", "Should return SSL options object");
    assertEquals(options.caCerts?.length, 1, "Should have one CA certificate");
    assertEquals(options.caCerts?.[0], mockCaCert, "Should load CA certificate content");
    assertEquals(options.cert, mockClientCert, "Should load client certificate content");
    assertEquals(options.key, mockClientKey, "Should load client key content");
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

// Clean up after all tests
Deno.test("SSL Config - Cleanup", () => {
  resetEnv();
});
