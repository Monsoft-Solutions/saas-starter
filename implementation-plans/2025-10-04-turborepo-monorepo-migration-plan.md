# Turborepo Monorepo Migration Implementation Plan

**Project:** SaaS Starter
**Date:** 2025-10-04
**Type:** Infrastructure - Architecture Migration
**Complexity:** High
**Estimated Duration:** 12-16 hours

---

## Executive Summary

This implementation plan details the migration of the SaaS Starter project from a single-package structure to a Turborepo-based monorepo. The migration will split the codebase into logical workspaces while preserving all existing functionality, including multi-environment support, database operations, authentication, payments, and documentation.

### Migration Scope

- **2 Applications:** `web` (Next.js 15), `docs` (VitePress)
- **3 Shared Packages:** `ui` (shadcn/ui components), `eslint-config`, `typescript-config`
- **Package Manager:** pnpm@9.15.4 with workspaces
- **Build System:** Turborepo with intelligent caching

### Key Objectives

1. Maintain 100% feature parity with current implementation
2. Preserve multi-environment configuration (.env.local, .env.staging, .env.production)
3. Enable code sharing and reusability across future apps
4. Improve build performance through Turborepo caching
5. Support shadcn CLI for component management
6. Maintain Tailwind CSS v4 integration

---

## Technical Analysis

### Current State Assessment

**Project Structure:**

```
saas-starter/
├── app/                    # Next.js 15 App Router application
├── components/             # React components (23 shadcn/ui components)
├── lib/                    # Shared utilities, DB, auth, payments
├── docs/                   # VitePress documentation site
├── tests/                  # Vitest test files
├── styles/                 # Global styles
├── package.json            # Single package.json with 40+ scripts
├── tsconfig.json           # TypeScript configuration
├── eslint.config.js        # ESLint flat config
└── .env.*                  # Multiple environment files
```

**Technology Stack:**

- Next.js 15.5.4 with App Router and Turbopack
- React 19.1.0
- Tailwind CSS 4.1.7 with custom theme
- TypeScript 5.9.2 (strict mode)
- BetterAuth 1.3.18
- Drizzle ORM 0.43.1
- Stripe 18.5.0
- VitePress 2.0.0-alpha.12
- Vitest 2.1.4

**Critical Dependencies:**

- Database: PostgreSQL with Drizzle migrations
- Environment: Multi-environment setup with dotenv-cli
- UI: 23 shadcn/ui components with Tailwind CSS v4
- Auth: BetterAuth with social providers
- Payments: Stripe with webhooks
- Email: Resend + React Email

---

## Dependencies & Prerequisites

### Required Software

- **Node.js:** v18.17.0 or later
- **pnpm:** v9.15.4 (already installed)
- **Turborepo:** Latest version (will be installed)
- **Git:** For version control

### Required Actions Before Migration

1. **Backup Current State**
   - Create a git branch: `git checkout -b feature/turborepo-migration`
   - Ensure all changes are committed
   - Tag current state: `git tag pre-turborepo-migration`

2. **Environment Variables Audit**
   - Document all environment variables used
   - Ensure `.env.example` is up-to-date
   - Verify multi-environment files are correct

3. **Dependency Audit**
   - Review package.json dependencies
   - Identify which dependencies belong to which workspace
   - Note any peer dependencies

4. **Test Suite Verification**
   - Run `pnpm test` to ensure all tests pass
   - Run `pnpm type-check` to verify TypeScript
   - Run `pnpm lint` to check code quality

---

## Architecture Overview

### Target Monorepo Structure

```
saas-starter/                          # Monorepo root
├── apps/
│   ├── web/                          # Next.js application
│   │   ├── app/                      # App Router pages
│   │   ├── lib/                      # App-specific logic
│   │   ├── middleware.ts             # Next.js middleware
│   │   ├── instrumentation.ts        # OpenTelemetry
│   │   ├── package.json              # App dependencies
│   │   ├── tsconfig.json             # Extends @repo/typescript-config
│   │   ├── next.config.ts            # Next.js config
│   │   ├── components.json           # shadcn config for web
│   │   └── .env.*                    # Environment files
│   └── docs/                         # VitePress documentation
│       ├── .vitepress/
│       ├── *.md                      # Documentation files
│       └── package.json
│
├── packages/
│   ├── ui/                           # Shared UI components
│   │   ├── src/
│   │   │   ├── components/           # shadcn/ui components (23 components)
│   │   │   ├── hooks/                # Shared hooks
│   │   │   ├── lib/                  # Utils (cn, etc.)
│   │   │   └── styles/               # Global styles, Tailwind config
│   │   ├── package.json              # UI package dependencies
│   │   ├── tsconfig.json             # Extends @repo/typescript-config
│   │   ├── components.json           # shadcn config for ui package
│   │   └── tailwind.config.ts        # Tailwind v4 config
│   │
│   ├── typescript-config/            # Shared TypeScript configs
│   │   ├── base.json                 # Base TS config
│   │   ├── nextjs.json               # Next.js specific
│   │   ├── react-library.json        # React library config
│   │   └── package.json
│   │
│   └── eslint-config/                # Shared ESLint configs
│       ├── base.js                   # Base ESLint config
│       ├── nextjs.js                 # Next.js specific
│       ├── react.js                  # React specific
│       └── package.json
│
├── turbo.json                        # Turborepo pipeline config
├── pnpm-workspace.yaml               # pnpm workspace definition
├── package.json                      # Root package.json (scripts, workspaces)
├── tsconfig.json                     # Root TypeScript config
└── .env.*                            # Environment files (optional at root)
```

### Package Naming Convention

All internal packages will use the `@repo/` namespace:

- `@repo/ui` - Shared UI components
- `@repo/typescript-config` - TypeScript configurations
- `@repo/eslint-config` - ESLint configurations

### Import Strategy

**Before Migration:**

```typescript
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
```

**After Migration:**

```typescript
// In apps/web
import { Button } from '@repo/ui/components/button';
import { cn } from '@repo/ui/lib/utils';

// Internal app imports still use @/
import { auth } from '@/lib/auth/client';
```

---

## Implementation Phases

### Phase 1: Initial Setup & Root Configuration

**Objective:** Set up the monorepo foundation with Turborepo and pnpm workspaces.

**Estimated Time:** 2 hours
**Complexity:** Medium

#### Tasks

**1.1 Install Turborepo**

```bash
cd /Users/monsoft_solutions/monsoft/projects/business-scraper/saas-starter
pnpm add turbo --save-dev -w
```

**1.2 Create pnpm Workspace Configuration**

Create `/Users/monsoft_solutions/monsoft/projects/business-scraper/saas-starter/pnpm-workspace.yaml`:

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

**1.3 Create Root package.json**

Update `/Users/monsoft_solutions/monsoft/projects/business-scraper/saas-starter/package.json`:

```json
{
  "name": "saas-starter-monorepo",
  "version": "1.0.0",
  "private": true,
  "packageManager": "pnpm@9.15.4+sha512.b2dc20e2fc72b3e18848459b37359a32064663e5627a51e4c74b2c29dd8e8e0491483c3abb40789cfd578bf362fb6ba8261b05f0387d76792ed6e23ea3b1b6a0",
  "scripts": {
    "dev": "turbo run dev",
    "dev:web": "turbo run dev --filter=web",
    "dev:docs": "turbo run dev --filter=docs",
    "build": "turbo run build",
    "build:web": "turbo run build --filter=web",
    "build:docs": "turbo run build --filter=docs",
    "lint": "turbo run lint",
    "lint:fix": "turbo run lint:fix",
    "type-check": "turbo run type-check",
    "test": "turbo run test",
    "test:coverage": "turbo run test:coverage",
    "clean": "turbo run clean && rm -rf node_modules",
    "format": "prettier --write \"**/*.{ts,tsx,md,json}\""
  },
  "devDependencies": {
    "turbo": "latest",
    "prettier": "^3.6.2"
  }
}
```

**1.4 Create Turborepo Configuration**

Create `/Users/monsoft_solutions/monsoft/projects/business-scraper/saas-starter/turbo.json`:

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": [
    "**/.env.*local",
    "**/.env.development",
    "**/.env.staging",
    "**/.env.production"
  ],
  "globalEnv": [
    "NODE_ENV",
    "POSTGRES_URL",
    "BETTER_AUTH_SECRET",
    "BETTER_AUTH_URL",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "RESEND_API_KEY",
    "BASE_URL"
  ],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": [
        "$TURBO_DEFAULT$",
        ".env.production",
        ".env.staging",
        ".env.development"
      ],
      "outputs": [".next/**", "!.next/cache/**", ".vitepress/dist/**"],
      "env": [
        "POSTGRES_URL",
        "BETTER_AUTH_SECRET",
        "BETTER_AUTH_URL",
        "STRIPE_SECRET_KEY",
        "NEXT_PUBLIC_*"
      ]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^lint"],
      "outputs": []
    },
    "lint:fix": {
      "cache": false,
      "outputs": []
    },
    "type-check": {
      "dependsOn": ["^type-check"],
      "outputs": []
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"],
      "inputs": [
        "**/*.test.ts",
        "**/*.test.tsx",
        "**/*.spec.ts",
        "vitest.config.ts"
      ]
    },
    "test:coverage": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"],
      "cache": false
    },
    "clean": {
      "cache": false
    }
  }
}
```

**1.5 Update .gitignore**

Add to `/Users/monsoft_solutions/monsoft/projects/business-scraper/saas-starter/.gitignore`:

```
# Turborepo
.turbo
apps/*/.turbo
packages/*/.turbo

# Build outputs
apps/*/dist
apps/*/.next
apps/*/.vitepress/dist
packages/*/dist

# Environment files
apps/*/.env.local
.env.local
```

**1.6 Create Directory Structure**

```bash
# Create apps and packages directories
mkdir -p apps packages

# Create package directories
mkdir -p packages/ui/src/{components,hooks,lib,styles}
mkdir -p packages/typescript-config
mkdir -p packages/eslint-config
```

#### Validation

- [ ] `pnpm-workspace.yaml` exists and is valid
- [ ] Root `package.json` is configured
- [ ] `turbo.json` is created with proper task definitions
- [ ] Directory structure is created
- [ ] Turborepo CLI is accessible: `pnpm turbo --version`

---

### Phase 2: Create Shared Packages

**Objective:** Create the three shared packages (typescript-config, eslint-config, ui) with proper configurations.

**Estimated Time:** 3-4 hours
**Complexity:** High

#### Task 2.1: Create @repo/typescript-config Package

**2.1.1 Create package.json**

Create `/Users/monsoft_solutions/monsoft/projects/business-scraper/saas-starter/packages/typescript-config/package.json`:

```json
{
  "name": "@repo/typescript-config",
  "version": "0.0.0",
  "private": true,
  "main": "index.js",
  "files": ["base.json", "nextjs.json", "react-library.json"]
}
```

**2.1.2 Create base.json**

Create `/Users/monsoft_solutions/monsoft/projects/business-scraper/saas-starter/packages/typescript-config/base.json`:

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "target": "ESNext",
    "lib": ["ESNext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "incremental": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "declaration": true,
    "declarationMap": true
  },
  "exclude": ["node_modules"]
}
```

**2.1.3 Create nextjs.json**

Create `/Users/monsoft_solutions/monsoft/projects/business-scraper/saas-starter/packages/typescript-config/nextjs.json`:

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "./base.json",
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "jsx": "preserve",
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

**2.1.4 Create react-library.json**

Create `/Users/monsoft_solutions/monsoft/projects/business-scraper/saas-starter/packages/typescript-config/react-library.json`:

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "./base.json",
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "jsx": "react-jsx",
    "composite": true,
    "outDir": "dist"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts", "**/*.test.tsx"]
}
```

#### Task 2.2: Create @repo/eslint-config Package

**2.2.1 Create package.json**

Create `/Users/monsoft_solutions/monsoft/projects/business-scraper/saas-starter/packages/eslint-config/package.json`:

```json
{
  "name": "@repo/eslint-config",
  "version": "0.0.0",
  "private": true,
  "main": "base.js",
  "files": ["base.js", "nextjs.js", "react.js"],
  "dependencies": {
    "eslint": "^9.36.0",
    "eslint-plugin-unused-imports": "^4.2.0",
    "globals": "^16.4.0",
    "typescript-eslint": "^8.44.1",
    "@eslint/js": "^9.36.0"
  },
  "peerDependencies": {
    "eslint": "^9.0.0"
  }
}
```

**2.2.2 Create base.js**

Create `/Users/monsoft_solutions/monsoft/projects/business-scraper/saas-starter/packages/eslint-config/base.js`:

```javascript
import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import unusedImportsPlugin from 'eslint-plugin-unused-imports';

export default [
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      'unused-imports': unusedImportsPlugin,
      '@typescript-eslint': tseslint.plugin,
    },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'error',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
    },
  },
];
```

**2.2.3 Create nextjs.js**

Create `/Users/monsoft_solutions/monsoft/projects/business-scraper/saas-starter/packages/eslint-config/nextjs.js`:

```javascript
import baseConfig from './base.js';
import nextPlugin from '@next/eslint-plugin-next';
import pluginReactConfig from 'eslint-plugin-react/configs/recommended.js';

export default [
  ...baseConfig,
  pluginReactConfig,
  nextPlugin.configs.recommended,
  {
    rules: {
      'react/react-in-jsx-scope': 'off',
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
];
```

**2.2.4 Create react.js**

Create `/Users/monsoft_solutions/monsoft/projects/business-scraper/saas-starter/packages/eslint-config/react.js`:

```javascript
import baseConfig from './base.js';
import pluginReactConfig from 'eslint-plugin-react/configs/recommended.js';

export default [
  ...baseConfig,
  pluginReactConfig,
  {
    rules: {
      'react/react-in-jsx-scope': 'off',
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
];
```

#### Task 2.3: Create @repo/ui Package

**2.3.1 Create package.json**

Create `/Users/monsoft_solutions/monsoft/projects/business-scraper/saas-starter/packages/ui/package.json`:

```json
{
  "name": "@repo/ui",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./components/*": "./src/components/*.tsx",
    "./hooks/*": "./src/hooks/*.ts",
    "./lib/*": "./src/lib/*.ts",
    "./styles/*": "./src/styles/*.css"
  },
  "scripts": {
    "lint": "eslint . --max-warnings 0",
    "type-check": "tsc --noEmit",
    "clean": "rm -rf .turbo node_modules"
  },
  "dependencies": {
    "@radix-ui/react-avatar": "^1.1.10",
    "@radix-ui/react-collapsible": "^1.1.12",
    "@radix-ui/react-dialog": "^1.1.15",
    "@radix-ui/react-dropdown-menu": "^2.1.16",
    "@radix-ui/react-label": "^2.1.7",
    "@radix-ui/react-popover": "^1.1.15",
    "@radix-ui/react-radio-group": "^1.3.8",
    "@radix-ui/react-scroll-area": "^1.2.10",
    "@radix-ui/react-separator": "^1.1.7",
    "@radix-ui/react-slot": "^1.2.3",
    "@radix-ui/react-switch": "^1.2.6",
    "@radix-ui/react-tabs": "^1.1.13",
    "@radix-ui/react-toggle": "^1.1.10",
    "@radix-ui/react-toggle-group": "^1.1.11",
    "@tailwindcss/postcss": "4.1.7",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "cmdk": "^1.1.1",
    "lucide-react": "^0.511.0",
    "next-themes": "^0.4.6",
    "sonner": "^2.0.7",
    "tailwind-merge": "^3.3.1",
    "tailwindcss": "4.1.7",
    "tw-animate-css": "^1.4.0"
  },
  "peerDependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@repo/eslint-config": "workspace:*",
    "@repo/typescript-config": "workspace:*",
    "@types/react": "19.1.4",
    "@types/react-dom": "19.1.5",
    "eslint": "^9.36.0",
    "typescript": "^5.9.2"
  }
}
```

**2.3.2 Create components.json for UI package**

Create `/Users/monsoft_solutions/monsoft/projects/business-scraper/saas-starter/packages/ui/components.json`:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/styles/globals.css",
    "baseColor": "zinc",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@repo/ui/components",
    "utils": "@repo/ui/lib/utils",
    "ui": "@repo/ui/components",
    "lib": "@repo/ui/lib",
    "hooks": "@repo/ui/hooks"
  },
  "iconLibrary": "lucide"
}
```

**2.3.3 Move UI components**

```bash
# Move all shadcn/ui components to packages/ui/src/components
cp -r components/ui/* packages/ui/src/components/

# Move utility functions
mkdir -p packages/ui/src/lib
cp lib/utils.ts packages/ui/src/lib/utils.ts

# Move global styles
mkdir -p packages/ui/src/styles
cp app/globals.css packages/ui/src/styles/globals.css
cp styles/utilities.css packages/ui/src/styles/utilities.css
```

**2.3.4 Create index.ts for barrel exports**

Create `/Users/monsoft_solutions/monsoft/projects/business-scraper/saas-starter/packages/ui/src/index.ts`:

```typescript
// Re-export all components
export * from './components/alert';
export * from './components/avatar';
export * from './components/badge';
export * from './components/breadcrumb';
export * from './components/button';
export * from './components/card';
export * from './components/command';
export * from './components/dialog';
export * from './components/dropdown-menu';
export * from './components/input';
export * from './components/label';
export * from './components/popover';
export * from './components/radio-group';
export * from './components/scroll-area';
export * from './components/select';
export * from './components/separator';
export * from './components/sheet';
export * from './components/sidebar';
export * from './components/sonner';
export * from './components/switch';
export * from './components/tabs';
export * from './components/toggle';
export * from './components/toggle-group';

// Re-export utilities
export * from './lib/utils';
```

**2.3.5 Update import paths in UI components**

All components in `packages/ui/src/components/` need their imports updated:

**Before:**

```typescript
import { cn } from '@/lib/utils';
```

**After:**

```typescript
import { cn } from '@repo/ui/lib/utils';
```

This needs to be done for all 23 components.

**2.3.6 Create tsconfig.json for UI package**

Create `/Users/monsoft_solutions/monsoft/projects/business-scraper/saas-starter/packages/ui/tsconfig.json`:

```json
{
  "extends": "@repo/typescript-config/react-library.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@repo/ui/*": ["./src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**2.3.7 Create eslint.config.js for UI package**

Create `/Users/monsoft_solutions/monsoft/projects/business-scraper/saas-starter/packages/ui/eslint.config.js`:

```javascript
import reactConfig from '@repo/eslint-config/react.js';

export default [...reactConfig];
```

#### Validation

- [ ] All three packages have valid package.json files
- [ ] TypeScript configs are properly structured
- [ ] ESLint configs are properly structured
- [ ] UI package contains all 23 components
- [ ] UI package has proper exports in index.ts
- [ ] Import paths in UI components are updated
- [ ] Run `pnpm install` from root to link workspace packages

---

### Phase 3: Migrate Applications

**Objective:** Move the Next.js app and VitePress docs to the apps/ directory and update configurations.

**Estimated Time:** 4-5 hours
**Complexity:** High

#### Task 3.1: Migrate Next.js App to apps/web

**3.1.1 Create apps/web directory and move files**

```bash
# Create web app directory
mkdir -p apps/web

# Move Next.js app files
mv app apps/web/
mv public apps/web/
mv lib apps/web/
mv tests apps/web/
mv middleware.ts apps/web/
mv instrumentation.ts apps/web/
mv next.config.ts apps/web/
mv next-env.d.ts apps/web/

# Move configuration files
cp components.json apps/web/
mv .env* apps/web/ 2>/dev/null || true
mv drizzle.config.ts apps/web/
mv vitest.config.ts apps/web/

# Create a .gitignore for web app
cat > apps/web/.gitignore << 'EOF'
.next
.turbo
node_modules
.env.local
*.tsbuildinfo
coverage
EOF
```

**3.1.2 Create apps/web/package.json**

Create `/Users/monsoft_solutions/monsoft/projects/business-scraper/saas-starter/apps/web/package.json`:

```json
{
  "name": "web",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev --turbopack & pnpm stripe:listen & pnpm qstash:listen",
    "dev:local": "next dev --turbopack",
    "dev:staging": "dotenv -e .env.staging -- next dev --turbopack",
    "dev:prod": "dotenv -e .env.production -- next dev --turbopack",
    "build": "next build",
    "build:staging": "dotenv -e .env.staging -- next build",
    "build:prod": "dotenv -e .env.production -- next build",
    "start": "next start",
    "start:staging": "dotenv -e .env.staging -- next start",
    "start:prod": "dotenv -e .env.production -- next start",
    "db:setup": "tsx lib/db/setup.ts",
    "db:setup:staging": "dotenv -e .env.staging -- tsx lib/db/setup.ts",
    "db:setup:prod": "dotenv -e .env.production -- tsx lib/db/setup.ts",
    "db:seed": "tsx lib/db/seed.ts",
    "db:seed:staging": "dotenv -e .env.staging -- tsx lib/db/seed.ts",
    "db:seed:prod": "dotenv -e .env.production -- tsx lib/db/seed.ts",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:migrate:staging": "dotenv -e .env.staging -- drizzle-kit migrate",
    "db:migrate:prod": "dotenv -e .env.production -- drizzle-kit migrate",
    "db:studio": "drizzle-kit studio",
    "db:studio:staging": "dotenv -e .env.staging -- drizzle-kit studio",
    "db:studio:prod": "dotenv -e .env.production -- drizzle-kit studio",
    "lint": "prettier --check .",
    "lint:fix": "prettier --write .",
    "type-check": "tsc --noEmit",
    "test": "vitest run",
    "test:coverage": "vitest run --coverage",
    "preview:emails": "tsx scripts/preview-emails.ts",
    "stripe": "stripe listen --forward-to localhost:3000/api/stripe/webhook",
    "qstash:listen": "npx qstash dev",
    "stripe:listen": "stripe listen --forward-to localhost:3000/api/stripe/webhook",
    "clean": "rm -rf .next .turbo node_modules"
  },
  "dependencies": {
    "@paralleldrive/cuid2": "^2.2.2",
    "@react-email/components": "^0.5.5",
    "@react-email/render": "^1.3.1",
    "@repo/ui": "workspace:*",
    "@upstash/qstash": "^2.8.3",
    "@upstash/redis": "^1.35.4",
    "autoprefixer": "^10.4.21",
    "better-auth": "^1.3.18",
    "date-fns": "^4.1.0",
    "dotenv": "^16.6.1",
    "drizzle-kit": "^0.31.5",
    "drizzle-orm": "^0.43.1",
    "next": "15.5.4",
    "next-themes": "^0.4.6",
    "postcss": "^8.5.6",
    "postgres": "^3.4.7",
    "react": "19.1.0",
    "react-dom": "19.1.0",
    "resend": "^6.1.0",
    "server-only": "^0.0.1",
    "stripe": "^18.5.0",
    "svix": "^1.76.1",
    "swr": "^2.3.6",
    "winston": "^3.18.1",
    "winston-daily-rotate-file": "^5.0.0",
    "zod": "^3.25.76"
  },
  "devDependencies": {
    "@better-auth/cli": "^1.3.18",
    "@electric-sql/pglite": "^0.3.10",
    "@repo/eslint-config": "workspace:*",
    "@repo/typescript-config": "workspace:*",
    "@types/node": "^22.18.6",
    "@types/react": "19.1.4",
    "@types/react-dom": "19.1.5",
    "@vitest/coverage-v8": "2.1.9",
    "dotenv-cli": "^10.0.0",
    "eslint": "^9.36.0",
    "husky": "^9.1.7",
    "lint-staged": "^16.2.1",
    "prettier": "^3.6.2",
    "shadcn": "^3.3.1",
    "tsx": "^4.19.2",
    "typescript": "^5.9.2",
    "vitest": "^2.1.4"
  },
  "lint-staged": {
    "*.{js,jsx,ts,tsx,json,css,md}": ["prettier --write"],
    "*.{js,jsx,ts,tsx}": ["tsc --noEmit"]
  }
}
```

**3.1.3 Update apps/web/components.json**

Update `/Users/monsoft_solutions/monsoft/projects/business-scraper/saas-starter/apps/web/components.json`:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "app/globals.css",
    "baseColor": "zinc",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@repo/ui/components",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

**3.1.4 Create apps/web/tsconfig.json**

Create `/Users/monsoft_solutions/monsoft/projects/business-scraper/saas-starter/apps/web/tsconfig.json`:

```json
{
  "extends": "@repo/typescript-config/nextjs.json",
  "compilerOptions": {
    "baseUrl": ".",
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./*"],
      "@repo/ui": ["../../packages/ui/src"],
      "@repo/ui/*": ["../../packages/ui/src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

**3.1.5 Create apps/web/eslint.config.js**

Create `/Users/monsoft_solutions/monsoft/projects/business-scraper/saas-starter/apps/web/eslint.config.js`:

```javascript
import nextConfig from '@repo/eslint-config/nextjs.js';

export default [
  ...nextConfig,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "MemberExpression[object.type='MemberExpression'][object.object.name='auth'][object.property.name='api'][property.name='getSession']",
          message:
            'Direct auth.api.getSession() calls are forbidden. Use helpers from @/lib/auth/server-context instead.',
        },
      ],
    },
  },
  {
    files: ['**/lib/auth/server-context.ts'],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
];
```

**3.1.6 Update import paths in apps/web**

This is a critical step. All imports from `@/components/ui/*` need to be changed to `@repo/ui/components/*`.

**Files to update:**

- All files in `apps/web/app/`
- All files in `apps/web/lib/`
- All files in `apps/web/components/` (non-UI components)

**Search and replace pattern:**

```bash
# In apps/web directory
find . -type f \( -name "*.ts" -o -name "*.tsx" \) -not -path "./node_modules/*" -exec sed -i '' 's|@/components/ui/|@repo/ui/components/|g' {} +
```

**Example changes:**

Before:

```typescript
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
```

After:

```typescript
import { Button } from '@repo/ui/components/button';
import { Card } from '@repo/ui/components/card';
```

**3.1.7 Update apps/web/app/globals.css**

Update `/Users/monsoft_solutions/monsoft/projects/business-scraper/saas-starter/apps/web/app/globals.css`:

```css
@import '@repo/ui/styles/globals.css';
@import '@repo/ui/styles/utilities.css';
```

**3.1.8 Update next.config.ts**

Update `/Users/monsoft_solutions/monsoft/projects/business-scraper/saas-starter/apps/web/next.config.ts`:

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@repo/ui'],
  experimental: {
    optimizePackageImports: ['@repo/ui'],
  },
};

export default nextConfig;
```

#### Task 3.2: Migrate VitePress Docs to apps/docs

**3.2.1 Move docs to apps/docs**

```bash
# Move docs directory
mv docs apps/docs

# Create .gitignore for docs
cat > apps/docs/.gitignore << 'EOF'
.vitepress/dist
.vitepress/cache
.turbo
node_modules
EOF
```

**3.2.2 Create apps/docs/package.json**

Create `/Users/monsoft_solutions/monsoft/projects/business-scraper/saas-starter/apps/docs/package.json`:

```json
{
  "name": "docs",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "dev": "vitepress dev",
    "build": "vitepress build",
    "preview": "vitepress preview",
    "lint": "prettier --check .",
    "lint:fix": "prettier --write .",
    "clean": "rm -rf .vitepress/dist .vitepress/cache .turbo node_modules"
  },
  "dependencies": {
    "vitepress": "2.0.0-alpha.12"
  },
  "devDependencies": {
    "@repo/typescript-config": "workspace:*",
    "prettier": "^3.6.2"
  }
}
```

**3.2.3 Create apps/docs/tsconfig.json**

Create `/Users/monsoft_solutions/monsoft/projects/business-scraper/saas-starter/apps/docs/tsconfig.json`:

```json
{
  "extends": "@repo/typescript-config/base.json",
  "compilerOptions": {
    "lib": ["ESNext", "DOM"],
    "types": ["vitepress"]
  },
  "include": [".vitepress/**/*.ts", ".vitepress/**/*.mts"],
  "exclude": ["node_modules", ".vitepress/dist", ".vitepress/cache"]
}
```

#### Validation

- [ ] apps/web contains all Next.js app files
- [ ] apps/web/package.json has correct dependencies
- [ ] apps/web imports are updated to use @repo/ui
- [ ] apps/docs contains VitePress documentation
- [ ] apps/docs/package.json is configured
- [ ] All environment files are in apps/web
- [ ] Database configuration is in apps/web

---

### Phase 4: Configuration & Integration

**Objective:** Complete the integration by installing dependencies, updating scripts, and configuring caching.

**Estimated Time:** 2-3 hours
**Complexity:** Medium

#### Task 4.1: Install Dependencies

**4.1.1 Install root dependencies**

```bash
cd /Users/monsoft_solutions/monsoft/projects/business-scraper/saas-starter
pnpm install
```

This will:

- Install Turborepo at the root
- Link workspace packages
- Install dependencies for all apps and packages
- Create a unified pnpm-lock.yaml

**4.1.2 Verify workspace links**

```bash
# Check that packages are properly linked
pnpm list --depth=0 --filter=web
pnpm list --depth=0 --filter=@repo/ui
```

#### Task 4.2: Update Root Scripts

**4.2.1 Update root package.json scripts**

Update `/Users/monsoft_solutions/monsoft/projects/business-scraper/saas-starter/package.json` to include convenience scripts:

```json
{
  "name": "saas-starter-monorepo",
  "version": "1.0.0",
  "private": true,
  "packageManager": "pnpm@9.15.4+sha512.b2dc20e2fc72b3e18848459b37359a32064663e5627a51e4c74b2c29dd8e8e0491483c3abb40789cfd578bf362fb6ba8261b05f0387d76792ed6e23ea3b1b6a0",
  "scripts": {
    "dev": "turbo run dev",
    "dev:web": "turbo run dev --filter=web",
    "dev:docs": "turbo run dev --filter=docs",
    "build": "turbo run build",
    "build:web": "turbo run build --filter=web",
    "build:docs": "turbo run build --filter=docs",
    "build:staging": "turbo run build:staging --filter=web",
    "build:prod": "turbo run build:prod --filter=web",
    "start": "turbo run start --filter=web",
    "start:staging": "turbo run start:staging --filter=web",
    "start:prod": "turbo run start:prod --filter=web",
    "db:setup": "turbo run db:setup --filter=web",
    "db:setup:staging": "turbo run db:setup:staging --filter=web",
    "db:setup:prod": "turbo run db:setup:prod --filter=web",
    "db:migrate": "turbo run db:migrate --filter=web",
    "db:migrate:staging": "turbo run db:migrate:staging --filter=web",
    "db:migrate:prod": "turbo run db:migrate:prod --filter=web",
    "db:seed": "turbo run db:seed --filter=web",
    "db:studio": "turbo run db:studio --filter=web",
    "lint": "turbo run lint",
    "lint:fix": "turbo run lint:fix",
    "type-check": "turbo run type-check",
    "test": "turbo run test",
    "test:coverage": "turbo run test:coverage",
    "clean": "turbo run clean && rm -rf node_modules .turbo",
    "format": "prettier --write \"**/*.{ts,tsx,md,json}\"",
    "turbo:prune": "turbo prune --scope=web --docker"
  },
  "devDependencies": {
    "turbo": "latest",
    "prettier": "^3.6.2"
  }
}
```

#### Task 4.3: Configure Turborepo Caching

**4.3.1 Update turbo.json with optimized caching**

Update `/Users/monsoft_solutions/monsoft/projects/business-scraper/saas-starter/turbo.json`:

```json
{
  "$schema": "https://turbo.build/schema.json",
  "ui": "tui",
  "globalDependencies": [
    "**/.env.*local",
    "**/.env.development",
    "**/.env.staging",
    "**/.env.production"
  ],
  "globalEnv": ["NODE_ENV", "VERCEL_ENV", "CI"],
  "globalPassThroughEnv": [
    "POSTGRES_URL",
    "BETTER_AUTH_SECRET",
    "BETTER_AUTH_URL",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "RESEND_API_KEY",
    "RESEND_FROM_EMAIL",
    "BASE_URL",
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "FACEBOOK_CLIENT_ID",
    "FACEBOOK_CLIENT_SECRET",
    "LINKEDIN_CLIENT_ID",
    "LINKEDIN_CLIENT_SECRET",
    "TIKTOK_CLIENT_KEY",
    "TIKTOK_CLIENT_SECRET",
    "UPSTASH_REDIS_REST_URL",
    "UPSTASH_REDIS_REST_TOKEN",
    "QSTASH_CURRENT_SIGNING_KEY",
    "QSTASH_NEXT_SIGNING_KEY",
    "QSTASH_TOKEN"
  ],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": [
        "$TURBO_DEFAULT$",
        ".env.production",
        ".env.staging",
        ".env.development"
      ],
      "outputs": [".next/**", "!.next/cache/**", ".vitepress/dist/**"],
      "env": [
        "POSTGRES_URL",
        "BETTER_AUTH_SECRET",
        "BETTER_AUTH_URL",
        "STRIPE_SECRET_KEY",
        "NEXT_PUBLIC_*"
      ]
    },
    "build:staging": {
      "dependsOn": ["^build"],
      "inputs": ["$TURBO_DEFAULT$", ".env.staging"],
      "outputs": [".next/**", "!.next/cache/**"],
      "cache": true
    },
    "build:prod": {
      "dependsOn": ["^build"],
      "inputs": ["$TURBO_DEFAULT$", ".env.production"],
      "outputs": [".next/**", "!.next/cache/**"],
      "cache": true
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "dev:local": {
      "cache": false,
      "persistent": true
    },
    "dev:staging": {
      "cache": false,
      "persistent": true
    },
    "dev:prod": {
      "cache": false,
      "persistent": true
    },
    "start": {
      "cache": false,
      "persistent": true
    },
    "start:staging": {
      "cache": false,
      "persistent": true
    },
    "start:prod": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^lint"],
      "outputs": [],
      "inputs": [
        "**/*.ts",
        "**/*.tsx",
        "**/*.js",
        "**/*.jsx",
        "eslint.config.js",
        ".eslintrc.json"
      ]
    },
    "lint:fix": {
      "cache": false,
      "outputs": []
    },
    "type-check": {
      "dependsOn": ["^type-check"],
      "outputs": ["*.tsbuildinfo"],
      "inputs": ["**/*.ts", "**/*.tsx", "tsconfig.json"]
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"],
      "inputs": [
        "**/*.test.ts",
        "**/*.test.tsx",
        "**/*.spec.ts",
        "vitest.config.ts"
      ]
    },
    "test:coverage": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"],
      "cache": false
    },
    "db:generate": {
      "cache": false
    },
    "db:migrate": {
      "cache": false
    },
    "db:migrate:staging": {
      "cache": false
    },
    "db:migrate:prod": {
      "cache": false
    },
    "db:seed": {
      "cache": false
    },
    "db:seed:staging": {
      "cache": false
    },
    "db:seed:prod": {
      "cache": false
    },
    "db:setup": {
      "cache": false
    },
    "db:setup:staging": {
      "cache": false
    },
    "db:setup:prod": {
      "cache": false
    },
    "db:studio": {
      "cache": false,
      "persistent": true
    },
    "db:studio:staging": {
      "cache": false,
      "persistent": true
    },
    "db:studio:prod": {
      "cache": false,
      "persistent": true
    },
    "clean": {
      "cache": false
    }
  }
}
```

**4.3.2 Create .turbo directory in .gitignore**

Ensure `.turbo` is ignored:

```bash
echo ".turbo" >> /Users/monsoft_solutions/monsoft/projects/business-scraper/saas-starter/.gitignore
```

#### Task 4.4: Update Environment Variable Handling

**4.4.1 Document environment variable locations**

Create `/Users/monsoft_solutions/monsoft/projects/business-scraper/saas-starter/ENV_MIGRATION.md`:

```markdown
# Environment Variables Migration

## Before (Single Package)

- `.env.local` - Local development (root)
- `.env.development` - Development (root)
- `.env.staging` - Staging (root)
- `.env.production` - Production (root)

## After (Monorepo)

- `apps/web/.env.local` - Local development
- `apps/web/.env.development` - Development
- `apps/web/.env.staging` - Staging
- `apps/web/.env.production` - Production

## Notes

- All env files are now in `apps/web/`
- Next.js automatically loads env files from the app directory
- Turborepo passes through env vars via `globalPassThroughEnv` in turbo.json
- Database scripts use env files from `apps/web/`
```

**4.4.2 Update environment file examples**

Copy example files to apps/web:

```bash
cp .env.example apps/web/.env.example
cp .env.local.example apps/web/.env.local.example
```

#### Task 4.5: Update Husky Git Hooks

**4.5.1 Update pre-commit hook**

Update `/Users/monsoft_solutions/monsoft/projects/business-scraper/saas-starter/.husky/pre-commit`:

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Run lint-staged only for web app
cd apps/web && npx lint-staged
```

#### Validation

- [ ] `pnpm install` completes successfully
- [ ] Workspace packages are properly linked
- [ ] Root scripts are updated
- [ ] turbo.json has optimized caching
- [ ] Environment files are documented
- [ ] Husky hooks are updated

---

### Phase 5: Testing & Validation

**Objective:** Thoroughly test all functionality to ensure the migration is successful and nothing is broken.

**Estimated Time:** 2-3 hours
**Complexity:** Medium

#### Task 5.1: Verify Build System

**5.1.1 Test development mode**

```bash
# From root directory
cd /Users/monsoft_solutions/monsoft/projects/business-scraper/saas-starter

# Test web app dev
pnpm dev:web

# Verify:
# - App runs on localhost:3000
# - Hot reload works
# - No import errors
# - UI components render correctly

# Test docs dev
pnpm dev:docs

# Verify:
# - Docs run on localhost:5173
# - All pages load
# - Navigation works
```

**5.1.2 Test production build**

```bash
# Build all apps
pnpm build

# Verify:
# - web app builds successfully
# - docs build successfully
# - No TypeScript errors
# - No missing dependencies

# Test production start
pnpm start

# Verify:
# - App runs in production mode
# - All pages accessible
```

**5.1.3 Test multi-environment builds**

```bash
# Test staging build
pnpm build:staging

# Test production build
pnpm build:prod

# Verify:
# - Builds complete without errors
# - Correct env vars are loaded
```

#### Task 5.2: Verify Type Checking

**5.2.1 Run type checking**

```bash
# Type check all workspaces
pnpm type-check

# Verify:
# - No TypeScript errors
# - All imports resolve correctly
# - Workspace packages are properly typed
```

#### Task 5.3: Verify Linting

**5.3.1 Run linting**

```bash
# Lint all workspaces
pnpm lint

# Fix any issues
pnpm lint:fix

# Verify:
# - No linting errors
# - ESLint configs work correctly
# - Custom rules are applied
```

#### Task 5.4: Verify Testing

**5.4.1 Run tests**

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test:coverage

# Verify:
# - All tests pass
# - Test imports work correctly
# - Coverage reports generate
```

#### Task 5.5: Verify Database Operations

**5.5.1 Test database commands**

```bash
# Test database setup
pnpm db:setup

# Test migrations
pnpm db:migrate

# Test seeding
pnpm db:seed

# Test Drizzle Studio
pnpm db:studio

# Verify:
# - All DB commands work
# - Connections succeed
# - Migrations apply correctly
```

#### Task 5.6: Verify shadcn CLI

**5.6.1 Test adding a new component**

```bash
# Navigate to web app
cd apps/web

# Try adding a component
pnpm dlx shadcn@canary add checkbox

# Verify:
# - Component is added to correct location
# - Imports are updated correctly
# - Component works in the app
```

#### Task 5.7: Verify Turborepo Caching

**5.7.1 Test cache functionality**

```bash
# Clean build
pnpm clean
pnpm build

# Note build time

# Rebuild without changes
pnpm build

# Verify:
# - Second build is much faster (cache hit)
# - Turbo shows cache statistics
# - Outputs are properly cached

# Check cache
turbo run build --dry-run=json
```

#### Task 5.8: End-to-End Application Testing

**5.8.1 Test core features**

Manual testing checklist:

- [ ] Authentication
  - [ ] Sign up works
  - [ ] Sign in works
  - [ ] Social auth works (if configured)
  - [ ] Session management works

- [ ] UI Components
  - [ ] All shadcn components render
  - [ ] Tailwind CSS v4 styles apply
  - [ ] Dark mode toggle works
  - [ ] Responsive design works

- [ ] Stripe Integration
  - [ ] Checkout flow works
  - [ ] Webhooks receive events
  - [ ] Customer portal works
  - [ ] Subscription status updates

- [ ] Database
  - [ ] CRUD operations work
  - [ ] Migrations apply
  - [ ] Activity logging works

- [ ] Email System
  - [ ] Emails send correctly
  - [ ] Templates render
  - [ ] Email preview works

**5.8.2 Test environment switching**

```bash
# Test local development
pnpm dev:web

# Test staging
pnpm dev:staging

# Test production
pnpm dev:prod

# Verify:
# - Correct env vars load
# - Different databases/services connect
# - No env var leakage
```

#### Task 5.9: Documentation Review

**5.9.1 Update project documentation**

Update the following files:

- `/Users/monsoft_solutions/monsoft/projects/business-scraper/saas-starter/README.md`
  - Add monorepo structure explanation
  - Update getting started instructions
  - Add workspace commands
  - Update directory structure diagram

- `/Users/monsoft_solutions/monsoft/projects/business-scraper/saas-starter/CLAUDE.md`
  - Update development commands
  - Add monorepo-specific guidelines
  - Update import path conventions
  - Add package management instructions

- `/Users/monsoft_solutions/monsoft/projects/business-scraper/saas-starter/apps/docs/README.md`
  - Add monorepo migration notes
  - Update architecture documentation
  - Add new workspace structure

**5.9.2 Create migration guide**

Create `/Users/monsoft_solutions/monsoft/projects/business-scraper/saas-starter/MONOREPO_MIGRATION_GUIDE.md`:

```markdown
# Monorepo Migration Guide

This document explains the monorepo structure and how to work with it.

## Structure

- `apps/web` - Next.js application
- `apps/docs` - VitePress documentation
- `packages/ui` - Shared UI components
- `packages/typescript-config` - Shared TypeScript configs
- `packages/eslint-config` - Shared ESLint configs

## Common Commands

[List common commands with examples]

## Adding Dependencies

[Explain how to add dependencies to different workspaces]

## Working with shadcn/ui

[Explain shadcn CLI usage in monorepo]

## Troubleshooting

[Common issues and solutions]
```

#### Validation Checklist

- [ ] Development mode works for all apps
- [ ] Production builds complete successfully
- [ ] Multi-environment builds work
- [ ] Type checking passes
- [ ] Linting passes
- [ ] All tests pass
- [ ] Database operations work
- [ ] shadcn CLI works correctly
- [ ] Turborepo caching is effective
- [ ] All core features work
- [ ] Environment switching works
- [ ] Documentation is updated

---

## Folder Structure

### Complete Final Structure

```
saas-starter/
├── .git/
├── .github/
│   └── workflows/
├── .husky/
│   └── pre-commit
├── .turbo/                           # Turborepo cache (gitignored)
├── apps/
│   ├── web/                          # Next.js application
│   │   ├── app/                      # App Router pages
│   │   │   ├── (app)/               # Protected routes
│   │   │   ├── (login)/             # Auth routes
│   │   │   ├── (public)/            # Public routes
│   │   │   ├── actions/             # Server actions
│   │   │   ├── api/                 # API routes
│   │   │   ├── globals.css
│   │   │   ├── layout.tsx
│   │   │   └── ...
│   │   ├── components/              # App-specific components
│   │   ├── lib/                     # App-specific logic
│   │   │   ├── auth/
│   │   │   ├── db/
│   │   │   ├── payments/
│   │   │   ├── email/
│   │   │   └── ...
│   │   ├── public/
│   │   ├── scripts/
│   │   ├── tests/
│   │   ├── .env.local               # Local development (gitignored)
│   │   ├── .env.development         # Development config
│   │   ├── .env.staging             # Staging config
│   │   ├── .env.production          # Production config
│   │   ├── .env.example
│   │   ├── .env.local.example
│   │   ├── components.json          # shadcn config
│   │   ├── drizzle.config.ts
│   │   ├── eslint.config.js
│   │   ├── instrumentation.ts
│   │   ├── middleware.ts
│   │   ├── next.config.ts
│   │   ├── next-env.d.ts
│   │   ├── package.json
│   │   ├── postcss.config.mjs
│   │   ├── tsconfig.json
│   │   └── vitest.config.ts
│   │
│   └── docs/                        # VitePress documentation
│       ├── .vitepress/
│       │   ├── cache/
│       │   ├── config.mts
│       │   └── ...
│       ├── auth/
│       ├── stripe/
│       ├── cache/
│       ├── async-job-processing/
│       ├── *.md
│       ├── package.json
│       └── tsconfig.json
│
├── packages/
│   ├── ui/                          # Shared UI components package
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── alert.tsx
│   │   │   │   ├── avatar.tsx
│   │   │   │   ├── badge.tsx
│   │   │   │   ├── breadcrumb.tsx
│   │   │   │   ├── button.tsx
│   │   │   │   ├── card.tsx
│   │   │   │   ├── command.tsx
│   │   │   │   ├── dialog.tsx
│   │   │   │   ├── dropdown-menu.tsx
│   │   │   │   ├── input.tsx
│   │   │   │   ├── label.tsx
│   │   │   │   ├── popover.tsx
│   │   │   │   ├── radio-group.tsx
│   │   │   │   ├── scroll-area.tsx
│   │   │   │   ├── select.tsx
│   │   │   │   ├── separator.tsx
│   │   │   │   ├── sheet.tsx
│   │   │   │   ├── sidebar.tsx
│   │   │   │   ├── sonner.tsx
│   │   │   │   ├── switch.tsx
│   │   │   │   ├── tabs.tsx
│   │   │   │   ├── toggle.tsx
│   │   │   │   └── toggle-group.tsx
│   │   │   ├── hooks/
│   │   │   │   └── use-mobile.ts
│   │   │   ├── lib/
│   │   │   │   └── utils.ts
│   │   │   ├── styles/
│   │   │   │   ├── globals.css
│   │   │   │   └── utilities.css
│   │   │   └── index.ts            # Barrel exports
│   │   ├── components.json
│   │   ├── eslint.config.js
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── typescript-config/           # Shared TypeScript configs
│   │   ├── base.json
│   │   ├── nextjs.json
│   │   ├── react-library.json
│   │   └── package.json
│   │
│   └── eslint-config/               # Shared ESLint configs
│       ├── base.js
│       ├── nextjs.js
│       ├── react.js
│       └── package.json
│
├── node_modules/                    # Shared node_modules (hoisted)
├── .gitignore
├── .prettierrc
├── CLAUDE.md
├── ENV_MIGRATION.md                 # Environment migration docs
├── LICENSE
├── MONOREPO_MIGRATION_GUIDE.md      # Monorepo usage guide
├── package.json                     # Root package.json
├── pnpm-lock.yaml                   # Unified lockfile
├── pnpm-workspace.yaml              # Workspace definition
├── README.md
├── tsconfig.json                    # Root TypeScript config
└── turbo.json                       # Turborepo config
```

---

## Configuration Changes

### Root Configuration Files

**package.json**

- Changed from app-specific to monorepo root
- Scripts use Turborepo filters
- Contains only root-level devDependencies

**pnpm-workspace.yaml** (new)

- Defines workspace packages
- Enables pnpm workspace features

**turbo.json** (new)

- Defines build pipeline
- Configures task dependencies
- Sets up caching strategies
- Declares environment variables

**tsconfig.json**

- Minimal root config
- Workspaces extend it

### Apps Configuration

**apps/web/package.json**

- Contains Next.js dependencies
- Depends on `@repo/ui`, `@repo/typescript-config`, `@repo/eslint-config`
- Preserves all original scripts

**apps/web/tsconfig.json**

- Extends `@repo/typescript-config/nextjs.json`
- Adds workspace package paths

**apps/web/next.config.ts**

- Adds `transpilePackages: ['@repo/ui']`
- Enables optimized package imports

**apps/docs/package.json**

- Contains VitePress dependencies
- Minimal dependencies

### Packages Configuration

**packages/ui/package.json**

- Uses `exports` field for granular imports
- Defines peer dependencies (React)
- Uses workspace dependencies

**packages/ui/tsconfig.json**

- Extends `@repo/typescript-config/react-library.json`
- Enables composite builds

**packages/typescript-config/\***

- Reusable TypeScript configurations
- Base, Next.js, and React library variants

**packages/eslint-config/\***

- Reusable ESLint configurations
- Base, Next.js, and React variants

---

## Risk Assessment

### Potential Challenges & Mitigation Strategies

#### 1. Import Path Breakage

**Risk Level:** High
**Impact:** Application won't compile

**Mitigation:**

- Systematic search and replace of import paths
- Use TypeScript compiler to identify missing imports
- Test each section of the app after migration
- Create a rollback plan

**Rollback:**

- Git branch allows easy revert: `git checkout master`

#### 2. Environment Variable Issues

**Risk Level:** Medium
**Impact:** Runtime errors, missing config

**Mitigation:**

- Document all environment variables
- Test each environment (local, staging, production)
- Verify Turborepo passes through env vars correctly
- Use `.env.example` files as reference

**Fallback:**

- Keep original env files as backup
- Document env variable locations clearly

#### 3. Build Performance Regression

**Risk Level:** Low
**Impact:** Slower builds

**Mitigation:**

- Configure Turborepo caching properly
- Use `turbo run build --dry-run=json` to verify cache hits
- Optimize task dependencies
- Monitor build times before/after

**Optimization:**

- Adjust `turbo.json` caching strategies
- Use remote caching if needed

#### 4. Type Resolution Issues

**Risk Level:** Medium
**Impact:** TypeScript errors

**Mitigation:**

- Use composite TypeScript projects
- Configure proper path mappings
- Test type checking after each phase
- Use `skipLibCheck` if necessary (temporarily)

**Resolution:**

- Check tsconfig.json paths
- Verify workspace package TypeScript exports
- Rebuild composite projects

#### 5. Dependency Conflicts

**Risk Level:** Medium
**Impact:** Runtime errors, duplicate packages

**Mitigation:**

- Use pnpm's strict dependency resolution
- Define peer dependencies correctly
- Use `pnpm list` to verify installations
- Check for duplicate packages

**Resolution:**

- Use pnpm's `overrides` field if needed
- Ensure compatible versions across workspaces

#### 6. shadcn CLI Compatibility

**Risk Level:** Low
**Impact:** Can't add new components

**Mitigation:**

- Test shadcn CLI before full migration
- Ensure `components.json` is properly configured
- Verify import aliases work
- Document shadcn usage in monorepo

**Fallback:**

- Manually copy components if CLI fails
- Update import paths manually

#### 7. Database Migration Issues

**Risk Level:** Low
**Impact:** DB operations fail

**Mitigation:**

- Keep `drizzle.config.ts` in `apps/web`
- Test all DB commands after migration
- Verify env vars are loaded correctly
- Backup database before testing

**Resolution:**

- Check working directory for DB scripts
- Verify env file paths

---

## Success Metrics

### Quantitative Metrics

1. **Build Performance**
   - First build: Baseline time
   - Cached build: Should be >80% faster
   - Target: < 10 seconds for cached builds

2. **Type Checking**
   - Zero TypeScript errors
   - All imports resolve correctly
   - Workspace types properly inferred

3. **Test Coverage**
   - Maintain existing coverage percentage
   - All tests pass
   - No test flakiness introduced

4. **Code Quality**
   - Zero linting errors (after lint:fix)
   - Prettier formatting consistent
   - No console errors in development

### Qualitative Metrics

1. **Developer Experience**
   - Commands are intuitive
   - Documentation is clear
   - Adding new features is easier
   - Workspace navigation is logical

2. **Maintainability**
   - Shared code is reusable
   - Dependencies are properly scoped
   - Configuration is centralized
   - Codebase is more organized

3. **Scalability**
   - Easy to add new apps
   - Easy to add new packages
   - Clear patterns to follow
   - Minimal cross-package coupling

### Validation Checklist

- [ ] All original functionality works
- [ ] Build times are improved (or same)
- [ ] All tests pass
- [ ] Type checking succeeds
- [ ] Linting succeeds
- [ ] Multi-environment support works
- [ ] Database operations work
- [ ] Authentication works
- [ ] Stripe integration works
- [ ] Email system works
- [ ] Documentation site works
- [ ] shadcn CLI works
- [ ] Development experience is good
- [ ] Code is well-organized
- [ ] Dependencies are optimized

---

## References

### Official Documentation

- **Turborepo Documentation:** https://turborepo.com/docs
  - Getting Started: https://turborepo.com/docs/getting-started/add-to-existing-repository
  - Structuring Repository: https://turborepo.com/docs/crafting-your-repository/structuring-a-repository
  - Task Configuration: https://turborepo.com/docs/core-concepts/monorepos/running-tasks
  - Caching: https://turborepo.com/docs/core-concepts/caching

- **pnpm Workspaces:** https://pnpm.io/workspaces
  - Workspace Protocol: https://pnpm.io/workspaces#workspace-protocol-workspace
  - Workspace Commands: https://pnpm.io/cli/add#--filter-package_name

- **shadcn/ui Monorepo:** https://ui.shadcn.com/docs/monorepo
  - Setup Guide: https://ui.shadcn.com/docs/monorepo#setup
  - CLI Usage: https://ui.shadcn.com/docs/cli

- **Tailwind CSS v4:** https://tailwindcss.com/docs
  - Monorepo Setup: https://turborepo.com/docs/guides/tools/tailwind

### Example Repositories

- **Turborepo Design System Example:** https://github.com/vercel/turborepo/tree/main/examples/design-system
- **shadcn/ui Turborepo Starter:** https://github.com/dan5py/turborepo-shadcn-ui
- **Next.js Monorepo Template:** https://vercel.com/templates/next.js/monorepo-turborepo

### Best Practices Articles

- **Nhost Monorepo Setup:** https://nhost.io/blog/how-we-configured-pnpm-and-turborepo-for-our-monorepo
- **Complete Monorepo Guide 2025:** https://jsdev.space/complete-monorepo-guide/
- **Setting up Tailwind CSS v4 in Turbo Monorepo:** https://medium.com/@philippbtrentmann/setting-up-tailwind-css-v4-in-a-turbo-monorepo-7688f3193039

### Internal Documentation

After migration, refer to:

- `/Users/monsoft_solutions/monsoft/projects/business-scraper/saas-starter/MONOREPO_MIGRATION_GUIDE.md`
- `/Users/monsoft_solutions/monsoft/projects/business-scraper/saas-starter/ENV_MIGRATION.md`
- `/Users/monsoft_solutions/monsoft/projects/business-scraper/saas-starter/CLAUDE.md`
- `/Users/monsoft_solutions/monsoft/projects/business-scraper/saas-starter/apps/docs/README.md`

---

## Post-Migration Tasks

### Immediate (After Phase 5)

1. **Update CI/CD Pipelines**
   - Update GitHub Actions workflows for monorepo
   - Add Turborepo caching to CI
   - Update deployment scripts

2. **Update Deployment Configuration**
   - Vercel: Add `turbo.json` configuration
   - Railway: Update build commands
   - Docker: Create multi-stage builds for apps

3. **Team Onboarding**
   - Share migration guide with team
   - Conduct code walkthrough
   - Update development setup docs
   - Create troubleshooting guide

### Short-term (1-2 weeks)

1. **Optimize Caching**
   - Monitor cache hit rates
   - Fine-tune `turbo.json` configuration
   - Consider remote caching (Vercel Remote Cache)

2. **Add More Shared Packages**
   - Consider creating `@repo/database` for Drizzle schemas
   - Consider creating `@repo/email` for email templates
   - Consider creating `@repo/utils` for shared utilities

3. **Improve Documentation**
   - Add JSDoc comments to shared packages
   - Create Storybook for UI components (optional)
   - Document architectural decisions

### Long-term (1-3 months)

1. **Performance Monitoring**
   - Track build times
   - Monitor bundle sizes
   - Optimize dependencies

2. **Developer Experience Improvements**
   - Add custom Turborepo generators
   - Create scripts for common tasks
   - Improve error messages

3. **Continuous Improvement**
   - Refactor based on team feedback
   - Add more automation
   - Update to latest Turborepo features

---

## Appendix A: Command Reference

### Development Commands

```bash
# Start all apps in development mode
pnpm dev

# Start specific app
pnpm dev:web
pnpm dev:docs

# Start with specific environment
pnpm --filter=web dev:staging
pnpm --filter=web dev:prod
```

### Build Commands

```bash
# Build all apps
pnpm build

# Build specific app
pnpm build:web
pnpm build:docs

# Build with specific environment
pnpm build:staging
pnpm build:prod
```

### Database Commands

```bash
# Database setup
pnpm db:setup
pnpm db:setup:staging
pnpm db:setup:prod

# Migrations
pnpm db:migrate
pnpm db:migrate:staging
pnpm db:migrate:prod

# Seeding
pnpm db:seed

# Drizzle Studio
pnpm db:studio
```

### Testing & Quality Commands

```bash
# Run tests
pnpm test
pnpm test:coverage

# Type checking
pnpm type-check

# Linting
pnpm lint
pnpm lint:fix

# Formatting
pnpm format
```

### Workspace Commands

```bash
# Add dependency to specific workspace
pnpm add <package> --filter=web
pnpm add <package> --filter=@repo/ui

# Remove dependency
pnpm remove <package> --filter=web

# List workspace packages
pnpm list --depth=0

# Run command in specific workspace
pnpm --filter=web <command>
```

### Turborepo Commands

```bash
# Run task across all workspaces
turbo run build
turbo run test

# Run task for specific workspace
turbo run build --filter=web

# Clear Turborepo cache
turbo run clean
rm -rf .turbo

# Dry run (see what would be cached)
turbo run build --dry-run=json

# Force run without cache
turbo run build --force
```

---

## Appendix B: Troubleshooting Guide

### Issue: Import errors after migration

**Symptoms:**

- "Cannot find module '@/components/ui/button'"
- TypeScript errors about missing imports

**Solution:**

1. Check if import was updated to `@repo/ui/components/button`
2. Verify `tsconfig.json` paths are correct
3. Restart TypeScript server in your IDE
4. Run `pnpm install` to ensure packages are linked

### Issue: Environment variables not loading

**Symptoms:**

- "process.env.VARIABLE is undefined"
- Database connection fails

**Solution:**

1. Ensure env files are in `apps/web/`
2. Check `turbo.json` has variable in `globalPassThroughEnv`
3. Verify dotenv-cli is used for staging/prod
4. Restart development server

### Issue: Turborepo cache not working

**Symptoms:**

- Builds are always slow
- No cache hits shown

**Solution:**

1. Check `turbo.json` outputs are correct
2. Verify `.turbo` directory exists
3. Try clearing cache: `rm -rf .turbo && pnpm build`
4. Check for gitignored files affecting cache keys

### Issue: Type errors in workspace packages

**Symptoms:**

- "Cannot find type definition for module '@repo/ui'"
- Types not available for imported components

**Solution:**

1. Ensure package has `types` field in package.json
2. Check `tsconfig.json` includes workspace package paths
3. Run `pnpm type-check` to see detailed errors
4. Verify composite project configuration

### Issue: shadcn CLI not working

**Symptoms:**

- "Failed to add component"
- Components added to wrong location

**Solution:**

1. Check `components.json` aliases are correct
2. Ensure you're in the correct directory (`apps/web`)
3. Verify UI package structure matches expected layout
4. Update shadcn CLI: `pnpm add -g shadcn@canary`

### Issue: Slow pnpm install

**Symptoms:**

- Installation takes very long
- Frequent network requests

**Solution:**

1. Check pnpm store location
2. Use pnpm cache: `pnpm store prune`
3. Verify lockfile is committed
4. Consider using a pnpm mirror

### Issue: Husky hooks not running

**Symptoms:**

- Pre-commit hook doesn't run
- Lint-staged doesn't execute

**Solution:**

1. Reinstall Husky: `pnpm dlx husky install`
2. Check hook file has execute permissions
3. Verify working directory in hook script
4. Check `lint-staged` configuration

---

## Appendix C: Migration Rollback Plan

If critical issues arise during migration, follow this rollback procedure:

### Step 1: Immediate Rollback

```bash
# Checkout master branch
git checkout master

# Create backup branch of migration attempt
git branch migration-backup-$(date +%Y%m%d)

# Force clean working directory
git reset --hard HEAD
git clean -fdx

# Reinstall dependencies
pnpm install

# Verify app works
pnpm dev
```

### Step 2: Identify Issues

1. Document what went wrong
2. Note which phase failed
3. Identify specific errors
4. Check logs and error messages

### Step 3: Plan Fix

1. Review this implementation plan
2. Identify root cause
3. Determine if issue is fixable
4. Decide: retry migration or wait

### Step 4: Retry Migration (Optional)

```bash
# Start fresh migration
git checkout -b feature/turborepo-migration-retry

# Follow implementation plan from beginning
# Address identified issues
# Proceed more carefully through failed phase
```

---

## Notes

- This migration is reversible until the feature branch is merged
- Each phase builds on the previous one - complete phases in order
- Test thoroughly after each phase before proceeding
- Keep the original branch as backup until migration is validated
- Consider doing the migration during low-traffic period
- Communicate with team members about the migration timeline
- Be prepared to spend time on debugging import paths and dependencies

---

**End of Implementation Plan**

This plan should be executed by the `software-engineer` agent with careful attention to each phase's validation steps. If any phase fails validation, stop and resolve issues before proceeding to the next phase.
