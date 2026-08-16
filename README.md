# DecisionTrail

DecisionTrail is a small project I built to make meeting notes more useful after the meeting is over.

You can paste in a page of notes and the app pulls out things that are easy to lose track of: decisions, action items, open questions, and assumptions. It shows where each suggestion came from before you decide whether to keep it.

The part I care most about is the review step. I did not want the app to quietly turn model output into project truth. If it finds a task, you can review the task name, owner, due date, and priority before adding it to the to-do list. Decisions and other project context also keep a link back to the original sentence.

## What it can do

- Create separate projects and keep notes for each one
- Find decisions, tasks, assumptions, and open questions in notes
- Split compound sentences into separate tasks (for example, “pay rent and make my calendar”)
- Pull out task owners and due dates when they are actually stated
- Let you edit a task before adding it to your list
- Keep a project to-do list with checkboxes and priorities
- Keep accepted non-task items in a project memory view with source evidence
- Run without an API key using a lightweight local demo analyzer
- Use the OpenAI API for more flexible language understanding when a key is available

## Why I built it

I take a lot of notes, but the useful parts are usually scattered through paragraphs. A sentence that mattered during a meeting can be hard to find a week later, and a simple summary does not always help with actually following through.

I wanted to try a different flow: write normally first, then have software help organize the useful pieces without taking control away from the person who wrote the notes.

## Running it locally

You will need a recent version of Node.js.

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

DecisionTrail works in demo mode without any credentials. The demo analyzer handles common phrases such as “I need to…”, “we decided…”, and “by Friday.”

For live model analysis, create a local environment file:

```bash
cp .env.example .env.local
```

Then add your API key to `.env.local`:

```text
OPENAI_API_KEY=your_key_here
```

Restart the development server after adding it.

## Tests

```bash
npm test
npm run build
```

## Tech

- Next.js
- TypeScript
- React
- Zod
- OpenAI Responses API (optional)
- Vitest

I kept the first version in one TypeScript app because the workload is small enough that a separate backend service would add more complexity than value.

## Project structure

```text
app/
  api/analyze/route.ts   analysis endpoint
  globals.css            styling
components/
  workspace.tsx          main product UI
lib/
  demo.ts                local analyzer used without an API key
  types.ts               shared types
docs/
  architecture.md
  product-decisions.md
tests/
```

## Things I would like to add next

- Save projects to a real database instead of browser state
- Support real dates instead of keeping due dates as text
- Search across project notes and accepted memory
- Surface potentially stale or contradictory decisions
- Add better extraction tests for messy, real-world notes
- Add collaboration instead of using placeholder avatars
