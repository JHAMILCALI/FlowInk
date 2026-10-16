import { sampleSequence, sampleTracks } from "@flowink/animation-core";
import { sampleSmartTransition } from "@flowink/presentation-core";
import type {
  FlowInkSceneElement,
  FlowInkSlide,
} from "@flowink/project-schema";

import type { SampledProperties } from "@flowink/animation-core";

type Point = readonly [number, number];

const isPoint = (value: unknown): value is Point =>
  Array.isArray(value) &&
  value.length >= 2 &&
  typeof value[0] === "number" &&
  typeof value[1] === "number";

const trimPoints = (value: unknown, progress: number): unknown => {
  if (!Array.isArray(value) || value.length < 2 || !value.every(isPoint)) {
    return value;
  }
  if (progress >= 1) {
    return value;
  }
  const points = value as Point[];
  const lengths = points
    .slice(1)
    .map((point, index) =>
      Math.hypot(point[0] - points[index][0], point[1] - points[index][1]),
    );
  const total = lengths.reduce((sum, length) => sum + length, 0);
  const target = total * Math.max(0, progress);
  const result: [number, number][] = [[points[0][0], points[0][1]]];
  let travelled = 0;
  for (let index = 0; index < lengths.length; index++) {
    const segment = lengths[index];
    if (travelled + segment <= target) {
      result.push([points[index + 1][0], points[index + 1][1]]);
      travelled += segment;
      continue;
    }
    const ratio = segment === 0 ? 0 : (target - travelled) / segment;
    result.push([
      points[index][0] + (points[index + 1][0] - points[index][0]) * ratio,
      points[index][1] + (points[index + 1][1] - points[index][1]) * ratio,
    ]);
    break;
  }
  return result;
};

export const applySample = (
  element: FlowInkSceneElement,
  sample: SampledProperties,
): FlowInkSceneElement => {
  const nextWidth = element.width * sample.scaleX;
  const nextHeight = element.height * sample.scaleY;
  const next: FlowInkSceneElement = {
    ...element,
    x: sample.x + (element.width - nextWidth) / 2,
    y: sample.y + (element.height - nextHeight) / 2,
    width: nextWidth,
    height: nextHeight,
    angle: sample.rotation,
    opacity: Math.min(100, Math.max(0, sample.opacity)),
  };
  if ("points" in element && sample.drawProgress < 1) {
    next.points = trimPoints(element.points, sample.drawProgress);
  }
  return next;
};

const applySamples = (
  elements: readonly FlowInkSceneElement[],
  samples: ReadonlyMap<string, SampledProperties>,
): FlowInkSceneElement[] =>
  elements.map((element) => {
    const sample = samples.get(element.id);
    return sample ? applySample(element, sample) : { ...element };
  });

export const buildSequenceScene = (
  slide: FlowInkSlide,
  stepIndex: number,
  stepProgress = 1,
): FlowInkSceneElement[] =>
  applySamples(
    slide.scene.elements,
    sampleSequence(slide.scene.elements, slide.steps, stepIndex, stepProgress),
  );

export const buildTimelineScene = (
  slide: FlowInkSlide,
  time: number,
): FlowInkSceneElement[] =>
  applySamples(
    slide.scene.elements,
    sampleTracks(slide.scene.elements, slide.timeline.tracks, time),
  );

export const buildSmartTransitionScene = (
  from: FlowInkSlide,
  to: FlowInkSlide,
  progress: number,
): FlowInkSceneElement[] => sampleSmartTransition(from, to, progress);
