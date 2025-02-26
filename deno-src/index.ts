import { expose } from "@kunkun/api/runtime/deno";
import { API } from "../src/api.types.ts";
import { DatabaseSync } from "node:sqlite";

expose({
  async getRecentProjects(sqlitePath: string) {
    const db = new DatabaseSync(sqlitePath);
    const result = db
      .prepare("SELECT * FROM workspaces WHERE local_paths IS NOT NULL;")
      .all() as Array<{ local_paths: Uint8Array }>;
    let paths = result.map((r) =>
      new TextDecoder().decode(r.local_paths.slice(16))
    );
    return paths;
  },
} satisfies API);
