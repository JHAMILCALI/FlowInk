import { createFrameSchedule } from "./index";

describe("export runtime", () => {
  it("creates a deterministic frame schedule", () => {
    const frames = createFrameSchedule(2, 30);
    expect(frames).toHaveLength(60);
    expect(frames[0]).toEqual({ index: 0, time: 0, progress: 0 });
    expect(frames[59].progress).toBe(1);
  });
});
