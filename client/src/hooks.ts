import { toError } from "@repo/shared";
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

export type UseInUseOptions = {
	readonly forceInUse?: boolean;
	readonly permaInUse?: boolean | number;
};

export const useInUse = (options: UseInUseOptions = {}) => {
	const { forceInUse, permaInUse } = options;
	const [inUseCount, setInUseCount] = useState(0);

	const hasBeenInUseRef = useRef(false);
	const inUse = !!inUseCount || forceInUse || (permaInUse === true && hasBeenInUseRef.current);

	const isMountedRef = useIsMountedRef();

	const reserve = useCallbackStable(() => setInUseCount((count) => count + 1));
	const release = useCallbackStable(
		(noDelay?: boolean) =>
			new Promise<void>((res) =>
				setTimeout(
					() => {
						if (isMountedRef.current) setInUseCount((count) => count - 1);
						res();
					},
					!noDelay && typeof permaInUse === "number" ? permaInUse : 0
				)
			)
	);

	const reserveWhile = useCallbackStable(async <R>(fn: () => R): Promise<R> => {
		reserve();
		try {
			const res = await fn();
			hasBeenInUseRef.current = true;
			release();
			return res;
		} catch (e) {
			release(true);
			throw e;
		}
	});

	useEffect(() => {
		if (permaInUse !== true) hasBeenInUseRef.current = false;
	}, [permaInUse]);

	return { reserve, release, reserveWhile, inUse, inUseCount };
};
