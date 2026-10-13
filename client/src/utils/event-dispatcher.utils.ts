export type EventDispatcherType = "value" | "mount" | "unmount";
export type EventDispatcherValueListener<VALUE> = (value: VALUE) => unknown;
export type EventDispatcherMountListener = () => unknown;
export type EventDispatcherUnMountListener = () => unknown;
export type EventDispatcherUnsub = () => void;

type TypeListeners<VALUE> = {
	readonly value: EventDispatcherValueListener<VALUE>;
	readonly mount: EventDispatcherMountListener;
	readonly unmount: EventDispatcherUnMountListener;
};

export type EventDispatcherOn<VALUE> = <TYPE extends EventDispatcherType>(
	type: TYPE,
	listener: TypeListeners<VALUE>[TYPE]
) => EventDispatcherUnsub;

export type EventDispatcherOff<VALUE> = <TYPE extends EventDispatcherType>(
	type: TYPE,
	listener: TypeListeners<VALUE>[TYPE]
) => void;

export type EventDispatcherFire<VALUE> = (value: VALUE) => void;

export type EventDispatcherGet<VALUE> = () => VALUE;

export type EventDispatcherGetReadonly<VALUE> = () => ReadonlyEventDispatcher<VALUE>;

export type ReadonlyEventDispatcher<VALUE> = {
	readonly on: EventDispatcherOn<VALUE>;
	readonly off: EventDispatcherOff<VALUE>;
};

export type EventDispatcher<VALUE> = {
	readonly on: EventDispatcherOn<VALUE>;
	readonly off: EventDispatcherOff<VALUE>;
	readonly fire: EventDispatcherFire<VALUE>;
	readonly getReadonly: EventDispatcherGetReadonly<VALUE>;
};

export type ReadonlyStatefulEventDispatcher<VALUE> = ReadonlyEventDispatcher<VALUE> & {
	readonly get: EventDispatcherGet<VALUE>;
};

export type StatefulEventDispatcher<VALUE> = EventDispatcher<VALUE> & {
	readonly get: EventDispatcherGet<VALUE>;
};

export type EventDispatcherOptions = object;

export type StatefulEventDispatcherOptions<VALUE> = EventDispatcherOptions & {
	readonly initialState: VALUE;
	readonly reportStateImmediately?: boolean;
};

export function createEventDispatcher<VALUE>(
	options?: EventDispatcherOptions & { readonly initialState?: never }
): EventDispatcher<VALUE>;
export function createEventDispatcher<VALUE>(
	options: StatefulEventDispatcherOptions<VALUE>
): StatefulEventDispatcher<VALUE>;
export function createEventDispatcher<VALUE>(
	options: StatefulEventDispatcherOptions<VALUE> | EventDispatcherOptions = {}
): StatefulEventDispatcher<VALUE> | EventDispatcher<VALUE> {
	const stateful = "initialState" in options;
	let state = stateful ? options.initialState : undefined;
	const reportStateImmediately = stateful ? !!options.reportStateImmediately : false;

	const listeners: {
		readonly [TYPE in EventDispatcherType]: Set<TypeListeners<VALUE>[TYPE]>;
	} = {
		value: new Set(),
		mount: new Set(),
		unmount: new Set(),
	};

	const off: EventDispatcherOff<VALUE> = (type, listener) => {
		const sizeBefore = listeners.value.size;
		listeners[type].delete(listener);
		const sizeAfter = listeners.value.size;

		switch (type) {
			case "value":
				if (sizeBefore !== sizeAfter && sizeAfter === 0) listeners.unmount.forEach((l) => l());
				break;
		}
	};

	const on: EventDispatcherOn<VALUE> = (type, listener) => {
		const sizeBefore = listeners.value.size;
		listeners[type].add(listener);
		const sizeAfter = listeners.value.size;

		switch (type) {
			case "value":
				if (sizeBefore !== sizeAfter && sizeAfter === 1) listeners.mount.forEach((l) => l());
				if (reportStateImmediately) (listener as EventDispatcherValueListener<VALUE>)(state!);
				break;
			case "mount":
				if (sizeAfter !== 0) (listener as EventDispatcherMountListener)();
				break;
		}

		return () => off(type, listener);
	};

	const fire: EventDispatcherFire<VALUE> = (value) => {
		if (stateful) state = value;
		listeners.value.forEach((l) => l(value));
	};

	const ro: ReadonlyEventDispatcher<VALUE> | ReadonlyStatefulEventDispatcher<VALUE> = {
		on,
		off,
		...(stateful ? { get: () => state } : {}),
	};

	const getReadonly: EventDispatcherGetReadonly<VALUE> = () => ro;

	return {
		...ro,
		fire,
		getReadonly,
	};
}

export type EventDispatcherValue<DISPATCHER> =
	DISPATCHER extends EventDispatcher<infer VALUE> ? VALUE : never;

export type EventDispatcherFamily<PARAM, DISPATCHER extends EventDispatcher<never>> = {
	(
		value: PARAM,
		firstListener: EventDispatcherValueListener<EventDispatcherValue<DISPATCHER>>
	): DISPATCHER;
};

export function eventDispatcherFamily<PARAM, DISPATCHER extends EventDispatcher<never>>(
	fn: (param: PARAM) => DISPATCHER
): EventDispatcherFamily<PARAM, DISPATCHER>;
export function eventDispatcherFamily<PARAM, DISPATCHER extends EventDispatcher<never>, KEY>(
	fn: (param: PARAM) => DISPATCHER,
	getKey: (param: PARAM) => KEY
): EventDispatcherFamily<PARAM, DISPATCHER>;
export function eventDispatcherFamily<
	PARAM,
	DISPATCHER extends EventDispatcher<never>,
	KEY = PARAM,
>(
	fn: (param: PARAM) => DISPATCHER,
	getKey: (param: PARAM) => KEY = (param) => param as unknown as KEY
): EventDispatcherFamily<PARAM, DISPATCHER> {
	const map = new Map<unknown, DISPATCHER>();
	return (param, firstListener) => {
		const key = getKey(param);
		const existing = map.get(key);
		if (existing) {
			existing.on("value", firstListener);
			return existing;
		}

		const dispatcher = fn(param);
		map.set(key, dispatcher);
		dispatcher.on("unmount", () => {
			if (map.get(key) === dispatcher) map.delete(key);
		});
		dispatcher.on("value", firstListener);
		return dispatcher;
	};
}
