# Agent Registry

This document serves as the central registry for all AI agents available in this project. Agents are deployed across three locations for maximum compatibility and effectiveness.

## Available Agents

### agent-creator-expert

- **Purpose**: Expert agent for creating, managing and maintaining other AI agents across multiple locations
- **Summary**: Creates agent rules following best practices, maintains registry, and ensures consistency across the agent ecosystem.
- **Locations**: `/agents/`, `.cursor/rules/`, `.claude/agents/`

### software-arquitect

- **Purpose**: Comprehensive implementation planning for new features, systems, or architectural changes
- **Summary**: Analyzes projects and creates detailed implementation plans for complex development tasks.
- **Locations**: `/agents/`

### software-engineer

- **Purpose**: General software engineering and development tasks
- **Summary**: Handles coding, debugging, and software development across the full stack.
- **Locations**: `/agents/`

### ui-tester

- **Purpose**: UI testing and quality assurance
- **Summary**: Specialized agent for testing user interfaces and ensuring quality standards.
- **Locations**: `/agents/`

### ui-ux-designer

- **Purpose**: UI/UX design and frontend development with design system integration
- **Summary**: Creates exceptional user experiences using shadcn/ui components and design system tokens.
- **Locations**: `/agents/`

### database-optimizer

- **Purpose**: Database optimization, query performance tuning, and database architecture analysis
- **Summary**: Specializes in identifying performance bottlenecks, optimizing queries, and implementing caching solutions.
- **Locations**: `/agents/`, `.cursor/rules/`, `.claude/agents/`

## Agent Locations

**`/agents/`**: Primary agent documentation with examples and user-facing descriptions  
**`.cursor/rules/`**: Cursor IDE-specific rules in MDC format with file targeting  
**`.claude/agents/`**: Claude-optimized agent definitions and capabilities

## Usage

To use an agent, reference it in your requests:

```
"I'll use the [agent-name] agent to [specific task]"
```

Agents automatically apply their rules based on file types and contexts as defined in their respective rule files.

---

_Last updated: 2025-09-28_
_Total agents: 6_
