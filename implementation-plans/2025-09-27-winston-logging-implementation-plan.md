## Winston Logging Implementation Plan

### Executive Summary

This document outlines the plan to integrate Winston, a powerful and versatile logging library, into our Next.js application. The goal is to establish a centralized, structured, and environment-aware logging system that will replace the current scattered `console.log` statements. This will improve debugging, monitoring, and overall application observability.

### Technical Analysis

The current logging implementation relies on `console.log`, `console.error`, and `console.warn` statements spread across the codebase. This approach lacks structure, consistency, and the ability to persist logs to a file for later analysis, especially in a production environment. Key-value pair logging, log levels, and log rotation are also missing. By introducing Winston, we can address these shortcomings and implement a professional-grade logging solution.

### Dependencies & Prerequisites

The following dependencies will be added to the project:

- `winston`: The core logging library.
- `winston-daily-rotate-file`: A transport for Winston that allows for log file rotation based on date, size, etc.

These will be installed via pnpm:
`pnpm add winston winston-daily-rotate-file`

### Architecture Overview

The proposed logging architecture will be:

- **Centralized**: A single logger instance will be configured and exported from a new module at `lib/logger/logger.service.ts`.
- **Structured**: Logs will be formatted as JSON objects, including a timestamp, log level, message, and optional metadata.
- **Multi-Transport**:
  - In **development**, logs will be sent to the console with colorization for readability.
  - In **production**, logs will be written to daily rotating files in the `logs/` directory. The console will only show errors and warnings.
- **Environment-Aware**: The logger's configuration (e.g., log level, transports) will be determined by the `NODE_ENV` environment variable.
- **Extensible**: The setup will be modular, allowing for easy addition of other transports in the future (e.g., Logstash, Sentry).

### Implementation Phases

#### Phase 1: Setup and Configuration

- **Objective**: Install dependencies and create the core logger service.
- **Tasks**:
  1.  Install `winston` and `winston-daily-rotate-file`.
  2.  Create a new directory `lib/logger`.
  3.  Create `lib/logger/logger.service.ts` to house the Winston logger configuration.
  4.  Configure different transports for development and production environments.
  5.  Define log formats (e.g., `winston.format.json()`, `winston.format.timestamp()`, `winston.format.prettyPrint()`).
- **Testing**: Verify that the logger instance is created correctly and that it logs to the console in development.

#### Phase 2: Core Integration & Refactoring

- **Objective**: Replace existing `console.log` statements with the new logger.
- **Tasks**:
  1.  Globally search for `console.log`, `console.error`, `console.warn`, and `console.info`.
  2.  Replace these with the appropriate logger methods (e.g., `logger.info()`, `logger.error()`).
  3.  Pay special attention to critical areas such as:
      - API routes (`app/api/`)
      - Server Actions (`app/(login)/actions.ts`, `lib/payments/actions.ts`)
      - Database setup and seeding scripts (`lib/db/setup.ts`, `lib/db/seed.ts`)
      - Authentication logic (`lib/auth/`)
- **Testing**: Ensure that all refactored parts of the application log messages correctly using the new logger.

#### Phase 3: Request and Response Logging

- **Objective**: Automatically log all incoming API requests and their outcomes.
- **Tasks**:
  1.  Update the main `middleware.ts` to log information about each incoming request, such as method, URL, IP address, and user agent.
  2.  The middleware should also log the response status code and response time.
- **Testing**: Make requests to various API endpoints and verify that request/response logs are generated in the correct format.

#### Phase 4: Error Handling Integration

- **Objective**: Ensure all uncaught exceptions and unhandled promise rejections are logged.
- **Tasks**:
  1.  Integrate the logger with Next.js's error handling mechanisms.
  2.  Create a global error handler (if one doesn't exist) that uses `logger.error()` to log exception details, including the stack trace.
  3.  Wrap the application entry point to catch unhandled promise rejections and log them.
- **Testing**: Intentionally introduce errors in different parts of the application (e.g., a server component, an API route) and verify that they are caught and logged correctly.

#### Phase 5: Documentation and Usage Guidelines

- **Objective**: Document the new logging service for the team.
- **Tasks**: 2. Document how to import and use the logger. 3. Provide examples of logging simple messages, objects, and errors. 4. Explain the different log levels and when to use them.
- **Testing**: Have a team member review the documentation for clarity and completeness.

### Folder Structure

The following new files and directories will be created:

```
saas-starter/
├── lib/
│   └── logger/
│       └── logger.service.ts
├── logs/
│   └── .gitkeep
└── ...
```

### Configuration Changes

- `.gitignore`: Add `logs/` to the `.gitignore` file to prevent log files from being committed to the repository.

### Risk Assessment

- **Performance Overhead**: Intensive logging can impact application performance. This will be mitigated by using asynchronous transports and setting an appropriate log level in production.
- **Disk Space**: Log files can consume significant disk space. The `winston-daily-rotate-file` transport will be configured with a retention policy (e.g., delete logs older than 14 days) to manage disk usage.
- **Sensitive Information**: There's a risk of logging sensitive data (e.g., passwords, API keys). Developers must be reminded not to log such information. We can also implement a mechanism to mask sensitive fields in logs.

### Success Metrics

- All `console.*` calls (except for specific, justified cases) are replaced with the new logger.
- Logs are correctly written to the console in development and to rotating files in production.
- API requests and responses are automatically logged.
- Unhandled exceptions are caught and logged with stack traces.
- The logging system is documented, and the team understands how to use it.

### References

- [Winston GitHub Repository](https://github.com/winstonjs/winston)
- [winston-daily-rotate-file NPM](https://www.npmjs.com/package/winston-daily-rotate-file)
- [Logging in Node.js using Winston](https://blog.logrocket.com/logging-node-js-using-winston/)
