import {
  parseProject,
  serializeProject,
  type FlowInkProject,
} from "@flowink/project-schema";

export const downloadBlob = (blob: Blob, fileName: string): void => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
};

export const downloadProject = (project: FlowInkProject): void => {
  const safeName =
    project.metadata.title
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "flowink-project";
  downloadBlob(
    new Blob([serializeProject(project)], { type: "application/json" }),
    `${safeName}.flowink`,
  );
};

export const importProjectFile = async (file: File): Promise<FlowInkProject> =>
  parseProject(await file.text());

export const readAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(String(reader.result)), {
      once: true,
    });
    reader.addEventListener("error", () => reject(reader.error), {
      once: true,
    });
    reader.readAsDataURL(file);
  });
