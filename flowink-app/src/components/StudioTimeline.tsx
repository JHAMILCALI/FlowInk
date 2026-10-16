import { useEffect, useMemo, useRef, useState } from "react";

import type { AnimatableProperty, EasingName } from "@flowink/project-schema";
import { Button, EmptyState, Field, IconButton } from "@flowink/ui";

import { getActiveSlide, useFlowInkStore } from "../stores/useFlowInkStore";
import {
  CopyIcon,
  LayersIcon,
  PauseIcon,
  PlayIcon,
  PlusIcon,
  TrashIcon,
} from "./Icons";

const properties: { value: AnimatableProperty; label: string }[] = [
  { value: "opacity", label: "Opacity" },
  { value: "x", label: "Position X" },
  { value: "y", label: "Position Y" },
  { value: "scaleX", label: "Scale X" },
  { value: "scaleY", label: "Scale Y" },
  { value: "rotation", label: "Rotation" },
  { value: "drawProgress", label: "Draw progress" },
];

const defaultValueFor = (
  property: AnimatableProperty,
  element:
    | ReturnType<typeof getActiveSlide>["scene"]["elements"][number]
    | undefined,
): number => {
  if (property === "opacity") return element?.opacity ?? 100;
  if (property === "x") return element?.x ?? 0;
  if (property === "y") return element?.y ?? 0;
  if (property === "rotation") return element?.angle ?? 0;
  return 1;
};

export const StudioTimeline = () => {
  const slide = useFlowInkStore(getActiveSlide);
  const selectedIds = useFlowInkStore((state) => state.selectedElementIds);
  const playhead = useFlowInkStore((state) => state.playhead);
  const isPlaying = useFlowInkStore((state) => state.isPlaying);
  const loop = useFlowInkStore((state) => state.loop);
  const setPlayhead = useFlowInkStore((state) => state.setPlayhead);
  const setPlaying = useFlowInkStore((state) => state.setPlaying);
  const setLoop = useFlowInkStore((state) => state.setLoop);
  const addKeyframe = useFlowInkStore((state) => state.addTimelineKeyframe);
  const updateKeyframeTime = useFlowInkStore(
    (state) => state.updateKeyframeTime,
  );
  const removeTrack = useFlowInkStore((state) => state.removeTrack);
  const copyTrack = useFlowInkStore((state) => state.copyTrack);
  const pasteTrack = useFlowInkStore((state) => state.pasteTrack);
  const [property, setProperty] = useState<AnimatableProperty>("opacity");
  const selectedElement = slide.scene.elements.find(
    (element) => element.id === selectedIds[0],
  );
  const [value, setValue] = useState(() =>
    defaultValueFor(property, selectedElement),
  );
  const [easing, setEasing] = useState<EasingName>("ease-in-out");
  const [zoom, setZoom] = useState(1);
  const startRef = useRef<{ clock: number; time: number } | null>(null);

  useEffect(() => {
    setValue(defaultValueFor(property, selectedElement));
  }, [property, selectedElement]);

  useEffect(() => {
    if (!isPlaying) {
      startRef.current = null;
      return;
    }
    startRef.current = { clock: performance.now(), time: playhead };
    let frame = 0;
    const tick = (clock: number) => {
      const start = startRef.current;
      if (!start) return;
      let next = start.time + (clock - start.clock) / 1000;
      if (next >= slide.timeline.duration) {
        if (loop) {
          next %= slide.timeline.duration;
          startRef.current = { clock, time: next };
        } else {
          setPlayhead(slide.timeline.duration);
          setPlaying(false);
          return;
        }
      }
      setPlayhead(next);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [isPlaying, loop, setPlayhead, setPlaying, slide.timeline.duration]);

  const ticks = useMemo(
    () =>
      Array.from(
        { length: Math.floor(slide.timeline.duration) + 1 },
        (_, index) => index,
      ),
    [slide.timeline.duration],
  );

  return (
    <section
      className="fi-timeline"
      style={{ "--timeline-zoom": zoom } as React.CSSProperties}
    >
      <header className="fi-timeline__toolbar">
        <div className="fi-timeline__transport">
          <IconButton
            label={isPlaying ? "Pause" : "Play"}
            icon={isPlaying ? <PauseIcon /> : <PlayIcon />}
            active={isPlaying}
            onClick={() => setPlaying(!isPlaying)}
          />
          <button
            type="button"
            className={`fi-loop-button ${loop ? "is-active" : ""}`}
            onClick={() => setLoop(!loop)}
          >
            LOOP
          </button>
          <output>{playhead.toFixed(2)}s</output>
        </div>
        <div className="fi-timeline__add">
          <Field label="Property">
            <select
              value={property}
              onChange={(event) =>
                setProperty(event.target.value as AnimatableProperty)
              }
            >
              {properties.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Value">
            <input
              type="number"
              step="0.1"
              value={value}
              onChange={(event) => setValue(Number(event.target.value))}
            />
          </Field>
          <Field label="Easing">
            <select
              value={easing}
              onChange={(event) => setEasing(event.target.value as EasingName)}
            >
              <option value="linear">Linear</option>
              <option value="ease-in">Ease In</option>
              <option value="ease-out">Ease Out</option>
              <option value="ease-in-out">Ease In Out</option>
              <option value="spring-soft">Spring Soft</option>
              <option value="spring-snappy">Spring Snappy</option>
            </select>
          </Field>
          <Button
            variant="primary"
            disabled={!selectedIds.length}
            onClick={() => addKeyframe(property, playhead, value, easing)}
          >
            <PlusIcon /> Keyframe
          </Button>
          <Button
            variant="ghost"
            disabled={!selectedIds.length}
            onClick={pasteTrack}
          >
            Paste track
          </Button>
        </div>
        <label className="fi-timeline__zoom">
          Zoom{" "}
          <input
            type="range"
            min="0.7"
            max="2.5"
            step="0.1"
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
          />
        </label>
      </header>

      <div className="fi-timeline__body">
        <div className="fi-timeline__labels">
          <div className="fi-timeline__corner">TRACKS</div>
          {slide.timeline.tracks.map((track) => {
            const element = slide.scene.elements.find(
              (candidate) => candidate.id === track.elementId,
            );
            return (
              <div key={track.id} className="fi-track-label">
                <span>
                  <strong>{element?.type ?? "element"}</strong>
                  <small>{track.property}</small>
                </span>
                <IconButton
                  label="Copy track"
                  icon={<CopyIcon />}
                  onClick={() => copyTrack(track.id)}
                />
                <IconButton
                  label="Delete track"
                  icon={<TrashIcon />}
                  onClick={() => removeTrack(track.id)}
                />
              </div>
            );
          })}
        </div>
        <div className="fi-timeline__scroll">
          <div className="fi-timeline__canvas">
            <div
              className="fi-ruler"
              onClick={(event) => {
                const rect = event.currentTarget.getBoundingClientRect();
                setPlayhead(
                  ((event.clientX - rect.left) / rect.width) *
                    slide.timeline.duration,
                );
              }}
            >
              {ticks.map((tick) => (
                <span
                  key={tick}
                  style={{ left: `${(tick / slide.timeline.duration) * 100}%` }}
                >
                  {tick}
                </span>
              ))}
            </div>
            <div
              className="fi-playhead"
              style={{ left: `${(playhead / slide.timeline.duration) * 100}%` }}
            />
            {slide.timeline.tracks.map((track) => (
              <div className="fi-track" key={track.id}>
                {track.keyframes.map((keyframe) => (
                  <input
                    key={keyframe.id}
                    className="fi-keyframe-range"
                    aria-label={`${
                      track.property
                    } keyframe at ${keyframe.time.toFixed(2)} seconds`}
                    type="range"
                    min="0"
                    max={slide.timeline.duration}
                    step="0.25"
                    value={keyframe.time}
                    title={`${keyframe.value} @ ${keyframe.time.toFixed(2)}s`}
                    onChange={(event) =>
                      updateKeyframeTime(
                        track.id,
                        keyframe.id,
                        Number(event.target.value),
                      )
                    }
                  />
                ))}
              </div>
            ))}
            {!slide.timeline.tracks.length && (
              <EmptyState icon={<LayersIcon />} title="No animation tracks">
                Select an object, place the playhead and add a keyframe.
              </EmptyState>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
