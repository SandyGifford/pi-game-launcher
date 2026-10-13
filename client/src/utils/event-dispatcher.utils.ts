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

export type EventDispatcher<VALUE> = {
	readonly on: EventDispatcherOn<VALUE>;
	readonly off: EventDispatcherOff<VALUE>;
	readonly fire: EventDispatcherFire<VALUE>;
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

	return {
		on,
		off,
		fire,
		...(stateful ? { get: () => state } : {}),
	};
}
