import express from "express";
import { CLIENT_DIR, LAUNCHABLES, LAUNCHABLES_MAP, STATIC_DIR } from "./consts.ts";
import { isLaunchableId, launch } from "./utils.ts";

const app = express();
const port = Number(process.env["PORT"] ?? 3000);

app.post("/api/launch/:id", async (req, res) => {
	const res500 = (message: string) => {
		res.status(500);
		res.render("error", { message });
	};

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

// icons and other static assets, then the built client (see client/vite.config.ts)
app.use(express.static(STATIC_DIR));
app.use(express.static(CLIENT_DIR));

app.listen(port, () => {
	console.log(`Server listening on port ${port}`);
});
