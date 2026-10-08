import type { Launchable, LaunchableType } from "@repo/shared";
import type { DistributedOmit } from "type-fest";

export type NewLaunchable = DistributedOmit<Launchable, "id">;

export type LaunchableLaunchAction =
	{ readonly action: "none" } | { readonly action: "redirect"; readonly url: string };

export type LaunchableMetaNode<TYPE extends LaunchableType> = {
	readonly launch: (
		launchable: Extract<Launchable, { readonly type: TYPE }>
	) => (LaunchableLaunchAction | void) | Promise<LaunchableLaunchAction | void>;
};

export type LaunchableMeta = {
	readonly [TYPE in LaunchableType]: LaunchableMetaNode<TYPE>;
};
