export type EventDispatcherType = "value" | "mount" | "unmount";
export type EventDispatcherValueListener<VALUE> = (value: VALUE) => unknown;
export type EventDispatcherMountListener = () => void | (() => unknown);
export type EventDispatcherUnMountListener = () => unknown;
export type EventDispatcherUnsub = () => void;

export type EventDispatcherListenerTypeMap<VALUE> = {
	readonly value: EventDispatcherValueListener<VALUE>;
	readonly mount: EventDispatcherMountListener;
	readonly unmount: EventDispatcherUnMountListener;
};

export type EventDispatcherOn<VALUE> = <TYPE extends EventDispatcherType>(
	type: TYPE,
	listener: EventDispatcherListenerTypeMap<VALUE>[TYPE]
) => EventDispatcherUnsub;

export type EventDispatcherOff<VALUE> = <TYPE extends EventDispatcherType>(
	type: TYPE,
	listener: EventDispatcherListenerTypeMap<VALUE>[TYPE]
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

export type EventDispatcherFamilyOptions = object;
export type EventDispatcherFamilyWithKeyOptions<PARAM, KEY> = EventDispatcherFamilyOptions & {
	readonly getKey: (param: PARAM) => KEY;
};

export type EventDispatcherFamily<PARAM, DISPATCHER extends EventDispatcher<never>, KEY> = {
	(param: PARAM): DISPATCHER;
	readonly remove: (key: KEY) => void;
	readonly clear: () => void;
};
