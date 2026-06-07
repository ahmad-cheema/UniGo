require("dotenv/config");

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const migrationTableSql = `
CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
  "id" VARCHAR(36) PRIMARY KEY,
  "checksum" VARCHAR(64) NOT NULL,
  "finished_at" TIMESTAMPTZ,
  "migration_name" VARCHAR(255) NOT NULL,
  "logs" TEXT,
  "rolled_back_at" TIMESTAMPTZ,
  "started_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "applied_steps_count" INTEGER NOT NULL DEFAULT 0
)
`;

async function main() {
  const client = new Client({ connectionString });
  const migrationsRoot = path.join(process.cwd(), "prisma", "migrations");
  const migrationNames = fs
    .readdirSync(migrationsRoot)
    .filter((name) =>
      fs.existsSync(path.join(migrationsRoot, name, "migration.sql"))
    )
    .sort();

  await client.connect();
  await client.query(migrationTableSql);

  const appliedRows = await client.query(
    'SELECT "migration_name" FROM "_prisma_migrations" WHERE "rolled_back_at" IS NULL'
  );
  const applied = new Set(appliedRows.rows.map((row) => row.migration_name));

  for (const migrationName of migrationNames) {
    if (applied.has(migrationName)) {
      console.log(`skip ${migrationName}`);
      continue;
    }

    const sql = fs.readFileSync(
      path.join(migrationsRoot, migrationName, "migration.sql"),
      "utf8"
    );
    const checksum = crypto.createHash("sha256").update(sql).digest("hex");

    await client.query("BEGIN");
    try {
      await client.query(sql);
      await client.query(
        `INSERT INTO "_prisma_migrations"
          ("id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count")
         VALUES ($1, $2, now(), $3, null, null, now(), 1)`,
        [crypto.randomUUID(), checksum, migrationName]
      );
      await client.query("COMMIT");
      console.log(`applied ${migrationName}`);
    } catch (error) {
      await client.query("ROLLBACK");
      throw new Error(`${migrationName}: ${error.message}`);
    }
  }

  await client.end();
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
