import {
	EventDispatcherListenerError,
	EventDispatcherMountError,
	EventDispatcherUnmountError,
} from "./event-dispatcher.errors";
import type {
	EventDispatcher,
	EventDispatcherFire,
	EventDispatcherGetReadonly,
	EventDispatcherListenerTypeMap,
	EventDispatcherMountListener,
	EventDispatcherOff,
	EventDispatcherOn,
	EventDispatcherOptions,
	EventDispatcherType,
	EventDispatcherValueListener,
	ReadonlyEventDispatcher,
} from "./event-dispatcher.types";

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

export const eventDispatcher = <VALUE>(
	initialState: VALUE,
	options: EventDispatcherOptions = {}
): EventDispatcher<VALUE> => {
	let state = initialState;
	const { reportStateImmediately } = options;

	const listeners: {
		readonly [TYPE in EventDispatcherType]: Set<EventDispatcherListenerTypeMap<VALUE>[TYPE]>;
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
		listener: EventDispatcherListenerTypeMap<VALUE>[TYPE]
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
		state = value;
		// A throwing listener must not starve the others; all errors are reported together afterwards.
		const errors = runIsolated([...listeners.value].map((l) => () => l(value)));
		if (errors.length) throw new EventDispatcherListenerError("Value listeners threw", errors);
	};

	const ro: ReadonlyEventDispatcher<VALUE> = {
		on,
		onValue: (listener) => on("value", listener),
		off,
		get: () => state,
	};

	const getReadonly: EventDispatcherGetReadonly<VALUE> = () => ro;

	return {
		...ro,
		fire,
		getReadonly,
	};
};
