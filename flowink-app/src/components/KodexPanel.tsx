import { useEffect, useMemo, useRef, useState } from "react";

import { CaptureUpdateAction } from "@excalidraw/excalidraw";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";

import {
  AI_PROVIDER_SESSION_KEY,
  createAIProviderConfig,
  providerLabel,
  requestAIAgentPlan,
  type AIProvider,
  type AIProviderConfig,
} from "../services/aiAgent";
import {
  createKodexDeck,
  createKodexSlide,
  interpretKodexCommand,
  kodexHelp,
  type KodexIntent,
} from "../services/kodex";
import {
  createTechnicalPreset,
  createTemplateSlide,
} from "../services/presets";
import { getActiveSlide, useFlowInkStore } from "../stores/useFlowInkStore";
import {
  CloseIcon,
  KodexIcon,
  SendIcon,
  SettingsIcon,
  SparkIcon,
} from "./Icons";

interface KodexMessage {
  id: number;
  role: "assistant" | "user";
  text: string;
  change?: string;
  error?: boolean;
}

const quickPrompts = [
  "Crea una presentación de 5 diapositivas sobre MCP",
  "Agrega una diapositiva sobre arquitectura",
  "Aplica una transición smart y cambia al modo oscuro",
];

const providers: { id: AIProvider; label: string }[] = [
  { id: "local", label: "FlowInk local" },
  { id: "openai", label: "OpenAI / Codex" },
  { id: "anthropic", label: "Anthropic / Claude" },
  { id: "compatible", label: "API compatible" },
];

const isProvider = (value: unknown): value is AIProvider =>
  value === "local" ||
  value === "openai" ||
  value === "anthropic" ||
  value === "compatible";

const restoreConfig = (raw: string | null): AIProviderConfig | null => {
  if (!raw) return null;
  try {
    const candidate = JSON.parse(raw) as Partial<AIProviderConfig>;
    if (!isProvider(candidate.provider)) return null;
    return {
      provider: candidate.provider,
      model: typeof candidate.model === "string" ? candidate.model : "",
      endpoint:
        typeof candidate.endpoint === "string" ? candidate.endpoint : "",
      apiKey: typeof candidate.apiKey === "string" ? candidate.apiKey : "",
    };
  } catch {
    return null;
  }
};

export const KodexPanel = ({
  api,
  navigate,
  onClose,
}: {
  api: ExcalidrawImperativeAPI | null;
  navigate: (path: string) => void;
  onClose: () => void;
}) => {
  const project = useFlowInkStore((state) => state.project);
  const editorTheme = useFlowInkStore((state) => state.editorTheme);
  const activeSlide = useFlowInkStore(getActiveSlide);
  const applyProject = useFlowInkStore((state) => state.applyKodexProject);
  const insertSlide = useFlowInkStore((state) => state.insertKodexSlide);
  const replaceSlide = useFlowInkStore((state) => state.replaceActiveSlide);
  const renameSlide = useFlowInkStore((state) => state.renameActiveSlide);
  const duplicateSlide = useFlowInkStore((state) => state.duplicateActiveSlide);
  const deleteSlide = useFlowInkStore((state) => state.deleteActiveSlide);
  const setTransition = useFlowInkStore((state) => state.setTransition);
  const setTheme = useFlowInkStore((state) => state.setEditorTheme);
  const setMode = useFlowInkStore((state) => state.setMode);
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [config, setConfig] = useState<AIProviderConfig>(() =>
    createAIProviderConfig(),
  );
  const [messages, setMessages] = useState<KodexMessage[]>([
    {
      id: 1,
      role: "assistant",
      text: "Hola, soy Kodex. Conecta tu IA favorita y modificaré esta presentación mientras trabajas.",
    },
  ]);
  const nextMessageId = useRef(2);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const activeRequest = useRef<AbortController | null>(null);
  const slidePosition = useMemo(
    () => project.slides.findIndex((slide) => slide.id === activeSlide.id) + 1,
    [activeSlide.id, project.slides],
  );
  const ready =
    config.provider === "local" ||
    Boolean(
      config.endpoint.trim() &&
        config.model.trim() &&
        (config.provider === "compatible" || config.apiKey.trim()),
    );

  useEffect(() => {
    const ownerWindow = composerRef.current?.ownerDocument.defaultView;
    const stored = restoreConfig(
      ownerWindow?.sessionStorage.getItem(AI_PROVIDER_SESSION_KEY) ?? null,
    );
    if (stored) setConfig(stored);
  }, []);

  useEffect(
    () => () => {
      activeRequest.current?.abort();
    },
    [],
  );

  const execute = (intent: KodexIntent): { text: string; change?: string } => {
    const currentProject = useFlowInkStore.getState().project;
    switch (intent.type) {
      case "create-deck": {
        const deck = createKodexDeck(intent.topic, intent.count);
        applyProject(deck);
        return {
          text: `Construí una presentación sobre “${intent.topic}” con ${intent.count} diapositivas.`,
          change: `${intent.count} slides creadas`,
        };
      }
      case "add-slide": {
        insertSlide(
          createKodexSlide(intent.topic, currentProject.slides.length),
        );
        return {
          text: `Añadí una diapositiva visual sobre “${intent.topic}” después de la actual.`,
          change: "Slide añadida",
        };
      }
      case "rename-slide":
        renameSlide(intent.name);
        return {
          text: `La diapositiva ahora se llama “${intent.name}”.`,
          change: "Nombre actualizado",
        };
      case "duplicate-slide":
        duplicateSlide();
        return {
          text: "Dupliqué la diapositiva activa y abrí la copia.",
          change: "Slide duplicada",
        };
      case "delete-slide":
        if (currentProject.slides.length === 1) {
          return {
            text: "No puedo eliminar la única diapositiva del proyecto.",
          };
        }
        deleteSlide();
        return {
          text: "Eliminé la diapositiva activa. Puedes deshacer el cambio desde la cabecera.",
          change: "Slide eliminada",
        };
      case "apply-template":
        replaceSlide(createTemplateSlide(intent.templateId));
        setMode("draw");
        return {
          text: `Apliqué la plantilla ${intent.templateId.toUpperCase()} a la diapositiva activa.`,
          change: "Plantilla aplicada",
        };
      case "insert-block": {
        if (!api) {
          return {
            text: "El lienzo todavía está cargando. Inténtalo de nuevo en un momento.",
          };
        }
        const state = api.getAppState();
        const zoom = state.zoom.value;
        const centerX = state.width / (2 * zoom) - state.scrollX;
        const centerY = state.height / (2 * zoom) - state.scrollY;
        const elements = createTechnicalPreset(
          intent.preset,
          centerX - 200,
          centerY - 120,
        );
        api.updateScene({
          elements: [...api.getSceneElements(), ...elements],
          captureUpdate: CaptureUpdateAction.IMMEDIATELY,
        });
        api.selection.select(elements.map((element) => element.id));
        return {
          text: "Inserté el bloque en el centro del lienzo y lo dejé seleccionado.",
          change: "Bloque insertado",
        };
      }
      case "set-transition":
        setTransition(intent.transition);
        return {
          text: `Configuré la transición “${intent.transition}” para esta diapositiva.`,
          change: "Transición actualizada",
        };
      case "set-theme":
        setTheme(intent.theme);
        return {
          text: `Cambié FlowInk al modo ${
            intent.theme === "dark" ? "oscuro" : "claro"
          }.`,
          change: "Tema actualizado",
        };
      case "present":
        navigate("/present");
        return { text: "Abrí el modo presentación." };
      case "help":
        return { text: kodexHelp };
    }
  };

  const appendAssistant = (
    text: string,
    options: Pick<KodexMessage, "change" | "error"> = {},
  ) => {
    setMessages((current) => [
      ...current,
      {
        id: nextMessageId.current++,
        role: "assistant",
        text,
        ...options,
      },
    ]);
  };

  const submit = async (value = prompt) => {
    const nextPrompt = value.trim();
    if (!nextPrompt || busy) return;
    setMessages((current) => [
      ...current,
      {
        id: nextMessageId.current++,
        role: "user",
        text: nextPrompt,
      },
    ]);
    setPrompt("");

    if (config.provider === "local") {
      const result = execute(interpretKodexCommand(nextPrompt));
      appendAssistant(result.text, { change: result.change });
      composerRef.current?.focus();
      return;
    }
    if (!ready) {
      appendAssistant("Configura el proveedor antes de enviar instrucciones.", {
        error: true,
      });
      setShowSettings(true);
      return;
    }

    const ownerWindow = composerRef.current?.ownerDocument.defaultView;
    if (!ownerWindow) return;
    const controller = new ownerWindow.AbortController();
    activeRequest.current = controller;
    setBusy(true);
    try {
      const plan = await requestAIAgentPlan(
        config,
        nextPrompt,
        {
          projectTitle: project.metadata.title,
          slideNames: project.slides.map((slide) => slide.name),
          activeSlideName: activeSlide.name,
          activeSlideNumber: slidePosition,
          elementCount: activeSlide.scene.elements.filter(
            (element) => !element.isDeleted,
          ).length,
          theme: editorTheme,
        },
        ownerWindow.fetch.bind(ownerWindow),
        controller.signal,
      );
      const results = plan.actions.map(execute);
      const changes = results
        .map((result) => result.change)
        .filter((change): change is string => Boolean(change));
      appendAssistant(
        plan.reply || results.map((result) => result.text).join(" "),
        { change: changes.length ? changes.join(" · ") : undefined },
      );
    } catch (error) {
      if (!controller.signal.aborted) {
        appendAssistant(
          error instanceof Error
            ? error.message
            : "No se pudo conectar con la IA.",
          { error: true },
        );
      }
    } finally {
      if (activeRequest.current === controller) activeRequest.current = null;
      setBusy(false);
      composerRef.current?.focus();
    }
  };

  const saveConnection = () => {
    const ownerWindow = composerRef.current?.ownerDocument.defaultView;
    ownerWindow?.sessionStorage.setItem(
      AI_PROVIDER_SESSION_KEY,
      JSON.stringify(config),
    );
    setShowSettings(false);
    appendAssistant(
      config.provider === "local"
        ? "Modo local activado. No se necesita conexión externa."
        : `${providerLabel(config.provider)} quedó conectado con el modelo ${
            config.model || "sin especificar"
          }.`,
      { change: "Proveedor actualizado" },
    );
  };

  return (
    <aside className="fi-kodex" aria-label="Kodex presentation agent">
      <header className="fi-kodex__header">
        <span className="fi-kodex__avatar">
          <KodexIcon />
        </span>
        <span className="fi-kodex__identity">
          <strong>Kodex</strong>
          <small>
            <i data-ready={ready} /> {providerLabel(config.provider)} agent
          </small>
        </span>
        <button
          type="button"
          className={showSettings ? "is-active" : ""}
          onClick={() => setShowSettings((visible) => !visible)}
          aria-label="Configure AI provider"
          title="Configure AI provider"
        >
          <SettingsIcon />
        </button>
        <button type="button" onClick={onClose} aria-label="Close Kodex">
          <CloseIcon />
        </button>
      </header>

      {showSettings && (
        <form
          className="fi-kodex-settings"
          onSubmit={(event) => {
            event.preventDefault();
            saveConnection();
          }}
        >
          <div className="fi-kodex-settings__heading">
            <span>
              <strong>Conectar una IA</strong>
              <small>La credencial vive sólo en esta sesión.</small>
            </span>
            <span className={ready ? "is-ready" : ""}>
              {ready ? "LISTO" : "FALTA CONFIGURAR"}
            </span>
          </div>

          <label>
            Proveedor
            <select
              value={config.provider}
              onChange={(event) =>
                setConfig(
                  createAIProviderConfig(event.target.value as AIProvider),
                )
              }
            >
              {providers.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.label}
                </option>
              ))}
            </select>
          </label>

          {config.provider !== "local" && (
            <>
              <label>
                Modelo
                <input
                  value={config.model}
                  onChange={(event) =>
                    setConfig((current) => ({
                      ...current,
                      model: event.target.value,
                    }))
                  }
                  placeholder="Nombre exacto del modelo"
                />
              </label>
              <label>
                Endpoint
                <input
                  type="url"
                  value={config.endpoint}
                  onChange={(event) =>
                    setConfig((current) => ({
                      ...current,
                      endpoint: event.target.value,
                    }))
                  }
                  placeholder="https://…"
                />
              </label>
              <label>
                API key {config.provider === "compatible" && "(opcional)"}
                <input
                  type="password"
                  autoComplete="off"
                  value={config.apiKey}
                  onChange={(event) =>
                    setConfig((current) => ({
                      ...current,
                      apiKey: event.target.value,
                    }))
                  }
                  placeholder="••••••••••••••••"
                />
              </label>
            </>
          )}

          <p>
            También puedes conectar Ollama, LM Studio o tu propio proxy mediante
            “API compatible”.
          </p>
          <button type="submit" className="fi-kodex-settings__save">
            Guardar conexión
          </button>
        </form>
      )}

      <div className="fi-kodex__context">
        <SparkIcon />
        <span>
          Editing <strong>{activeSlide.name}</strong>
        </span>
        <small>
          {String(slidePosition).padStart(2, "0")} /{" "}
          {String(project.slides.length).padStart(2, "0")}
        </small>
      </div>

      <div className="fi-kodex__messages" aria-live="polite">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`fi-kodex-message fi-kodex-message--${message.role} ${
              message.error ? "is-error" : ""
            }`}
          >
            {message.role === "assistant" && (
              <span className="fi-kodex-message__mark">
                <KodexIcon />
              </span>
            )}
            <div>
              <p>{message.text}</p>
              {message.change && <small>✓ {message.change}</small>}
            </div>
          </div>
        ))}
        {busy && (
          <div className="fi-kodex-message fi-kodex-message--thinking">
            <span className="fi-kodex-message__mark">
              <KodexIcon />
            </span>
            <div>
              <span />
              <span />
              <span />
            </div>
          </div>
        )}
      </div>

      {messages.length === 1 && !showSettings && (
        <div className="fi-kodex__suggestions">
          <span>Prueba una instrucción</span>
          {quickPrompts.map((quickPrompt) => (
            <button
              type="button"
              key={quickPrompt}
              onClick={() => void submit(quickPrompt)}
            >
              {quickPrompt}
            </button>
          ))}
        </div>
      )}

      <div className="fi-kodex__composer">
        <textarea
          ref={composerRef}
          rows={3}
          value={prompt}
          placeholder="Describe el cambio que quieres hacer…"
          aria-label="Ask Kodex to modify the presentation"
          disabled={busy}
          onChange={(event) => setPrompt(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void submit();
            }
          }}
        />
        <button
          type="button"
          aria-label="Send instruction to Kodex"
          disabled={!prompt.trim() || busy}
          onClick={() => void submit()}
        >
          <SendIcon />
        </button>
        <small>
          {busy
            ? `${providerLabel(config.provider)} está preparando cambios…`
            : `${providerLabel(
                config.provider,
              )} · cambios reversibles con Ctrl+Z`}
        </small>
      </div>
    </aside>
  );
};
