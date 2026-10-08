import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useReducer,
	useRef,
	useState,
	type DependencyList,
	type RefObject,
} from "react";
import { toError } from "@repo/shared";

export const useAlwaysRef = <T>(val: T): RefObject<T> => {
	const ref = useRef(val);
	ref.current = val;
	return ref;
};

export const useCallbackStable = <F extends (...args: never[]) => unknown>(fn: F): F => {
	const ref = useRef(fn);
	useLayoutEffect(() => {
		ref.current = fn;
	});
	return useCallback<F>(((...args: Parameters<F>) => ref.current(...args)) as F, []);
};

export type UsePromiseReturnType<T> = { readonly reload: () => void } & (
	| { readonly status: "loading"; readonly error?: never; readonly data?: never }
	| { readonly status: "error"; readonly error: Error; readonly data?: never }
	| { readonly status: "data"; readonly error?: Error; readonly data: T }
);

export const usePromise = <R>(
	fn: () => Promise<R>,
	deps: DependencyList
): UsePromiseReturnType<R> => {
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

export const useIsMountedRef = () => {
	const isMountedRef = useRef(true);
	useEffect(() => {
		isMountedRef.current = true;
		return () => {
			isMountedRef.current = false;
		};
	}, []);

	return isMountedRef;
};
