# Deployment Guide

## Stack

Vite + React SPA, deployed to Vercel. No Next.js — do NOT add `'use client'` directives.

## How to deploy

The project is linked to Vercel (`krounes-projects / project-myw4v`) but has `alwaysRefuseToBuild: true` because it also has a GitHub integration. This means `vercel deploy` without `--prebuilt` will always fail. **Always use the prebuilt flow.**

### Preview deploy

```bash
npx vercel pull --yes --environment preview
npx vercel build
npx vercel deploy --prebuilt
```

### Production deploy

```bash
npx vercel pull --yes --environment production
npx vercel build --prod
npx vercel deploy --prebuilt --prod
```

## Git email requirement

Vercel checks the git commit author email against team members. The account email is `kr0ne@tuta.io`. If the local git config uses a different email (e.g. GitHub noreply), deploys fail with `TEAM_ACCESS_REQUIRED`.

Before committing, make sure the local repo email is set correctly:

```bash
git config --local user.email "kr0ne@tuta.io"
```

This only affects this repo, not the global git config.

## Vercel CLI

The CLI is not installed globally. Use `npx vercel`.

## Logs

Client-side logs (`info`, `warn`, `error`) are forwarded to Vercel runtime logs via `POST /api/log` (see `api/log.ts`). View them at:

```
https://vercel.com/krounes-projects/project-myw4v/logs
```

Or via CLI (no `--level` flag — it conflicts with `--follow`):

```bash
npx vercel logs https://project-myw4v.vercel.app
```
