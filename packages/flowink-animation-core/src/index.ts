import type {
  EasingName,
  FlowInkAnimationTrack,
  FlowInkCameraKeyframe,
  FlowInkKeyframe,
  FlowInkSceneElement,
  FlowInkStep,
  FlowInkStepAnimation,
} from "@flowink/project-schema";

export interface SampledProperties {
  opacity: number;
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
  drawProgress: number;
}

export interface CameraSample {
  x: number;
  y: number;
  zoom: number;
  rotation: number;
}

export const clamp01 = (value: number): number =>
  Math.min(1, Math.max(0, value));

export const easing = (name: EasingName, progress: number): number => {
  const t = clamp01(progress);
  if (t === 0 || t === 1) {
    return t;
  }
  switch (name) {
    case "linear":
      return t;
    case "ease-in":
      return t * t;
    case "ease-out":
      return 1 - (1 - t) * (1 - t);
    case "ease-in-out":
      return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    case "spring-soft": {
      const value = 1 - Math.exp(-6 * t) * Math.cos(8 * t);
      return clamp01(value);
    }
    case "spring-snappy": {
      const value = 1 - Math.exp(-9 * t) * Math.cos(13 * t);
      return clamp01(value);
    }
  }
};

export const interpolate = (
  from: number,
  to: number,
  progress: number,
): number => from + (to - from) * progress;

const orderedKeyframes = (keyframes: readonly FlowInkKeyframe[]) =>
  [...keyframes].sort((a, b) => a.time - b.time);

export const sampleKeyframes = (
  keyframes: readonly FlowInkKeyframe[],
  time: number,
): number | undefined => {
  const ordered = orderedKeyframes(keyframes);
  if (!ordered.length) {
    return undefined;
  }
  if (time <= ordered[0].time) {
    return ordered[0].value;
  }
  const last = ordered[ordered.length - 1];
  if (time >= last.time) {
    return last.value;
  }

  for (let index = 0; index < ordered.length - 1; index++) {
    const from = ordered[index];
    const to = ordered[index + 1];
    if (time >= from.time && time <= to.time) {
      const duration = Math.max(Number.EPSILON, to.time - from.time);
      const progress = easing(to.easing, (time - from.time) / duration);
      return interpolate(from.value, to.value, progress);
    }
  }
  return last.value;
};

export const getBaseProperties = (
  element: FlowInkSceneElement,
): SampledProperties => ({
  opacity: element.opacity,
  x: element.x,
  y: element.y,
  scaleX: 1,
  scaleY: 1,
  rotation: element.angle,
  drawProgress: 1,
});

export const sampleTracks = (
  elements: readonly FlowInkSceneElement[],
  tracks: readonly FlowInkAnimationTrack[],
  time: number,
): Map<string, SampledProperties> => {
  const samples = new Map(
    elements.map((element) => [element.id, getBaseProperties(element)]),
  );

  for (const track of tracks) {
    const sample = samples.get(track.elementId);
    const value = sampleKeyframes(track.keyframes, time);
    if (!sample || value === undefined) {
      continue;
    }
    sample[track.property] = value;
  }
  return samples;
};

const presetStart = (
  animation: FlowInkStepAnimation,
  base: SampledProperties,
): SampledProperties => {
  const start = { ...base };
  switch (animation.preset) {
    case "fade":
      start.opacity = 0;
      break;
    case "slide-left":
      start.opacity = 0;
      start.x -= 120;
      break;
    case "slide-right":
      start.opacity = 0;
      start.x += 120;
      break;
    case "slide-up":
      start.opacity = 0;
      start.y -= 90;
      break;
    case "slide-down":
      start.opacity = 0;
      start.y += 90;
      break;
    case "scale":
      start.opacity = 0;
      start.scaleX = 0.55;
      start.scaleY = 0.55;
      break;
    case "pop":
      start.opacity = 0;
      start.scaleX = 0.25;
      start.scaleY = 0.25;
      start.rotation -= 0.08;
      break;
    case "draw":
      start.drawProgress = 0;
      start.opacity = 100;
      break;
  }
  return start;
};

const mixProperties = (
  from: SampledProperties,
  to: SampledProperties,
  progress: number,
): SampledProperties => ({
  opacity: interpolate(from.opacity, to.opacity, progress),
  x: interpolate(from.x, to.x, progress),
  y: interpolate(from.y, to.y, progress),
  scaleX: interpolate(from.scaleX, to.scaleX, progress),
  scaleY: interpolate(from.scaleY, to.scaleY, progress),
  rotation: interpolate(from.rotation, to.rotation, progress),
  drawProgress: interpolate(from.drawProgress, to.drawProgress, progress),
});

const animationProgress = (
  animation: FlowInkStepAnimation,
  stepProgress: number,
): number => {
  const total = Math.max(animation.delay + animation.duration, Number.EPSILON);
  const elapsed = stepProgress * total;
  return easing(
    animation.easing,
    (elapsed - animation.delay) / Math.max(animation.duration, Number.EPSILON),
  );
};

export const getStepDuration = (step: FlowInkStep): number =>
  Math.max(
    0.1,
    ...step.animations.map((animation) => animation.delay + animation.duration),
  );

export const sampleSequence = (
  elements: readonly FlowInkSceneElement[],
  steps: readonly FlowInkStep[],
  stepIndex: number,
  stepProgress = 1,
): Map<string, SampledProperties> => {
  const samples = new Map(
    elements.map((element) => [element.id, getBaseProperties(element)]),
  );

  const animationsByElement = new Map<
    string,
    { step: number; animation: FlowInkStepAnimation }[]
  >();
  steps.forEach((step, index) => {
    step.animations.forEach((animation) => {
      const list = animationsByElement.get(animation.elementId) ?? [];
      list.push({ step: index, animation });
      animationsByElement.set(animation.elementId, list);
    });
  });

  for (const [elementId, entries] of animationsByElement) {
    const base = samples.get(elementId);
    if (!base) {
      continue;
    }
    let current = { ...base };
    for (const entry of entries) {
      const start = presetStart(entry.animation, base);
      const before = entry.animation.effect === "enter" ? start : base;
      const after = entry.animation.effect === "enter" ? base : start;

      if (entry.step > stepIndex) {
        if (entry.animation.effect === "enter") {
          current = before;
        }
        continue;
      }
      if (entry.step < stepIndex) {
        current = after;
        continue;
      }
      current = mixProperties(
        before,
        after,
        animationProgress(entry.animation, stepProgress),
      );
    }
    samples.set(elementId, current);
  }
  return samples;
};

export const sampleCamera = (
  keyframes: readonly FlowInkCameraKeyframe[],
  time: number,
): CameraSample | null => {
  const ordered = [...keyframes].sort((a, b) => a.time - b.time);
  if (!ordered.length) {
    return null;
  }
  if (time <= ordered[0].time) {
    const first = ordered[0];
    return {
      x: first.x,
      y: first.y,
      zoom: first.zoom,
      rotation: first.rotation,
    };
  }
  const last = ordered[ordered.length - 1];
  if (time >= last.time) {
    return { x: last.x, y: last.y, zoom: last.zoom, rotation: last.rotation };
  }

  for (let index = 0; index < ordered.length - 1; index++) {
    const from = ordered[index];
    const to = ordered[index + 1];
    if (time >= from.time && time <= to.time) {
      const progress = easing(
        to.easing,
        (time - from.time) / Math.max(to.time - from.time, Number.EPSILON),
      );
      return {
        x: interpolate(from.x, to.x, progress),
        y: interpolate(from.y, to.y, progress),
        zoom: interpolate(from.zoom, to.zoom, progress),
        rotation: interpolate(from.rotation, to.rotation, progress),
      };
    }
  }
  return null;
};
