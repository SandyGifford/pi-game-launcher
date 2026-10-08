import type { LaunchAction, LaunchActionType } from "@repo/shared";

export const LAUNCH_ACTION_META: {
	readonly [ACTION in LaunchActionType]: {
		readonly act: (action: Extract<LaunchAction, { readonly action: ACTION }>) => unknown;
	};
} = {
	none: { act: () => void 0 },
	redirect: { act: ({ url }) => window.location.assign(url) },
};
