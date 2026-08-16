# Architecture

```text
Browser / React client
        |
        | POST /api/analyze
        v
Next.js Route Handler
  - validates input with Zod
  - never exposes API credentials
        |
        +--------------------+
        |                    |
        v                    v
OpenAI Responses API      Demo analyzer
(if key exists)           (no key required)
        |                    |
        +----------+---------+
                   v
          validated suggestions
                   |
                   v
             human review
          / accept / dismiss \
                   |
                   v
           project memory
```

## Trust boundary

The API response is not considered durable state. The client treats it as untrusted suggestions until the user accepts an item. This mirrors the product model: model output is useful evidence, not authority.

## Production extension

A production version would persist notes and accepted memory in Postgres, attach stable source spans rather than source strings, add authentication/authorization, and evaluate extraction quality against a labeled corpus before enabling background automation.
