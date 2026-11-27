import { createContext, memo, useContext, useEffect, type ReactNode } from "react";
import { createQuickCtx } from "../../utils/createQuickCtx.utils";

type ViewThinkingCtx = {
	readonly currentThinkingId: string | undefined;
	readonly setCurrentThinkingId: (id: string) => void;
};

const [, ViewThinkingProvider, useViewThinking] = createQuickCtx<ViewThinkingCtx>("ViewThinking", {
	currentThinkingId: undefined,
	setCurrentThinkingId: () => void 0,
})(["currentThinkingId", "setCurrentThinkingId"]);

const viewMarkReadyCtx = createContext<() => void>(() => void 0);

export { useViewThinking };

export const useMarkViewAsReady = () => useContext(viewMarkReadyCtx);

export const useViewReadyOnMount = () => {
	const viewReady = useMarkViewAsReady();
	useEffect(() => {
		viewReady();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);
};

export const ViewProvider = memo(
	({
		markViewAsReady,
		currentThinkingId,
		setCurrentThinkingId,
		children,
	}: {
		readonly markViewAsReady: () => void;
		readonly currentThinkingId: string | undefined;
		readonly setCurrentThinkingId: (id: string) => void;
		readonly children: ReactNode;
	}) => (
		<ViewThinkingProvider
			currentThinkingId={currentThinkingId}
			setCurrentThinkingId={setCurrentThinkingId}
		>
			<viewMarkReadyCtx.Provider value={markViewAsReady}>
				{children}
			</viewMarkReadyCtx.Provider>
		</ViewThinkingProvider>
	)
);
