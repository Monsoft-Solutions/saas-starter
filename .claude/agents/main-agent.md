---
name: main-agent
description: Central registry and orchestrator for AI agents in the SaaS Starter project
capabilities:
  [
    agent-routing,
    registry-management,
    agent-coordination,
    multi-agent-orchestration,
  ]
version: 1.1.0
created: 2025-09-30
updated: 2025-09-30
author: system
---

# Main Agent Registry

Central coordinator for all AI agents in the SaaS Starter project. This agent serves as the registry and router for specialized agents.

## Core Responsibilities

1. **Agent Discovery**: Maintain up-to-date registry of all available agents
2. **Agent Routing**: Direct tasks to appropriate specialized agents
3. **Registry Updates**: Keep agent metadata current
4. **Agent Coordination**: Ensure consistency within Claude agents ecosystem

## Available Agents (Claude)

### agent-creator-expert

**Purpose**: Expert agent for creating, managing and maintaining other AI agents across multiple locations

**Summary**: Creates agent rules following best practices, maintains registry, and ensures consistency across the agent ecosystem.

**Location**: `.claude/agents/agent-creator-expert.md`

### software-arquitect

**Purpose**: Comprehensive implementation planning for new features, systems, or architectural changes

**Summary**: Analyzes projects and creates detailed implementation plans for complex development tasks.

**Location**: `.claude/agents/software-arquitect.md`

### software-engineer

**Purpose**: General software engineering and development tasks

**Summary**: Handles coding, debugging, and software development across the full stack.

**Location**: `.claude/agents/software-engineer.md`

### ui-tester

**Purpose**: UI testing and quality assurance

**Summary**: Specialized agent for testing user interfaces and ensuring quality standards using Chrome DevTools MCP.

**Location**: `.claude/agents/ui-tester.md`

### ui-ux-designer

**Purpose**: UI/UX design and frontend development with design system integration

**Summary**: Creates exceptional user experiences using shadcn/ui components and design system tokens.

**Location**: `.claude/agents/ui-ux-designer.md`

### database-optimizer

**Purpose**: Database optimization, query performance tuning, and database architecture analysis

**Summary**: Specializes in identifying performance bottlenecks, optimizing queries, and implementing caching solutions.

**Location**: `.claude/agents/database-optimizer.md`

### documentation-writer

**Purpose**: Creating and maintaining technical documentation following VitePress and markdown best practices

**Summary**: Expert in writing clear, comprehensive, and well-structured documentation for SaaS applications using VitePress, with knowledge of markdown extensions, proper formatting, and documentation architecture.

**Location**: `.claude/agents/documentation-writer.md`

### typescript

**Purpose**: TypeScript best practices, naming conventions, and coding standards expert

**Summary**: Ensures code follows TypeScript best practices, maintains type safety, and enforces consistent naming conventions across the codebase.

**Location**: `.claude/agents/typescript.md`

### unit-testing

- **Purpose**: Comprehensive unit testing expert specializing in Vitest, TypeScript, and modern testing best practices
- **Location**: `.cursor/rules/unit-test/.md`

## Routing Logic

When a task is received, route it to the appropriate specialized agent:

1. **Agent creation/management** → `agent-creator-expert`
2. **Architecture planning** → `software-arquitect`
3. **Coding/development** → `software-engineer`
4. **UI testing** → `ui-tester`
5. **UI/UX design** → `ui-ux-designer`
6. **Database optimization** → `database-optimizer`
7. **Documentation** → `documentation-writer`
8. **TypeScript best practices** → `typescript`

## Usage Pattern

Reference agents in responses:

```
"I'll use the [agent-name] agent to [specific task]"
```

Agents automatically apply their rules based on file types and contexts as defined in their respective rule files.

## Registry Maintenance

When adding/updating agents in Claude:

1. Create/update agent in `.claude/agents/`
2. Update this `main-agent.md` file
3. Use proper YAML frontmatter
4. Update total agent count and last updated date

## Application Access

To access the app on protected routes (_/app/_) you should use the chrome-dev MCP

**Application Access Credentials:**

- **URL**: Navigate to `/sign-in`
- **Email**: `admin@email.com`
- **Password**: `admin123`

---

_Last updated: 2025-09-30_  
_Total Claude agents: 9 (including main-agent)_
