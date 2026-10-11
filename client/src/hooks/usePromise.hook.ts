import { toError } from "@repo/shared";
import { useEffect, useReducer, useState, type DependencyList } from "react";

export type UsePromiseReturnType<T> = { readonly reload: () => void } & (
	| { readonly status: "loading"; readonly error?: never; readonly data?: never }
	| { readonly status: "error"; readonly error: Error; readonly data?: never }
	| { readonly status: "data"; readonly error?: Error; readonly data: T }
);

export const usePromise = <R>(fn: () => Promise<R>, deps: DependencyList): UsePromiseReturnType<R> => {
	const [reloadCount, reload] = useReducer((count: number) => count + 1, 0);
	const [state, setState] = useState<UsePromiseReturnType<R>>({ status: "loading", reload });

	useEffect(() => {
		let current = true;
		setState({ status: "loading", reload });

		fn()
			.then((data) => {
				if (current) setState({ status: "data", data, reload });
			})
			.catch((error: unknown) => {
				if (current) setState({ status: "error", error: toError(error), reload });
			});

		return () => {
			current = false;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [...deps, reloadCount]);

	return state;
};
