import { mapToObject } from "@repo/shared";
import { createContext, useContext, useMemo, type FC, type ReactNode } from "react";

export const createQuickCtx =
	<CTX extends object>(name: string, defaultData: CTX) =>
	<const A extends readonly (keyof CTX)[]>(
		fields: A &
			(Exclude<keyof CTX, A[number]> extends never
				? unknown
				: ["Missing", Exclude<keyof CTX, A[number]>])
	): [
		ctx: React.Context<CTX>,
		Provider: FC<
			CTX & {
				readonly children: ReactNode;
			}
		>,
		useCtx: () => CTX,
	] => {
		const ctx = createContext<CTX>(defaultData);

		const Provider: FC<CTX & { readonly children: ReactNode }> = (props) => (
			<ctx.Provider
				value={useMemo(
					() => mapToObject(fields, (f) => [f, props[f]]) as CTX,
					// eslint-disable-next-line react-hooks/exhaustive-deps
					fields.map((f) => props[f])
				)}
			>
				{props.children}
			</ctx.Provider>
		);

		Provider.displayName = `${name}Provider`;

		const useCtx = () => useContext(ctx);

		return [ctx, Provider, useCtx];
	};
