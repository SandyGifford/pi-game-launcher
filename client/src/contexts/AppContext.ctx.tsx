import { createContext, useContext, useMemo, type ReactNode } from "react";

export type AppContext = {
	readonly thinking: boolean;
	readonly thinkWhile: (fn: () => boolean) => Promise<boolean>;
};

const ctx = createContext<AppContext>({ thinking: false, thinkWhile: async (fn) => fn() });

export const useAppContext = () => useContext(ctx);

export const AppContext = ({
	thinkWhile,
	thinking,
	children,
}: AppContext & { readonly children: ReactNode }) => (
	<ctx.Provider value={useMemo(() => ({ thinking, thinkWhile }), [thinkWhile, thinking])}>
		{children}
	</ctx.Provider>
);
