import { useContext, useEffect } from "react";
import { createQuickCtx } from "../../utils/createQuickCtx.utils";

export type ViewCtx = {
	readonly viewReady: () => void;
};

const [ctx, ViewProvider] = createQuickCtx<ViewCtx>("View", {
	viewReady: () => void 0,
})(["viewReady"]);

export { ViewProvider };

export const useViewReady = () => useContext(ctx).viewReady;

export const useViewReadyOnMount = () => {
	const viewReady = useViewReady();
	useEffect(() => {
		viewReady();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);
};
