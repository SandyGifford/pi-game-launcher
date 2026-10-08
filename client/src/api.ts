import type { Launchable, LaunchableID } from "@repo/shared";

export const launch = async (id: LaunchableID): Promise<void> => {
	await fetch(`/api/launch/${id}`, { method: "POST" });
};

export const getLaunchables = async (): Promise<readonly Launchable[]> =>
	fetch("/api/launchables").then((r) => r.json());
