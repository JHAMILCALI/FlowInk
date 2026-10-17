import {
  FONT_FAMILY,
  convertToExcalidrawElements,
} from "@excalidraw/excalidraw";
import type { ExcalidrawElementSkeleton } from "@excalidraw/element/transform";
import { pointFrom } from "@excalidraw/math";
import {
  createProject,
  createSlide,
  synchronizeElementMeta,
  type FlowInkProject,
  type FlowInkSlide,
  type SlideTransitionType,
} from "@flowink/project-schema";

import type { TechnicalPreset } from "./presets";

export type KodexIntent =
  | { type: "create-deck"; topic: string; count: number }
  | { type: "add-slide"; topic: string }
  | { type: "rename-slide"; name: string }
  | { type: "duplicate-slide" }
  | { type: "delete-slide" }
  | { type: "apply-template"; templateId: string }
  | { type: "insert-block"; preset: TechnicalPreset }
  | { type: "set-transition"; transition: SlideTransitionType }
  | { type: "set-theme"; theme: "light" | "dark" }
  | { type: "present" }
  | { type: "help" };

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const cleanTopic = (value: string, fallback = "Nueva idea") =>
  value
    .replace(/^(?:sobre|acerca de|de)\s+/i, "")
    .replace(/[.!?]+$/, "")
    .trim() || fallback;

const topicAfter = (input: string, pattern: RegExp, fallback?: string) => {
  const match = input.match(pattern);
  return cleanTopic(match?.[1] ?? "", fallback);
};

const nameAfterRename = (input: string) =>
  cleanTopic(
    input
      .replace(/^.*?\b(?:renombra(?:r)?|llama|rename)\b/i, "")
      .replace(
        /^\s*(?:(?:la|el)\s+)?(?:diapositiva|slide)?\s*(?:a|como|to)?\s*/i,
        "",
      )
      .replace(/^["“”']|["“”']$/g, ""),
    "Slide",
  );

const templateAliases: Record<string, string> = {
  mcp: "mcp",
  aws: "aws",
  nube: "aws",
  api: "api",
  database: "database",
  datos: "database",
  red: "network",
  network: "network",
  seguridad: "security",
  security: "security",
  autenticacion: "auth",
  oauth: "auth",
  microservicios: "microservices",
  microservices: "microservices",
};

const blockAliases: Record<string, TechnicalPreset> = {
  codigo: "code-card",
  code: "code-card",
  terminal: "terminal",
  navegador: "browser",
  browser: "browser",
  nota: "sticky-note",
  tarjeta: "tech-card",
  card: "tech-card",
};

const transitions: SlideTransitionType[] = [
  "cut",
  "fade",
  "push-left",
  "push-right",
  "zoom",
  "camera",
  "smart",
];

export const interpretKodexCommand = (input: string): KodexIntent => {
  const text = normalize(input);
  const count = Math.min(
    10,
    Math.max(
      2,
      Number(text.match(/\b(\d{1,2})\s*(?:slides|diapositivas)/)?.[1] ?? 5),
    ),
  );

  if (
    /\b(presenta|presentar|presentation mode|modo presentacion)\b/.test(text)
  ) {
    return { type: "present" };
  }
  if (/\b(modo oscuro|tema oscuro|dark mode|dark theme)\b/.test(text)) {
    return { type: "set-theme", theme: "dark" };
  }
  if (/\b(modo claro|tema claro|light mode|light theme)\b/.test(text)) {
    return { type: "set-theme", theme: "light" };
  }
  if (/\b(duplica|duplicar|duplicate)\b/.test(text)) {
    return { type: "duplicate-slide" };
  }
  if (/\b(elimina|eliminar|borra|borrar|delete)\b/.test(text)) {
    return { type: "delete-slide" };
  }
  if (/\b(renombra|renombrar|llama|rename)\b/.test(text)) {
    return {
      type: "rename-slide",
      name: nameAfterRename(input),
    };
  }

  const transition = transitions.find((candidate) => text.includes(candidate));
  if (transition && /\b(transicion|transition)\b/.test(text)) {
    return { type: "set-transition", transition };
  }

  const template = Object.entries(templateAliases).find(([alias]) =>
    text.includes(alias),
  );
  if (template && /\b(plantilla|template|diagrama)\b/.test(text)) {
    return { type: "apply-template", templateId: template[1] };
  }

  const block = Object.entries(blockAliases).find(([alias]) =>
    text.includes(alias),
  );
  if (block && /\b(agrega|agregar|inserta|insertar|add)\b/.test(text)) {
    return { type: "insert-block", preset: block[1] };
  }

  if (
    /\b(agrega|agregar|anade|nueva|add)\b.*\b(diapositiva|slide)\b/.test(text)
  ) {
    return {
      type: "add-slide",
      topic: topicAfter(
        input,
        /(?:diapositiva|slide)(?:\s+(?:sobre|de))?\s+(.+)$/i,
        "Nueva sección",
      ),
    };
  }

  if (
    /\b(crea|crear|genera|generar|haz|build|create)\b.*\b(presentacion|deck|slides)\b/.test(
      text,
    )
  ) {
    return {
      type: "create-deck",
      topic: topicAfter(
        input,
        /(?:presentaci[oó]n|deck|slides)(?:\s+de\s+\d+\s+(?:diapositivas|slides))?(?:\s+(?:sobre|de))?\s+(.+)$/i,
        "Nueva presentación",
      ),
      count,
    };
  }

  return { type: "help" };
};

const palette = {
  background: "#0b100d",
  surface: "#101813",
  surfaceAlt: "#16221a",
  border: "#2a3b30",
  ink: "#dff7e5",
  muted: "#8ba894",
  primary: "#6dfc8c",
};

const text = (
  x: number,
  y: number,
  value: string,
  fontSize: number,
  color = palette.ink,
): ExcalidrawElementSkeleton => ({
  type: "text",
  x,
  y,
  text: value,
  fontSize,
  fontFamily: FONT_FAMILY.Helvetica,
  strokeColor: color,
  roughness: 0,
});

const card = (
  x: number,
  title: string,
  description: string,
  index: number,
): ExcalidrawElementSkeleton[] => [
  {
    type: "rectangle",
    x,
    y: 330,
    width: 320,
    height: 190,
    strokeColor: palette.border,
    backgroundColor: index === 1 ? palette.surfaceAlt : palette.surface,
    fillStyle: "solid",
    strokeWidth: 2,
    roughness: 0,
    roundness: { type: 3 },
  },
  {
    type: "ellipse",
    x: x + 24,
    y: 360,
    width: 36,
    height: 36,
    strokeColor: palette.primary,
    backgroundColor: index === 1 ? palette.primary : palette.surfaceAlt,
    fillStyle: "solid",
    roughness: 0,
  },
  text(x + 80, 358, title, 24),
  text(x + 24, 435, description, 17, palette.muted),
];

const slideLabels = [
  ["Contexto", "Por qué importa"],
  ["Sistema", "Cómo se organiza"],
  ["Resultado", "Qué debemos lograr"],
] as const;

const createSceneSlide = (
  name: string,
  title: string,
  subtitle: string,
  index: number,
): FlowInkSlide => {
  const slide = createSlide(name);
  const labels =
    index === 2
      ? ([
          ["Entrada", "Datos y señales"],
          ["Proceso", "Lógica principal"],
          ["Salida", "Valor entregado"],
        ] as const)
      : slideLabels;
  const skeletons: ExcalidrawElementSkeleton[] = [
    text(120, 78, title.toUpperCase(), 42),
    text(120, 140, subtitle, 21, palette.muted),
    ...labels.flatMap(([label, description], cardIndex) =>
      card(120 + cardIndex * 390, label, description, cardIndex),
    ),
    text(120, 650, String(index + 1).padStart(2, "0"), 16, palette.primary),
    text(165, 650, "KODEX GENERATED", 14, palette.muted),
  ];
  if (index === 2) {
    skeletons.push(
      {
        type: "arrow",
        x: 445,
        y: 425,
        points: [pointFrom(0, 0), pointFrom(65, 0)],
        strokeColor: palette.primary,
        strokeWidth: 3,
        roughness: 0,
        endArrowhead: "arrow",
      },
      {
        type: "arrow",
        x: 835,
        y: 425,
        points: [pointFrom(0, 0), pointFrom(65, 0)],
        strokeColor: palette.primary,
        strokeWidth: 3,
        roughness: 0,
        endArrowhead: "arrow",
      },
    );
  }
  slide.scene = {
    elements: convertToExcalidrawElements(skeletons),
    appState: {
      ...slide.scene.appState,
      viewBackgroundColor: palette.background,
      currentItemStrokeColor: palette.ink,
    },
    files: {},
  };
  return synchronizeElementMeta(slide);
};

export const createKodexSlide = (topic: string, index = 1): FlowInkSlide =>
  createSceneSlide(
    topic,
    topic,
    index === 0
      ? "Una historia visual creada con Kodex"
      : "Explora, conecta y presenta la idea",
    index,
  );

export const createKodexDeck = (topic: string, count = 5): FlowInkProject => {
  const project = createProject(
    topic,
    `Presentación creada por Kodex sobre ${topic}`,
  );
  const names = [
    topic,
    "Panorama",
    "Cómo funciona",
    "Puntos clave",
    "Próximos pasos",
    "Arquitectura",
    "Riesgos",
    "Métricas",
    "Roadmap",
    "Conclusiones",
  ];
  project.slides = Array.from({ length: count }, (_, index) =>
    createSceneSlide(
      names[index] ?? `Sección ${index + 1}`,
      index === 0 ? topic : names[index] ?? `Sección ${index + 1}`,
      index === 0
        ? "Una historia visual creada con Kodex"
        : `${topic} · ${index + 1} de ${count}`,
      index,
    ),
  );
  return project;
};

export const kodexHelp =
  "Puedo crear una presentación, añadir o renombrar slides, aplicar plantillas, insertar bloques, cambiar transiciones y preparar el modo presentación.";
