import { useEffect, type DependencyList } from "react";
import { useCallbackStable } from "../hooks/useCallbackStable.hook";
import type { ReadonlyEventDispatcher } from "./event-dispatcher.types";

export const useEventDispatcher = <T>(
	dispatcher: ReadonlyEventDispatcher<T>,
	listener: (value: T) => unknown,
	dependencies: DependencyList = []
) => {
	const stable = useCallbackStable(listener);
	useEffect(() => {
		dispatcher.on("value", stable);
		return () => dispatcher.off("value", stable);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [dispatcher, ...dependencies]);
};
