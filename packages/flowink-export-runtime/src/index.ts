export interface FrameDescriptor {
  index: number;
  time: number;
  progress: number;
}

export interface RecordCanvasOptions {
  canvas: HTMLCanvasElement;
  duration: number;
  fps: number;
  mimeType: string;
  renderFrame: (frame: FrameDescriptor) => void | Promise<void>;
  onProgress?: (progress: number) => void;
  signal?: AbortSignal;
}

export const createFrameSchedule = (
  duration: number,
  fps: number,
): FrameDescriptor[] => {
  const safeDuration = Math.max(0, duration);
  const safeFps = Math.max(1, Math.round(fps));
  const frameCount = Math.max(1, Math.ceil(safeDuration * safeFps));
  return Array.from({ length: frameCount }, (_, index) => ({
    index,
    time: index / safeFps,
    progress: frameCount === 1 ? 1 : index / (frameCount - 1),
  }));
};

const nextAnimationFrame = () =>
  new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

export const recordCanvas = async ({
  canvas,
  duration,
  fps,
  mimeType,
  renderFrame,
  onProgress,
  signal,
}: RecordCanvasOptions): Promise<Blob> => {
  if (typeof MediaRecorder === "undefined") {
    throw new Error("MediaRecorder is not available in this browser.");
  }
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    throw new Error(`The browser cannot encode ${mimeType}.`);
  }

  const stream = canvas.captureStream(fps);
  const recorder = new MediaRecorder(stream, { mimeType });
  const chunks: BlobPart[] = [];
  const completed = new Promise<Blob>((resolve, reject) => {
    recorder.addEventListener("dataavailable", (event) => {
      if (event.data.size) {
        chunks.push(event.data);
      }
    });
    recorder.addEventListener("stop", () =>
      resolve(new Blob(chunks, { type: mimeType })),
    );
    recorder.addEventListener("error", () =>
      reject(new Error("The browser video encoder reported an error.")),
    );
  });

  const abort = () => recorder.state !== "inactive" && recorder.stop();
  signal?.addEventListener("abort", abort, { once: true });
  recorder.start();
  try {
    const frames = createFrameSchedule(duration, fps);
    for (const frame of frames) {
      if (signal?.aborted) {
        throw new DOMException("Export cancelled", "AbortError");
      }
      await renderFrame(frame);
      onProgress?.((frame.index + 1) / frames.length);
      await nextAnimationFrame();
    }
  } finally {
    signal?.removeEventListener("abort", abort);
    if (recorder.state !== "inactive") {
      recorder.stop();
    }
    stream.getTracks().forEach((track) => track.stop());
  }
  return completed;
};
