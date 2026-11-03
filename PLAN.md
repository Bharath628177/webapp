# Phase-by-phase plan: AI-Native Engineer challenge

The brief scores judgement rather than feature count, and it warns against throwaway prototypes. This plan therefore puts most of the effort into clean boundaries, recorded assumptions and an honest record of how AI was used. It adds up to about 2h50, inside the 2–3 hour time-box.

**Recommended stack**
- **Client and backend:** React with TypeScript (Vite), and Node with TypeScript (Fastify and Zod).
- **Local run:** `docker compose up` starts the web app, the API and Mailpit, a free local mail catcher. The reviewer can see the "sales inbox" email at `localhost:8025` without creating an account.

| Phase | Focus | Time |
|---|---|---|
| 0 | Set up and decide | 20 min |
| 1 | Walking skeleton | 20 min |
| 2 | Catalogue API | 30 min |
| 3 | Enquiry API | 20 min |
| 4 | React client | 40 min |
| 5 | Hardening and review | 20 min |
| 6 | Docs and PR | 20 min |
| 7 | Interview prep | After submission |

## Phase 0: Set up and decide (20 min)
- **Time log:** start it now, because you have to report time across planning, building, testing and reviewing.
- **Repo:** this folder isn't a git repo yet. Run `git init`, commit a baseline to `main`, then branch to `feature/catalogue-poc`, because the PR needs `main` to target. Keep the challenge files out of the repo.
- **Agent instructions:** commit a `CLAUDE.md` with the architecture rules, for example "the client never calls Fake Store" and "no provider types outside adapters".
- **Starter docs:** create `DECISIONS.md` and `AI_USAGE.md`, and commit this plan. Add AI mistakes and key prompts as they happen, since they're hard to reconstruct later.

**Assumptions to record**

| Gap in the criteria | Assumption |
|---|---|
| Who "chooses" the top-rated products | The owner does, through a config file (`merchandising.json`). The wording is "I have chosen", so don't sort by Fake Store's `rating` field. There is no admin UI, and that cut is justified in the docs. |
| Top rated on category pages | Curated per category in the same file. A category with no picks shows only "additional products", and products never appear in both lists. |
| Search scope | Case-insensitive match on title, description and category. An empty term sends no request, and no matches shows an empty state. |
| Enquiry form fields | Name and email are required; phone and message are optional. |
| Enquiry storage | Email only, with no database. If sending fails, the customer sees an error and keeps their input, never a false "Thank you". |
| Accounts, cart and pagination | Out of scope, since the catalogue is too small to need pagination. |

## Phase 1: Walking skeleton (20 min)
- **Goal:** get one request working end to end from web to API to Fake Store, with Mailpit running, before building features.
- **Layout:** use `apps/api` and `apps/web`, with no shared package. Hand-written client types are less setup, and OpenAPI generation goes in "what next".
- **Serving:** nginx serves the web app and proxies `/api`, so there's no CORS to configure. It also needs a fallback so deep links work.
- **Config:** add `.env.example`, with compose defaults that work without copying it.
- **Check:** confirm what I'm assuming from memory about Fake Store: about 20 products, 4 categories, and no search endpoint.

## Phase 2: Catalogue API (30 min)
This phase carries most of the Solution Design score. The three things the brief says will change each get a boundary:

```
routes → CatalogueService → ProductSource (interface)
                          ├ FakeStoreProductSource
                          └ FixtureProductSource   (tests, and fallback if the API is down)
                          → MerchandisingConfig    (kept separate from product data)
```

- **Endpoints:**
  - `GET /api/featured`
  - `GET /api/categories`
  - `GET /api/categories/:slug/products`, which returns `{ topRated, additional }`
  - `GET /api/products?search=`
  - `GET /api/products/:id`
- **Domain types:** return your own types rather than Fake Store's shape. Use your own category slugs too, because names like `men's clothing` are awkward in URLs.
- **Resilience:** add a short in-memory cache, since search has to filter on the server. Add a request timeout too, and map upstream failures to a 502 and unknown IDs to a 404.
- **Bad config:** a featured ID that doesn't exist is skipped and logged, not a crash.
- **Tests:** cover search matching, the top-rated split with no duplicates, the adapter's mapping (with mocked HTTP), and the routes using a fake source.

## Phase 3: Enquiry API (20 min)
- **Endpoint:** `POST /api/enquiries` takes the product ID and contact details, validated with Zod.
- **Email boundary:** define an `EmailSender` interface with an `SmtpEmailSender` implementation using Nodemailer. SMTP works with Mailpit now and SES later, which keeps it AWS-compatible.
- **Trust:** look up the product name on the server, and don't accept it from the client.
- **Security basics:**
  - Send plain-text email.
  - Add a body size limit, helmet and rate limiting.
  - Keep customer details out of logs.
- **Tests:** cover a successful send, each validation failure, an unknown product, and a mail failure that returns an error status.

## Phase 4: React client (40 min)
- **Routes:** `/`, `/category/:slug`, `/search?q=` and `/product/:id`. Keeping the search term in the URL makes results linkable.
- **Enquiry flow:** the Enquire button opens a form on the product page, and a successful submit shows the "Thank you" message.
- **Data layer:** put all calls in one API module, and use TanStack Query for loading, error and caching states. Every page needs loading, error and empty states.
- **Look and feel:** the creative work is still coming, so use CSS variables as design tokens and a small set of components, with minimal styling.
- **Search:** use a real `<form>`, so both the button and Enter work.
- **Accessibility:** use labelled inputs, proper links for tiles, and visible field errors.
- **Tests:** use React Testing Library for enquiry success and failure, search, and the home page showing 5 products.

## Phase 5: Hardening and review (20 min)
- **Review:** read the whole diff yourself, because you have to defend every line. Log what you catch in `AI_USAGE.md`.
- **Acceptance check:** walk through all five acceptance criteria by hand.
- **Clean-clone test:** from a fresh clone, time the path from `git clone` to a working app against the 10-minute limit.
- **Failure test:** block access to Fake Store and stop Mailpit, then confirm the app fails cleanly.
- **Secrets:** check that none are committed.
- **Cut order if you're over time:** drop CI first, then a Playwright smoke test (both optional extras), then visual polish. Don't cut the tests above or the docs.

## Phase 6: Docs and PR (20 min)
- **`README.md`:** setup, Mailpit URL, configuration, and why you chose this stack.
- **`DECISIONS.md`:** assumptions, cuts and reasons, how the design grows, and what you'd do with another day. Good next-day items are persistent enquiries with a retry queue, an admin UI for merchandising, OpenAPI types, and deployment to AWS.
- **`AI_USAGE.md`:** tools and models, a link to the agent instructions, the plan, 3–5 key prompts or moments, and where the AI was wrong and how you caught it.
- **Time spent:** add your actual time and rough split, even if you went over.
- **PR:** raise it into `main` and leave it open. The description is assessed, so cover what was built, the key decisions, how to run and test it, and known gaps.
- **Submit:** reply with the repo link within 3 days of receiving the email. If the repo is private, give the named reviewers access.

## Phase 7: Interview prep (after submission)
The follow-up lasts 45 minutes and includes a small live change, so rehearse a few likely ones:
- Add a second email provider.
- Add a field to the enquiry form.
- Change the featured products.
- Add sorting or a filter to category pages.
- Add a new product source, such as a local file.

Also practise explaining why top-rated products are curated, why there's no database, and one decision where you overruled the AI.
