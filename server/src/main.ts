import express from "express";
import { CLIENT_DIST_DIR, LAUNCHABLES, LAUNCHABLES_MAP, STATIC_DIR } from "./consts.ts";
import { APIError } from "./errors.ts";
import { gitIsBehind, updateFromGit } from "./git.utils.ts";
import { updateFromNpm } from "./npm.utils.ts";
import { isLaunchableId, launch } from "./utils.ts";

const app = express();
const port = Number(process.env["PORT"] ?? 3000);

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

app.get("/api/needs-update", async (req, res) => {
	res.send(await gitIsBehind());
});

app.post("/api/update", async (req, res) => {
	await updateFromGit();
	await updateFromNpm();
	res.send();

	// exit once the response is sent; pm2 restarts the server on the new code
	res.on("finish", () => {
		server.close(() => process.exit(0));
		server.closeAllConnections();
	});
	setTimeout(() => process.exit(0), 5000).unref();
});

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

const server = app.listen(port, () => {
	console.log(`Server listening on port ${port}`);
});
