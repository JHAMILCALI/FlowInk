import { describe, expect, it } from "vitest";

import { createAIProviderConfig, parseAIAgentPlan } from "./aiAgent";

describe("multi-provider AI agent", () => {
  it("creates safe provider defaults", () => {
    expect(createAIProviderConfig("openai")).toMatchObject({
      provider: "openai",
      model: "gpt-4o-mini",
    });
    expect(createAIProviderConfig("compatible").endpoint).toContain(
      "127.0.0.1",
    );
  });

  it("parses and validates a multi-action plan", () => {
    expect(
      parseAIAgentPlan(`\`\`\`json
        {
          "reply": "Actualizaré la presentación.",
          "actions": [
            { "type": "rename-slide", "value": "Arquitectura", "count": 0 },
            { "type": "set-transition", "value": "smart", "count": 0 },
            { "type": "set-theme", "value": "dark", "count": 0 }
          ]
        }
      \`\`\``),
    ).toEqual({
      reply: "Actualizaré la presentación.",
      actions: [
        { type: "rename-slide", name: "Arquitectura" },
        { type: "set-transition", transition: "smart" },
        { type: "set-theme", theme: "dark" },
      ],
    });
  });

  it("drops unsupported actions instead of executing them", () => {
    expect(
      parseAIAgentPlan(
        '{"reply":"No action","actions":[{"type":"run-code","value":"x","count":0}]}',
      ).actions,
    ).toEqual([]);
  });
});
