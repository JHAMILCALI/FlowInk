import type { KodexIntent } from "./kodex";

export type AIProvider = "local" | "openai" | "anthropic" | "compatible";

export interface AIProviderConfig {
  provider: AIProvider;
  model: string;
  endpoint: string;
  apiKey: string;
}

export interface FlowInkAIContext {
  projectTitle: string;
  slideNames: string[];
  activeSlideName: string;
  activeSlideNumber: number;
  elementCount: number;
  theme: "light" | "dark";
}

export interface AIAgentPlan {
  reply: string;
  actions: KodexIntent[];
}

interface RawAIAction {
  type: string;
  value: string;
  count: number;
}

const actionTypes = [
  "create-deck",
  "add-slide",
  "rename-slide",
  "duplicate-slide",
  "delete-slide",
  "apply-template",
  "insert-block",
  "set-transition",
  "set-theme",
  "present",
  "help",
] as const;

const providerDefaults: Record<
  AIProvider,
  Omit<AIProviderConfig, "provider">
> = {
  local: { model: "FlowInk local", endpoint: "", apiKey: "" },
  openai: {
    model: "gpt-4o-mini",
    endpoint: "https://api.openai.com/v1/responses",
    apiKey: "",
  },
  anthropic: {
    model: "claude-sonnet-4-5",
    endpoint: "https://api.anthropic.com/v1/messages",
    apiKey: "",
  },
  compatible: {
    model: "local-model",
    endpoint: "http://127.0.0.1:11434/v1/chat/completions",
    apiKey: "",
  },
};

export const createAIProviderConfig = (
  provider: AIProvider = "local",
): AIProviderConfig => ({ provider, ...providerDefaults[provider] });

export const AI_PROVIDER_SESSION_KEY = "flowink.ai-provider.v1";

export const providerLabel = (provider: AIProvider) =>
  ({
    local: "Local",
    openai: "OpenAI",
    anthropic: "Claude",
    compatible: "Compatible",
  }[provider]);

const actionSchema = {
  type: "object",
  properties: {
    reply: {
      type: "string",
      description: "Short Spanish response explaining what will change.",
    },
    actions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          type: { type: "string", enum: actionTypes },
          value: {
            type: "string",
            description:
              "Topic, name, template, block, transition or theme. Empty when unused.",
          },
          count: {
            type: "number",
            description: "Slide count for create-deck; zero when unused.",
          },
        },
        required: ["type", "value", "count"],
        additionalProperties: false,
      },
    },
  },
  required: ["reply", "actions"],
  additionalProperties: false,
};

const systemPrompt = `You are Kodex, the real-time presentation editing agent inside FlowInk.
Translate the user's instruction into a small JSON action plan. Reply in Spanish.
Use only these actions:
- create-deck: value=topic, count=2..10
- add-slide: value=topic
- rename-slide: value=new name
- duplicate-slide, delete-slide, present, help: value="", count=0
- apply-template: value=mcp|aws|api|database|network|security|auth|microservices
- insert-block: value=code-card|terminal|browser|sticky-note|tech-card
- set-transition: value=cut|fade|push-left|push-right|zoom|camera|smart
- set-theme: value=light|dark
You may return several actions in execution order. Never invent other actions.
Return JSON only, matching the requested schema.`;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const toIntent = (action: RawAIAction): KodexIntent | null => {
  const value = action.value.trim();
  switch (action.type) {
    case "create-deck":
      return {
        type: "create-deck",
        topic: value || "Nueva presentación",
        count: Math.min(10, Math.max(2, Math.round(action.count || 5))),
      };
    case "add-slide":
      return { type: "add-slide", topic: value || "Nueva sección" };
    case "rename-slide":
      return { type: "rename-slide", name: value || "Slide" };
    case "duplicate-slide":
    case "delete-slide":
    case "present":
    case "help":
      return { type: action.type };
    case "apply-template":
      return value ? { type: "apply-template", templateId: value } : null;
    case "insert-block":
      if (
        [
          "code-card",
          "terminal",
          "browser",
          "sticky-note",
          "tech-card",
        ].includes(value)
      ) {
        return {
          type: "insert-block",
          preset: value as Extract<
            KodexIntent,
            { type: "insert-block" }
          >["preset"],
        };
      }
      return null;
    case "set-transition":
      if (
        [
          "cut",
          "fade",
          "push-left",
          "push-right",
          "zoom",
          "camera",
          "smart",
        ].includes(value)
      ) {
        return {
          type: "set-transition",
          transition: value as Extract<
            KodexIntent,
            { type: "set-transition" }
          >["transition"],
        };
      }
      return null;
    case "set-theme":
      return value === "light" || value === "dark"
        ? { type: "set-theme", theme: value }
        : null;
    default:
      return null;
  }
};

export const parseAIAgentPlan = (raw: string): AIAgentPlan => {
  const unfenced = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
  const start = unfenced.indexOf("{");
  const end = unfenced.lastIndexOf("}");
  if (start < 0 || end <= start) {
    throw new Error("La IA no devolvió un plan JSON válido.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(unfenced.slice(start, end + 1));
  } catch {
    throw new Error("No se pudo interpretar la respuesta de la IA.");
  }
  if (!isRecord(parsed) || !Array.isArray(parsed.actions)) {
    throw new Error("La respuesta no contiene una lista de acciones.");
  }

  const actions = parsed.actions
    .slice(0, 8)
    .map((candidate): RawAIAction | null => {
      if (!isRecord(candidate) || typeof candidate.type !== "string") {
        return null;
      }
      return {
        type: candidate.type,
        value: typeof candidate.value === "string" ? candidate.value : "",
        count: typeof candidate.count === "number" ? candidate.count : 0,
      };
    })
    .filter((action): action is RawAIAction => action !== null)
    .map(toIntent)
    .filter((intent): intent is KodexIntent => intent !== null);

  return {
    reply:
      typeof parsed.reply === "string" && parsed.reply.trim()
        ? parsed.reply.trim()
        : "Apliqué los cambios solicitados.",
    actions,
  };
};

const responseError = async (response: Response) => {
  let detail = "";
  try {
    const body = (await response.json()) as unknown;
    if (isRecord(body)) {
      if (typeof body.error === "string") detail = body.error;
      if (isRecord(body.error) && typeof body.error.message === "string") {
        detail = body.error.message;
      }
      if (typeof body.message === "string") detail = body.message;
    }
  } catch {
    detail = await response.text().catch(() => "");
  }
  return new Error(
    detail || `El proveedor respondió con el estado ${response.status}.`,
  );
};

const extractOpenAIText = (payload: unknown): string => {
  if (!isRecord(payload)) return "";
  if (typeof payload.output_text === "string") return payload.output_text;
  if (!Array.isArray(payload.output)) return "";
  for (const item of payload.output) {
    if (!isRecord(item) || !Array.isArray(item.content)) continue;
    for (const content of item.content) {
      if (isRecord(content) && typeof content.text === "string") {
        return content.text;
      }
    }
  }
  return "";
};

const extractAnthropicText = (payload: unknown): string => {
  if (!isRecord(payload) || !Array.isArray(payload.content)) return "";
  const item = payload.content.find(
    (candidate) => isRecord(candidate) && typeof candidate.text === "string",
  );
  return isRecord(item) && typeof item.text === "string" ? item.text : "";
};

const extractCompatibleText = (payload: unknown): string => {
  if (!isRecord(payload) || !Array.isArray(payload.choices)) return "";
  const choice = payload.choices[0];
  if (!isRecord(choice) || !isRecord(choice.message)) return "";
  return typeof choice.message.content === "string"
    ? choice.message.content
    : "";
};

export const requestAIAgentPlan = async (
  config: AIProviderConfig,
  instruction: string,
  context: FlowInkAIContext,
  fetcher: typeof fetch,
  signal?: AbortSignal,
): Promise<AIAgentPlan> => {
  if (config.provider === "local") {
    throw new Error("El proveedor local no requiere una petición remota.");
  }
  if (!config.endpoint.trim()) {
    throw new Error("Configura la URL del proveedor.");
  }
  if (config.provider !== "compatible" && !config.apiKey.trim()) {
    throw new Error("Configura la API key del proveedor.");
  }
  if (!config.model.trim()) {
    throw new Error("Configura el modelo que quieres utilizar.");
  }

  const userInput = JSON.stringify({ instruction, presentation: context });
  let body: Record<string, unknown>;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (config.provider === "openai") {
    headers.Authorization = `Bearer ${config.apiKey.trim()}`;
    body = {
      model: config.model.trim(),
      instructions: systemPrompt,
      input: userInput,
      store: false,
      text: {
        format: {
          type: "json_schema",
          name: "flowink_agent_plan",
          strict: true,
          schema: actionSchema,
        },
      },
    };
  } else if (config.provider === "anthropic") {
    headers["x-api-key"] = config.apiKey.trim();
    headers["anthropic-version"] = "2023-06-01";
    headers["anthropic-dangerous-direct-browser-access"] = "true";
    body = {
      model: config.model.trim(),
      max_tokens: 1200,
      system: systemPrompt,
      messages: [{ role: "user", content: userInput }],
    };
  } else {
    if (config.apiKey.trim()) {
      headers.Authorization = `Bearer ${config.apiKey.trim()}`;
    }
    body = {
      model: config.model.trim(),
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userInput },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    };
  }

  const request = (requestBody: Record<string, unknown>) =>
    fetcher(config.endpoint.trim(), {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
      signal,
    });

  let response = await request(body);
  if (
    !response.ok &&
    (response.status === 400 || response.status === 422) &&
    (config.provider === "openai" || config.provider === "compatible")
  ) {
    const fallbackBody = { ...body };
    if (config.provider === "openai") delete fallbackBody.text;
    if (config.provider === "compatible") {
      delete fallbackBody.response_format;
    }
    response = await request(fallbackBody);
  }

  if (!response.ok) throw await responseError(response);

  const payload = (await response.json()) as unknown;
  const raw =
    config.provider === "openai"
      ? extractOpenAIText(payload)
      : config.provider === "anthropic"
      ? extractAnthropicText(payload)
      : extractCompatibleText(payload);
  if (!raw) {
    throw new Error("El proveedor no devolvió contenido utilizable.");
  }
  return parseAIAgentPlan(raw);
};
