import type { Launchable, LaunchAction, LaunchableType } from "@repo/shared";
import type { DistributedOmit } from "type-fest";

export type NewLaunchable = DistributedOmit<Launchable, "id">;

export type LaunchableMetaNode<TYPE extends LaunchableType> = {
	readonly launch: (
		launchable: Extract<Launchable, { readonly type: TYPE }>
	) => (LaunchAction | void) | Promise<LaunchAction | void>;
};

export type LaunchableMeta = {
	readonly [TYPE in LaunchableType]: LaunchableMetaNode<TYPE>;
};
