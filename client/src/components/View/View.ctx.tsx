import { createContext, memo, useContext, useEffect, type ReactNode } from "react";
import type { TransitionStatus } from "react-transition-group";
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

const viewIsReadyCtx = createContext<boolean>(true);
const viewReadyTransitionCtx = createContext<TransitionStatus>("entered");

export const useViewIsReady = () => useContext(viewIsReadyCtx);
export const useViewReadyTransitionStatus = () => useContext(viewReadyTransitionCtx);

export const ViewProvider = memo(
	({
		isReady,
		status,
		markViewAsReady,
		currentThinkingId,
		setCurrentThinkingId,
		children,
	}: {
		readonly isReady: boolean;
		readonly status: TransitionStatus;
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
				<viewIsReadyCtx.Provider value={isReady}>
					<viewReadyTransitionCtx.Provider value={status}>
						{children}
					</viewReadyTransitionCtx.Provider>
				</viewIsReadyCtx.Provider>
			</viewMarkReadyCtx.Provider>
		</ViewThinkingProvider>
	)
);
