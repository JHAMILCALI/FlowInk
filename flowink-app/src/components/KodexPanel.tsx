import { useMemo, useRef, useState } from "react";

import { CaptureUpdateAction } from "@excalidraw/excalidraw";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";

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
import { CloseIcon, KodexIcon, SendIcon, SparkIcon } from "./Icons";

interface KodexMessage {
  id: number;
  role: "assistant" | "user";
  text: string;
  change?: string;
}

const quickPrompts = [
  "Crea una presentación de 5 diapositivas sobre MCP",
  "Agrega una diapositiva sobre arquitectura",
  "Aplica una transición smart",
];

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
  const [messages, setMessages] = useState<KodexMessage[]>([
    {
      id: 1,
      role: "assistant",
      text: "Hola, soy Kodex. Puedo construir y editar esta presentación mientras trabajas.",
    },
  ]);
  const nextMessageId = useRef(2);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const slidePosition = useMemo(
    () => project.slides.findIndex((slide) => slide.id === activeSlide.id) + 1,
    [activeSlide.id, project.slides],
  );

  const execute = (intent: KodexIntent): { text: string; change?: string } => {
    switch (intent.type) {
      case "create-deck": {
        const deck = createKodexDeck(intent.topic, intent.count);
        applyProject(deck);
        return {
          text: `Listo. Construí una presentación sobre “${intent.topic}” con ${intent.count} diapositivas.`,
          change: `${intent.count} slides creadas`,
        };
      }
      case "add-slide": {
        insertSlide(createKodexSlide(intent.topic, project.slides.length));
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
        if (project.slides.length === 1) {
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

  const submit = (value = prompt) => {
    const nextPrompt = value.trim();
    if (!nextPrompt) return;
    const userMessage: KodexMessage = {
      id: nextMessageId.current++,
      role: "user",
      text: nextPrompt,
    };
    const result = execute(interpretKodexCommand(nextPrompt));
    const assistantMessage: KodexMessage = {
      id: nextMessageId.current++,
      role: "assistant",
      ...result,
    };
    setMessages((current) => [...current, userMessage, assistantMessage]);
    setPrompt("");
    composerRef.current?.focus();
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
            <i /> Presentation agent
          </small>
        </span>
        <button type="button" onClick={onClose} aria-label="Close Kodex">
          <CloseIcon />
        </button>
      </header>

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
            className={`fi-kodex-message fi-kodex-message--${message.role}`}
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
      </div>

      {messages.length === 1 && (
        <div className="fi-kodex__suggestions">
          <span>Prueba una instrucción</span>
          {quickPrompts.map((quickPrompt) => (
            <button
              type="button"
              key={quickPrompt}
              onClick={() => submit(quickPrompt)}
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
          onChange={(event) => setPrompt(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              submit();
            }
          }}
        />
        <button
          type="button"
          aria-label="Send instruction to Kodex"
          disabled={!prompt.trim()}
          onClick={() => submit()}
        >
          <SendIcon />
        </button>
        <small>Kodex applies changes instantly · Ctrl+Z to undo</small>
      </div>
    </aside>
  );
};
