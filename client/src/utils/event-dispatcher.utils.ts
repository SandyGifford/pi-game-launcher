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

export type EventDispatcher<VALUE> = {
	readonly on: EventDispatcherOn<VALUE>;
	readonly off: EventDispatcherOff<VALUE>;
	readonly fire: EventDispatcherFire<VALUE>;
};

export const createEventDispatcher = <VALUE>(): EventDispatcher<VALUE> => {
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
				if (sizeBefore !== sizeAfter && sizeAfter === 1)
					listeners.mount.forEach((l) => l());
				break;
			case "mount":
				if (sizeAfter !== 0) (listener as EventDispatcherMountListener)();
				break;
		}

		return () => off(type, listener);
	};
	const fire: EventDispatcherFire<VALUE> = (value) => listeners.value.forEach((l) => l(value));

	return {
		on,
		off,
		fire,
	};
};
