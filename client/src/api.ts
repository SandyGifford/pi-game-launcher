import type { Launchable, LaunchableID } from "@repo/shared";
import { carryOutLaunchAction } from "./utils";

export const launch = async (id: LaunchableID): Promise<void> => {
	const action = await fetch(`/api/launch/${id}`, { method: "POST" }).then((r) => r.json());
	carryOutLaunchAction(action);
};

export const getLaunchables = async (): Promise<readonly Launchable[]> =>
	fetch("/api/launchables").then((r) => r.json());
