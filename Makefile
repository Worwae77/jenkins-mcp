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
	@deno run --allow-net --allow-env --allow-read --allow-write src/simple-server.ts

start: check-env ## Start the MCP server
	@echo "$(GREEN)Starting Jenkins MCP Server...$(NC)"
	@if [ -f "./$(BINARY_NAME)" ]; then \
		exec ./$(BINARY_NAME); \
	else \
		echo "$(YELLOW)Binary not found, running from source...$(NC)"; \
		deno run --allow-net --allow-env --allow-read --allow-write src/simple-server.ts; \
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

quality: check fmt lint test ## Run all code quality checks

## Building
build: clean ## Build standalone executable for current platform
	@echo "$(GREEN)Building standalone executable...$(NC)"
	@deno compile --allow-net --allow-env --allow-read --allow-write --output $(BINARY_NAME) src/simple-server.ts
	@echo "$(GREEN)Built: $(BINARY_NAME)$(NC)"

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
	@echo "$(GREEN)All platform binaries built successfully!$(NC)"
	@ls -la jenkins-mcp-server-*

## Docker
docker-build: ## Build Docker image
	@echo "$(GREEN)Building Docker image...$(NC)"
	@docker build -t $(DOCKER_IMAGE):$(DOCKER_TAG) .
	@echo "$(GREEN)Docker image built: $(DOCKER_IMAGE):$(DOCKER_TAG)$(NC)"

docker-test: check-docker-env docker-build ## Test Docker deployment
	@echo "$(GREEN)Testing Docker deployment...$(NC)"
	@echo "$(BLUE)Checking Docker availability...$(NC)"
	@if ! command -v docker >/dev/null 2>&1; then \
		echo "$(RED)Error: Docker is not installed$(NC)"; \
		exit 1; \
	fi
	@echo "$(BLUE)Testing MCP server response...$(NC)"
	@if echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | \
		docker run -i --rm \
			-e JENKINS_URL="$$JENKINS_URL" \
			-e JENKINS_USERNAME="$$JENKINS_USERNAME" \
			-e JENKINS_API_TOKEN="$$JENKINS_API_TOKEN" \
			-e LOG_LEVEL=info \
			$(DOCKER_IMAGE):$(DOCKER_TAG) | jq '.result.tools | length' >/dev/null 2>&1; then \
		echo "$(GREEN)✅ Docker deployment test successful!$(NC)"; \
		echo ""; \
		echo "$(BLUE)Available tools:$(NC)"; \
		echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | \
			docker run -i --rm \
				-e JENKINS_URL="$$JENKINS_URL" \
				-e JENKINS_USERNAME="$$JENKINS_USERNAME" \
				-e JENKINS_API_TOKEN="$$JENKINS_API_TOKEN" \
				-e LOG_LEVEL=info \
				$(DOCKER_IMAGE):$(DOCKER_TAG) | \
			jq -r '.result.tools[] | "- " + .name + ": " + .description'; \
	else \
		echo "$(RED)❌ Docker deployment test failed$(NC)"; \
		exit 1; \
	fi

docker-run: check-docker-env ## Run Docker container interactively
	@echo "$(GREEN)Running Docker container...$(NC)"
	@docker run -i --rm \
		-e JENKINS_URL="$$JENKINS_URL" \
		-e JENKINS_USERNAME="$$JENKINS_USERNAME" \
		-e JENKINS_API_TOKEN="$$JENKINS_API_TOKEN" \
		-e LOG_LEVEL=info \
		$(DOCKER_IMAGE):$(DOCKER_TAG)

## Testing and Deployment
deploy-test: ## Test all deployment methods (Docker, Standalone, Source)
	@echo "$(GREEN)Testing all deployment methods...$(NC)"
	@export JENKINS_URL=$${JENKINS_TEST_URL:-http://localhost:8080}; \
	export JENKINS_USERNAME=$${JENKINS_TEST_USERNAME:-admin}; \
	export JENKINS_API_TOKEN=$${JENKINS_TEST_API_TOKEN:-test}; \
	TEST_PAYLOAD='{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'; \
	echo "$(BLUE)📋 Test Configuration:$(NC)"; \
	echo "  JENKINS_URL: $$JENKINS_URL"; \
	echo "  JENKINS_USERNAME: $$JENKINS_USERNAME"; \
	echo "  JENKINS_API_TOKEN: ****"; \
	echo ""; \
	echo "$(BLUE)🐳 Testing Docker Deployment...$(NC)"; \
	if command -v docker >/dev/null 2>&1 && docker image inspect $(DOCKER_IMAGE):$(DOCKER_TAG) >/dev/null 2>&1; then \
		if DOCKER_RESULT=$$(echo "$$TEST_PAYLOAD" | docker run -i --rm \
			-e JENKINS_URL="$$JENKINS_URL" \
			-e JENKINS_USERNAME="$$JENKINS_USERNAME" \
			-e JENKINS_API_TOKEN="$$JENKINS_API_TOKEN" \
			$(DOCKER_IMAGE):$(DOCKER_TAG) 2>/dev/null); then \
			if echo "$$DOCKER_RESULT" | grep -q '"jsonrpc":"2.0"'; then \
				echo "$(GREEN)✅ Docker: MCP server responds correctly$(NC)"; \
			else \
				echo "$(RED)❌ Docker: MCP server response invalid$(NC)"; \
			fi; \
		else \
			echo "$(RED)❌ Docker: MCP server failed to start$(NC)"; \
		fi; \
	else \
		echo "$(YELLOW)⚠️  Docker image not found. Run 'make docker-build' first$(NC)"; \
	fi; \
	echo ""; \
	echo "$(BLUE)🏃 Testing Standalone Executable...$(NC)"; \
	if [ -f "./$(BINARY_NAME)" ]; then \
		if STANDALONE_RESULT=$$(echo "$$TEST_PAYLOAD" | JENKINS_URL="$$JENKINS_URL" JENKINS_USERNAME="$$JENKINS_USERNAME" JENKINS_API_TOKEN="$$JENKINS_API_TOKEN" ./$(BINARY_NAME) 2>/dev/null); then \
			if echo "$$STANDALONE_RESULT" | grep -q '"jsonrpc":"2.0"'; then \
				echo "$(GREEN)✅ Standalone: MCP server responds correctly$(NC)"; \
			else \
				echo "$(RED)❌ Standalone: MCP server response invalid$(NC)"; \
			fi; \
		else \
			echo "$(RED)❌ Standalone: MCP server failed to start$(NC)"; \
		fi; \
	else \
		echo "$(YELLOW)⚠️  Standalone executable not found. Run 'make build' first$(NC)"; \
	fi; \
	echo ""; \
	echo "$(BLUE)🦕 Testing Source Code Deployment...$(NC)"; \
	if command -v deno >/dev/null 2>&1; then \
		if SOURCE_RESULT=$$(echo "$$TEST_PAYLOAD" | JENKINS_URL="$$JENKINS_URL" JENKINS_USERNAME="$$JENKINS_USERNAME" JENKINS_API_TOKEN="$$JENKINS_API_TOKEN" timeout 5s deno run --allow-net --allow-env --allow-read --allow-write src/simple-server.ts 2>/dev/null); then \
			if echo "$$SOURCE_RESULT" | grep -q '"jsonrpc":"2.0"'; then \
				echo "$(GREEN)✅ Source: MCP server responds correctly$(NC)"; \
			else \
				echo "$(RED)❌ Source: MCP server response invalid$(NC)"; \
			fi; \
		else \
			echo "$(RED)❌ Source: MCP server failed to start$(NC)"; \
		fi; \
	else \
		echo "$(YELLOW)⚠️  Deno runtime not available$(NC)"; \
	fi; \
	echo ""; \
	echo "$(GREEN)🎉 Deployment testing completed!$(NC)"

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
check-env: ## Check environment configuration
	@if [ ! -f "$(ENV_FILE)" ]; then \
		echo "$(RED)Error: $(ENV_FILE) not found$(NC)"; \
		echo "$(YELLOW)Run 'make install' to create it from $(ENV_EXAMPLE)$(NC)"; \
		exit 1; \
	fi
	@echo "$(GREEN)Environment configuration found$(NC)"

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
