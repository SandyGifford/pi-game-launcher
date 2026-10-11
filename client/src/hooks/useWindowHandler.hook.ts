import { useEffect, type DependencyList } from "react";
import { useCallbackStable } from "./useCallbackStable.hook";

export type UseWindowHandlerOptions = {
	readonly addOptions?: boolean | AddEventListenerOptions;
	readonly removeOptions?: boolean | EventListenerOptions;
};

const resolveEventOptions = <T extends EventListenerOptions | AddEventListenerOptions>(
	options: T | boolean | undefined
): T => (typeof options === "boolean" ? ({ capture: options } as T) : ((options || {}) as T));

// Listener and dependencies come first so react-hooks/exhaustive-deps (additionalEffectHooks)
// can find them at the positions it expects (callback at 0, dependencies at 1).
export function useWindowHandler<K extends keyof WindowEventMap>(
	listener: (ev: WindowEventMap[K]) => unknown,
	dependencies: DependencyList,
	type: K,
	options: UseWindowHandlerOptions = {}
): void {
	const stableListener = useCallbackStable(listener);

	const addOptions = resolveEventOptions(options.addOptions);
	const removeOptions = resolveEventOptions(options.removeOptions);

	useEffect(() => {
		window.addEventListener(type, stableListener, addOptions);
		return () => window.removeEventListener(type, stableListener);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		type,
		addOptions.capture,
		addOptions.once,
		addOptions.passive,
		addOptions.signal,
		removeOptions.capture,
		// eslint-disable-next-line react-hooks/exhaustive-deps
		...dependencies,
	]);
}
