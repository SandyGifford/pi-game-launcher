import { awaitTime, type Launchable, type LaunchableID } from "@repo/shared";
import { carryOutLaunchAction } from "./utils/carryOutLaunchAction.util";

export const launch = async (id: LaunchableID): Promise<void> => {
	const action = await fetch(`/api/launch/${id}`, { method: "POST" }).then((r) => r.json());
	carryOutLaunchAction(action);
};

const waitForServer = async () => {
	// give the server time to go down before polling for it to come back
	await awaitTime(1000);
	for (;;) {
		try {
			if ((await fetch("/api/launchables", { cache: "no-store" })).ok) return;
		} catch {
			// server is still restarting
		}
		await awaitTime(500);
	}
};

export const updateAndReload = async (): Promise<void> => {
	await fetch("/api/update", { method: "POST" });
	await waitForServer();
	location.reload();
};

export const getLaunchables = async (): Promise<readonly Launchable[]> =>
	fetch("/api/launchables").then((r) => r.json());

export const needsUpdate = async (): Promise<boolean> =>
	fetch("/api/needs-update").then((r) => r.json());
