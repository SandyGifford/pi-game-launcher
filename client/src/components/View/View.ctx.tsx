import { useEffect } from "react";
import { createQuickCtx } from "../../utils/createQuickCtx.utils";

export type ViewCtx = {
	readonly viewReady: () => void;
	readonly currentThinkingId: string | undefined;
	readonly setCurrentThinkingId: (id: string) => void;
};

const [, ViewProvider, useView] = createQuickCtx<ViewCtx>("View", {
	viewReady: () => void 0,
	currentThinkingId: undefined,
	setCurrentThinkingId: () => void 0,
})(["viewReady", "currentThinkingId", "setCurrentThinkingId"]);

export { useView, ViewProvider };

export const useViewReady = () => useView().viewReady;

export const useViewReadyOnMount = () => {
	const viewReady = useViewReady();
	useEffect(() => {
		viewReady();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);
};
