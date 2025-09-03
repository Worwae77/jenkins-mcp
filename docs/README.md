# Jenkins MCP Server Documentation

Welcome to the comprehensive documentation for the Jenkins MCP Server! This
directory contains all the technical documentation, guides, and references you
need to understand, deploy, and contribute to this project.

## 📚 Documentation Overview

The Jenkins MCP Server enables AI assistants to interact with Jenkins CI/CD
systems through the Model Context Protocol (MCP). This production-ready server
provides 18 comprehensive tools for Jenkins automation, advanced agent
management, and intelligent troubleshooting capabilities.

## 🚀 Quick Navigation

### 🌟 **Getting Started**

- **[Main README](../README.md)** - Project overview and quick start
- **[Contributing Guide](../CONTRIBUTING.md)** - Quick contributor onboarding
- **[Migration Guide](../MIGRATION.md)** - Shell script to Makefile transition

### 📋 **Core Documentation**

#### 📖 **Requirements & Planning**

- **[Software Requirements Specification (SRS)](SRS.md)** - Complete
  requirements documentation
- **[Project Completion Summary](PROJECT_COMPLETION_SUMMARY.md)** - Current
  implementation status
- **[Project History](PROJECT_HISTORY.md)** - Evolution and development timeline

#### 🏗️ **Technical Architecture**

- **[System Architecture](architecture/SYSTEM_ARCHITECTURE.md)** - Detailed
  technical design
- **[API Reference](api/API_REFERENCE.md)** - Complete MCP tools documentation

#### 🚀 **Deployment & Operations**

- **[Deployment Guide](guides/DEPLOYMENT.md)** - Production deployment
  procedures
- **[Troubleshooting Guide](guides/TROUBLESHOOTING.md)** - Problem diagnosis and
  solutions
- **[CI/CD Integration](CI_CD_INTEGRATION.md)** - Multi-platform build
  automation

#### 🤝 **Development & Contribution**

- **[Quick Contribution Guide](QUICK_CONTRIBUTION_GUIDE.md)** - 4-step GitHub
  workflow
- **[Detailed Contributing Guide](CONTRIBUTING.md)** - Comprehensive development
  workflow
- **[Experimental Roadmap](F005_EXPERIMENTAL_ROADMAP.md)** - v1.1 feature
  planning
- **[Repositioning Summary](F005_REPOSITIONING_SUMMARY.md)** - Strategic
  decisions

## 🎯 Documentation Structure

```text
docs/
├── README.md                     📖 This overview document
├── SRS.md                       📋 Software requirements specification
├── PROJECT_COMPLETION_SUMMARY.md 📊 Current implementation status
├── PROJECT_HISTORY.md           📅 Development timeline
├── CONTRIBUTING.md              🤝 Detailed development guide
├── F005_EXPERIMENTAL_ROADMAP.md  🛣️ v1.1 planning
├── F005_REPOSITIONING_SUMMARY.md 📝 Strategic decisions
├── CI_CD_INTEGRATION.md         🔄 Build automation guide
├── api/
│   └── API_REFERENCE.md         📚 Complete MCP tools reference
├── architecture/
│   └── SYSTEM_ARCHITECTURE.md   🏗️ Technical design document
└── guides/
    ├── DEPLOYMENT.md            🚀 Production deployment
    └── TROUBLESHOOTING.md       🔧 Problem solving guide
```

## 🎯 Documentation by Audience

### 👨‍💻 **For Developers**

**Getting started with development:**

1. [Contributing Guide](../CONTRIBUTING.md) - Quick setup and workflow
2. [System Architecture](architecture/SYSTEM_ARCHITECTURE.md) - Technical design
3. [API Reference](api/API_REFERENCE.md) - Tool implementation details
4. [Detailed Contributing Guide](CONTRIBUTING.md) - Comprehensive workflow

### 🚀 **For DevOps Engineers**

**Deploying and operating the server:**

1. [Deployment Guide](guides/DEPLOYMENT.md) - Production setup
2. [CI/CD Integration](CI_CD_INTEGRATION.md) - Build automation
3. [Troubleshooting Guide](guides/TROUBLESHOOTING.md) - Problem resolution
4. [Migration Guide](../MIGRATION.md) - Makefile transition

### 🏢 **For Enterprise Users**

**Enterprise adoption and planning:**

1. [Software Requirements](SRS.md) - Complete specifications
2. [System Architecture](architecture/SYSTEM_ARCHITECTURE.md) - Security and
   design
3. [Deployment Guide](guides/DEPLOYMENT.md) - Enterprise deployment
4. [Experimental Roadmap](F005_EXPERIMENTAL_ROADMAP.md) - Future features

### 🤖 **For AI/ML Engineers**

**Integrating with AI systems:**

1. [API Reference](api/API_REFERENCE.md) - MCP tools and usage
2. [Main README](../README.md) - AI interaction examples
3. [System Architecture](architecture/SYSTEM_ARCHITECTURE.md) - Integration
   patterns

## 📊 Project Status

### ✅ **v2.5.3 - Production Ready & CI/CD Optimized**

- **Status:** Complete and fully operational
- **Features:** 18 comprehensive MCP tools for Jenkins automation
- **Recent Achievements:** Successful CI/CD build pipeline fixes, Docker integration, enhanced SSL support
- **Documentation:** Comprehensive (5,000+ lines)
- **Testing:** Fully tested with robust CI/CD integration (69 test cases)
- **Security:** Enterprise-grade SSL support and secure credential management

### 🎯 **v2.6 - Agent Management & Advanced Automation (Active)**

- **Focus:** Advanced agent management, auto-recovery, and intelligent troubleshooting
- **Timeline:** Current development cycle
- **Features:** Agent diagnostics, auto-recovery systems, pipeline best practices
- **Documentation:** [Experimental Roadmap](F005_EXPERIMENTAL_ROADMAP.md)

### 🔮 **v3.0 - AI-Driven Operations (Future)**

- **Focus:** AI-enhanced automation and multi-cluster management
- **Features:** Advanced analytics, intelligent automation, enhanced AI integration
- **Timeline:** Next major release cycle

## 🛠️ Available MCP Tools

The Jenkins MCP Server provides **18 production-ready tools** organized into comprehensive categories:

### 🏗️ **Core Jenkins Operations (13 Tools)**

| Category                | Tools                                                              | Description                            |
| ----------------------- | ------------------------------------------------------------------ | -------------------------------------- |
| **Job Management**      | `jenkins_list_jobs`, `jenkins_get_job`, `jenkins_create_job`       | Job discovery and management           |
| **Build Operations**    | `jenkins_trigger_build`, `jenkins_get_build`, `jenkins_stop_build` | Build control and monitoring           |
| **Logging & Debugging** | `jenkins_get_build_logs`                                           | Console output and debugging           |
| **Infrastructure**      | `jenkins_list_nodes`, `jenkins_get_node_status`                    | Agent and node management              |
| **Queue Management**    | `jenkins_get_queue`, `jenkins_cancel_queue_item`                   | Build queue operations                 |
| **System Info**         | `jenkins_get_version`, `jenkins_ssl_diagnostics`                   | Server information and SSL diagnostics |

### 🔧 **Advanced Agent Management (5 Tools)**

| Category                    | Tools                                                                                     | Description                              |
| --------------------------- | ----------------------------------------------------------------------------------------- | ---------------------------------------- |
| **Agent Operations**        | `jenkins_restart_agent`, `jenkins_agent_diagnostics`                                     | Agent lifecycle and health monitoring    |
| **Auto-Recovery**           | `jenkins_auto_recovery`                                                                  | Intelligent system recovery automation  |
| **Troubleshooting**         | `jenkins_troubleshoot_build_failure`, `jenkins_pipeline_best_practices`                  | Advanced problem resolution and guidance |
| **System Info**         | `jenkins_get_version`, `jenkins_ssl_diagnostics`                   | Server information and SSL diagnostics |

For complete tool documentation, see [API Reference](api/API_REFERENCE.md).

## 🔧 Development Quick Start

```bash
# 1. Clone and setup
git clone https://github.com/Worwae77/jenkins-mcp.git
cd jenkins-mcp
make install

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local with your Jenkins details

# 3. Start development
make dev

# 4. Run quality checks (69 test cases)
make quality

# 5. Build for production
make build

# 6. Docker deployment
make docker-build
```

### 🏗️ **Build System & CI/CD**

Our robust build system supports multiple environments:

```bash
# Development builds (with SSL bypass for corporate environments)
make build

# CI/CD builds (secure, no SSL bypass)
make build-ci

# Cross-platform builds
make build-all  # Linux, macOS, Windows

# Docker builds
make docker-build     # Local development
make docker-build-ci  # CI/CD compatible
```

For detailed setup, see [Contributing Guide](../CONTRIBUTING.md).

## 📖 Documentation Standards

### ✅ **Quality Standards**

- **Comprehensive:** All features and components documented
- **Up-to-date:** Synchronized with code and releases (v2.5.3)
- **Accessible:** Multiple audience perspectives
- **Practical:** Real-world examples and procedures
- **Tested:** All code examples and procedures verified

### 🔄 **Maintenance Process**

- **Version Sync:** Documentation updated with each release
- **Quality Checks:** Automated markdown linting and link checking
- **Community Review:** Open to community contributions and feedback
- **Continuous Improvement:** Regular updates based on user feedback
- **CI/CD Integration:** Documentation builds verified in pipeline

## 🚀 **Recent Improvements (v2.5.3)**

### ✅ **CI/CD Pipeline Enhancements**

- **Fixed build failures** with environment-specific commands
- **Added Docker integration** with `docker-build-ci` target
- **Resolved SSL certificate** handling in CI environments
- **Implemented dual-environment** approach (local vs CI)
- **Achieved 100% test success** rate (69/69 tests passing)

### 🔧 **Technical Improvements**

- **Enhanced Makefile** with comprehensive build targets
- **Improved test isolation** to prevent environment pollution
- **Standardized Deno version** to 2.4.5 across all workflows
- **Streamlined GitHub Actions** for reliable cross-platform builds
- **Added 5 new advanced tools** for agent management and troubleshooting

## 🤝 Contributing to Documentation

We welcome contributions to improve our documentation:

### 📝 **How to Contribute**

1. **Fork the repository**
2. **Create a documentation branch**
3. **Make your improvements**
4. **Test with markdown linting:** `markdownlint docs/`
5. **Submit a pull request**

### 🎯 **Documentation Needs**

- Additional examples and use cases
- Translation to other languages
- Video tutorials and guides
- Interactive documentation features

## 📞 Getting Help

### 💬 **Community Support**

- **GitHub Issues:** Bug reports and feature requests
- **GitHub Discussions:** Questions and community help
- **Documentation Issues:** Improvements and corrections

### 📚 **Additional Resources**

- **[Model Context Protocol](https://github.com/modelcontextprotocol)** - MCP
  specification and tools
- **[Jenkins API](https://www.jenkins.io/doc/book/using/remote-access-api/)** -
  Jenkins REST API documentation
- **[Deno Manual](https://deno.land/manual)** - Deno runtime documentation

---

## 🌟 Documentation Quality

This documentation has been designed to be:

- **📖 Comprehensive:** Complete coverage of all project aspects
- **🎯 Practical:** Real-world examples and step-by-step procedures
- **🔄 Maintainable:** Well-structured and easy to update
- **🤝 Community-Friendly:** Welcoming to contributors of all levels
- **🏢 Enterprise-Ready:** Suitable for production deployments
- **🚀 CI/CD Optimized:** Fully tested build and deployment pipeline

**Total Documentation:** 5,000+ lines across 12+ specialized documents  
**Test Coverage:** 69 test cases with 100% success rate  
**Build Targets:** 8+ cross-platform build configurations  
**Tools Available:** 18 comprehensive MCP tools  

---

**Welcome to the Jenkins MCP Server community!** 🚀

_For questions about this documentation, please open an issue or start a
discussion on GitHub._
