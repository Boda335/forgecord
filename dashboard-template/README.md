# Forgecord Dashboard

This folder uses the reusable UI components, styles, theme tokens, fonts, and shared utilities from the Nexus Shop client. Forgecord's Discord OAuth and server-management flow remain in place. The primary brand color is fixed to `#f3ac2f` in both light and dark modes.

Workspace pages live in `src/features/workspace`. Shared UI primitives live in `src/components/ui`; routing is implemented in `src/App.tsx`.

## Development

```bash
npm install
npm run dev
```

Vite runs on `http://localhost:8080`. Requests to `/api` and `/auth` are proxied to `http://localhost:3000` by default. Set `FORGECORD_API_PROXY` to override the backend URL.

## Build

```bash
npm run build
npm run preview
```
