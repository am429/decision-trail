export type SuggestionKind = "decision" | "action" | "question" | "assumption";
export type TaskPriority = "low" | "medium" | "high";

export type Suggestion = {
  id: string;
  kind: SuggestionKind;
  title: string;
  detail?: string;
  owner?: string;
  due?: string;
  priority?: TaskPriority;
  evidence: string;
  confidence: number;
};

export type AnalyzeResult = {
  summary: string;
  suggestions: Suggestion[];
  mode: "ai" | "demo";
};
