/* eslint-disable @typescript-eslint/no-explicit-any */
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
export type EventDispatcherOnValue<VALUE> = (
	listener: EventDispatcherValueListener<VALUE>
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
	readonly onValue: EventDispatcherOnValue<VALUE>;
	readonly off: EventDispatcherOff<VALUE>;
};

export type EventDispatcher<VALUE> = ReadonlyEventDispatcher<VALUE> & {
	readonly fire: EventDispatcherFire<VALUE>;
	readonly getReadonly: EventDispatcherGetReadonly<VALUE>;
};

export type ReadonlyStatefulEventDispatcher<VALUE> = ReadonlyEventDispatcher<VALUE> & {
	readonly get: EventDispatcherGet<VALUE>;
};

export type ToReadonlyEventDispatcher<
	DISP extends EventDispatcher<any> | StatefulEventDispatcher<any>,
> =
	DISP extends StatefulEventDispatcher<infer VALUE>
		? ReadonlyStatefulEventDispatcher<VALUE>
		: DISP extends EventDispatcher<infer VALUE>
			? ReadonlyEventDispatcher<VALUE>
			: never;

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

export type EventDispatcherFamilyRemove<KEY> = (key: KEY) => void;
export type EventDispatcherFamilyClear = () => void;
export type EventDispatcherFamilyGetReadonly<
	PARAM,
	DISPATCHER extends EventDispatcher<any>,
> = () => ReadonlyEventDispatcherFamily<PARAM, DISPATCHER>;

export type ReadonlyEventDispatcherFamily<PARAM, DISPATCHER extends EventDispatcher<any>> = {
	(param: PARAM): ToReadonlyEventDispatcher<DISPATCHER>;
};

export type EventDispatcherFamily<PARAM, DISPATCHER extends EventDispatcher<any>, KEY> = {
	(param: PARAM): DISPATCHER;
	readonly remove: EventDispatcherFamilyRemove<KEY>;
	readonly clear: EventDispatcherFamilyClear;
	readonly getReadonly: EventDispatcherFamilyGetReadonly<PARAM, DISPATCHER>;
};
