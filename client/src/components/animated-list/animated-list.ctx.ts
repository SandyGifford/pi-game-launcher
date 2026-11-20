import { useResizeObserver } from "use-resize-observer";
import { createQuickCtx } from "../../utils/createQuickCtx.utils";

export type AnimatedListCtxUseHeight = (key: string | undefined, height: number) => void;

export type AnimatedListCtx = {
	readonly useHeight: AnimatedListCtxUseHeight;
};

const [, AnimatedListProvider, useAnimatedList] = createQuickCtx<AnimatedListCtx>("AnimatedList", {
	useHeight: () => void 0,
})(["useHeight"]);

export const useAnimatedListItem = (key: string | undefined, el: HTMLElement | null) => {
	const { useHeight } = useAnimatedList();
	const { height } = useResizeObserver({ ref: el, box: "content-box" });
	useHeight(key, height ?? 0);
};

export { AnimatedListProvider };
