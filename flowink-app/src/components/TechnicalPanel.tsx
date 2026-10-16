import { useRef } from "react";

import {
  CaptureUpdateAction,
  convertToExcalidrawElements,
} from "@excalidraw/excalidraw";
import type {
  BinaryFileData,
  ExcalidrawImperativeAPI,
} from "@excalidraw/excalidraw/types";
import { EmptyState, Panel } from "@flowink/ui";
import { createId, type FlowInkAsset } from "@flowink/project-schema";

import { readAsDataUrl } from "../services/files";
import {
  FLOWINK_TEMPLATES,
  createTechnicalPreset,
  createTemplateSlide,
  type TechnicalPreset,
} from "../services/presets";
import { useFlowInkStore } from "../stores/useFlowInkStore";
import { ImageIcon, LayersIcon, PlusIcon, SparkIcon } from "./Icons";

const presets: { id: TechnicalPreset; label: string; glyph: string }[] = [
  { id: "code-card", label: "Code Card", glyph: "{ }" },
  { id: "terminal", label: "Terminal", glyph: ">_" },
  { id: "browser", label: "Browser", glyph: "◎" },
  { id: "sticky-note", label: "Sticky Note", glyph: "▧" },
  { id: "tech-card", label: "Tech Card", glyph: "◉" },
];

const acceptedImageTypes = new Set([
  "image/svg+xml",
  "image/png",
  "image/jpeg",
  "image/webp",
]);

export const TechnicalPanel = ({
  api,
}: {
  api: ExcalidrawImperativeAPI | null;
}) => {
  const replaceSlide = useFlowInkStore((state) => state.replaceActiveSlide);
  const addAsset = useFlowInkStore((state) => state.addAsset);
  const assets = useFlowInkStore((state) =>
    Object.values(state.project.assets),
  );
  const fileInput = useRef<HTMLInputElement>(null);

  const insertAsset = (asset: FlowInkAsset) => {
    if (!api) return;
    const binary: BinaryFileData = {
      id: asset.id as BinaryFileData["id"],
      dataURL: asset.dataUrl as BinaryFileData["dataURL"],
      mimeType: asset.mimeType as BinaryFileData["mimeType"],
      created: Date.parse(asset.createdAt),
    };
    api.addFiles([binary]);

    const state = api.getAppState();
    const selectedImage = api
      .getSceneElements()
      .find(
        (element) =>
          element.type === "image" && state.selectedElementIds[element.id],
      );
    if (selectedImage?.type === "image") {
      api.mutateElement(selectedImage, { fileId: binary.id });
      return;
    }

    const element = convertToExcalidrawElements([
      {
        type: "image",
        x: state.width / (2 * state.zoom.value) - state.scrollX - 160,
        y: state.height / (2 * state.zoom.value) - state.scrollY - 90,
        width: 320,
        height: 180,
        fileId: binary.id,
      },
    ])[0];
    api.updateScene({
      elements: [...api.getSceneElements(), element],
      captureUpdate: CaptureUpdateAction.IMMEDIATELY,
    });
  };

  const insertPreset = (preset: TechnicalPreset) => {
    if (!api) {
      return;
    }
    const state = api.getAppState();
    const zoom = state.zoom.value;
    const centerX = state.width / (2 * zoom) - state.scrollX;
    const centerY = state.height / (2 * zoom) - state.scrollY;
    const elements = createTechnicalPreset(
      preset,
      centerX - 200,
      centerY - 120,
    );
    api.updateScene({
      elements: [...api.getSceneElements(), ...elements],
      captureUpdate: CaptureUpdateAction.IMMEDIATELY,
    });
    api.selection.select(elements.map((element) => element.id));
  };

  const addImage = async (file: File) => {
    if (!acceptedImageTypes.has(file.type)) {
      throw new Error("FlowInk accepts SVG, PNG, JPG and WebP images.");
    }
    const dataUrl = await readAsDataUrl(file);
    const id = createId("asset");
    const asset: FlowInkAsset = {
      id,
      name: file.name,
      mimeType: file.type as
        | "image/svg+xml"
        | "image/png"
        | "image/jpeg"
        | "image/webp",
      size: file.size,
      dataUrl,
      createdAt: new Date().toISOString(),
    };
    addAsset(asset);
    insertAsset(asset);
  };

  return (
    <aside className="fi-inspector">
      <Panel title="Technical blocks" actions={<LayersIcon />}>
        <div className="fi-preset-grid">
          {presets.map((preset) => (
            <button
              type="button"
              key={preset.id}
              onClick={() => insertPreset(preset.id)}
            >
              <span>{preset.glyph}</span>
              {preset.label}
            </button>
          ))}
        </div>
      </Panel>

      <Panel title="Assets" actions={<ImageIcon />}>
        <input
          ref={fileInput}
          hidden
          type="file"
          accept="image/svg+xml,image/png,image/jpeg,image/webp"
          onChange={(event) => {
            const file = event.currentTarget.files?.[0];
            if (file) {
              void addImage(file).catch((error: unknown) =>
                fileInput.current?.ownerDocument.defaultView?.alert(
                  error instanceof Error
                    ? error.message
                    : "Could not add image",
                ),
              );
            }
            event.currentTarget.value = "";
          }}
        />
        <button
          type="button"
          className="fi-drop-zone"
          onClick={() => fileInput.current?.click()}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            const file = event.dataTransfer.files[0];
            if (file) {
              void addImage(file).catch((error: unknown) =>
                fileInput.current?.ownerDocument.defaultView?.alert(
                  error instanceof Error
                    ? error.message
                    : "Could not add image",
                ),
              );
            }
          }}
        >
          <PlusIcon />
          <span>Drop image or browse</span>
          <small>SVG · PNG · JPG · WEBP</small>
        </button>
        {assets.length > 0 && (
          <div className="fi-recent-assets">
            {assets
              .slice(-4)
              .reverse()
              .map((asset) => (
                <button
                  key={asset.id}
                  type="button"
                  title="Insert, or replace the selected image"
                  onClick={() => insertAsset(asset)}
                >
                  <img src={asset.dataUrl} alt="" />
                  <span>{asset.name}</span>
                </button>
              ))}
          </div>
        )}
      </Panel>

      <Panel title="Templates" actions={<SparkIcon />}>
        <div className="fi-template-list">
          {FLOWINK_TEMPLATES.map((template) => (
            <button
              type="button"
              key={template.id}
              onClick={() => {
                const ownerWindow =
                  fileInput.current?.ownerDocument.defaultView;
                if (
                  api?.getSceneElements().length &&
                  !ownerWindow?.confirm(
                    "Replace this slide with the selected template?",
                  )
                ) {
                  return;
                }
                replaceSlide(createTemplateSlide(template.id));
              }}
            >
              <span className="fi-template-list__mark">
                <SparkIcon />
              </span>
              <span>
                <strong>{template.name}</strong>
                <small>{template.description}</small>
              </span>
            </button>
          ))}
        </div>
        {!FLOWINK_TEMPLATES.length && (
          <EmptyState icon={<SparkIcon />} title="No templates">
            Templates will appear here.
          </EmptyState>
        )}
      </Panel>
    </aside>
  );
};
