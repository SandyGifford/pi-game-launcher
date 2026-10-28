import { CLIENT_DIST_DIR, STATIC_DIR } from "@repo/shared-node";
import express from "express";
import { api } from "./api/index.ts";
import { APIError } from "./errors.ts";

export const app = express();

app.use("/api", api);

// icons and other static assets, then the built client (see client/vite.config.ts)
app.use(express.static(STATIC_DIR));
app.use(express.static(CLIENT_DIST_DIR));

// default error handler; must be registered last and keep all four parameters
app.use((err: unknown, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (res.headersSent) {
    next(err);
    return;
  }
  if (err instanceof APIError) res.status(500).send({ type: "ERROR", message: err.message });
  else res.status(500).send();
});
