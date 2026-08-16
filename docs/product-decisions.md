# Product decisions

This file documents decisions that are easy to miss by reading the code alone.

## 1. AI output is a proposal, not workspace truth

**Decision:** AI-generated items enter a review queue. A human must explicitly accept them before they become part of project memory.

**Why:** Extraction is probabilistic. An incorrect decision or owner is more harmful when it quietly becomes durable organizational knowledge.

**Tradeoff:** The review step adds friction. We accept that cost because the product's job is to make shared context more trustworthy, not merely faster to generate.

## 2. Every extracted item requires provenance

**Decision:** Decisions, actions, questions, and assumptions carry the exact source text that supports them.

**Why:** Users should be able to answer “why does the workspace believe this?” without trusting a model's hidden reasoning.

**Tradeoff:** Some useful inferences will be omitted when there is no crisp supporting sentence. Precision is more important than recall for durable project memory.

## 3. The repository works without an API key

**Decision:** When `OPENAI_API_KEY` is absent, the app returns a deterministic analysis of the included sample notes.

**Why:** A reviewer should be able to clone the repository and understand the full interaction without creating an account or spending money.

**Tradeoff:** Demo mode only analyzes the bundled example accurately. The UI labels demo mode explicitly rather than pretending the result is live AI.

## 4. TypeScript first

**Decision:** v0.1 uses one Next.js/TypeScript application rather than splitting AI work into a Python service.

**Why:** There is no workload yet that justifies a second runtime. One deployable unit keeps iteration, types, and failure modes simple.

**When to revisit:** If offline evaluation, retrieval pipelines, or ML-specific workloads become substantial, a Python service may earn its operational cost.
