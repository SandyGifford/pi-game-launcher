import { type Launchable, type LaunchableID, type LaunchAction } from "@repo/shared";
import { LAUNCHABLE_META, LAUNCHABLES_MAP } from "./consts.ts";
import type { NewLaunchable } from "./types.ts";
import { spawnChild } from "@repo/shared-node";

let lastId = 1;
export const processNewLaunchables = (
	launchables: readonly NewLaunchable[]
): readonly Launchable[] =>
	launchables.map((launchable) => ({
		...launchable,
		id: `${lastId++}` as LaunchableID,
	}));

export const isLaunchableId = (id: unknown): id is LaunchableID => {
	if (typeof id !== "string") return false;
	return id in LAUNCHABLES_MAP;
};

export const shutdown = async () => {
	await spawnChild("shutdown", ["-h", "now"]);
	console.log("=>", "shutdown");
};
export const restart = async () => {
	await spawnChild("reboot", []);
	console.log("=>", "restart");
};

export const launch = async (launchable: Launchable): Promise<LaunchAction> =>
	(await LAUNCHABLE_META[launchable.type].launch(launchable as never)) || { action: "none" };
