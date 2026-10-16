import { useState } from "react";

import { getCommonBounds } from "@excalidraw/excalidraw";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import type { NonDeletedExcalidrawElement } from "@excalidraw/element/types";
import type {
  AnimationPreset,
  EasingName,
  SlideTransitionType,
} from "@flowink/project-schema";
import { Button, EmptyState, Field, IconButton, Panel } from "@flowink/ui";

import {
  getActiveSlide,
  useFlowInkStore,
  type StepDraft,
} from "../stores/useFlowInkStore";
import {
  CameraIcon,
  LayersIcon,
  PlusIcon,
  SparkIcon,
  TrashIcon,
} from "./Icons";

const presets: { value: AnimationPreset; label: string }[] = [
  { value: "fade", label: "Fade" },
  { value: "slide-left", label: "Slide Left" },
  { value: "slide-right", label: "Slide Right" },
  { value: "slide-up", label: "Slide Up" },
  { value: "slide-down", label: "Slide Down" },
  { value: "scale", label: "Scale" },
  { value: "pop", label: "Pop" },
  { value: "draw", label: "Draw" },
];

const easingOptions: { value: EasingName; label: string }[] = [
  { value: "linear", label: "Linear" },
  { value: "ease-in", label: "Ease In" },
  { value: "ease-out", label: "Ease Out" },
  { value: "ease-in-out", label: "Ease In Out" },
  { value: "spring-soft", label: "Spring Soft" },
  { value: "spring-snappy", label: "Spring Snappy" },
];

export const SequencePanel = ({
  api,
}: {
  api: ExcalidrawImperativeAPI | null;
}) => {
  const slide = useFlowInkStore(getActiveSlide);
  const selected = useFlowInkStore((state) => state.selectedElementIds);
  const addStep = useFlowInkStore((state) => state.addStep);
  const removeStep = useFlowInkStore((state) => state.removeStep);
  const setTransition = useFlowInkStore((state) => state.setTransition);
  const addCamera = useFlowInkStore((state) => state.addCameraKeyframe);
  const removeCamera = useFlowInkStore((state) => state.removeCameraKeyframe);
  const [draft, setDraft] = useState<StepDraft>({
    name: "",
    effect: "enter",
    preset: "fade",
    duration: 0.6,
    delay: 0,
    easing: "ease-out",
  });

  const captureCamera = () => {
    if (!api) {
      return;
    }
    const state = api.getAppState();
    const selectedElements = api
      .getSceneElements()
      .filter(
        (element) => state.selectedElementIds[element.id],
      ) as NonDeletedExcalidrawElement[];
    let x = state.width / (2 * state.zoom.value) - state.scrollX;
    let y = state.height / (2 * state.zoom.value) - state.scrollY;
    let zoom: number = state.zoom.value;
    if (selectedElements.length) {
      const [minX, minY, maxX, maxY] = getCommonBounds(selectedElements);
      x = (minX + maxX) / 2;
      y = (minY + maxY) / 2;
      zoom = Math.min(
        4,
        Math.max(
          0.1,
          Math.min(
            state.width / (maxX - minX + 240),
            state.height / (maxY - minY + 180),
          ),
        ),
      );
    }
    const time = slide.camera.keyframes.length
      ? Math.max(...slide.camera.keyframes.map((keyframe) => keyframe.time)) + 1
      : 0;
    addCamera({
      name: `Camera ${slide.camera.keyframes.length + 1}`,
      time,
      x,
      y,
      zoom,
      rotation: 0,
      duration: 0.8,
      easing: "ease-in-out",
    });
  };

  return (
    <aside className="fi-inspector fi-sequence-panel">
      <Panel title="Animation" actions={<SparkIcon />}>
        <div className="fi-selection-chip">
          <LayersIcon />{" "}
          {selected.length
            ? `${selected.length} selected`
            : "Select canvas objects"}
        </div>
        <Field label="Step name">
          <input
            value={draft.name}
            placeholder={`Step ${slide.steps.length + 1}`}
            onChange={(event) =>
              setDraft({ ...draft, name: event.target.value })
            }
          />
        </Field>
        <div className="fi-field-row">
          <Field label="Action">
            <select
              value={draft.effect}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  effect: event.target.value as StepDraft["effect"],
                })
              }
            >
              <option value="enter">Entry</option>
              <option value="exit">Exit</option>
            </select>
          </Field>
          <Field label="Preset">
            <select
              value={draft.preset}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  preset: event.target.value as AnimationPreset,
                })
              }
            >
              {presets.map((preset) => (
                <option key={preset.value} value={preset.value}>
                  {preset.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="fi-field-row">
          <Field label="Duration">
            <input
              type="number"
              min="0.05"
              step="0.05"
              value={draft.duration}
              onChange={(event) =>
                setDraft({ ...draft, duration: Number(event.target.value) })
              }
            />
          </Field>
          <Field label="Delay">
            <input
              type="number"
              min="0"
              step="0.05"
              value={draft.delay}
              onChange={(event) =>
                setDraft({ ...draft, delay: Number(event.target.value) })
              }
            />
          </Field>
        </div>
        <Field label="Easing">
          <select
            value={draft.easing}
            onChange={(event) =>
              setDraft({ ...draft, easing: event.target.value as EasingName })
            }
          >
            {easingOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
        <Button
          variant="primary"
          disabled={!selected.length}
          onClick={() => {
            addStep(draft);
            setDraft({ ...draft, name: "" });
          }}
        >
          <PlusIcon /> Add step
        </Button>
      </Panel>

      <Panel title={`Sequence · ${slide.steps.length}`}>
        {slide.steps.length ? (
          <ol className="fi-step-list">
            {slide.steps.map((step, index) => (
              <li key={step.id}>
                <span className="fi-step-list__number">{index + 1}</span>
                <span>
                  <strong>{step.name}</strong>
                  <small>
                    {step.animations[0]?.preset ?? "camera"} ·{" "}
                    {step.animations.length} object(s)
                  </small>
                </span>
                <IconButton
                  label="Remove step"
                  icon={<TrashIcon />}
                  onClick={() => removeStep(step.id)}
                />
              </li>
            ))}
          </ol>
        ) : (
          <EmptyState icon={<SparkIcon />} title="Build the explanation">
            Select objects, choose an effect and add the first step.
          </EmptyState>
        )}
      </Panel>

      <Panel title="Camera" actions={<CameraIcon />}>
        <Button variant="secondary" onClick={captureCamera}>
          <PlusIcon /> Camera frame
        </Button>
        <div className="fi-camera-list">
          {slide.camera.keyframes.map((keyframe) => (
            <div key={keyframe.id}>
              <span>
                <strong>{keyframe.name}</strong>
                <small>
                  {keyframe.zoom.toFixed(2)}× · {keyframe.time.toFixed(1)}s
                </small>
              </span>
              <IconButton
                label="Remove camera frame"
                icon={<TrashIcon />}
                onClick={() => removeCamera(keyframe.id)}
              />
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Slide transition">
        <Field label="Transition">
          <select
            value={slide.transition.type}
            onChange={(event) =>
              setTransition(event.target.value as SlideTransitionType)
            }
          >
            <option value="cut">Cut</option>
            <option value="fade">Fade</option>
            <option value="push-left">Push Left</option>
            <option value="push-right">Push Right</option>
            <option value="zoom">Zoom</option>
            <option value="camera">Camera</option>
            <option value="smart">Smart Transition</option>
          </select>
        </Field>
      </Panel>
    </aside>
  );
};
