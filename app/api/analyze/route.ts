import OpenAI from "openai";
import { z } from "zod";
import { demoAnalysis } from "@/lib/demo";

const RequestSchema = z.object({
  notes: z.string().trim().min(20).max(20_000),
});

const SuggestionSchema = z.object({
  kind: z.enum(["decision", "action", "question", "assumption"]),
  title: z.string().min(1),
  detail: z.string().optional(),
  owner: z.string().optional(),
  due: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  evidence: z.string().min(1),
  confidence: z.number().min(0).max(1),
});

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const ModelResultSchema = z.object({
  summary: z.string().min(1),
  suggestions: z.array(SuggestionSchema).max(25),
});

export async function POST(request: Request) {
  try {
    const parsed = RequestSchema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json({ error: "Please provide at least 20 characters of notes." }, { status: 400 });
    }

    if (!openai) {
      return Response.json(demoAnalysis(parsed.data.notes));
    }

    const response = await openai.responses.create({
      model: "gpt-5",
      input: [
        {
          role: "system",
          content:
            "You extract organizational memory from project notes. Return ONLY valid JSON. Never invent facts. Every suggestion must quote exact supporting evidence from the notes. Extract each distinct action item separately, including natural first-person tasks such as 'I need to', 'I have to', and 'I should'. If one sentence contains multiple tasks, return multiple action suggestions. For action items, include owner, due date, or priority only when supported by the notes. Use priority high only for explicit urgency, low only for explicit low-urgency language, and otherwise omit it. Prefer omission over guessing. JSON shape: {summary: string, suggestions: Array<{kind: 'decision'|'action'|'question'|'assumption', title: string, detail?: string, owner?: string, due?: string, priority?: 'low'|'medium'|'high', evidence: string, confidence: number}>}",
        },
        {
          role: "user",
          content: parsed.data.notes,
        },
      ],
    });

    const raw = response.output_text.replace(/^```json\s*/i, "").replace(/```\s*$/, "");
    const result = ModelResultSchema.parse(JSON.parse(raw));

    return Response.json({
      ...result,
      mode: "ai",
      suggestions: result.suggestions.map((suggestion, index) => ({
        ...suggestion,
        id: `${suggestion.kind}-${index}`,
      })),
    });
  } catch (error) {
    console.error("analysis failed", error);
    return Response.json(
      { error: "Analysis failed. Your notes were not changed." },
      { status: 500 },
    );
  }
}
