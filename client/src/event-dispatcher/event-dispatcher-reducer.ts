import { eventDispatcher } from "./event-dispatcher";
import type { EventDispatcher, ReadonlyEventDispatcher } from "./event-dispatcher.types";
import { bindDispatcher, type EventDispatcherArrayValues } from "./event-dispatcher.utils";

export const reducerEventDispatcher =
	<TARGET>() =>
	<const S extends readonly ReadonlyEventDispatcher<unknown>[]>(
		initialValue: TARGET,
		sources: S,
		reduce: (values: EventDispatcherArrayValues<S>, current: TARGET) => TARGET,
		areEqual: (a: TARGET, b: TARGET) => boolean = Object.is
	): EventDispatcher<TARGET> => {
		const target = eventDispatcher(initialValue);
		bindDispatcher(target, sources, reduce, areEqual);
		return target;
	};
