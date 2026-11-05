# Decisions and assumptions

## Assumptions

| Where the criteria were unclear | Assumption | Why |
|---|---|---|
| What "top rated" means | The owner's choice, held in `merchandising.json`. Fake Store's `rating` field is deliberately ignored. | The criterion says "I have chosen 5 products" and puts "top rated" in quotes. The shipped picks are not the highest rated, so this is visible on screen. |
| Top rated on category pages | Also curated, per category. A category with no picks shows only "additional" products, and a product never appears in both groups. | Keeps one meaning of "top rated" across the product. |
| The picks themselves | Placeholders chosen by the developer. | The owner has not named products yet. |
| Search scope | Case-insensitive match of the whole phrase on title, description and category name. | "Text matching that search term" is the simplest reading. Word-by-word matching is a contained change in `CatalogueService.search`. |
| Blank search | The client sends no request. The API returns 400. | There is nothing to match. |
| Enquiry fields | Name and email are required. Phone and message are optional. | Sales needs a way to reply, and a shorter form is more likely to be finished. |
| Currency | USD. | Fake Store gives no currency. |
| Category names | Shown as supplied, including Fake Store's spelling "jewelery". | Product metadata is not important yet, and the data will be replaced. |
| Product images | The browser loads image URLs that came through our API, directly from the provider's host. | The rule covers product data, which all goes through the backend. An image proxy adds cost and no value yet. This is a judgement call, and it is the first thing to revisit if the rule is meant to cover images too. |
| Look and feel | A placeholder in the style of a large retail site (navy header, ruled product grid), set by `tokens.css` and `app.css`. It uses no other company's logo or wording. | The owner's creative work is still coming, and the PoC should look credible until then. |
| The client and backend | A web client rather than mobile. | See the README. |

## Dropped or simplified

| Cut | Why |
|---|---|
| Admin UI for choosing products | A JSON file meets the criteria. The owner edits it, or a developer does, and restarts the API. |
| Storing enquiries | The criteria ask for an email. Without storage, a mail outage means the enquiry is not captured, so the customer sees an error, keeps their input, and never sees a false "Thank you". |
| Pagination | 20 products. |
| Shared types between client and API | Hand-written types avoid a shared package and extra Docker setup. The risk is drift between the two. |
| End-to-end browser tests | Route tests and UI tests with a stubbed network cover the critical path for less setup. The join between them is checked by hand. |
| CI | First to go under the time-box. `npm test` and `npm run typecheck` run locally. |
| Content Security Policy on the web app | It would hard-code the image host, which is expected to change. |
| Infrastructure as code | The brief makes it optional. The containers and SMTP are AWS-compatible, but nothing has been deployed. |

## How this grows beyond the PoC

The brief names three things that will change. Each one sits behind a single boundary.

| Change | What to do | What stays the same |
|---|---|---|
| Product data source | Implement `ProductSource` and select it in `server.ts`. | Routes, `CatalogueService`, the API contract, the client. |
| Email provider | Implement `EmailSender`, or just point `SMTP_*` at a provider such as SES. | `EnquiryService` and everything above it. |
| Look and feel | Replace `tokens.css`, then restyle `app.css`. Markup has no brand values in it. | Pages, data fetching, tests. |

Other choices that help:

- **Our own API contract:** the client never sees Fake Store's shape, and IDs are strings, so a future SKU fits.
- **Merchandising apart from product data:** either can change alone. A stale pick is logged and skipped, while invalid config stops startup.
- **`buildApp` takes its adapters as arguments:** tests use the same wiring as production, with fakes.

Known limit: `ProductSource` lists everything, and search filters in memory. That suits 20 products, but a large catalogue would need search pushed down into the source. The change is contained to `ProductSource` and `CatalogueService`.

## What I would do next with another day

1. Store enquiries before sending them, and retry with a queue, so a mail outage loses nothing.
2. Generate client types from an OpenAPI description to remove the drift risk.
3. Add CI and one browser test through the real stack.
4. Build a small admin screen for merchandising, once the owner has confirmed how they want to work.
5. Deploy to AWS (for example ECS or App Runner, with SES) and add spam protection to the form.

## Changes from the plan

- **Fixture source:** the plan called it a fallback for when the API is down. It became an explicit `PRODUCT_SOURCE=fixture` setting instead, because an automatic fallback could silently show stale data as if it were live. A failure now returns a clear error.
- **One retry to Fake Store:** the plan had a timeout and a 502, but no retry. The first real run showed occasional connection failures and timeouts, and an enquiry has no client retry to hide them. `FakeStoreProductSource` now retries once, so the slowest failure takes about 10 seconds rather than 5. It stays in the adapter because it is a fact about this provider. Serving the last good data during an outage was rejected, for the same reason the fixture is not an automatic fallback.

## Known small issues

- **Duplicate headers on `/api`:** nginx adds its security headers on top of helmet's, so API responses carry two values of `X-Frame-Options` and `Referrer-Policy`. Browsers apply the stricter result and these are JSON responses, so it is left as it is.

## Time spent

<!-- TODO(candidate): fill in your real numbers before submitting. -->

| Activity | Time |
|---|---|
| Planning | TODO |
| Building | TODO |
| Testing | TODO |
| Reviewing | TODO |
| **Total** | TODO |
