# SaaS Starter Documentation

This directory contains the complete standalone documentation for the SaaS Starter project - a Next.js application with BetterAuth, Stripe integration, and modern UI components.

## 🚀 Quick Start

### Prerequisites

- **Node.js**: Version 22.18.8 or later (specified in `.nvmrc`)
- **Package Manager**: pnpm (version 9.15.4 or later)

### Installation

1. **Navigate to the docs directory:**

   ```bash
   cd docs
   ```

2. **Install dependencies:**

   ```bash
   pnpm install
   ```

3. **Start the development server:**

   ```bash
   pnpm dev
   ```

4. **Open your browser:**
   Navigate to `http://localhost:5173` to view the documentation.

## 📝 Available Scripts

- `pnpm dev` - Start the development server with hot reload
- `pnpm build` - Build the documentation for production
- `pnpm preview` - Preview the production build locally
- `pnpm lint` - Check code formatting
- `pnpm lint:fix` - Fix code formatting issues
- `pnpm type-check` - Run TypeScript type checking

## 📚 Documentation Structure

The documentation is organized into the following sections:

### Getting Started

- **Overview** - Project overview and architecture
- **Quick Start** - Getting started guide
- **Environment Configuration** - Environment setup and configuration

### Core Features

- **Authentication** - Server authorization, actions, hooks, and OAuth setup
- **API Architecture** - Type-safe API client, handlers, validation, and server actions
- **Admin Space** - Admin panel features and API reference
- **Payments** - Stripe integration, webhooks, checkout, and billing portal

### Infrastructure

- **Cache System** - Redis/Upstash cache configuration and usage
- **Background Jobs** - Async job processing system
- **Logging** - Logging system and configuration
- **Configuration** - Environment and application configuration

### Development

- **Design System** - UI component system and design tokens
- **Unit Testing** - Testing setup and best practices
- **Email System** - Email sending and templates

## 🎨 Features

- **Modern UI** - Built with shadcn/ui components and Tailwind CSS
- **Dark Mode** - Automatic theme switching support
- **Search** - Local search functionality for finding content
- **Mobile Responsive** - Optimized for all screen sizes
- **GitHub Integration** - Edit links for contributing to documentation

## 🔧 Configuration

The VitePress configuration is located in `.vitepress/config.mts`. You can customize:

- **Site metadata** - Title, description, and social links
- **Navigation** - Menu structure and sidebar organization
- **Theme** - Styling and layout customization
- **GitHub integration** - Repository links and edit functionality

## 📖 Writing Guidelines

### Adding New Pages

1. Create a new markdown file in the appropriate section
2. Add frontmatter metadata:

   ```yaml
   ---
   title: Your Page Title
   description: Brief description for SEO
   ---
   ```

3. Update the sidebar configuration in `.vitepress/config.mts`

### Markdown Features

VitePress supports enhanced markdown features:

- **Vue Components** - Embed Vue components in markdown
- **Code Highlighting** - Syntax highlighting for all major languages
- **Math Expressions** - LaTeX math with `$...$` and `$$...$$`
- **Containers** - Info, warning, and tip callouts
- **Custom Components** - Use the VitePress component system

## 🚀 Deployment

### Static Site Generation

Build the documentation for deployment:

```bash
pnpm build
```

The built files will be in the `.vitepress/dist` directory, ready for deployment to any static hosting service.

### Hosting Options

- **Vercel** - Zero-configuration deployment
- **Netlify** - Static site hosting with build previews
- **GitHub Pages** - Free hosting for public repositories
- **Cloudflare Pages** - Fast global delivery

## 🤝 Contributing

1. **Edit pages** - Use the "Edit this page" link on any page
2. **Add content** - Create new markdown files and update navigation
3. **Improve styling** - Customize the theme configuration
4. **Submit PRs** - All changes go through pull requests

## 📄 License

This documentation is part of the SaaS Starter project and follows the same license terms.

---

**Built with ❤️ using [VitePress](https://vitepress.dev/)**
**Part of the [SaaS Starter](https://github.com/Monsoft-Solutions/saas-starter) project**
