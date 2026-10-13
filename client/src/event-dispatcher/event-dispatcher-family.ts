import type {
	EventDispatcher,
	EventDispatcherFamily,
	EventDispatcherFamilyOptions,
	EventDispatcherFamilyWithKeyOptions,
} from "./event-dispatcher.types";

export function eventDispatcherFamily<PARAM, DISPATCHER extends EventDispatcher<never>>(
	fn: (param: PARAM) => DISPATCHER,
	options?: EventDispatcherFamilyOptions & { readonly getKey?: never }
): EventDispatcherFamily<PARAM, DISPATCHER, PARAM>;
export function eventDispatcherFamily<PARAM, DISPATCHER extends EventDispatcher<never>, KEY>(
	fn: (param: PARAM) => DISPATCHER,
	options: EventDispatcherFamilyWithKeyOptions<PARAM, KEY>
): EventDispatcherFamily<PARAM, DISPATCHER, KEY>;
export function eventDispatcherFamily<
	PARAM,
	DISPATCHER extends EventDispatcher<never>,
	KEY = PARAM,
>(
	fn: (param: PARAM) => DISPATCHER,
	options:
		| (EventDispatcherFamilyOptions & { readonly getKey?: never })
		| EventDispatcherFamilyWithKeyOptions<PARAM, KEY> = {}
): EventDispatcherFamily<PARAM, DISPATCHER, KEY> {
	const { getKey = (param) => param as unknown as KEY } = options;

	const map = new Map<KEY, DISPATCHER>();
	return Object.assign(
		(param: PARAM) => {
			const key = getKey(param);
			const existing = map.get(key);
			if (existing) return existing;

			const dispatcher = fn(param);
			map.set(key, dispatcher);
			dispatcher.on("unmount", () => {
				if (map.get(key) === dispatcher) map.delete(key);
			});
			return dispatcher;
		},
		{
			remove: (key: KEY) => map.delete(key),
			clear: () => map.clear(),
		}
	);
}
