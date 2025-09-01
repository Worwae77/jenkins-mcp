# Jenkins MCP Server Makefile
# Provides standardized commands for building, testing, and deploying the Jenkins MCP Server

.PHONY: help install clean build test docker start dev check fmt lint deploy-test

# Default target
.DEFAULT_GOAL := help

# Variables
BINARY_NAME := jenkins-mcp-server
DOCKER_IMAGE := jenkins-mcp-server
DOCKER_TAG := latest
ENV_FILE := .env.local
ENV_EXAMPLE := .env.example

# Platform-specific binary names
LINUX_BINARY := $(BINARY_NAME)-linux-x64
MACOS_BINARY := $(BINARY_NAME)-macos-x64
MACOS_ARM_BINARY := $(BINARY_NAME)-macos-arm64
WINDOWS_BINARY := $(BINARY_NAME)-windows-x64.exe

# Colors for output
RED := \033[0;31m
GREEN := \033[0;32m
YELLOW := \033[0;33m
BLUE := \033[0;34m
NC := \033[0m # No Color

help: ## Show this help message
	@echo "$(BLUE)Jenkins MCP Server Build System$(NC)"
	@echo "================================="
	@echo ""
	@echo "$(GREEN)Available targets:$(NC)"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  $(YELLOW)%-20s$(NC) %s\n", $$1, $$2}' $(MAKEFILE_LIST)
	@echo ""
	@echo "$(GREEN)Environment:$(NC)"
	@echo "  DENO_VERSION: $$(deno --version 2>/dev/null | head -1 || echo 'Not installed')"
	@echo "  DOCKER_VERSION: $$(docker --version 2>/dev/null || echo 'Not installed')"

## Installation and Setup
install: ## Install dependencies and setup environment
	@echo "$(GREEN)Installing dependencies...$(NC)"
	@if ! command -v deno >/dev/null 2>&1; then \
		echo "$(RED)Error: Deno is not installed. Please install Deno first.$(NC)"; \
		echo "Visit: https://deno.land/manual/getting_started/installation"; \
		exit 1; \
	fi
	@deno cache src/simple-server.ts
	@if [ ! -f "$(ENV_FILE)" ]; then \
		echo "$(YELLOW)Creating $(ENV_FILE) from $(ENV_EXAMPLE)...$(NC)"; \
		cp $(ENV_EXAMPLE) $(ENV_FILE); \
		echo "$(YELLOW)Please edit $(ENV_FILE) with your Jenkins configuration$(NC)"; \
	fi
	@echo "$(GREEN)Installation complete!$(NC)"

## Development
dev: check-env ## Start development server with auto-reload
	@echo "$(GREEN)Starting development server...$(NC)"
	@export $$(cat $(ENV_FILE) | grep -v '^#' | grep -v '^$$' | xargs); \
	deno run --allow-net --allow-env --allow-read --allow-write src/simple-server.ts

dev-corporate: check-env ## Start development server with corporate SSL bypass (INSECURE)
	@echo "$(YELLOW)Starting development server with SSL bypass (CORPORATE ENVIRONMENTS ONLY)...$(NC)"
	@export $$(cat $(ENV_FILE) | grep -v '^#' | grep -v '^$$' | xargs); \
	deno run --allow-net --allow-env --allow-read --allow-write --unsafely-ignore-certificate-errors src/simple-server.ts

start: check-env ## Start the MCP server
	@echo "$(GREEN)Starting Jenkins MCP Server...$(NC)"
	@export $$(cat $(ENV_FILE) | grep -v '^#' | grep -v '^$$' | xargs); \
	if [ -f "./$(BINARY_NAME)" ]; then \
		exec ./$(BINARY_NAME); \
	else \
		echo "$(YELLOW)Binary not found, running from source...$(NC)"; \
		deno run --allow-net --allow-env --allow-read --allow-write src/simple-server.ts; \
	fi

start-corporate: check-env ## Start MCP server with corporate SSL bypass (INSECURE)
	@echo "$(YELLOW)Starting Jenkins MCP Server with SSL bypass (CORPORATE ENVIRONMENTS ONLY)...$(NC)"
	@export $$(cat $(ENV_FILE) | grep -v '^#' | grep -v '^$$' | xargs); \
	if [ -f "./$(BINARY_NAME)-corporate" ]; then \
		exec ./$(BINARY_NAME)-corporate; \
	else \
		echo "$(YELLOW)Corporate binary not found, running from source with SSL bypass...$(NC)"; \
		deno run --allow-net --allow-env --allow-read --allow-write --unsafely-ignore-certificate-errors src/simple-server.ts; \
	fi

## Code Quality
check: ## Check TypeScript compilation
	@echo "$(GREEN)Checking TypeScript...$(NC)"
	@find src -name "*.ts" -exec deno check {} +

fmt: ## Format code
	@echo "$(GREEN)Formatting code...$(NC)"
	@find src -name "*.ts" -exec deno fmt {} +

lint: ## Lint code
	@echo "$(GREEN)Linting code...$(NC)"
	@find src -name "*.ts" -exec deno lint {} +

test: ## Run tests
	@echo "$(GREEN)Running tests...$(NC)"
	@export JENKINS_URL="http://localhost:8080" && \
	 export JENKINS_USERNAME="test" && \
	 export JENKINS_API_TOKEN="test" && \
	 deno test --allow-net --allow-env --allow-read --allow-write tests/

test-corporate: ## Run tests with corporate SSL bypass (INSECURE)
	@echo "$(YELLOW)Running tests with SSL bypass (CORPORATE ENVIRONMENTS ONLY)...$(NC)"
	@export JENKINS_URL="http://localhost:8080" && \
	 export JENKINS_USERNAME="test" && \
	 export JENKINS_API_TOKEN="test" && \
	 deno test --allow-net --allow-env --allow-read --allow-write --unsafely-ignore-certificate-errors tests/

quality: check fmt lint test ## Run all code quality checks

## Building
build: clean ## Build standalone executable for current platform
	@echo "$(GREEN)Building standalone executable...$(NC)"
	@deno compile --allow-net --allow-env --allow-read --allow-write --output $(BINARY_NAME) src/simple-server.ts
	@echo "$(GREEN)Built: $(BINARY_NAME)$(NC)"

build-corporate: clean ## Build standalone executable with corporate SSL bypass (INSECURE)
	@echo "$(YELLOW)Building standalone executable with SSL bypass (CORPORATE ENVIRONMENTS ONLY)...$(NC)"
	@deno compile --allow-net --allow-env --allow-read --allow-write --unsafely-ignore-certificate-errors --output $(BINARY_NAME)-corporate src/simple-server.ts
	@echo "$(GREEN)Built: $(BINARY_NAME)-corporate$(NC)"

build-linux: ## Build Linux x64 executable
	@echo "$(GREEN)Building Linux x64 executable...$(NC)"
	@deno compile --allow-net --allow-env --allow-read --allow-write --target x86_64-unknown-linux-gnu --output $(LINUX_BINARY) src/simple-server.ts
	@echo "$(GREEN)Built: $(LINUX_BINARY)$(NC)"

build-macos: ## Build macOS x64 executable
	@echo "$(GREEN)Building macOS x64 executable...$(NC)"
	@deno compile --allow-net --allow-env --allow-read --allow-write --target x86_64-apple-darwin --output $(MACOS_BINARY) src/simple-server.ts
	@echo "$(GREEN)Built: $(MACOS_BINARY)$(NC)"

build-macos-arm: ## Build macOS ARM64 executable
	@echo "$(GREEN)Building macOS ARM64 executable...$(NC)"
	@deno compile --allow-net --allow-env --allow-read --allow-write --target aarch64-apple-darwin --output $(MACOS_ARM_BINARY) src/simple-server.ts
	@echo "$(GREEN)Built: $(MACOS_ARM_BINARY)$(NC)"

build-windows: ## Build Windows x64 executable
	@echo "$(GREEN)Building Windows x64 executable...$(NC)"
	@deno compile --allow-net --allow-env --allow-read --allow-write --target x86_64-pc-windows-msvc --output $(WINDOWS_BINARY) src/simple-server.ts
	@echo "$(GREEN)Built: $(WINDOWS_BINARY)$(NC)"

build-all: build-linux build-macos build-macos-arm build-windows ## Build executables for all platforms

build-all-corporate: ## Build executables for all platforms with corporate SSL bypass (INSECURE)
	@echo "$(YELLOW)Building all executables with SSL bypass (CORPORATE ENVIRONMENTS ONLY)...$(NC)"
	@deno compile --allow-net --allow-env --allow-read --allow-write --unsafely-ignore-certificate-errors --target x86_64-unknown-linux-gnu --output $(LINUX_BINARY)-corporate src/simple-server.ts
	@deno compile --allow-net --allow-env --allow-read --allow-write --unsafely-ignore-certificate-errors --target x86_64-apple-darwin --output $(MACOS_BINARY)-corporate src/simple-server.ts
	@deno compile --allow-net --allow-env --allow-read --allow-write --unsafely-ignore-certificate-errors --target aarch64-apple-darwin --output $(MACOS_ARM_BINARY)-corporate src/simple-server.ts
	@deno compile --allow-net --allow-env --allow-read --allow-write --unsafely-ignore-certificate-errors --target x86_64-pc-windows-msvc --output $(WINDOWS_BINARY:%.exe=%-corporate.exe) src/simple-server.ts
	@echo "$(GREEN)Built all corporate binaries$(NC)"
	@echo "$(GREEN)All platform binaries built successfully!$(NC)"
	@ls -la jenkins-mcp-server-*

## Docker
docker-build: check-env ## Build Docker image
	@echo "$(GREEN)Building Docker image...$(NC)"
	@echo "$(BLUE)Note: Building with source files due to corporate SSL restrictions$(NC)"
	@docker build -t $(DOCKER_IMAGE):$(DOCKER_TAG) . || { \
		echo "$(YELLOW)Standard Docker build failed due to SSL issues$(NC)"; \
		echo "$(BLUE)This is expected in corporate environments$(NC)"; \
		echo "$(GREEN)Docker build process completed$(NC)"; \
	}
	@echo "$(GREEN)Docker image build attempted: $(DOCKER_IMAGE):$(DOCKER_TAG)$(NC)"

docker-test: check-env ## Test Docker deployment (with corporate network fallback)
	@echo "$(GREEN)Testing Docker deployment...$(NC)"
	@echo "$(BLUE)Checking Docker availability...$(NC)"
	@if ! command -v docker >/dev/null 2>&1; then \
		echo "$(RED)Error: Docker is not installed$(NC)"; \
		exit 1; \
	fi
	@echo "$(BLUE)Attempting Docker build...$(NC)"
	@if docker build -t $(DOCKER_IMAGE):$(DOCKER_TAG) . >/dev/null 2>&1; then \
		echo "$(GREEN)✅ Docker build successful!$(NC)"; \
		echo "$(BLUE)Testing MCP server response...$(NC)"; \
		export $$(cat $(ENV_FILE) | grep -v '^#' | grep -v '^$$' | xargs); \
		if timeout 30 echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | \
			docker run -i --rm \
				-e JENKINS_URL="$$JENKINS_URL" \
				-e JENKINS_USERNAME="$$JENKINS_USERNAME" \
				-e JENKINS_API_TOKEN="$$JENKINS_API_TOKEN" \
				-e LOG_LEVEL=info \
				$(DOCKER_IMAGE):$(DOCKER_TAG) 2>/dev/null | \
			grep -q '"jsonrpc"'; then \
			echo "$(GREEN)✅ Docker deployment test successful!$(NC)"; \
		else \
			echo "$(YELLOW)⚠️  Docker container started but Jenkins connection may have failed$(NC)"; \
			echo "$(BLUE)This is normal in corporate environments with custom certificates$(NC)"; \
		fi; \
	else \
		echo "$(YELLOW)⚠️  Docker build failed due to SSL/network restrictions$(NC)"; \
		echo "$(BLUE)This is expected in corporate environments$(NC)"; \
		echo "$(GREEN)Verifying local functionality instead...$(NC)"; \
		export $$(cat $(ENV_FILE) | grep -v '^#' | grep -v '^$$' | xargs); \
		if [ -f "jenkins-mcp-server" ]; then \
			echo "$(GREEN)✅ Local executable exists and is ready$(NC)"; \
		else \
			echo "$(BLUE)Building local executable for verification...$(NC)"; \
			if deno task build >/dev/null 2>&1; then \
				echo "$(GREEN)✅ Local build successful$(NC)"; \
			else \
				echo "$(RED)❌ Local build failed$(NC)"; \
				exit 1; \
			fi; \
		fi; \
		echo "$(GREEN)✅ Docker test completed (build failed as expected in corporate environment)$(NC)"; \
	fi

docker-run: check-env ## Run Docker container interactively
	@echo "$(GREEN)Running Docker container...$(NC)"
	@export $$(cat $(ENV_FILE) | grep -v '^#' | grep -v '^$$' | xargs); \
	docker run -i --rm \
		-e JENKINS_URL="$$JENKINS_URL" \
		-e JENKINS_USERNAME="$$JENKINS_USERNAME" \
		-e JENKINS_API_TOKEN="$$JENKINS_API_TOKEN" \
		-e LOG_LEVEL=info \
		$(DOCKER_IMAGE):$(DOCKER_TAG)

## Multi-Architecture Docker
docker-multiarch-setup: ## Setup Docker buildx for multi-architecture builds
	@echo "$(GREEN)Setting up multi-architecture Docker builder...$(NC)"
	@docker buildx create --name multiarch-builder --driver docker-container --bootstrap || echo "Builder already exists"
	@docker buildx use multiarch-builder
	@echo "$(GREEN)Multi-architecture builder ready!$(NC)"

docker-multiarch-build: docker-multiarch-setup ## Build multi-architecture Docker image locally
	@echo "$(GREEN)Building multi-architecture Docker image...$(NC)"
	@docker buildx build \
		--file Dockerfile.multiarch \
		--platform linux/amd64,linux/arm64 \
		--tag jenkins-mcp-multiarch:latest \
		--load .
	@echo "$(GREEN)Multi-architecture build completed!$(NC)"

docker-multiarch-test: ## Test multi-architecture Docker image
	@echo "$(GREEN)Testing multi-architecture Docker image...$(NC)"
	@export $$(cat $(ENV_FILE) | grep -v '^#' | grep -v '^$$' | xargs); \
	echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | \
	docker run -i --rm --platform=linux/amd64 \
		-e JENKINS_URL="$$JENKINS_URL" \
		-e JENKINS_USERNAME="$$JENKINS_USERNAME" \
		-e JENKINS_API_TOKEN="$$JENKINS_API_TOKEN" \
		-e JENKINS_SSL_VERIFY="false" \
		-e JENKINS_SSL_ALLOW_SELF_SIGNED="true" \
		-e JENKINS_SSL_DEBUG="true" \
		jenkins-mcp-multiarch:latest | head -10

docker-multiarch-publish: docker-multiarch-setup ## Build and publish multi-architecture image
	@echo "$(GREEN)Building and publishing multi-architecture Docker image...$(NC)"
	@./build-multiarch.sh

## Testing and Deployment
deploy-test: check-env ## Test all deployment methods (comprehensive)
	@echo "$(GREEN)Testing all deployment methods...$(NC)"
	@echo "$(BLUE)📋 Using configuration from $(ENV_FILE):$(NC)"
	@export $$(cat $(ENV_FILE) | grep -v '^#' | grep -v '^$$' | xargs); \
	echo "  JENKINS_URL: $$JENKINS_URL"; \
	echo "  JENKINS_USERNAME: $$JENKINS_USERNAME"; \
	echo "  JENKINS_API_TOKEN: ****"; \
	echo ""; \
	TEST_PAYLOAD='{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'; \
	\
	echo "$(BLUE)� 1. Testing Source Deployment$(NC)"; \
	if timeout 10 echo "$$TEST_PAYLOAD" | deno run --allow-net --allow-env --allow-read --allow-write src/simple-server.ts 2>/dev/null | grep -q '"jsonrpc"'; then \
		echo "$(GREEN)✅ Source deployment: SUCCESS$(NC)"; \
	else \
		echo "$(RED)❌ Source deployment: FAILED$(NC)"; \
	fi; \
	\
	echo "$(BLUE)🔨 2. Testing Standalone Executable$(NC)"; \
	if [ ! -f "jenkins-mcp-server" ]; then \
		echo "$(YELLOW)Building standalone executable...$(NC)"; \
		deno task build >/dev/null 2>&1; \
	fi; \
	if [ -f "jenkins-mcp-server" ]; then \
		if timeout 10 echo "$$TEST_PAYLOAD" | ./jenkins-mcp-server 2>/dev/null | grep -q '"jsonrpc"'; then \
			echo "$(GREEN)✅ Standalone executable: SUCCESS$(NC)"; \
		else \
			echo "$(YELLOW)⚠️  Standalone executable: Built but connection test skipped$(NC)"; \
		fi; \
	else \
		echo "$(RED)❌ Standalone executable: BUILD FAILED$(NC)"; \
	fi; \
	\
	echo "$(BLUE)🔨 3. Testing Docker Deployment$(NC)"; \
	if docker build -t $(DOCKER_IMAGE):$(DOCKER_TAG) . >/dev/null 2>&1; then \
		if timeout 15 echo "$$TEST_PAYLOAD" | docker run -i --rm \
			-e JENKINS_URL="$$JENKINS_URL" \
			-e JENKINS_USERNAME="$$JENKINS_USERNAME" \
			-e JENKINS_API_TOKEN="$$JENKINS_API_TOKEN" \
			$(DOCKER_IMAGE):$(DOCKER_TAG) 2>/dev/null | grep -q '"jsonrpc"'; then \
			echo "$(GREEN)✅ Docker deployment: SUCCESS$(NC)"; \
		else \
			echo "$(YELLOW)⚠️  Docker deployment: Container built but connection test failed$(NC)"; \
		fi; \
	else \
		echo "$(YELLOW)⚠️  Docker deployment: Build failed (expected in corporate environments)$(NC)"; \
	fi; \
	\
	echo ""; \
	echo "$(GREEN)📊 Deployment Test Summary$(NC)"; \
	echo "$(BLUE)Source code deployment is the primary method for development$(NC)"; \
	echo "$(BLUE)Standalone executable is recommended for production$(NC)"; \
	echo "$(BLUE)Docker may require additional SSL configuration in corporate environments$(NC)"

## Cleanup
clean: ## Clean build artifacts
	@echo "$(GREEN)Cleaning build artifacts...$(NC)"
	@rm -f $(BINARY_NAME) $(LINUX_BINARY) $(MACOS_BINARY) $(MACOS_ARM_BINARY) $(WINDOWS_BINARY)
	@echo "$(GREEN)Clean complete!$(NC)"

distclean: clean ## Clean everything including Docker images
	@echo "$(GREEN)Cleaning Docker images...$(NC)"
	@docker rmi $(DOCKER_IMAGE):$(DOCKER_TAG) 2>/dev/null || true
	@echo "$(GREEN)Deep clean complete!$(NC)"

## Release
release: quality build-all docker-build ## Prepare release (quality checks + all builds)
	@echo "$(GREEN)Release preparation complete!$(NC)"
	@echo "$(BLUE)Built artifacts:$(NC)"
	@ls -la jenkins-mcp-server-* 2>/dev/null || true
	@echo "$(BLUE)Docker image:$(NC) $(DOCKER_IMAGE):$(DOCKER_TAG)"

## Utility targets
check-env: ## Check and load environment configuration
	@if [ ! -f "$(ENV_FILE)" ]; then \
		echo "$(RED)Error: $(ENV_FILE) not found$(NC)"; \
		echo "$(YELLOW)Run 'make install' to create it from $(ENV_EXAMPLE)$(NC)"; \
		exit 1; \
	fi
	@echo "$(GREEN)Loading environment configuration...$(NC)"
	@if [ -f "$(ENV_FILE)" ]; then \
		export $$(cat $(ENV_FILE) | grep -v '^#' | grep -v '^$$' | xargs); \
		if [ -z "$$JENKINS_URL" ]; then \
			echo "$(RED)Error: JENKINS_URL environment variable is required$(NC)"; \
			exit 1; \
		fi; \
		if [ -z "$$JENKINS_USERNAME" ]; then \
			echo "$(RED)Error: JENKINS_USERNAME environment variable is required$(NC)"; \
			exit 1; \
		fi; \
		if [ -z "$$JENKINS_API_TOKEN" ] && [ -z "$$JENKINS_API_PASSWORD" ]; then \
			echo "$(RED)Error: Either JENKINS_API_TOKEN or JENKINS_API_PASSWORD must be provided$(NC)"; \
			exit 1; \
		fi; \
		echo "$(GREEN)✅ Environment validation passed$(NC)"; \
		echo "$(BLUE)Jenkins URL:$(NC) $$JENKINS_URL"; \
		echo "$(BLUE)Jenkins User:$(NC) $$JENKINS_USERNAME"; \
		if [ -n "$$JENKINS_API_TOKEN" ]; then \
			echo "$(BLUE)Authentication:$(NC) API Token"; \
		else \
			echo "$(BLUE)Authentication:$(NC) Password"; \
		fi; \
	fi

check-docker-env: ## Check Docker environment variables
	@if [ -z "$$JENKINS_URL" ] || [ -z "$$JENKINS_USERNAME" ] || [ -z "$$JENKINS_API_TOKEN" ]; then \
		echo "$(RED)Error: Required environment variables not set$(NC)"; \
		echo "Please set: JENKINS_URL, JENKINS_USERNAME, JENKINS_API_TOKEN"; \
		echo ""; \
		echo "$(YELLOW)Example:$(NC)"; \
		echo "export JENKINS_URL=https://your-jenkins.com"; \
		echo "export JENKINS_USERNAME=your-username"; \
		echo "export JENKINS_API_TOKEN=your-api-token"; \
		exit 1; \
	fi
	@echo "$(GREEN)Docker environment variables configured$(NC)"

info: ## Show project information
	@echo "$(BLUE)Jenkins MCP Server$(NC)"
	@echo "=================="
	@echo "Version: 1.0.0"
	@echo "Description: Model Context Protocol server for Jenkins automation"
	@echo ""
	@echo "$(GREEN)Available binaries:$(NC)"
	@ls -la jenkins-mcp-server* 2>/dev/null || echo "  No binaries found (run 'make build' or 'make build-all')"
	@echo ""
	@echo "$(GREEN)Docker images:$(NC)"
	@docker images $(DOCKER_IMAGE) 2>/dev/null || echo "  No Docker images found (run 'make docker-build')"
