# Web

Next.js application using TypeScript, Tailwind CSS, shadcn/ui, Biome and a generated typed REST
client. The standard Next.js home page remains at `/`; backend connectivity is shown at `/status`.

## Requirements

- Node.js 24 LTS
- Bun 1.3.14

## Local development

Start the API repository first, then run:

```bash
bun install
cp .env.example .env.local
bun run dev
```

Open:

- Application: <http://localhost:3000>
- API status: <http://localhost:3000/status>

## Commands

```bash
bun run dev           # start Next.js on port 3000
bun run build         # production build with Node.js
bun run start         # serve the production build with Node.js
bun run lint          # lint with Biome
bun run format        # format with Biome
bun run typecheck     # TypeScript validation
bun run api:generate  # update the committed API types from OpenAPI
bun run check         # all checks and production build
```

## API contract

The API repository owns the OpenAPI document. With the API running on port `5000`, regenerate the
typed client after changing an endpoint:

```bash
bun run api:generate
```

`OPENAPI_SCHEMA_URL` overrides the default schema URL
`http://localhost:5000/docs-json`. Generated declarations live in
`src/lib/api/schema.d.ts` and must be committed. Application code should use the typed wrapper in
`src/lib/api/client.ts` instead of raw `fetch` calls.

## Configuration

| Variable | Default | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:5000` | Browser-accessible NestJS API URL |
| `OPENAPI_SCHEMA_URL` | `http://localhost:5000/docs-json` | Development-time schema URL |
"# for-upload-frontend" 
