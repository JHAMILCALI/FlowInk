import { createProject } from "@flowink/project-schema";

import { buildTimelineScene } from "./index";

describe("player runtime", () => {
  it("applies scale around an element center", () => {
    const slide = createProject().slides[0];
    slide.scene.elements = [
      {
        id: "box",
        type: "rectangle",
        x: 10,
        y: 20,
        width: 100,
        height: 50,
        angle: 0,
        opacity: 100,
      },
    ];
    slide.timeline.tracks = [
      {
        id: "track",
        elementId: "box",
        property: "scaleX",
        keyframes: [{ id: "key", time: 0, value: 0.5, easing: "linear" }],
      },
    ];
    expect(buildTimelineScene(slide, 0)[0]).toMatchObject({ x: 35, width: 50 });
  });
});
