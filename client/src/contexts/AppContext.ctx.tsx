import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { SetView } from "../types/view.types";

export type AppContext = {
	readonly thinkWhile: (fn: () => boolean) => Promise<boolean>;
	readonly setView: SetView;
};

const ctx = createContext<AppContext>({ thinkWhile: async (fn) => fn(), setView: () => void 0 });

export const useAppContext = () => useContext(ctx);

export const AppContext = ({
	thinkWhile,
	setView,
	children,
}: AppContext & { readonly children: ReactNode }) => (
	<ctx.Provider value={useMemo(() => ({ thinkWhile, setView }), [thinkWhile, setView])}>
		{children}
	</ctx.Provider>
);
