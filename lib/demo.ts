import type { AnalyzeResult, Suggestion, SuggestionKind, TaskPriority } from "./types";

export const sampleNotes = `August 14 — Launch planning

Sarah thinks September 15 is possible, but Alex is worried auth could eat a week if we build it ourselves.

We agreed to use Clerk for authentication instead of owning auth infrastructure in v1. Priya will test whether Redis caching materially improves the activity feed before Friday. If it doesn't, we'll keep the first version simple.

We still need to decide whether invitations should be email-only or support share links at launch. For now we're assuming the beta will stay under 500 users.`;

function normalizeSentence(sentence: string) {
  return sentence.replace(/\s+/g, " ").trim().replace(/[.]+$/, "");
}

function titleFromSentence(sentence: string, kind: SuggestionKind) {
  let title = normalizeSentence(sentence)
    .replace(/^(and\s+)?(we\s+)?(agreed|decided|chose|will|need to|still need to|should|for now we(?:'re| are)? assuming|we(?:'re| are)? assuming|assuming)\s+(that\s+)?/i, "")
    .replace(/^(and\s+)?i\s+(?:also\s+)?(?:have to|need to|should(?:\s+also)?|must|want to)\s+/i, "")
    .replace(/^([A-Z][a-z]+)\s+will\s+/i, "$1: ")
    .replace(/^whether\s+/i, "")
    .trim();

  if (!title) title = normalizeSentence(sentence);
  title = title.charAt(0).toUpperCase() + title.slice(1);

  if (kind === "question" && !title.endsWith("?")) title += "?";
  return title.length > 100 ? `${title.slice(0, 97)}...` : title;
}

function detectOwner(sentence: string) {
  if (/^(?:and\s+)?i\s+/i.test(sentence)) return "Alisha";
  const match = sentence.match(/^\s*([A-Z][a-z]+)\s+(?:will|should|needs? to|is going to)\b/);
  return match?.[1];
}

function detectDue(sentence: string) {
  const match = sentence.match(/\b(?:by|before|on)\s+((?:next\s+)?(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)|tomorrow|today|[A-Z][a-z]+\s+\d{1,2})\b/i);
  return match?.[1];
}


function detectPriority(sentence: string): TaskPriority | undefined {
  const s = sentence.toLowerCase();
  if (/\b(asap|urgent|urgently|immediately|today|must do|highest priority)\b/.test(s)) return "high";
  if (/\b(low priority|whenever|eventually|when i get a chance|nice to have)\b/.test(s)) return "low";
  return undefined;
}

function classify(sentence: string): SuggestionKind | null {
  const s = sentence.toLowerCase();
  if (/\b(we agreed|we decided|decided to|agreed to|we chose|we're going with|we are going with)\b/.test(s)) return "decision";
  if (/\b(still need to decide|need to decide|open question|haven't decided|have not decided|unclear whether|should we|whether)\b/.test(s) || sentence.trim().endsWith("?")) return "question";
  if (/\b(assuming|we assume|we're assuming|we are assuming|assumption)\b/.test(s)) return "assumption";
  if (/^(?:and\s+)?i\s+(?:also\s+)?(?:have to|need to|should(?:\s+also)?|must|want to)\b/i.test(sentence)) return "action";
  if (/\b(will|needs to|need to|should|is going to)\b/.test(s) && /^\s*[A-Z][a-z]+\b/.test(sentence)) return "action";
  return null;
}

const actionStart = /^(?:and\s+)?i\s+(?:also\s+)?(?:have to|need to|should(?:\s+also)?|must|want to)\s+(.+)$/i;
const likelyVerb = "make|go|get|finish|pack|clean|play|apply|pay|zelle|schedule|book|call|send|buy|return|email|study|complete|submit|pick|drop|do|renew|order|write|read|practice|plan|set|register|cancel|organize|prepare";

function expandFirstPersonActions(sentence: string): string[] {
  const match = normalizeSentence(sentence).match(actionStart);
  if (!match) return [sentence];

  const body = match[1];
  // Break up sentences that contain more than one to-do.
  const parts = body
    .split(new RegExp(`\\s+and\\s+(?=(?:${likelyVerb})\\b)`, "i"))
    .map((part) => part.trim())
    .filter(Boolean);

  return parts.map((part) => `I need to ${part}`);
}

// Demo mode stays conservative: if the wording is unclear, it leaves it alone.
export function demoAnalysis(notes: string = sampleNotes): AnalyzeResult {
  const rawSentences = notes
    .split(/(?<=[.!?])\s+|\n+/)
    .map(normalizeSentence)
    .filter((sentence) => sentence.length >= 8);

  const sentences = rawSentences.flatMap(expandFirstPersonActions);
  const suggestions: Suggestion[] = [];

  for (const sentence of sentences) {
    const kind = classify(sentence);
    if (!kind) continue;

    const suggestion: Suggestion = {
      id: `${kind}-${suggestions.length}`,
      kind,
      title: titleFromSentence(sentence, kind),
      evidence: sentence,
      confidence: kind === "action" && /^I need to/i.test(sentence) ? 0.9 : 0.78,
    };

    if (kind === "action") {
      const owner = detectOwner(sentence);
      const due = detectDue(sentence);
      const priority = detectPriority(sentence);
      if (owner) suggestion.owner = owner;
      if (due) suggestion.due = due;
      if (priority) suggestion.priority = priority;
    }

    suggestions.push(suggestion);
    if (suggestions.length >= 25) break;
  }

  const counts = suggestions.reduce<Record<SuggestionKind, number>>(
    (acc, item) => {
      acc[item.kind] += 1;
      return acc;
    },
    { decision: 0, action: 0, question: 0, assumption: 0 },
  );

  const parts = [
    counts.decision && `${counts.decision} decision${counts.decision === 1 ? "" : "s"}`,
    counts.action && `${counts.action} action item${counts.action === 1 ? "" : "s"}`,
    counts.question && `${counts.question} open question${counts.question === 1 ? "" : "s"}`,
    counts.assumption && `${counts.assumption} assumption${counts.assumption === 1 ? "" : "s"}`,
  ].filter(Boolean);

  return {
    mode: "demo",
    summary: suggestions.length
      ? `Demo analysis found ${parts.join(", ")} in the notes you entered.`
      : "Demo analysis did not find an explicit decision, action item, open question, or assumption. Add an OpenAI API key for richer semantic analysis.",
    suggestions,
  };
}
