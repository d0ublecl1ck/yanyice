import { buildApp } from "./app";
import { getDatabaseUrl, getPort } from "./config";
import { ensureDatabaseSchema } from "./db/ensureDatabaseSchema";

const databaseUrl = getDatabaseUrl();
await ensureDatabaseSchema(databaseUrl);

const app = buildApp({ databaseUrl });
const port = getPort();

await app.listen({ port, host: "0.0.0.0" });
