import {
  FONT_FAMILY,
  convertToExcalidrawElements,
} from "@excalidraw/excalidraw";
import type { ExcalidrawElementSkeleton } from "@excalidraw/element/transform";
import type { ExcalidrawElement } from "@excalidraw/element/types";
import { pointFrom } from "@excalidraw/math";
import {
  createId,
  createSlide,
  synchronizeElementMeta,
  type FlowInkSceneElement,
  type FlowInkSlide,
} from "@flowink/project-schema";

export type TechnicalPreset =
  | "code-card"
  | "terminal"
  | "browser"
  | "sticky-note"
  | "tech-card";

const ink = "#dff7e5";
const muted = "#8ba894";
const primary = "#6dfc8c";
const surface = "#101813";
const border = "#2a3b30";

const baseRect = (x: number, y: number, width: number, height: number) => ({
  type: "rectangle" as const,
  x,
  y,
  width,
  height,
  strokeColor: border,
  backgroundColor: surface,
  fillStyle: "solid" as const,
  strokeWidth: 2,
  roughness: 0,
  roundness: { type: 3 as const },
});

const text = (
  x: number,
  y: number,
  value: string,
  fontSize = 22,
  color = ink,
  fontFamily = FONT_FAMILY.Cascadia,
) => ({
  type: "text" as const,
  x,
  y,
  text: value,
  fontSize,
  fontFamily,
  strokeColor: color,
  roughness: 0,
});

const trafficLights = (x: number, y: number) => [
  {
    type: "ellipse" as const,
    x,
    y,
    width: 10,
    height: 10,
    backgroundColor: "#ff6b6b",
    strokeColor: "#ff6b6b",
    fillStyle: "solid" as const,
    roughness: 0,
  },
  {
    type: "ellipse" as const,
    x: x + 18,
    y,
    width: 10,
    height: 10,
    backgroundColor: "#ffd166",
    strokeColor: "#ffd166",
    fillStyle: "solid" as const,
    roughness: 0,
  },
  {
    type: "ellipse" as const,
    x: x + 36,
    y,
    width: 10,
    height: 10,
    backgroundColor: primary,
    strokeColor: primary,
    fillStyle: "solid" as const,
    roughness: 0,
  },
];

const withGroup = (
  skeletons: ExcalidrawElementSkeleton[],
): ExcalidrawElementSkeleton[] => {
  const groupId = createId("group");
  return skeletons.map((skeleton) => ({ ...skeleton, groupIds: [groupId] }));
};

export const createTechnicalPreset = (
  preset: TechnicalPreset,
  x = 120,
  y = 100,
): readonly ExcalidrawElement[] => {
  let skeletons: ExcalidrawElementSkeleton[];
  switch (preset) {
    case "code-card":
      skeletons = [
        baseRect(x, y, 440, 260),
        ...trafficLights(x + 20, y + 20),
        text(x + 84, y + 14, "mcp.json", 18, muted),
        text(
          x + 26,
          y + 62,
          '{\n  "mcpServers": {\n    "flowink": { "command": "local" }\n  }\n}',
          20,
        ),
      ];
      break;
    case "terminal":
      skeletons = [
        baseRect(x, y, 460, 240),
        ...trafficLights(x + 20, y + 20),
        text(x + 84, y + 14, "Terminal", 18, muted),
        text(x + 26, y + 68, "$ yarn start:flowink", 21, primary),
        text(x + 26, y + 112, "✓ ready on localhost:4174", 19, ink),
      ];
      break;
    case "browser":
      skeletons = [
        baseRect(x, y, 520, 300),
        ...trafficLights(x + 20, y + 20),
        {
          ...baseRect(x + 20, y + 52, 480, 38),
          backgroundColor: "#0a0f0c",
          strokeWidth: 1,
        },
        text(x + 38, y + 60, "https://localhost:4174", 16, muted),
        text(x + 145, y + 150, "FLOWINK", 34, primary, FONT_FAMILY.Helvetica),
        text(
          x + 126,
          y + 206,
          "Technical stories, in motion.",
          18,
          ink,
          FONT_FAMILY.Helvetica,
        ),
      ];
      break;
    case "sticky-note":
      skeletons = [
        {
          type: "stickynote",
          x,
          y,
          width: 300,
          height: 220,
          strokeColor: "#203324",
          backgroundColor: "#d9ff74",
          label: {
            text: "WHY IT MATTERS\n\nExplain the decision, not only the syntax.",
            fontSize: 25,
            fontFamily: FONT_FAMILY.Excalifont,
          },
        },
      ];
      break;
    case "tech-card":
      skeletons = [
        baseRect(x, y, 340, 150),
        {
          type: "ellipse",
          x: x + 24,
          y: y + 28,
          width: 42,
          height: 42,
          backgroundColor: primary,
          strokeColor: primary,
          fillStyle: "solid",
          roughness: 0,
        },
        text(x + 84, y + 24, "FLOWINK ENGINE", 22, ink, FONT_FAMILY.Helvetica),
        text(x + 84, y + 62, "animation-core", 18, primary),
        text(x + 24, y + 108, "deterministic • local-first", 17, muted),
      ];
      break;
  }
  return convertToExcalidrawElements(withGroup(skeletons));
};

export interface FlowInkTemplateDefinition {
  id: string;
  name: string;
  description: string;
}

export const FLOWINK_TEMPLATES: FlowInkTemplateDefinition[] = [
  {
    id: "mcp",
    name: "MCP Explained",
    description: "Client, server and tool flow",
  },
  {
    id: "aws",
    name: "AWS Architecture",
    description: "Cloud service topology",
  },
  {
    id: "api",
    name: "API Request",
    description: "Request and response lifecycle",
  },
  {
    id: "database",
    name: "Database Architecture",
    description: "Application, cache and storage",
  },
  {
    id: "network",
    name: "Network",
    description: "Edge-to-origin network path",
  },
  {
    id: "security",
    name: "Cybersecurity",
    description: "Threat, control and audit",
  },
  {
    id: "auth",
    name: "Authentication",
    description: "OAuth-style identity flow",
  },
  {
    id: "microservices",
    name: "Microservices",
    description: "Services and event bus",
  },
];

const templateLabels: Record<string, readonly [string, string, string]> = {
  mcp: ["AI CLIENT", "MCP SERVER", "TOOLS"],
  aws: ["CLOUDFRONT", "LAMBDA", "DYNAMODB"],
  api: ["CLIENT", "API GATEWAY", "SERVICE"],
  database: ["APPLICATION", "CACHE", "DATABASE"],
  network: ["EDGE", "FIREWALL", "ORIGIN"],
  security: ["THREAT", "CONTROL", "EVIDENCE"],
  auth: ["USER", "IDENTITY", "RESOURCE"],
  microservices: ["SERVICE A", "EVENT BUS", "SERVICE B"],
};

export const createTemplateSlide = (templateId: string): FlowInkSlide => {
  const definition =
    FLOWINK_TEMPLATES.find((template) => template.id === templateId) ??
    FLOWINK_TEMPLATES[0];
  const labels = templateLabels[definition.id];
  const skeletons: ExcalidrawElementSkeleton[] = [
    text(
      120,
      80,
      definition.name.toUpperCase(),
      38,
      ink,
      FONT_FAMILY.Helvetica,
    ),
    text(120, 132, definition.description, 20, muted, FONT_FAMILY.Helvetica),
    ...labels.flatMap((label, index) => {
      const cardX = 120 + index * 390;
      return [
        baseRect(cardX, 300, 300, 170),
        {
          type: "ellipse" as const,
          x: cardX + 24,
          y: 330,
          width: 38,
          height: 38,
          backgroundColor: index === 1 ? primary : "#1c2d22",
          strokeColor: primary,
          fillStyle: "solid" as const,
          roughness: 0,
        },
        text(cardX + 82, 330, label, 23, ink, FONT_FAMILY.Helvetica),
        text(
          cardX + 24,
          405,
          index === 1 ? "orchestrates" : "sends / receives",
          17,
          muted,
        ),
      ];
    }),
    {
      type: "arrow",
      x: 430,
      y: 385,
      points: [pointFrom(0, 0), pointFrom(80, 0)],
      strokeColor: primary,
      strokeWidth: 3,
      roughness: 0,
      endArrowhead: "arrow",
    },
    {
      type: "arrow",
      x: 820,
      y: 385,
      points: [pointFrom(0, 0), pointFrom(80, 0)],
      strokeColor: primary,
      strokeWidth: 3,
      roughness: 0,
      endArrowhead: "arrow",
    },
    text(120, 620, "01  CONTEXT", 17, muted),
    text(480, 620, "02  EXCHANGE", 17, muted),
    text(840, 620, "03  OUTCOME", 17, muted),
  ];
  const slide = createSlide(definition.name);
  slide.scene.elements = convertToExcalidrawElements(
    skeletons,
  ) as unknown as FlowInkSceneElement[];
  slide.scene.appState.viewBackgroundColor = "#0b100d";
  return synchronizeElementMeta(slide);
};
