import { awaitTime, type Launchable, type LaunchableID, type WifiAccessPoint } from "@repo/shared";
import { carryOutLaunchAction } from "./utils/carryOutLaunchAction.util";

// launchables

export const launch = async (id: LaunchableID): Promise<void> => {
	const action = await fetch(`/api/launchables/${id}/launch`, { method: "POST" }).then((r) =>
		r.json()
	);
	carryOutLaunchAction(action);
};

export const getLaunchables = async (): Promise<readonly Launchable[]> =>
	fetch("/api/launchables").then((r) => r.json());

// system

export const shutdown = async (): Promise<void> => {
	await fetch("/api/system/shutdown", { method: "POST" });
};

export const restart = async (): Promise<void> => {
	await fetch("/api/system/restart", { method: "POST" });
};

// system/update

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
	await fetch("/api/system/update", { method: "POST" });
	await waitForServer();
	location.reload();
};

export const needsUpdate = async (): Promise<boolean> =>
	fetch("/api/system/update/needs").then((r) => r.json());

// system/wifi

export const getWifiList = async (): Promise<readonly WifiAccessPoint[]> =>
	fetch("/api/system/wifi/list").then((r) => r.json());
