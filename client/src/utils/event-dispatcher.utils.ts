export class EventDispatcherError extends Error {}

/** Thrown when several callbacks are run in isolation; `cause` is the first failure. */
export class EventDispatcherMultiError extends EventDispatcherError {
	readonly errors: readonly unknown[];

	constructor(message: string, errors: readonly unknown[]) {
		super(message, { cause: errors[0] });
		this.errors = errors;
	}
}

/** A value listener threw during `fire` (or while reporting the current state on `on`). */
export class EventDispatcherListenerError extends EventDispatcherMultiError {}

/** A mount listener threw. The listener that was being added has been rolled back. */
export class EventDispatcherMountError extends EventDispatcherMultiError {}

/** An unmount listener or a mount cleanup threw. All of them still ran. */
export class EventDispatcherUnmountError extends EventDispatcherMultiError {}

const runIsolated = (fns: readonly (() => unknown)[]): unknown[] => {
	const errors: unknown[] = [];
	fns.forEach((fn) => {
		try {
			fn();
		} catch (e) {
			errors.push(e);
		}
	});
	return errors;
};

export type EventDispatcherType = "value" | "mount" | "unmount";
export type EventDispatcherValueListener<VALUE> = (value: VALUE) => unknown;
export type EventDispatcherMountListener = () => void | (() => unknown);
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

export type EventDispatcher<VALUE> = ReadonlyEventDispatcher<VALUE> & {
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

export function eventDispatcher<VALUE>(
	options?: EventDispatcherOptions & { readonly initialState?: never }
): EventDispatcher<VALUE>;
export function eventDispatcher<VALUE>(
	options: StatefulEventDispatcherOptions<VALUE>
): StatefulEventDispatcher<VALUE>;
export function eventDispatcher<VALUE>(
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
	const cleanupFns = new Map<EventDispatcherMountListener, () => unknown>();

	const teardown = (): unknown[] => {
		const cleanups = [...cleanupFns.values()];
		cleanupFns.clear();
		return runIsolated([...listeners.unmount, ...cleanups]);
	};

	// Never throws; returns the errors so `off` can report them and `on` can fold them into a rollback.
	const removeListener = <TYPE extends EventDispatcherType>(
		type: TYPE,
		listener: TypeListeners<VALUE>[TYPE]
	): unknown[] => {
		const valueSizeBefore = listeners.value.size;
		listeners[type].delete(listener);
		const valueSizeAfter = listeners.value.size;

		switch (type) {
			case "value":
				return valueSizeBefore !== valueSizeAfter && valueSizeAfter === 0 ? teardown() : [];
			case "mount": {
				const mountListener = listener as EventDispatcherMountListener;
				const cleanup = cleanupFns.get(mountListener);
				cleanupFns.delete(mountListener);
				return cleanup ? runIsolated([cleanup]) : [];
			}
			default:
				return [];
		}
	};

	const off: EventDispatcherOff<VALUE> = (type, listener) => {
		const errors = removeListener(type, listener);
		if (errors.length)
			throw new EventDispatcherUnmountError("Unmount listeners or cleanups threw", errors);
	};

	const on: EventDispatcherOn<VALUE> = (type, listener) => {
		const valueSizeBefore = listeners.value.size;
		const alreadyAdded = listeners[type].has(listener);
		listeners[type].add(listener);
		const valueSizeAfter = listeners.value.size;

		// The caller never receives an unsubscribe function if we throw, so undo what we added.
		const rollback = (): unknown[] => (alreadyAdded ? [] : removeListener(type, listener));

		switch (type) {
			case "value":
				if (valueSizeBefore !== valueSizeAfter && valueSizeAfter === 1) {
					for (const mountListener of [...listeners.mount]) {
						try {
							const cleanup = mountListener();
							if (cleanup) cleanupFns.set(mountListener, cleanup);
						} catch (e) {
							throw new EventDispatcherMountError("A mount listener threw", [e, ...rollback()]);
						}
					}
				}
				if (reportStateImmediately) {
					try {
						(listener as EventDispatcherValueListener<VALUE>)(state!);
					} catch (e) {
						throw new EventDispatcherListenerError("A value listener threw", [e, ...rollback()]);
					}
				}
				break;
			case "mount": {
				const mountListener = listener as EventDispatcherMountListener;
				if (!alreadyAdded && valueSizeAfter !== 0) {
					try {
						const cleanup = mountListener();
						if (cleanup) cleanupFns.set(mountListener, cleanup);
					} catch (e) {
						throw new EventDispatcherMountError("A mount listener threw", [e, ...rollback()]);
					}
				}
				break;
			}
		}

		return () => off(type, listener);
	};

	const fire: EventDispatcherFire<VALUE> = (value) => {
		if (stateful) state = value;
		// A throwing listener must not starve the others; all errors are reported together afterwards.
		const errors = runIsolated([...listeners.value].map((l) => () => l(value)));
		if (errors.length) throw new EventDispatcherListenerError("Value listeners threw", errors);
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

export type EventDispatcherFamilyOptions = object;
export type EventDispatcherFamilyWithKeyOptions<PARAM, KEY> = EventDispatcherFamilyOptions & {
	readonly getKey: (param: PARAM) => KEY;
};

export type EventDispatcherFamily<PARAM, DISPATCHER extends EventDispatcher<never>, KEY> = {
	(param: PARAM): DISPATCHER;
	readonly remove: (key: KEY) => void;
	readonly clear: () => void;
};

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
