import type { LaunchableID } from "@repo/shared";

export const launch = async (id: LaunchableID): Promise<void> => {
	await fetch(`/api/launch/${id}`, { method: "POST" });
};
