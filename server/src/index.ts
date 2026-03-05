import "dotenv/config";

import { buildApp } from "./app";
import { getDatabaseConfig, getPort } from "./config";
import { ensureDatabaseSchema } from "./db/ensureDatabaseSchema";

const database = getDatabaseConfig();
await ensureDatabaseSchema(database.url);

const app = buildApp({ databaseUrl: database.url });
const port = getPort();

await app.listen({ port, host: "0.0.0.0" });
