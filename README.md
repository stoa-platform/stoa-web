<div align="center">
  <h1>🌐 STOA Web</h1>
  <p><strong>Landing page for STOA Platform</strong></p>
  <p>
    <a href="https://gostoa.dev">gostoa.dev</a>
  </p>
</div>

<p align="center">
  <a href="https://github.com/stoa-platform/stoa-web/actions/workflows/deploy.yml">
    <img src="https://github.com/stoa-platform/stoa-web/actions/workflows/deploy.yml/badge.svg" alt="Deploy">
  </a>
  <a href="LICENSE">
    <img src="https://img.shields.io/badge/license-Apache%202.0-green?style=flat-square" alt="License">
  </a>
  <a href="https://gostoa.dev">
    <img src="https://img.shields.io/badge/website-live-brightgreen?style=flat-square" alt="Website">
  </a>
</p>

---

## 🚀 Overview

This repository contains the marketing website for STOA Platform, built with [Astro](https://astro.build) and deployed on [Vercel](https://vercel.com).

**Live site**: [https://gostoa.dev](https://gostoa.dev)

---

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| [Astro](https://astro.build) | Static site generator |
| [Tailwind CSS](https://tailwindcss.com) | Styling |
| [TypeScript](https://www.typescriptlang.org) | Type safety |
| [Vercel](https://vercel.com) | Hosting & deployment |
| [Cloudflare](https://cloudflare.com) | DNS & CDN |

---

## 🏃 Quick Start

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm

### Development

```bash
# Clone the repository
git clone https://github.com/stoa-platform/stoa-web.git
cd stoa-web

# Install dependencies
pnpm install

# Start development server
pnpm dev

# Open http://localhost:4321
```

### Build

```bash
# Build for production
pnpm build

# Preview production build
pnpm preview
```

---

## 📁 Project Structure

```
stoa-web/
├── src/
│   ├── components/     # Astro/React components
│   ├── layouts/        # Page layouts
│   ├── pages/          # Routes
│   └── styles/         # Global styles
├── public/             # Static assets
├── astro.config.mjs    # Astro configuration
└── tailwind.config.mjs # Tailwind configuration
```

---

## 🚀 Deployment

Deployment is automatic via Vercel on push to `main`.

| Branch | Environment | URL |
|--------|-------------|-----|
| `main` | Production | [gostoa.dev](https://gostoa.dev) |
| `*` | Preview | Auto-generated |

---

## 🔗 Related Repositories

| Repository | Description |
|------------|-------------|
| [stoa](https://github.com/stoa-platform/stoa) | Main platform monorepo |
| [stoa-docs](https://github.com/stoa-platform/stoa-docs) | Documentation site |
| [stoa-helm](https://github.com/stoa-platform/stoa-helm) | Helm charts |

---

## 📄 License

Apache License 2.0 - see [LICENSE](LICENSE) for details.

---

<div align="center">
  <p>Part of the <a href="https://github.com/stoa-platform">STOA Platform</a> project</p>
</div>
