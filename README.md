# Product Catalogue

A product catalogue where customers browse, search and send an enquiry. It is a proof of concept built as a foundation: the product data source, look and feel, and email provider can each change without touching the rest.

## Run it

You need Docker with Compose. Nothing else: no accounts, no paid services and no `.env` file.

```sh
docker compose up --build
```

| What | Where |
|---|---|
| The catalogue | http://localhost:8080 |
| The "sales inbox" (Mailpit) | http://localhost:8025 |

Send an enquiry from any product page, then open the sales inbox to see the email.

If the Fake Store API is unavailable, use the bundled copy of the data:

```sh
PRODUCT_SOURCE=fixture docker compose up --build
```

On PowerShell, set `$env:PRODUCT_SOURCE = 'fixture'` first, then run `docker compose up --build`.

## Develop and test

You need Node 24.15 or newer.

```sh
npm install
npm test            # API and web tests
npm run typecheck
npm run dev:api     # API on http://127.0.0.1:3000
npm run dev:web     # Web on http://localhost:5173, proxying /api to the API
```

Enquiries sent in development need an SMTP server on `localhost:1025`. To get one, run `docker compose up mailpit`, or run the [Mailpit binary](https://github.com/axllent/mailpit/releases).

## Configure

Everything has a working default. To override a value, copy `.env.example` to `.env`; the file lists every setting.

| To change | Edit |
|---|---|
| Top rated products | `apps/api/config/merchandising.json` |
| Where enquiries go | `SALES_INBOX` |
| Where product data comes from | `PRODUCT_SOURCE`, or add a new `ProductSource` |
| Email provider | `SMTP_*`, or add a new `EmailSender`. Under Docker, `SMTP_HOST` and `SMTP_PORT` are set in `docker-compose.yml`, so change them there. |
| Look and feel | `apps/web/src/styles/tokens.css` |

## Stack

| Choice | Why |
|---|---|
| React with TypeScript (Vite) | A browser is the fastest way for the owner to try the product and share it, with no app store or emulator. |
| Node with TypeScript (Fastify and Zod) | The same language on both sides keeps the PoC small. Zod validates input at the boundary, and `inject` allows route tests without a running server. |
| nginx in front of the web app | Serves the build and proxies `/api`, so the browser sees one origin and needs no CORS. |
| Mailpit | A reviewer can see a real email without creating an account. |

## Layout

```
apps/api/src
  catalogue/          CatalogueService, merchandising config, routes
  catalogue/sources/  ProductSource and its Fake Store, fixture and caching implementations
  enquiries/          EnquiryService, routes
  enquiries/email/    EmailSender and its SMTP implementation
  http/               One error shape for every failure
apps/web/src
  api/                The only code that calls the backend
  pages/, components/ UI
  styles/tokens.css   Brand values
```

## More

- [DECISIONS.md](DECISIONS.md): assumptions, cuts, how this grows, and time spent
- [AI_USAGE.md](AI_USAGE.md): how AI was used and where it went wrong
- [PLAN.md](PLAN.md): the plan used for the build
