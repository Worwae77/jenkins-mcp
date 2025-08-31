# CI/CD Integration Guide

This project uses **Makefile-based CI/CD** to ensure consistency between local development and automated builds. This approach makes it extremely easy to port to any CI/CD system.

## 🚀 Quick CI/CD Setup for Any Platform

### **Basic CI Pipeline (Any System)**
```bash
# 1. Setup environment
make install

# 2. Run all quality checks
make quality

# 3. Build for production
make build-all
```

### **Docker Pipeline**
```bash
# 1. Build Docker image
make docker-build

# 2. Test Docker deployment
make docker-test
```

### **Release Pipeline**
```bash
# Complete release preparation
make release
```

## 📋 Platform-Specific Examples

### **GitHub Actions** ✅ (Current)
```yaml
- name: CI Pipeline
  run: |
    make install
    make quality
    make build-all
```

### **GitLab CI**
```yaml
stages:
  - quality
  - build

quality_check:
  script:
    - make install
    - make quality

build_binaries:
  script:
    - make build-all
```

### **Jenkins Pipeline**
```groovy
pipeline {
    agent any
    stages {
        stage('Quality') {
            steps {
                sh 'make install'
                sh 'make quality'
            }
        }
        stage('Build') {
            steps {
                sh 'make build-all'
            }
        }
    }
}
```

### **Azure DevOps**
```yaml
stages:
- stage: Quality
  jobs:
  - job: QualityCheck
    steps:
    - script: |
        make install
        make quality

- stage: Build
  jobs:
  - job: BuildAll
    steps:
    - script: make build-all
```

### **CircleCI**
```yaml
jobs:
  quality:
    docker:
      - image: denoland/deno:1.40.0
    steps:
      - checkout
      - run: make install
      - run: make quality
  
  build:
    docker:
      - image: denoland/deno:1.40.0
    steps:
      - checkout
      - run: make install
      - run: make build-all
```

### **Travis CI**
```yaml
script:
  - make install
  - make quality
  - make build-all
```

### **Drone CI**
```yaml
steps:
- name: quality
  commands:
    - make install
    - make quality

- name: build
  commands:
    - make build-all
```

## 🎯 Available Makefile Targets

Run `make help` to see all available commands:

### **Quality Assurance**
- `make quality` - Run all quality checks (TypeScript, formatting, linting, tests)
- `make check` - TypeScript compilation check
- `make fmt` - Code formatting
- `make lint` - Code linting
- `make test` - Run test suite

### **Building**
- `make build` - Build for current platform
- `make build-all` - Build for all platforms
- `make build-linux` - Build Linux x64
- `make build-macos` - Build macOS x64
- `make build-macos-arm` - Build macOS ARM64
- `make build-windows` - Build Windows x64

### **Docker**
- `make docker-build` - Build Docker image
- `make docker-test` - Test Docker deployment
- `make docker-run` - Run Docker container

### **Release**
- `make release` - Complete release preparation
- `make clean` - Clean build artifacts
- `make info` - Show project information

## 🔧 Environment Requirements

### **Prerequisites for Any CI System**
1. **Deno 2.0+** installed
2. **Make** utility available
3. **Docker** (optional, for Docker builds)

### **Environment Variables**
```bash
# Optional: Jenkins connection for testing
JENKINS_URL=http://localhost:8080
JENKINS_USERNAME=admin
JENKINS_TOKEN=your-token-here
```

## 💡 Benefits of This Approach

### **✅ Consistency**
- Same commands work locally and in CI/CD
- No platform-specific scripts to maintain
- Uniform behavior across all environments

### **✅ Portability**
- Easy to migrate between CI/CD systems
- No vendor lock-in
- Standard POSIX-compatible commands

### **✅ Simplicity**
- One source of truth for build logic
- Easy for contributors to understand
- Minimal CI/CD configuration required

### **✅ Maintainability**
- Build logic lives in version-controlled Makefile
- CI/CD configs become simple command runners
- Easy to test build logic locally

## 🚀 Migration Example

### **From Custom Scripts to Makefile**
**Before:**
```yaml
# .github/workflows/build.yml
- run: deno task check
- run: deno task test  
- run: deno compile --allow-net --allow-env --allow-read --allow-write --output jenkins-mcp-server src/simple-server.ts
```

**After:**
```yaml
# .github/workflows/build.yml
- run: make quality
- run: make build
```

The Makefile encapsulates all the complexity, making your CI/CD configs clean and portable! 🎉
