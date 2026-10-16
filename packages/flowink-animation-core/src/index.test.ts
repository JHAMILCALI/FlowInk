import type {
  FlowInkAnimationTrack,
  FlowInkSceneElement,
  FlowInkStep,
} from "@flowink/project-schema";

import { easing, sampleCamera, sampleSequence, sampleTracks } from "./index";

const element: FlowInkSceneElement = {
  id: "box",
  type: "rectangle",
  x: 100,
  y: 80,
  width: 200,
  height: 100,
  angle: 0,
  opacity: 100,
};

describe("animation core", () => {
  it("keeps easing endpoints deterministic", () => {
    expect(easing("spring-soft", 0)).toBe(0);
    expect(easing("spring-snappy", 1)).toBe(1);
  });

  it("samples timeline keyframes", () => {
    const tracks: FlowInkAnimationTrack[] = [
      {
        id: "track",
        elementId: "box",
        property: "x",
        keyframes: [
          { id: "a", time: 0, value: 0, easing: "linear" },
          { id: "b", time: 2, value: 100, easing: "linear" },
        ],
      },
    ];
    expect(sampleTracks([element], tracks, 1).get("box")?.x).toBe(50);
  });

  it("reveals a slide-left sequence element", () => {
    const steps: FlowInkStep[] = [
      {
        id: "step",
        name: "Reveal",
        cameraKeyframeId: null,
        animations: [
          {
            id: "anim",
            elementId: "box",
            effect: "enter",
            preset: "slide-left",
            duration: 1,
            delay: 0,
            easing: "linear",
          },
        ],
      },
    ];
    expect(sampleSequence([element], steps, -1).get("box")?.opacity).toBe(0);
    expect(sampleSequence([element], steps, 0, 0.5).get("box")).toMatchObject({
      x: 40,
      opacity: 50,
    });
    expect(sampleSequence([element], steps, 0, 1).get("box")?.x).toBe(100);
  });

  it("samples camera keyframes", () => {
    const camera = sampleCamera(
      [
        {
          id: "a",
          name: "A",
          time: 0,
          x: 0,
          y: 0,
          zoom: 1,
          rotation: 0,
          duration: 1,
          easing: "linear",
        },
        {
          id: "b",
          name: "B",
          time: 2,
          x: 100,
          y: 50,
          zoom: 2,
          rotation: 0.2,
          duration: 1,
          easing: "linear",
        },
      ],
      1,
    );
    expect(camera).toEqual({ x: 50, y: 25, zoom: 1.5, rotation: 0.1 });
  });
});
