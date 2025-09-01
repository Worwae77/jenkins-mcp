# 🔐 SSL Security Configuration Guide

## Security-First Approach

**By default, Jenkins MCP Server enforces strict SSL certificate validation for maximum security.** 

SSL bypass options are provided **only for corporate environments** where custom certificate authorities are in use and should **never be used in production environments**.

---

## 🟢 **Secure Configuration (Default - Recommended)**

```bash
# .env.local - Secure defaults
JENKINS_URL=https://jenkins.company.com
JENKINS_USERNAME=your-username
JENKINS_API_TOKEN=your-api-token

# SSL verification enabled (default)
JENKINS_SSL_VERIFY=true
JENKINS_SSL_ALLOW_SELF_SIGNED=false
```

**Commands:**
```bash
# Normal secure operation
make start                    # Start with SSL verification
make dev                      # Development with SSL verification  
make build                    # Build secure binary
make test                     # Test with SSL verification
```

---

## 🟡 **Corporate Environment Configuration**

### For Corporate Networks with Custom CA Certificates

```bash
# .env.local - Corporate environment
JENKINS_URL=https://jenkins.company.com
JENKINS_USERNAME=your-username
JENKINS_API_TOKEN=your-api-token

# Use corporate CA certificate
JENKINS_CA_CERT_PATH=/path/to/company-ca.pem
# OR
JENKINS_CA_CERT_CONTENT="-----BEGIN CERTIFICATE-----
MIICertificateContent...
-----END CERTIFICATE-----"
```

### For Self-Signed Certificates (Use with Caution)

```bash
# Allow self-signed certificates (corporate networks only)
JENKINS_SSL_ALLOW_SELF_SIGNED=true
```

---

## ⚠️ **Insecure SSL Bypass (Corporate Emergency Only)**

**⚠️ WARNING: This completely disables SSL security and should NEVER be used in production!**

```bash
# .env.local - INSECURE bypass (emergency use only)
JENKINS_SSL_BYPASS_ALL=true
```

**Corporate Emergency Commands:**
```bash
# ⚠️ INSECURE operations - corporate networks only
make start-corporate          # Start with SSL bypass
make dev-corporate            # Development with SSL bypass
make build-corporate          # Build with SSL bypass  
make test-corporate           # Test with SSL bypass
make build-all-corporate      # Build all platforms with SSL bypass
```

---

## 🏗️ **Docker Configuration**

### Secure Docker Deployment
```yaml
# docker-compose.yml - Secure configuration
environment:
  - JENKINS_SSL_VERIFY=true
  - JENKINS_CA_CERT_PATH=/etc/ssl/company-ca.pem
```

### Corporate Docker Deployment
```yaml
# docker-compose.yml - Corporate environment
environment:
  - JENKINS_SSL_BYPASS_ALL=true  # ⚠️ INSECURE
```

---

## 🎯 **Usage Decision Matrix**

| Environment | SSL Configuration | Commands | Security Level |
|------------|------------------|----------|----------------|
| **Production** | `JENKINS_SSL_VERIFY=true` | `make start`, `make build` | 🟢 **SECURE** |
| **Corporate CA** | Custom CA certificate | `make start` + CA config | 🟢 **SECURE** |
| **Corporate Self-Signed** | `JENKINS_SSL_ALLOW_SELF_SIGNED=true` | `make start` | 🟡 **CAUTION** |
| **Corporate Emergency** | `JENKINS_SSL_BYPASS_ALL=true` | `make start-corporate` | 🔴 **INSECURE** |

---

## 🔧 **Migration from v2.1.0**

If you were using the previous version with SSL bypass by default:

```bash
# OLD v2.1.0 behavior (SSL bypass was default)
make start  # This was insecure

# NEW v2.1.1 behavior (SSL verification is default)  
make start                # Now secure by default
make start-corporate      # Use this for corporate SSL bypass
```

---

## 💡 **Best Practices**

### ✅ **DO:**
- Use default secure configuration in production
- Use custom CA certificates for corporate environments
- Use `make start-corporate` only in corporate networks
- Test SSL configuration with `make test` first

### ❌ **DON'T:**
- Use `JENKINS_SSL_BYPASS_ALL=true` in production
- Use corporate commands outside corporate networks
- Ignore SSL certificate warnings in production
- Commit real certificates to version control

---

## 🔍 **SSL Debugging**

Enable SSL debugging to troubleshoot certificate issues:

```bash
# Enable SSL debugging
JENKINS_SSL_DEBUG=true
```

This will show detailed SSL certificate validation information to help diagnose corporate network issues.

---

**Remember: Security first! Always prefer the most secure option that works in your environment.**
