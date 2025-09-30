# Main Agent Registry

This document serves as the central registry for all AI agents available in this project. This registry tracks agents in the `/agents/` documentation folder.

## Available Agents

### agent-creator-expert

- **Purpose**: Expert agent for creating, managing and maintaining other AI agents across multiple locations
- **Summary**: Creates agent rules following best practices, maintains registry, and ensures consistency across the agent ecosystem.
- **Location**: `/agents/agent-creator-expert.md`

### software-arquitect

- **Purpose**: Comprehensive implementation planning for new features, systems, or architectural changes
- **Summary**: Analyzes projects and creates detailed implementation plans for complex development tasks.
- **Location**: `/agents/software-arquitect.md`

### software-engineer

- **Purpose**: General software engineering and development tasks
- **Summary**: Handles coding, debugging, and software development across the full stack.
- **Location**: `/agents/software-engineer.md`

### ui-tester

- **Purpose**: UI testing and quality assurance
- **Summary**: Specialized agent for testing user interfaces and ensuring quality standards using Chrome DevTools MCP.
- **Location**: `/agents/ui-tester.md`

### ui-ux-designer

- **Purpose**: UI/UX design and frontend development with design system integration
- **Summary**: Creates exceptional user experiences using shadcn/ui components and design system tokens.
- **Location**: `/agents/ui-ux-designer.md`

### database-optimizer

- **Purpose**: Database optimization, query performance tuning, and database architecture analysis
- **Summary**: Specializes in identifying performance bottlenecks, optimizing queries, and implementing caching solutions.
- **Location**: `/agents/database-optimizer.md`

### documentation-writer

- **Purpose**: Creating and maintaining technical documentation following VitePress and markdown best practices
- **Summary**: Expert in writing clear, comprehensive, and well-structured documentation for SaaS applications using VitePress, with knowledge of markdown extensions, proper formatting, and documentation architecture.
- **Location**: `/agents/documentation-writer.md`

### typescript

- **Purpose**: TypeScript best practices, naming conventions, and coding standards expert
- **Summary**: Ensures code follows TypeScript best practices, maintains type safety, and enforces consistent naming conventions across the codebase.
- **Location**: `/agents/typescript.md`

### unit-testing

- **Purpose**: Comprehensive unit testing expert specializing in Vitest, TypeScript, and modern testing best practices
- **Location**: `.cursor/rules/unit-test/.md`

## Agent Deployment

Agents in this project are deployed across three locations:

- **`/agents/`** - Primary agent documentation with examples and user-facing descriptions (this location)
- **`.cursor/rules/`** - Cursor IDE-specific rules in MDC format with file targeting
- **`.claude/agents/`** - Claude-optimized agent definitions and capabilities

## Usage

To use an agent, reference it in your requests:

```
"I'll use the [agent-name] agent to [specific task]"
```

Agents automatically apply their rules based on file types and contexts as defined in their respective rule files.

## Registry Maintenance

When adding or updating agents in `/agents/`:

1. ✅ Create/update agent in `/agents/`
2. ✅ Update this `main-agent.rules.md` file
3. ✅ Use proper markdown frontmatter
4. ✅ Update total agent count and last updated date
5. ✅ Consider creating corresponding agents in `.cursor/rules/` and `.claude/agents/`

## Application Access

To access the app on protected routes (_/app/_) you should use the chrome-dev MCP

**Application Access Credentials:**

- **URL**: Navigate to `/sign-in`
- **Email**: `admin@email.com`
- **Password**: `admin123`

---

_Last updated: 2025-09-30_  
_Total agents: 9 (including main-agent)_
