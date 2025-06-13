# PantryCRM CI/CD Pipeline Documentation

## Overview

This document provides comprehensive information about the GitHub Actions CI/CD pipelines implemented for PantryCRM, a kitchen pantry CRM specialized for the food service industry with Excel data migration capabilities.

## Pipeline Architecture

### Main CI/CD Pipeline

**File**: `.github/workflows/ci-cd-pipeline.yml`

The main pipeline implements a comprehensive CI/CD strategy with the following stages:

1. **Build and Test Stage** - Builds application and runs quality checks
2. **Security Scanning Stage** - Performs SAST and dependency vulnerability scanning
3. **Environment Deployments** - Deploys to development, staging, and production environments
4. **Post-Deployment Monitoring** - Monitors application health and creates deployment markers

**Triggers**:
- Push to `main` and `develop` branches
- Pull requests to `main` and `develop` branches
- Manual workflow dispatch with environment selection

**Reference**: [GitHub Actions Workflow Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)

### Pull Request Validation Pipeline

**File**: `.github/workflows/pr-validation.yml`

Comprehensive validation workflow for all pull requests with quality gates:

- **PR Metadata Validation** - Validates PR title format and description quality
- **Code Quality Checks** - ESLint, TypeScript checking, Prettier formatting
- **Security Validation** - CodeQL analysis, secret scanning, dependency audits
- **Performance Analysis** - Bundle size analysis, memory usage testing
- **Test Validation** - Unit tests with coverage reporting

**Reference**: [GitHub Actions Triggering Workflows](https://docs.github.com/en/actions/using-workflows/triggering-a-workflow)

### Production Deployment Pipeline

**File**: `.github/workflows/deploy-production.yml`

Manual production deployment workflow with comprehensive safeguards:

- **Pre-Deployment Validation** - Release tag validation, security scan verification
- **Blue-Green Deployment** - Uses Azure deployment slots for zero-downtime deployment
- **Automated Rollback** - Automatic rollback on health check failures
- **Post-Deployment Monitoring** - Health checks and performance monitoring

**Reference**: [GitHub Actions Environments](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment)

## Security Integration

### CodeQL Configuration

**File**: `.github/codeql/codeql-config.yml`

Static Application Security Testing (SAST) configuration:

```yaml
queries:
  - name: security-extended
    uses: security-extended
  - name: github-actions-security
    uses: github/codeql/actions/ql/src/codeql-suites/actions-security.qls
```

**Languages Analyzed**:
- JavaScript/TypeScript (application code)
- GitHub Actions workflows (infrastructure as code security)

**Reference**: [CodeQL Configuration](https://docs.github.com/en/code-security/code-scanning/automatically-scanning-your-code-for-vulnerabilities-and-errors/customizing-code-scanning)

### Security Scanning Features

1. **CodeQL Analysis** - Comprehensive SAST for multiple languages
2. **Dependency Scanning** - NPM audit for known vulnerabilities
3. **Secret Scanning** - TruffleHog for hardcoded secrets detection
4. **Container Security** - Trivy scanning (disabled, ready for future container deployment)

**Reference**: [GitHub Advanced Security](https://docs.github.com/en/get-started/learning-about-github/about-github-advanced-security)

## Deployment Strategy

### Environment Configuration

**Development Environment**:
- **Trigger**: Push to `develop` branch or manual dispatch
- **Slot**: `development`
- **Testing**: Integration tests

**Staging Environment**:
- **Trigger**: Push to `main` branch or manual dispatch
- **Slot**: `staging`
- **Testing**: E2E tests and performance testing

**Production Environment**:
- **Trigger**: Manual dispatch or `[deploy-prod]` commit message
- **Strategy**: Blue-green deployment with automatic rollback
- **Testing**: Smoke tests and health monitoring

### Azure Integration

**Authentication**: OpenID Connect (OIDC) for secure, keyless authentication

```yaml
- name: "🔐 Azure Login"
  uses: azure/login@v1
  with:
    client-id: ${{ secrets.AZURE_CLIENT_ID }}
    tenant-id: ${{ secrets.AZURE_TENANT_ID }}
    subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
```

**Deployment Target**: Azure App Service with B1 optimization

**Reference**: [OIDC in Azure](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-azure)

## Performance Optimization

### Build Optimization

**Caching Strategy**:
- **Dependencies**: NPM packages and node_modules
- **Build Artifacts**: Next.js build cache
- **Prisma**: Generated client caching

```yaml
- name: "📦 Cache Dependencies"
  uses: actions/cache@v4
  with:
    path: |
      ~/.npm
      node_modules
      ~/.cache
    key: ${{ runner.os }}-node-${{ env.NODE_VERSION }}-${{ hashFiles('**/package-lock.json') }}
```

**Reference**: [GitHub Actions Caching](https://docs.github.com/en/actions/using-workflows/caching-dependencies-to-speed-up-workflows)

### Azure B1 Specific Optimizations

**Memory Management**:
- Build process limited to 2048MB for Azure B1 compatibility
- Performance tests ensure memory usage stays within B1 limits

```yaml
env:
  NODE_OPTIONS: "--max-old-space-size=2048"
```

## Testing Strategy

### Test Types and Coverage

1. **Unit Tests** - Jest with coverage reporting
2. **Integration Tests** - API endpoint testing
3. **E2E Tests** - Playwright cross-browser testing
4. **Performance Tests** - Memory usage and load testing
5. **Security Tests** - SAST, dependency scanning, secret detection

### Test Commands

All test commands are defined in `package.json`:

```json
{
  "test:ci": "jest --ci --coverage --watchAll=false",
  "test:e2e": "playwright test",
  "test:performance:memory": "node tests/performance/memory-usage-test.js",
  "test:performance:load": "artillery run tests/performance/load-testing-4-users.yml"
}
```

**Reference**: [GitHub Actions Testing](https://docs.github.com/en/actions/automating-builds-and-tests/about-continuous-integration)

## Monitoring and Observability

### Application Insights Integration

Post-deployment monitoring includes:
- **Health Checks** - Automated endpoint monitoring
- **Performance Metrics** - Response time tracking
- **Deployment Annotations** - Release tracking in Azure Application Insights

### Notification Strategy

- **Success Notifications** - Deployment completion alerts
- **Failure Notifications** - Immediate failure alerts with rollback status
- **Performance Alerts** - Response time threshold monitoring

## Security Compliance

### Secret Management

All sensitive information is stored in GitHub Secrets:

- `AZURE_CLIENT_ID` - Azure service principal client ID
- `AZURE_TENANT_ID` - Azure tenant identifier
- `AZURE_SUBSCRIPTION_ID` - Azure subscription identifier
- `DATABASE_URL` - Production database connection string
- `JWT_SECRET` - JSON Web Token signing secret
- `NEXTAUTH_SECRET` - NextAuth.js session secret

**Reference**: [GitHub Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)

### Security Scanning Results

Security scan results are automatically uploaded to GitHub Security tab:

```yaml
- name: "📤 Upload ESLint Results"
  uses: github/codeql-action/upload-sarif@v3
  with:
    sarif_file: eslint-results.sarif
```

**Reference**: [SARIF Upload](https://docs.github.com/en/code-security/code-scanning/integrating-with-code-scanning/uploading-a-sarif-file-to-github)

## Workflow Permissions

### Principle of Least Privilege

Each workflow uses minimal required permissions:

```yaml
permissions:
  contents: read
  security-events: write
  actions: read
  checks: write
  deployments: write
  id-token: write  # Required for OIDC
```

**Reference**: [Workflow Permissions](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions#permissions)

## Troubleshooting

### Common Issues and Solutions

1. **Build Failures**
   - Check Node.js version compatibility
   - Verify environment variables are set
   - Review dependency conflicts

2. **Deployment Failures**
   - Validate Azure authentication
   - Check App Service configuration
   - Verify deployment slot availability

3. **Test Failures**
   - Review test environment setup
   - Check database connectivity
   - Validate test data availability

### Debug Commands

```bash
# Local build testing
npm run build:azure

# Type checking
npm run typecheck

# Security audit
npm run security:audit

# Performance testing
npm run test:performance:memory
```

## Best Practices

### Code Quality

1. **Conventional Commits** - PR titles must follow conventional commit format
2. **Type Safety** - TypeScript strict mode enabled
3. **Code Coverage** - Minimum coverage thresholds enforced
4. **Security Scanning** - All PRs must pass security checks

### Deployment Safety

1. **Environment Protection** - Production requires manual approval
2. **Health Checks** - Automated rollback on failure
3. **Blue-Green Deployment** - Zero-downtime production deployments
4. **Progressive Rollout** - Development → Staging → Production flow

### Performance

1. **Caching Strategy** - Aggressive caching for faster builds
2. **Parallel Execution** - Jobs run concurrently where possible
3. **Resource Optimization** - Azure B1 specific memory limits
4. **Artifact Management** - Build artifacts cached for reuse

## References

### Official GitHub Actions Documentation

- [Workflow Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [Security Hardening](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions)
- [Deployment Environments](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment)
- [Code Scanning](https://docs.github.com/en/code-security/code-scanning/automatically-scanning-your-code-for-vulnerabilities-and-errors)
- [Caching Dependencies](https://docs.github.com/en/actions/using-workflows/caching-dependencies-to-speed-up-workflows)

### Azure Integration Documentation

- [Azure Login Action](https://github.com/Azure/login)
- [Azure Web Apps Deploy](https://github.com/Azure/webapps-deploy)
- [OIDC Configuration](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-azure)

### Security Tools Documentation

- [CodeQL Configuration](https://docs.github.com/en/code-security/code-scanning/automatically-scanning-your-code-for-vulnerabilities-and-errors/customizing-code-scanning)
- [TruffleHog Secret Scanner](https://github.com/trufflesecurity/trufflehog)
- [Trivy Container Scanner](https://github.com/aquasecurity/trivy-action)

---

*This documentation is automatically maintained and updated with each pipeline modification. Last updated: $(date)*