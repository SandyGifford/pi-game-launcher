import type { Launchable, LaunchableArguments } from "@repo/shared";
import type { DistributedOmit } from "type-fest";

export type NewLaunchable = DistributedOmit<Launchable, "id" | "launchArguments"> & {
	readonly launchArguments?: LaunchableArguments;
};
