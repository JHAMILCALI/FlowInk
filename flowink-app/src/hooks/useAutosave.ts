import { useEffect } from "react";

import { saveProject } from "../services/persistence";
import { useFlowInkStore } from "../stores/useFlowInkStore";

export const useAutosave = (): void => {
  const project = useFlowInkStore((state) => state.project);
  const hydrated = useFlowInkStore((state) => state.hydrated);
  const setSaveStatus = useFlowInkStore((state) => state.setSaveStatus);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    setSaveStatus("saving");
    const timeout = window.setTimeout(() => {
      void saveProject(project)
        .then(() => setSaveStatus("saved"))
        .catch(() => setSaveStatus("error"));
    }, 500);
    return () => window.clearTimeout(timeout);
  }, [hydrated, project, setSaveStatus]);
};
