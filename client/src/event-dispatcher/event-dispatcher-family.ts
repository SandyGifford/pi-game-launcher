/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
	EventDispatcher,
	EventDispatcherFamily,
	EventDispatcherFamilyOptions,
	EventDispatcherFamilyWithKeyOptions,
	ReadonlyEventDispatcherFamily,
	ToReadonlyEventDispatcher,
} from "./event-dispatcher.types";

export function eventDispatcherFamily<PARAM, DISPATCHER extends EventDispatcher<any>>(
	fn: (param: PARAM) => DISPATCHER,
	options?: EventDispatcherFamilyOptions & { readonly getKey?: never }
): EventDispatcherFamily<PARAM, DISPATCHER, PARAM>;
export function eventDispatcherFamily<PARAM, DISPATCHER extends EventDispatcher<any>, KEY>(
	fn: (param: PARAM) => DISPATCHER,
	options: EventDispatcherFamilyWithKeyOptions<PARAM, KEY>
): EventDispatcherFamily<PARAM, DISPATCHER, KEY>;
export function eventDispatcherFamily<PARAM, DISPATCHER extends EventDispatcher<any>, KEY = PARAM>(
	getDispatcher: (param: PARAM) => DISPATCHER,
	options:
		| (EventDispatcherFamilyOptions & { readonly getKey?: never })
		| EventDispatcherFamilyWithKeyOptions<PARAM, KEY> = {}
): EventDispatcherFamily<PARAM, DISPATCHER, KEY> {
	const { getKey = (param) => param as unknown as KEY } = options;

	const map = new Map<KEY, DISPATCHER>();

	const fn = (param: PARAM) => {
		const key = getKey(param);
		const existing = map.get(key);
		if (existing) return existing;

		const dispatcher = getDispatcher(param);
		map.set(key, dispatcher);
		dispatcher.on("unmount", () => {
			if (map.get(key) === dispatcher) map.delete(key);
		});
		return dispatcher;
	};

	const roFn: ReadonlyEventDispatcherFamily<PARAM, DISPATCHER> = (param) =>
		fn(param).getReadonly() as ToReadonlyEventDispatcher<DISPATCHER>;

	return Object.assign(fn, {
		remove: (key: KEY) => map.delete(key),
		clear: () => map.clear(),
		getReadonly: () => roFn,
	});
}
