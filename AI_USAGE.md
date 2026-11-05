# AI usage notes

## Tools and models

- **Tool:** Claude Code, in the VS Code extension
- **Model:** Claude Opus 5.5 (`claude-opus-5-5`)

## Agent instructions and plan

- **Instructions:** [CLAUDE.md](CLAUDE.md) holds the architecture, security and working rules given to the agent.
- **Plan:** [PLAN.md](PLAN.md) was generated from the brief, then used to drive the build one phase at a time.

## Key prompts and moments

1. **"Create a phase by phase plan" for the brief.** Planning came before any code. This is where the main interpretation was settled: "I have chosen 5 products" means curated picks and not Fake Store's `rating` field.
2. **"Execute phase by phase and let me know the instructions to test for each phase. I hope you included tests in the phases."** This made testing an explicit deliverable for every phase. Phases 0 and 1 had no automated tests, so they were given manual checks.
3. **Local tools were missing.** The machine had no Node, Docker or `gh`, and an attempt to download a portable Node was blocked by a permissions check. Rather than hunt for another route, the agent wrote the code, kept it uncommitted, and handed back what needed running. The repo history should only claim what was actually run.
4. **Checking assumptions against the live API.** Before building, the agent confirmed that Fake Store has 20 products in 4 categories and ignores a `search` parameter. That confirmed search has to live in the backend.
5. **"Check the folder and update and test as per the document."** This was the first real run of the code, on a machine with Docker but no Node, so Node steps ran in a `node:24-alpine` container. The agent then worked through a step-by-step test checklist, which is how the Fake Store failure in the table below was found.

<!-- TODO(candidate): add a moment of your own, ideally a decision where you overruled the AI. -->

## Where the AI got things wrong

| What went wrong | How it was caught | Outcome |
|---|---|---|
| It assumed `pandoc` was installed when reading the brief. | The command failed. | Read the text directly from the .docx XML. |
| It assumed Node and Docker were installed, and the plan depended on them. | The first tool check failed. | Build and test could not run in the session. See moment 3. |
| A careless `curl -o /tmp_fs.json` wrote a file into the Git install folder, because Git Bash maps `/` there. | The agent checked where the file had landed. | Moved it out to a temporary folder. |
| The stylesheet left page content 16px out of line with the header, because the main area's padding reduced its width. | Spotted in a screenshot of a static preview. | Fixed in `app.css`. |
| The plan made the fixture an automatic fallback for when the API is down. That could silently show stale data as if it were live. | Reviewed while writing the code. | Changed to an explicit setting, recorded in `DECISIONS.md`. |
| The Fake Store adapter made one attempt, so one failed connection on a cold cache became a 502. Mocked tests could not show this. | An enquiry check failed against the running stack with a 502 instead of a 404. The log showed `ETIMEDOUT` after 521ms, and 1 of 30 further probes passed the 5s timeout. | Added one retry in `FakeStoreProductSource`, with tests. The retry path is proven by mocks only, because the live failure could not be triggered on demand. |
| The README implied `SMTP_*` changes the email provider under Docker, but `docker-compose.yml` fixes `SMTP_HOST` and `SMTP_PORT` to Mailpit. | Reading the compose file while checking the README's claims. | Corrected the README. |
| The agent ran the browser checks and the clean-copy build at the same time. The build's `docker compose down` removed the network the browser checks needed. | The browser run hung with no output. | Stopped it and reran the checks alone. No results were affected. |

<!-- TODO(candidate): add anything found while running the tests and reviewing the diff. -->

## Review

<!-- TODO(candidate): describe your own review before submitting. You must be able to explain and defend every line. -->
