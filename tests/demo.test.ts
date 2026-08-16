import { describe, expect, it } from "vitest";
import { demoAnalysis } from "../lib/demo";

describe("demo analysis", () => {
  it("analyzes the notes passed to it instead of replaying canned output", () => {
    const result = demoAnalysis(
      "We decided to launch on Tuesday. Maya will update the onboarding flow by Friday. We still need to decide whether guests can comment.",
    );

    expect(result.mode).toBe("demo");
    expect(result.suggestions.some((item) => item.evidence.includes("launch on Tuesday"))).toBe(true);
    expect(result.suggestions.some((item) => item.owner === "Maya")).toBe(true);
    expect(result.suggestions.some((item) => item.kind === "question")).toBe(true);
    expect(result.suggestions.every((item) => !item.evidence.includes("Clerk"))).toBe(true);
  });

  it("returns no fake suggestions when the notes have no explicit memory items", () => {
    const result = demoAnalysis("The team reviewed the homepage. Everyone shared feedback about spacing and typography.");
    expect(result.suggestions).toEqual([]);
  });
});

it("extracts each distinct task from a natural first-person weekly to-do paragraph", () => {
  const notes = `August 15 — Weekly to-do

I have to pay my rent and make my Google calendar for school. I also have to make a dermatologist appointment. And I need to Zelle Sonia back. I need to go back-to-school shopping. And I also need to get my hair cut. I should also finish annotating my copy of Beartown before I go to school. And I need to pack for school and go furniture shopping. I need to clean my room. I also need to play tennis with Lorena and make plans with her. And I need to apply to internships.`;
  const result = demoAnalysis(notes);
  const actions = result.suggestions.filter((item) => item.kind === "action");

  expect(actions).toHaveLength(13);
  expect(actions.map((item) => item.title)).toEqual(expect.arrayContaining([
    "Pay my rent",
    "Make my Google calendar for school",
    "Make a dermatologist appointment",
    "Zelle Sonia back",
    "Apply to internships",
  ]));
  expect(actions.every((item) => item.owner === "Alisha")).toBe(true);
});
