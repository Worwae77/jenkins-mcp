# SSL/TLS Configuration Guide for Jenkins MCP Server

## Overview

The Jenkins MCP Server now includes comprehensive SSL/TLS support to handle common enterprise scenarios where Jenkins runs with HTTPS and organizational CA certificates.

## Common SSL Issues & Solutions

### 1. **Certificate Verification Errors**
When Jenkins uses HTTPS with internal/organizational CA certificates, you may encounter:
```
Certificate verification failed: unable to verify the first certificate
```

**Solution**: Add your organization's CA certificate:
```bash
# Method 1: File path
export JENKINS_CA_CERT_PATH=/path/to/company-ca.pem

# Method 2: Certificate content (useful for containerized environments)
export JENKINS_CA_CERT_CONTENT="-----BEGIN CERTIFICATE-----
MIIDXTCCAkWgAwIBAgIJAKoK/OvD/7vHMA0GCSqGSIb3DQEBCwUAMEUxCzAJBgNV
...
-----END CERTIFICATE-----"
```

### 2. **Self-Signed Certificates**
For development/testing environments with self-signed certificates:
```bash
# Allow self-signed certificates (USE WITH CAUTION)
export JENKINS_SSL_ALLOW_SELF_SIGNED=true
export JENKINS_SSL_DEBUG=true
```

### 3. **Mutual TLS (Client Certificates)**
Some enterprise Jenkins setups require client certificates:
```bash
# Client certificate and key files
export JENKINS_CLIENT_CERT_PATH=/path/to/client.pem
export JENKINS_CLIENT_KEY_PATH=/path/to/client.key

# Or as content
export JENKINS_CLIENT_CERT_CONTENT="-----BEGIN CERTIFICATE-----..."
export JENKINS_CLIENT_KEY_CONTENT="-----BEGIN PRIVATE KEY-----..."
```

## Environment Variables

### SSL Verification
- `JENKINS_SSL_VERIFY` (default: `true`)
  - Set to `false` to disable SSL verification (NOT recommended for production)
  - When disabled, Deno will use more permissive SSL behavior
  - Use only for testing/development or when dealing with problematic certificates

### Self-Signed Certificates  
- `JENKINS_SSL_ALLOW_SELF_SIGNED` (default: `false`)
  - Set to `true` to allow self-signed certificates
  - Use with caution, preferably only in development

### Custom CA Certificates
- `JENKINS_CA_CERT_PATH`: Path to CA certificate file
- `JENKINS_CA_CERT_CONTENT`: CA certificate content as string

### Client Certificates (Mutual TLS)
- `JENKINS_CLIENT_CERT_PATH`: Path to client certificate file
- `JENKINS_CLIENT_KEY_PATH`: Path to client private key file
- `JENKINS_CLIENT_CERT_CONTENT`: Client certificate content as string
- `JENKINS_CLIENT_KEY_CONTENT`: Client private key content as string

### Debugging
- `JENKINS_SSL_DEBUG` (default: `false`)
  - Set to `true` to enable detailed SSL logging

## Configuration Examples

### 1. Corporate Jenkins with Organizational CA
```bash
# .env.local
JENKINS_URL=https://jenkins.company.com
JENKINS_USERNAME=your-username
JENKINS_API_TOKEN=your-api-token
JENKINS_CA_CERT_PATH=/etc/ssl/certs/company-ca.pem
JENKINS_SSL_VERIFY=true
JENKINS_SSL_DEBUG=true
```

### 2. Development with Self-Signed Certificate
```bash
# .env.local (Development only!)
JENKINS_URL=https://jenkins-dev.local
JENKINS_USERNAME=dev-user
JENKINS_API_TOKEN=dev-token
JENKINS_SSL_ALLOW_SELF_SIGNED=true
JENKINS_SSL_VERIFY=false
JENKINS_SSL_DEBUG=true
```

### 3. High-Security Environment with Mutual TLS
```bash
# .env.local
JENKINS_URL=https://secure-jenkins.company.com
JENKINS_USERNAME=your-username
JENKINS_API_TOKEN=your-api-token
JENKINS_CA_CERT_PATH=/etc/ssl/company-ca.pem
JENKINS_CLIENT_CERT_PATH=/etc/ssl/client.pem
JENKINS_CLIENT_KEY_PATH=/etc/ssl/client.key
JENKINS_SSL_VERIFY=true
```

## Troubleshooting Commands

### Test SSL Connection
```bash
# Test SSL connection to Jenkins
openssl s_client -connect your-jenkins-server:443 -servername your-jenkins-server

# Check certificate details
openssl x509 -in /path/to/cert.pem -text -noout

# Verify certificate chain
openssl verify -CAfile /path/to/ca.pem /path/to/cert.pem
```

### Jenkins MCP Server Diagnostics
Use the new SSL diagnostics tool:
```bash
# Through MCP protocol
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"jenkins_ssl_diagnostics","arguments":{}}}' | ./start-server.sh
```

### Debug SSL Issues
1. Enable SSL debugging:
   ```bash
   export JENKINS_SSL_DEBUG=true
   ```

2. Start the server and check logs:
   ```bash
   ./start-server.sh
   ```

3. Look for SSL-related log messages:
   - Certificate loading status
   - SSL option application
   - Connection errors

## Security Best Practices

### ✅ **Recommended**
- Use organizational CA certificates instead of disabling verification
- Keep certificates updated and rotated regularly
- Use API tokens instead of passwords
- Enable SSL debugging only during troubleshooting

### ⚠️ **Use with Caution**
- Self-signed certificates (development only)
- Client certificates with proper key management

### ❌ **Never in Production**
- `JENKINS_SSL_VERIFY=false`
- Hardcoded certificates in code
- Unencrypted private keys in environment variables

## Implementation Details

The SSL support is implemented in:
- `src/utils/ssl.ts`: SSL configuration and validation
- `src/jenkins/client.ts`: Integration with fetch API
- `src/utils/config.ts`: Configuration management

Key features:
- Automatic SSL option detection and application
- Certificate validation with detailed error messages
- Support for both file-based and environment-based certificate management
- Comprehensive logging and debugging capabilities
- Built-in troubleshooting guidance

## Migration from Previous Versions

If you're upgrading from a version without SSL support:

1. **No breaking changes**: Existing configurations continue to work
2. **New features are opt-in**: SSL options are only used when explicitly configured
3. **Enhanced error messages**: Better diagnostics for SSL-related connection issues

Simply add the SSL environment variables as needed for your environment.
