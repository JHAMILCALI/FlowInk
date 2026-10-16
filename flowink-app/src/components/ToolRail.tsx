import { useState, type ReactElement } from "react";

import type {
  ExcalidrawImperativeAPI,
  ToolType,
} from "@excalidraw/excalidraw/types";
import { IconButton } from "@flowink/ui";

import {
  ArrowIcon,
  DiamondIcon,
  EllipseIcon,
  EraserIcon,
  ImageIcon,
  LineIcon,
  PenIcon,
  RectIcon,
  SelectIcon,
  SparkIcon,
  TextIcon,
} from "./Icons";

const tools: {
  type: ToolType;
  label: string;
  icon: ReactElement;
  shortcut: string;
}[] = [
  { type: "selection", label: "Select", icon: <SelectIcon />, shortcut: "V" },
  { type: "rectangle", label: "Rectangle", icon: <RectIcon />, shortcut: "R" },
  { type: "diamond", label: "Diamond", icon: <DiamondIcon />, shortcut: "D" },
  { type: "ellipse", label: "Ellipse", icon: <EllipseIcon />, shortcut: "O" },
  { type: "arrow", label: "Arrow", icon: <ArrowIcon />, shortcut: "A" },
  { type: "line", label: "Line", icon: <LineIcon />, shortcut: "L" },
  { type: "freedraw", label: "Draw", icon: <PenIcon />, shortcut: "P" },
  { type: "text", label: "Text", icon: <TextIcon />, shortcut: "T" },
  { type: "image", label: "Image", icon: <ImageIcon />, shortcut: "I" },
  { type: "eraser", label: "Eraser", icon: <EraserIcon />, shortcut: "E" },
];

export const ToolRail = ({ api }: { api: ExcalidrawImperativeAPI | null }) => {
  const [active, setActive] = useState<ToolType>("selection");
  return (
    <aside className="fi-tool-rail" aria-label="Drawing tools">
      <div className="fi-tool-rail__brand" title="FlowInk">
        <SparkIcon />
      </div>
      <div className="fi-tool-rail__divider" />
      {tools.map((tool) => (
        <div className="fi-tool-rail__item" key={tool.type}>
          <IconButton
            label={tool.label}
            icon={tool.icon}
            active={active === tool.type}
            onClick={() => {
              api?.setActiveTool({ type: tool.type });
              setActive(tool.type);
            }}
          />
          <kbd>{tool.shortcut}</kbd>
        </div>
      ))}
    </aside>
  );
};
