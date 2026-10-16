import {
  migrateProject,
  serializeProject,
  type FlowInkProject,
} from "@flowink/project-schema";

const DB_NAME = "flowink";
const DB_VERSION = 1;
const PROJECTS_STORE = "projects";
const META_STORE = "meta";
const LAST_PROJECT_KEY = "last-project";
const RECOVERY_KEY = "flowink-recovery";

const requestToPromise = <T>(request: IDBRequest<T>): Promise<T> =>
  new Promise((resolve, reject) => {
    request.addEventListener("success", () => resolve(request.result), {
      once: true,
    });
    request.addEventListener("error", () => reject(request.error), {
      once: true,
    });
  });

const transactionDone = (transaction: IDBTransaction): Promise<void> =>
  new Promise((resolve, reject) => {
    transaction.addEventListener("complete", () => resolve(), { once: true });
    transaction.addEventListener("error", () => reject(transaction.error), {
      once: true,
    });
    transaction.addEventListener("abort", () => reject(transaction.error), {
      once: true,
    });
  });

const openDatabase = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.addEventListener("upgradeneeded", () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(PROJECTS_STORE)) {
        database.createObjectStore(PROJECTS_STORE, { keyPath: "id" });
      }
      if (!database.objectStoreNames.contains(META_STORE)) {
        database.createObjectStore(META_STORE);
      }
    });
    request.addEventListener("success", () => resolve(request.result), {
      once: true,
    });
    request.addEventListener("error", () => reject(request.error), {
      once: true,
    });
  });

interface StoredProject {
  id: string;
  updatedAt: string;
  project: FlowInkProject;
}

export const saveProject = async (project: FlowInkProject): Promise<void> => {
  const database = await openDatabase();
  const transaction = database.transaction(
    [PROJECTS_STORE, META_STORE],
    "readwrite",
  );
  const storedProject: StoredProject = {
    id: project.metadata.createdAt,
    updatedAt: project.metadata.updatedAt,
    project,
  };
  transaction.objectStore(PROJECTS_STORE).put(storedProject);
  transaction
    .objectStore(META_STORE)
    .put(project.metadata.createdAt, LAST_PROJECT_KEY);
  await transactionDone(transaction);
  database.close();
  try {
    localStorage.setItem(RECOVERY_KEY, serializeProject(project));
  } catch {
    // IndexedDB remains authoritative when localStorage quota is exceeded.
  }
};

export const loadLastProject = async (): Promise<FlowInkProject | null> => {
  try {
    const database = await openDatabase();
    const transaction = database.transaction(
      [PROJECTS_STORE, META_STORE],
      "readonly",
    );
    const id = await requestToPromise(
      transaction.objectStore(META_STORE).get(LAST_PROJECT_KEY),
    );
    const stored = id
      ? await requestToPromise<StoredProject | undefined>(
          transaction.objectStore(PROJECTS_STORE).get(id),
        )
      : undefined;
    await transactionDone(transaction);
    database.close();
    return stored ? migrateProject(stored.project) : loadRecoveryProject();
  } catch {
    return loadRecoveryProject();
  }
};

export const loadRecentProjects = async (): Promise<FlowInkProject[]> => {
  const database = await openDatabase();
  const transaction = database.transaction(PROJECTS_STORE, "readonly");
  const records = await requestToPromise<StoredProject[]>(
    transaction.objectStore(PROJECTS_STORE).getAll(),
  );
  await transactionDone(transaction);
  database.close();
  return records
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 12)
    .map((record) => migrateProject(record.project));
};

const loadRecoveryProject = (): FlowInkProject | null => {
  try {
    const source = localStorage.getItem(RECOVERY_KEY);
    return source ? migrateProject(JSON.parse(source) as unknown) : null;
  } catch {
    return null;
  }
};
