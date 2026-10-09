import type { Launchable, LaunchableID } from "@repo/shared";
import { carryOutLaunchAction } from "./utils";

export const launch = async (id: LaunchableID): Promise<void> => {
	const action = await fetch(`/api/launch/${id}`, { method: "POST" }).then((r) => r.json());
	carryOutLaunchAction(action);
};

const waitForServer = async () => {
	// give the server time to go down before polling for it to come back
	await new Promise((r) => setTimeout(r, 1000));
	for (;;) {
		try {
			if ((await fetch("/api/launchables", { cache: "no-store" })).ok) return;
		} catch {
			// server is still restarting
		}
		await new Promise((r) => setTimeout(r, 500));
	}
};

export const updateAndReload = async (): Promise<void> => {
	const res = await fetch("/api/update", { method: "POST" });
	if (!res.ok) throw new Error("Update failed");
	await waitForServer();
	location.reload();
};

export const getLaunchables = async (): Promise<readonly Launchable[]> =>
	fetch("/api/launchables").then((r) => r.json());
