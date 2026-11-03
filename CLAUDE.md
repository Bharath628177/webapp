# Agent instructions

Product catalogue PoC that is meant to grow. Before making a decision, check `DECISIONS.md`. Add any new assumption or AI mistake to `DECISIONS.md` or `AI_USAGE.md` as it happens.

## Architecture rules

- The client never calls the Fake Store API for product data. All product data goes through `apps/api`.
- Provider types stay inside adapters. Fake Store's response shape must not leave `FakeStoreProductSource`, and Nodemailer must not leave `SmtpEmailSender`.
- Routes handle HTTP only. Business rules live in `CatalogueService` and `EnquiryService`.
- "Top rated" means chosen by the owner in `apps/api/config/merchandising.json`. Never derive it from a provider's rating field.
- `apps/web` calls the backend only through `src/api/client.ts`.
- Colours, spacing and fonts come from the tokens in `apps/web/src/styles/tokens.css`.

## Security rules

- Validate all input with Zod at the route boundary.
- Never log customer details, and never log raw mail errors, because they can contain addresses.
- Never trust product details sent by the client. Look them up on the server.
- Never commit secrets. New configuration goes in `.env.example` with a safe local default.
- The stack must not need paid services or accounts.

## Working rules

- Every behaviour change needs a test. Run `npm test` and `npm run typecheck` before calling work done.
- Report what was actually run. Say so plainly if something could not be verified.
- Keep it small. Do not add a feature or abstraction the acceptance criteria or a known change does not need.
