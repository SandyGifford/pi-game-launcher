import { useCallback, useLayoutEffect, useRef } from "react";

export const useCallbackStable = <F extends (...args: never[]) => unknown>(fn: F): F => {
	const ref = useRef(fn);
	useLayoutEffect(() => {
		ref.current = fn;
	});
	return useCallback<F>(((...args: Parameters<F>) => ref.current(...args)) as F, []);
};
