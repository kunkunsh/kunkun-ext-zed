import { DatabaseSync } from "node:sqlite";
import * as v from "@valibot/valibot";
import { exists } from "jsr:@std/fs/exists";
const db = new DatabaseSync(
  "/Users/hk/Library/Application Support/Zed/db/0-stable/db.sqlite"
);

const result = db
  .prepare("SELECT * FROM workspaces WHERE local_paths IS NOT NULL;")
  .all() as Array<{ local_paths: Uint8Array }>;

// Skip the first 16 bytes (8 bytes version + 8 bytes length) and decode only the path
console.log(
  result.map((r) => new TextDecoder().decode(r.local_paths.slice(16)))
);
// If you want to see the raw bytes for debugging
// console.log("Raw bytes:");
// console.log(
//   result.map((r) =>
//     Array.from(r.local_paths.slice(0, 16))
//       .map((b) => b.toString(16).padStart(2, "0"))
//       .join(" ")
//   )
// );
