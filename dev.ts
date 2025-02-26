import db from "/Users/hk/Library/Application Support/Zed/db/0-stable/db.sqlite" with { "type": "sqlite" };

const query = db.query("SELECT * FROM workspaces WHERE local_paths IS NOT NULL;");

for (const row of query) {
    console.log(row.local_paths);
  console.log(new TextDecoder().decode(row.local_paths));
}

