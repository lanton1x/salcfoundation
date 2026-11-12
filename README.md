# St. Andrew Lutheran Church Foundation, Inc.

Official web application for the **St. Andrew Lutheran Church Foundation, Inc.** (Beaverton, OR — Registered 501(c)(3) Nonprofit Organization, EIN: `93-1055462`).

Built with **Next.js (App Router)**, **React 19**, **Tailwind CSS v4**, and a serverless **AWS Lambda + Google Drive CMS** backend.

---

## Overview

The platform provides St Andrew Lutheran Church congregation, community partners, and grant and scholarship applicants with direct access to:

- **Our Mission & Vision:** Core values, stewardship principles, and organizational reach.
- **Board of Directors:** Current board leadership, officer roles, and term schedules.
- **Grants & Scholarships Portal:** Direct integration with the standalone SALCF Grant & Scholarship Application SPA (`salcf-grantapplications`).
- **ELCA Foundation Resources:** Planning guides, gift planning matrices, and educational materials.
- **Gift Policies & FAQ:** Comprehensive endowment and contribution guidelines.
- **Memorial & Legacy Gifts:** Tributes honoring departed saints and perpetual estate/trust endowments, enriched automatically from embedded WebP XMP metadata.
- **Annual Reports Archive:** Inline-rendered yearly stewardship and financial reports with embedded visual charts.

---

## Architecture & Data Flow

1. **Single-Trip Server Bootstrap (`lib/cmsService.ts`):**
   - On page load, Next.js executes a single server-side `POST` request (`context: "site_bootstrap"`) to the AWS API Gateway / Lambda proxy (`salcf-load-template`).
   - Responses are cached on the server via Next.js `'use cache'` and `cacheLife('hours')`, keeping Google Drive credentials completely isolated in AWS Secrets Manager / Parameter Store.
2. **Pre-Rendering Enrichment:**
   - **Memorial & Legacy Images:** Raw `.webp` files are fetched server-side during pre-rendering to extract embedded `exiftool` XMP tags (`<dc:description>` and `<dc:subject>`) without external binary dependencies.
   - **Annual Reports:** Markdown report files (`.md`) are paired with companion `.png` charts in Google Drive, rewriting relative image references into direct Google Drive media URLs for seamless inline rendering.
3. **Design System ("Reflective Horizon"):**
   - **Sidebar (`#1E2736`):** Deep Midnight Navy navigation with Crisp White (`#FFFFFF`), Muted Ice Blue (`#A4B3C6`), and Soft Gold (`#D4AF37`) active indicators.
   - **Main Canvas (`#F0F3F6` & `#E4E9ED`):** Mist Blue content surface separated from the sidebar, featuring Crisp White (`#FFFFFF`) floating cards and Deep Slate Charcoal (`#2C3E50`) WCAG AAA typography.

---

## Project Structure

```text
salc-foundation/
├── app/
│   ├── components/
│   │   └── FoundationContainer.tsx   # Main responsive layout & tab navigation shell
│   ├── globals.css                   # Tailwind CSS v4 & @tailwindcss/typography setup
│   ├── layout.tsx                    # Root metadata, Geist fonts, and viewport shell
│   └── page.tsx                      # Async Server Component hydrating site bootstrap data
├── lib/
│   └── cmsService.ts                 # Cached AWS Lambda client, WebP XMP parser & report enricher
├── public/
│   └── salcf_logo.png                # Foundation emblem
├── next.config.ts                    # Cache Components & Google Drive image remotePatterns
└── package.json
```

---

## Getting Started

### Prerequisites

- **Node.js** 24
- **pnpm** (recommended package manager)

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Environment Variables

Create a `.env` file in the project root with the following variables (Google Drive credentials and folder IDs remain strictly on AWS Lambda):

```bash
# Server-side AWS API Gateway endpoint for the polymorphic Lambda router
AWS_LAMBDA_API_GATEWAY_URL="https://u63h9i8lwg.execute-api.us-west-2.amazonaws.com/default"

# Public URL for the standalone Grant & Scholarship Application SPA
NEXT_PUBLIC_GRANT_APP_URL="https://salcf-grantapplications.vercel.app"
```

### 3. Run the Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

## Key Scripts

| Command | Description |
| :--- | :--- |
| `pnpm dev` | Starts the local Next.js development server with Turbopack. |
| `pnpm build` | Builds the optimized production bundle. |
| `pnpm start` | Runs the compiled production server locally. |
| `pnpm lint` | Runs ESLint checks across the codebase. |

---

## Deployment

This application is designed for deployment on **Vercel**. Ensure both `AWS_LAMBDA_API_GATEWAY_URL` and `NEXT_PUBLIC_GRANT_APP_URL` are configured in your Vercel project's **Environment Variables** settings before deploying.
