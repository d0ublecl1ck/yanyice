import { buildApp } from "./app";
import { getPort } from "./config";

const app = buildApp();
const port = getPort();

await app.listen({ port, host: "0.0.0.0" });
