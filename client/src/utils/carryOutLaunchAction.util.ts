import type { LaunchAction } from "@repo/shared";
import { LAUNCH_ACTION_META } from "../consts";

export const carryOutLaunchAction = async (action: LaunchAction) => {
	await LAUNCH_ACTION_META[action.action].act?.(action as never);
};
