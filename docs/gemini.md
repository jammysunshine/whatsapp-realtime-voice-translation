# Generic Development Workflow Guidelines

This file contains generic development workflow guidelines that apply across ALL projects in this organization. These principles, practices, and mandates are designed to ensure consistent development quality, security, and collaboration standards ACROSS ALL PROJECTS.

## ⚠️ IMPORTANT MANDATE: GENERIC NATURE OF THIS FILE

**THIS IS A GENERIC GUIDELINE FILE**: This `gemini.md` file contains ONLY generic development workflows, practices, and standards that apply to ALL projects universally. It should NOT contain project-specific implementation details, features, or requirements.

**PROJECT-SPECIFIC MANDATES**: All project-specific requirements, features, implementation details, and project-specific guidelines MUST be documented in project-specific files such as:
- `INITIAL-PROMPT.md` (main project requirements)
- `README.md` (project-specific setup and usage)
- Project-specific documentation files

**CROSS-REFERENCE REQUIREMENT**: This file MAY reference project-specific files for detailed information but should not duplicate or contain project-specific content.

For project-specific instructions, ALWAYS refer to the `INITIAL-PROMPT.md` file and other project-specific documentation files in each project's root directory.

---

## Development Workflow & Commitment

*   **Regular Commits**: After every logical step or feature implementation (e.g., after implementing a new function, or fixing a bug, or completing a set of related changes), automatically commit and push the changes to the GitHub repository
*   **Documentation Reference**: For the overall project goals and requirements, refer to the appropriate project documentation files
*   **Code Maintenance**: Regularly review the code for issues, optimizations, and unused parts (imports, variables, functions, dead code) to maintain a clean, efficient, and high-quality codebase. This should be done frequently and automatically if possible.

---

## Documentation Maintenance

*   **README Enterprise Quality**: The README.md file must be enterprise-grade with comprehensive sections including: getting started, understanding the project, configuration, build instructions, deployment, execution, technical architecture, high-level design, low-level design, help section, FAQ, and lessons learned
*   **Regular Documentation Updates**: All documentation files (.md files) must be reviewed and updated regularly to reflect current project state after significant changes
*   **Comprehensive Coverage**: Documentation must include user guides, technical architecture diagrams, API documentation, deployment guides, and troubleshooting sections
*   **Maintainability**: All project documentation must be kept current and accurate to ensure project maintainability

---

## Cost-Effective Technology Choices

*   **Free Tier Priority**: Use only technology stacks, services, and tools that are free or have generous free tiers for development, build, deployment, monitoring, and analytics
*   **Cost Consciousness**: Prioritize solutions that offer sustainable free usage limits for project development and operations
*   **Open Source Preference**: When possible, prefer open-source alternatives over paid services
*   **Sustainable Budgeting**: Ensure all tools and services selected have sustainable free usage models that support the project lifecycle without incurring unexpected costs

---

## Core Development Principles

*   **Clean Code**: All code must be written with clarity, maintainability, and readability as primary concerns
*   **Security First**: Always implement security measures as a primary concern when dealing with any external integrations, webhooks, or APIs
*   **Performance Consciousness**: Consider performance implications of all design decisions from the outset
*   **Test-Driven Mindset**: Write testable code and maintain comprehensive test coverage
*   **Documentation First**: Document code, architecture, and important decisions as you develop

---

## Branch Management Guidelines

*   **Feature Branch Workflow**: Use dedicated feature branches (e.g., 'feature/feature-name', 'bugfix/issue-description') for all significant work to isolate changes and prevent disruption to the main branch
*   **Branch Naming Convention**: Follow consistent naming patterns (feature/, bugfix/, hotfix/, release/)
*   **Automated Cleanup**: Delete feature branches after successful merge to keep repository clean
*   **Incremental Development**: Break large improvements into smaller, testable changes that can be developed and validated incrementally
*   **Branch Management**: Create new branches for optimization work and other significant changes rather than committing directly to main

---

## Code Quality Standards

*   **Linting**: Implement and enforce consistent code linting (e.g., ESLint, Prettier) across all projects
*   **Code Reviews**: All code changes must pass peer review before merging
*   **Technical Debt Management**: Address technical debt items identified during development in subsequent sprints
*   **Refactoring Standards**: Refactor code when code coverage thresholds are met to maintain quality

---

## Security Practices

*   **Dependency Scanning**: Run automated security scans (e.g., npm audit, Snyk) regularly and address vulnerabilities before merging
*   **Secret Management**: Never commit secrets to the repository; use environment variables, vaults, or secure storage
*   **Input Validation**: Implement comprehensive input validation and sanitization to protect against injection attacks
*   **Authentication & Authorization**: Implement proper authentication and authorization for all webhooks and API endpoints

---

## Automated Testing Mandates

*   **Minimum Coverage**: Maintain at least 80% test coverage across all projects
*   **Test Types**: Implement unit tests, integration tests, and end-to-end tests where applicable
*   **Continuous Testing**: Run automated tests on every commit and pull request
*   **Performance Testing**: Include performance benchmarks for any performance-critical features

---

## Documentation Standards

*   **API Documentation**: Maintain up-to-date API documentation for all endpoints
*   **Inline Documentation**: Include meaningful comments and documentation for complex logic
*   **Architecture Documentation**: Keep architectural decision records (ADRs) up to date
*   **README Updates**: Update README files with any significant feature additions or changes

---

## Git Configuration

*   **`.gitignore` Configuration**: The .gitignore file must be configured to track only source code, explicitly excluding:
    * `node_modules/` - Dependencies folder
    * `.next/` - Next.js build artifacts (if applicable)
    * `out/` - Next.js static export folder (if applicable)  
    * `build/` - General build artifacts
    * `npm-debug.log*`, `yarn-debug.log*`, `yarn-error.log*`, `.pnpm-debug.log*` - Debug logs
    * `.env*` - Environment files (except .env.example if needed as template)
    * `.vercel` - Vercel deployment files
    * `.DS_Store` - macOS system files
    * `*.pem` - Certificate files
    * `*.key` - Key files
    * `*.cert` - Certificate files
    * `*.json` - Sensitive JSON files (credentials, etc.)
    * `coverage/` - Test coverage reports
    * `.pnp`, `.pnp.*`, `.yarn/*` - Package manager specific files
    * `.aider*` - Aider tool files
    * `logs/` - Log files directory
    * `temp/` - Temporary files directory
    * Any other build artifacts, temporary files, or binary files.

---

## Commit Message Guidelines

Commit messages should be simple, concise, and descriptive. Avoid using special characters (e.g., `!`, `@`, `#`, `%`, `^`, `&`, `*`, `(`, `)`, `[`, `]`, `{`, `}`, `;`, `:`, `'`, `\\\"`, `<`, `>`, `?`, `/`, `\\\\`, `|`, `~`, `` ` ``, `-`, `_`, `=`, `+`) in the commit message itself to ensure compatibility and readability across various Git tools and platforms.

---

## Deployment & Infrastructure

*   **Continuous Integration**: Implement automated CI/CD pipelines for all projects
*   **Infrastructure as Code**: Define infrastructure using code (Terraform, CloudFormation, etc.)
*   **Environment Promotion**: Follow consistent environment promotion strategies (dev → staging → production)
*   **Rollback Procedures**: Document and test rollback procedures for all deployments

---

## Monitoring & Observability

*   **Application Performance Monitoring**: Implement APM tools (e.g., New Relic, Datadog) to track application performance
*   **Logging Standards**: Use structured logging with consistent formats and log levels
*   **Metrics Collection**: Collect and monitor key application metrics
*   **Alerting Systems**: Set up appropriate alerting for critical system failures and performance issues
*   **Health Checks**: Implement comprehensive health check endpoints

---

## Performance Optimization

*   **Performance Budget**: Define and maintain performance budgets for critical metrics
*   **Resource Management**: Always ensure proper and timely cleanup of all allocated resources (e.g., HTTP connections, timers, event listeners) to prevent leaks
*   **Optimization Reviews**: Conduct performance optimization reviews during code reviews
*   **Scalability Planning**: Consider scalability implications during architectural decisions

---

## Error Handling & Resilience

*   **Graceful Degradation**: Implement graceful degradation when services are unavailable
*   **Circuit Breaker Pattern**: Use circuit breakers for external service calls
*   **Retry Mechanisms**: Implement intelligent retry strategies with exponential backoff
*   **Fallback Mechanisms**: Design fallback mechanisms for critical functionality

---

## Environmental Management

*   **Multi-Environment Configuration**: Implement consistent configuration management across dev, staging, and production
*   **Environment-Specific Testing**: Include environment-specific testing in deployment pipelines
*   **Configuration Validation**: Validate configuration values before application startup

---

## Dependency Management

*   **Dependency Updates**: Regularly update dependencies to latest stable versions
*   **Security Audits**: Run dependency security audits as part of CI/CD pipeline
*   **Version Pinning**: Pin versions appropriately to ensure reproducible builds
*   **License Compliance**: Verify license compliance of all dependencies

---

## Collaboration & Communication

*   **Pull Request Standards**: Follow consistent pull request templates and review processes
*   **Commit Standards**: Follow conventional commit message formats
*   **Issue Tracking**: Maintain clear issue tracking and project management
*   **Knowledge Sharing**: Document architectural decisions and share knowledge regularly

---

## General Optimization Guidelines

*   **Structured Logging**: Implement a dedicated logging solution (e.g., Winston for server, custom logger for client) with configurable levels. Avoid raw `console.log` in production.
*   **Centralized Configuration**: Externalize all hardcoded values (e.g., API keys, ports, timeouts, language codes, MIME types) into environment variables or a central configuration file. For local development, utilize `.env` files and a library like `dotenv` to manage these variables effectively.
*   **User-Friendly Error Handling**: Replace intrusive `alert` or raw `console.error` with proper error responses for API calls in production.
*   **Asynchronous Operations**: Avoid synchronous I/O operations (e.g., `fs.readFileSync`) in main execution paths. Perform heavy or blocking operations asynchronously, ideally during application startup or initialization.
*   **Code Readability & Maintainability**: Extract complex conditional logic into well-named variables or helper functions. Refactor repetitive code into reusable functions or components.
*   **Rate Limiting**: Implement appropriate rate limiting to prevent API abuse and control costs.

---

## Agent Workflow Mandates

*   **Self-Review Before Testing**: Always perform a thorough self-review of all implemented changes, including code, configuration, and documentation, to ensure correctness, completeness, and adherence to project standards *before* asking the user to test.
*   **Update gemini.md Regularly**: As a critical mandate, this `gemini.md` file must be updated automatically after every major feature implementation or optimization work to document the changes and keep the generic guidelines current. This includes documenting new testing practices, monitoring features, configuration options, and code quality improvements THAT APPLY GENERALLY TO ALL PROJECTS.
*   **Branch Cleanup**: Regularly delete unused or merged feature branches to maintain a clean and manageable repository structure.
*   **Documentation First**: Prioritize documentation updates when implementing new features to ensure knowledge retention.

## ⚠️ PROJECT-SPECIFIC CONTENT SEPARATION MANDATE

**PROJECT-SPECIFIC UPDATES MUST BE DOCUMENTED IN PROJECT-SPECIFIC FILES**: Any project-specific implementation details, features, or accomplishments must be documented in project-specific files such as `INITIAL-PROMPT.md` or `README.md`, NOT in this generic `gemini.md` file.

**REMOVAL OF PROJECT-SPECIFIC CONTENT**: The following content was previously incorrectly added to this generic file and violates the separation of concerns mandate. Such content should be moved to project-specific documentation files.

---

## Testing Best Practices

*   **Module Import Validation**: Test that all modified modules can be imported without syntax errors before testing functionality.
*   **Configuration Verification**: Confirm that new configurations are properly loaded and accessible to the application.
*   **Method Functionality Tests**: Verify that new methods and functions work as expected with various inputs.
*   **Integration Testing**: Ensure all services work together properly in the processing pipeline.
*   **Backward Compatibility**: Test that changes maintain compatibility with existing functionality.
*   **Comprehensive Validation**: Create and run tests that validate all aspects of the implemented features before finalizing changes.
*   **Automated Testing Integration**: All new features and optimizations must include corresponding unit tests in the test suite to ensure functionality is preserved and regressions are caught early.
*   **Real-time Production Testing**: After deploying services, verify endpoints are operational using shell commands like curl before configuring external webhooks. For example: `curl -X GET "https://your-domain.example.com/health"` to check health endpoints and `curl -X GET "https://your-domain.example.com/webhook"` to verify webhook accessibility. This ensures the service is properly running before external systems attempt to connect.
*   **External Service Integration Testing**: Test with real external service messages to verify end-to-end functionality including media download, processing, transformation, and response delivery.
*   **Audio Format Testing**: Verify proper handling of various audio formats, particularly service-specific audio formats with explicit sample rate configuration.
*   **Performance Testing**: Monitor response times and throughput to ensure sub-2-second processing for the complete media processing pipeline.
*   **Post-Deployment Testing**: After deploying services, verify endpoints are operational using shell commands like curl before configuring external webhooks. For example: `curl -X GET "https://your-domain.example.com/health"` to check health endpoints and `curl -X GET "https://your-domain.example.com/webhook"` to verify webhook accessibility. This ensures the service is properly running before external systems attempt to connect.

---

## Implementation Best Practices

*   **Research Before Implementation**: Always research the correct approach for implementing features, especially when working with external APIs, to ensure proper implementation from the start.
*   **Backward Compatibility**: Maintain compatibility with existing code and APIs when adding new features or making changes.
*   **Proper Error Handling**: Preserve and maintain error handling mechanisms when refactoring or adding new functionality.
*   **Configuration-Driven Development**: Use configuration files to manage settings, API parameters, and feature flags to maintain flexibility and maintainability.
*   **API Documentation Adherence**: Follow official API documentation to implement features correctly, such as using proper parameters for automatic language detection rather than omitting required fields.
*   **Audio Format Compatibility**: When working with audio processing, ensure proper handling of various formats and explicit configuration of sample rates when required by external services.
*   **External Service Integration**: When integrating with external services, implement explicit configuration for format-specific requirements rather than relying on automatic detection which may fail.
*   **Real-time Processing Optimization**: Optimize processing pipelines for real-time performance with proper queuing, streaming, and asynchronous operations to maintain sub-second response times.

---

## Code Quality and Optimization

*   **Resource Management**: Always ensure proper cleanup of temporary files and resources, especially in error handling paths.
*   **Centralized Validation**: Create reusable validation utilities to reduce code duplication and improve maintainability.
*   **Security Hardening**: Implement comprehensive input validation and sanitization to protect against injection attacks and invalid payloads.
*   **Configurable Settings**: Make important parameters configurable through environment variables rather than hardcoding values.
*   **Consistent Logging**: Use standardized logging approaches throughout the application instead of raw console.log statements.
*   **Documentation**: Maintain up-to-date documentation for APIs, configuration options, and internal functions.
*   **Performance Monitoring**: Implement and maintain performance monitoring capabilities to track application health and identify optimization opportunities.
*   **Dependency Management**: Regularly audit dependencies for security vulnerabilities and keep packages up-to-date while maintaining compatibility.
*   **Environment-Specific Behavior**: Implement configuration options that allow the application to adapt its behavior based on the deployment environment (development, staging, production).
*   **Audio Processing Optimization**: Optimize audio processing pipelines with proper format handling, sample rate configuration, and streaming operations to ensure real-time performance.
*   **Error Recovery**: Implement graceful degradation and proper error handling for external service failures with informative user feedback.
*   **Monitoring and Alerting**: Implement comprehensive monitoring with appropriate alerting for critical system failures and performance issues.