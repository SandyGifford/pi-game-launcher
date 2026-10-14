import express from "express";
import { LAUNCHABLES, LAUNCHABLES_MAP } from "./consts.ts";
import { APIError } from "./errors.ts";
import { isLaunchableId, launch, restart, shutdown } from "./utils.ts";
import { CLIENT_DIST_DIR, STATIC_DIR } from "@repo/shared-node";

const app = express();

app.post("/api/launch/:id", async (req, res) => {
	const res500 = (message: string) => res.status(500).send({ type: "ERROR", message });

	const id = req.params.id;
	if (!isLaunchableId(id)) {
		res500(`Invalid ID: ${id}`);
		return;
	}

	const launchable = LAUNCHABLES_MAP[id];

	// this shouldn't be possible, but it keeps TypeScript happy
	if (!launchable) {
		res500(`Could not find Launchable: ${id}`);
		return;
	}

	res.send(await launch(launchable));
});

app.get("/api/launchables", async (req, res) => res.send(LAUNCHABLES));

// eventually this will check for system updates
app.get("/api/needs-update", async (req, res) => res.send(false));

// eventually this will run system updates
app.post("/api/update", async (req, res) => res.send());

app.post("/api/shutdown", shutdown);
app.post("/api/restart", restart);

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

export { app };
