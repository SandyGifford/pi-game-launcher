import type { SetView } from "../types/view.types";
import { createQuickCtx } from "../utils/createQuickCtx.utils";

export type AppContext = {
	readonly thinkWhile: (fn: () => boolean) => Promise<boolean>;
	readonly setView: SetView;
};

export const [, AppContext, useAppContext] = createQuickCtx<AppContext>("AppContext", {
	thinkWhile: async (fn) => fn(),
	setView: () => void 0,
})(["thinkWhile", "setView"]);
