# 🚀 GitHub Actions Pre-Deployment Testing Guide

## Overview

This guide provides comprehensive instructions for testing and validating GitHub Actions workflows for PantryCRM before deployment. All workflows are optimized for Azure B1 tier constraints (1.75 GB RAM, 1 Core).

## Table of Contents

1. [Quick Start](#quick-start)
2. [Local Testing with Act](#local-testing-with-act)
3. [Workflow Validation](#workflow-validation)
4. [Performance Testing](#performance-testing)
5. [Security Validation](#security-validation)
6. [Deployment Testing](#deployment-testing)
7. [Troubleshooting](#troubleshooting)
8. [Pre-Deployment Checklist](#pre-deployment-checklist)

## Quick Start

```bash
# Install act for local testing
curl -s https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash

# Validate all workflows
./scripts/validate-workflows.sh

# Run specific workflow locally
./scripts/validate-workflows.sh run .github/workflows/enhanced-ci-cd.yml

# Run performance validation
./scripts/performance-validation.sh
```

## Local Testing with Act

### Setup

1. **Install Act**:
   ```bash
   # macOS
   brew install act
   
   # Linux
   curl -s https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash
   
   # Windows
   choco install act-cli
   ```

2. **Configure Act**:
   - Configuration file: `.actrc`
   - Environment variables: `.env.act`
   - Event payloads: `.github/act-events/*.json`

3. **Test Workflows Locally**:
   ```bash
   # List all jobs
   act -l
   
   # Run push event
   act push
   
   # Run pull request event
   act pull_request
   
   # Run specific workflow
   act -W .github/workflows/enhanced-ci-cd.yml
   
   # Run with specific event
   act push -e .github/act-events/push.json
   
   # Dry run (show what would execute)
   act -n push
   ```

### Act Commands Reference

| Command | Description |
|---------|-------------|
| `act -l` | List all workflows and jobs |
| `act push` | Run push event workflows |
| `act pull_request` | Run PR workflows |
| `act -W <file>` | Run specific workflow file |
| `act -j <job>` | Run specific job |
| `act -n` | Dry run mode |
| `act --container-architecture linux/amd64` | Force architecture |

## Workflow Validation

### 1. Syntax Validation

```bash
# Validate YAML syntax
yamllint .github/workflows/*.yml

# Validate GitHub Actions syntax
actionlint

# Use our validation script
./scripts/validate-workflows.sh validate
```

### 2. Build Matrix Testing

Test across multiple Node.js versions:

```yaml
strategy:
  matrix:
    node-version: ['18.x', '20.x', 'latest']
```

Local test:
```bash
act -W .github/workflows/enhanced-ci-cd.yml --matrix node-version:18.x
act -W .github/workflows/enhanced-ci-cd.yml --matrix node-version:20.x
```

### 3. Job Dependencies

Validate job dependency chains:
```bash
act -W .github/workflows/workflow-orchestration-test.yml \
    -e .github/act-events/workflow_dispatch.json \
    --input test_scenario=job-dependencies
```

## Performance Testing

### Azure B1 Optimization

Run performance validation for Azure B1 constraints:

```bash
# Full performance test suite
./scripts/performance-validation.sh all

# Individual tests
./scripts/performance-validation.sh build    # Build performance
./scripts/performance-validation.sh bundle   # Bundle size analysis
./scripts/performance-validation.sh startup  # Startup time
./scripts/performance-validation.sh load     # Load testing
./scripts/performance-validation.sh cache    # Cache effectiveness
```

### Performance Benchmarks

| Metric | Threshold | Azure B1 Optimized |
|--------|-----------|-------------------|
| Memory Usage | < 1536 MB | ✅ |
| Build Time | < 5 minutes | ✅ |
| Bundle Size | < 50 MB | ✅ |
| Startup Time | < 30 seconds | ✅ |
| Response Time | < 1000ms | ✅ |

### GitHub Actions Performance

Test workflow performance:
```bash
# Test caching
act -W .github/workflows/performance-optimization.yml \
    --artifact-server-path /tmp/artifacts

# Test parallel jobs
act -W .github/workflows/workflow-orchestration-test.yml \
    --input test_scenario=parallel-execution
```

## Security Validation

### 1. Dependency Scanning

```bash
# NPM audit
npm audit --production

# Run security workflow locally
act -W .github/workflows/security-enhanced.yml \
    --input scan_type=dependencies
```

### 2. Secret Scanning

```bash
# Check for secrets
trufflehog filesystem . --only-verified

# Run secret scan workflow
act -W .github/workflows/security-enhanced.yml \
    --input scan_type=secrets
```

### 3. SAST Analysis

```bash
# Run CodeQL locally
act -W .github/workflows/security-enhanced.yml \
    --input scan_type=code
```

### Security Checklist

- [ ] No hardcoded secrets in workflows
- [ ] Minimal permissions defined
- [ ] Pinned action versions with SHAs
- [ ] Environment protection rules configured
- [ ] Secret scanning enabled
- [ ] Dependency scanning automated
- [ ] SAST tools configured

## Deployment Testing

### 1. Pre-Deployment Validation

```bash
# Test deployment validation
act -W .github/workflows/deployment-validation.yml \
    -e .github/act-events/workflow_dispatch.json \
    --input environment=staging \
    --input action=validate
```

### 2. Deployment Simulation

```bash
# Simulate deployment
act -W .github/workflows/deployment-validation.yml \
    --input environment=staging \
    --input action=deploy \
    --secret-file .env.act
```

### 3. Rollback Testing

```bash
# Test rollback procedure
act -W .github/workflows/deployment-validation.yml \
    --input environment=staging \
    --input action=rollback
```

### Deployment Validation Steps

1. **Azure Resource Check**
   - App Service Plan status
   - App Service state
   - Deployment slots availability

2. **Package Validation**
   - Required files present
   - Build artifacts complete
   - Package size acceptable

3. **Environment Configuration**
   - Required variables set
   - Database connection valid
   - External services accessible

4. **Health Checks**
   - Application starts successfully
   - Health endpoints respond
   - Critical features working

## Troubleshooting

### Common Issues

#### 1. Act Container Issues

```bash
# Clean Docker resources
docker system prune -a

# Use specific platform
act --platform ubuntu-latest=catthehacker/ubuntu:act-latest

# Increase resources
act --container-options "--memory=2g --cpus=2"
```

#### 2. Workflow Failures

```bash
# Debug mode
act -v push

# Show workflow graph
act -g push

# Run specific job with debug
act -j build-and-test -s ACTIONS_STEP_DEBUG=true
```

#### 3. Memory Issues

```bash
# Set Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=1536"

# Monitor memory during build
./scripts/performance-validation.sh build
```

### Debug Commands

```bash
# List available events
act -l

# Show workflow structure
act -g

# Verbose output
act -v

# Very verbose output
act -vv

# List available secrets
act -s

# Override secret
act -s MY_SECRET=value
```

## Pre-Deployment Checklist

### ✅ Workflow Configuration

- [ ] **YAML Syntax Valid**
  ```bash
  yamllint .github/workflows/*.yml
  actionlint
  ```

- [ ] **All Secrets Configured**
  ```bash
  # Check .env.act has all required secrets
  grep -E "AZURE_|DATABASE_|JWT_|NEXTAUTH_" .env.act
  ```

- [ ] **Permissions Follow Least Privilege**
  ```bash
  # Check workflow permissions
  grep -A5 "permissions:" .github/workflows/*.yml
  ```

- [ ] **Environment Isolation Configured**
  ```bash
  # Verify environment configurations
  grep -B2 -A5 "environment:" .github/workflows/*.yml
  ```

### ✅ Build and Test Validation

- [ ] **All Node.js Versions Build Successfully**
  ```bash
  act -W .github/workflows/enhanced-ci-cd.yml --matrix node-version:18.x
  act -W .github/workflows/enhanced-ci-cd.yml --matrix node-version:20.x
  ```

- [ ] **Unit Tests Pass with Required Coverage**
  ```bash
  npm run test:ci
  # Coverage should be > 80%
  ```

- [ ] **Integration Tests Pass**
  ```bash
  npm run test:e2e
  ```

- [ ] **Security Scans Complete**
  ```bash
  npm audit --production
  ./scripts/validate-workflows.sh
  ```

### ✅ Performance Validation

- [ ] **Memory Usage Within Limits**
  ```bash
  ./scripts/performance-validation.sh build
  # Peak memory < 1536MB
  ```

- [ ] **Build Time Acceptable**
  ```bash
  # Build completes < 5 minutes
  time npm run build:azure
  ```

- [ ] **Bundle Size Optimized**
  ```bash
  ./scripts/performance-validation.sh bundle
  # Total size < 50MB
  ```

- [ ] **Response Times Meet SLA**
  ```bash
  ./scripts/performance-validation.sh load
  # Average response < 1000ms
  ```

### ✅ Deployment Readiness

- [ ] **Deployment Protection Rules**
  ```bash
  # Verify in GitHub Settings > Environments
  # Required reviewers configured
  # Wait timer set (if needed)
  ```

- [ ] **Rollback Procedures Tested**
  ```bash
  act -W .github/workflows/deployment-validation.yml \
      --input action=rollback
  ```

- [ ] **Health Checks Configured**
  ```bash
  curl http://localhost:3000/api/health
  # Returns 200 OK
  ```

- [ ] **Monitoring Configured**
  - Application Insights connected
  - Alerts configured
  - Deployment markers enabled

### ✅ Security Validation

- [ ] **No Critical Vulnerabilities**
  ```bash
  npm audit --production --audit-level=high
  ```

- [ ] **Secrets Properly Managed**
  - No hardcoded secrets
  - Using GitHub Secrets
  - Rotation schedule defined

- [ ] **Access Controls Configured**
  - Branch protection enabled
  - Required reviews set
  - Admin bypass disabled

### ✅ Documentation

- [ ] **Workflow Documentation Updated**
  - README includes CI/CD section
  - Workflow files have comments
  - Troubleshooting guide available

- [ ] **Runbook Created**
  - Deployment procedures documented
  - Rollback procedures documented
  - Emergency contacts listed

## Success Metrics

Track these metrics to ensure CI/CD health:

| Metric | Target | Measurement |
|--------|--------|-------------|
| Build Success Rate | > 95% | GitHub Actions insights |
| Deployment Success Rate | > 99% | Deployment history |
| Mean Time to Deploy | < 10 min | Workflow run duration |
| Mean Time to Recover | < 30 min | Incident response time |
| Test Coverage | > 80% | Jest coverage reports |
| Security Scan Pass Rate | 100% | Security workflow results |

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Act Documentation](https://github.com/nektos/act)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [Azure App Service Best Practices](https://docs.microsoft.com/en-us/azure/app-service/app-service-best-practices)

## Support

For issues or questions:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review workflow logs in GitHub Actions
3. Run local validation with act
4. Create an issue in the repository

---

**Last Updated**: December 2024
**Version**: 1.0.0