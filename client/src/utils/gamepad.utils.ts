import { createEventDispatcher, type EventDispatcherUnsub } from "./event-dispatcher.utils";

const AXIS_LABELS = [
	/* 0 */ "LEFT_STICK_X",
	/* 1 */ "LEFT_STICK_Y",
	/* 2 */ "RIGHT_STICK_X",
	/* 3 */ "RIGHT_STICK_Y",
] as const satisfies string[];

const BUTTON_LABELS = [
	/*  0 */ "FACE_BOTTOM",
	/*  1 */ "FACE_RIGHT",
	/*  2 */ "FACE_LEFT",
	/*  3 */ "FACE_TOP",
	/*  4 */ "LEFT_BUMPER",
	/*  5 */ "RIGHT_BUMPER",
	/*  6 */ "LEFT_TRIGGER",
	/*  7 */ "RIGHT_TRIGGER",
	/*  8 */ "SYSTEM_LEFT",
	/*  9 */ "SYSTEM_RIGHT",
	/* 10 */ "LEFT_STICK",
	/* 11 */ "RIGHT_STICK",
	/* 12 */ "DPAD_UP",
	/* 13 */ "DPAD_DOWN",
	/* 14 */ "DPAD_LEFT",
	/* 15 */ "DPAD_RIGHT",
	/* 16 */ "SYSTEM_CENTER",
] as const satisfies string[];

export type GamepadAxisLabel = (typeof AXIS_LABELS)[number];
export type GamepadButtonLabel = (typeof BUTTON_LABELS)[number];

const AXIS_LABEL_INDEX_MAP = Object.fromEntries(AXIS_LABELS.map((label, i) => [label, i])) as {
	readonly [LABEL in GamepadAxisLabel]: number;
};

const BUTTON_LABEL_INDEX_MAP = Object.fromEntries(BUTTON_LABELS.map((label, i) => [label, i])) as {
	readonly [LABEL in GamepadButtonLabel]: number;
};

const resolveButtonIndex = (button: number | GamepadButtonLabel): number =>
	typeof button === "number" ? button : BUTTON_LABEL_INDEX_MAP[button];
const resolveAxisIndex = (axis: number | GamepadAxisLabel): number =>
	typeof axis === "number" ? axis : AXIS_LABEL_INDEX_MAP[axis];

export type GamepadDispatcher<VALUE> = {
	readonly on: (
		type: "value",
		listener: (value: VALUE) => unknown
	) => EventDispatcherUnsub;
	readonly get: () => VALUE;
};

type ManagedDispatcher<VALUE> = {
	readonly dispatcher: GamepadDispatcher<VALUE>;
	readonly fire: (value: VALUE) => void;
};

type DispatcherLifecycle = {
	readonly start: () => void;
	readonly stop: () => void;
	readonly onEmpty?: () => void;
};

const createManagedDispatcher = <VALUE>(
	initialValue: VALUE,
	{ start, stop, onEmpty }: DispatcherLifecycle
): ManagedDispatcher<VALUE> => {
	const internal = createEventDispatcher({ initialState: initialValue, reportStateImmediately: true });
	const listeners = new Map<(value: VALUE) => unknown, { count: number; unsubscribe: EventDispatcherUnsub }>();

	const unsubscribe = (listener: (value: VALUE) => unknown) => {
		const current = listeners.get(listener);
		if (!current) return;
		current.count -= 1;
		if (current.count === 0) {
			listeners.delete(listener);
			current.unsubscribe();
			if (listeners.size === 0) {
				stop();
				onEmpty?.();
			}
		}
	};

	const dispatcher: GamepadDispatcher<VALUE> = {
		on: (_type, listener) => {
			const existing = listeners.get(listener);
			if (existing) {
				existing.count += 1;
				let subscribed = true;
				return () => {
					if (!subscribed) return;
					subscribed = false;
					unsubscribe(listener);
				};
			}

			if (listeners.size === 0) start();

			const stopListening = internal.on("value", listener);
			listeners.set(listener, { count: 1, unsubscribe: stopListening });
			let subscribed = true;
			return () => {
				if (!subscribed) return;
				subscribed = false;
				unsubscribe(listener);
			};
		},
		get: internal.get,
	};

	return { dispatcher, fire: internal.fire };
};

const createDispatcherFamily = <KEY, VALUE>(
	makeDispatcher: (key: KEY, onEmpty: () => void) => ManagedDispatcher<VALUE>,
	areEqual: (a: KEY, b: KEY) => boolean = Object.is
): ((key: KEY) => GamepadDispatcher<VALUE>) => {
	const dispatchers = new Map<KEY, ManagedDispatcher<VALUE>>();

	return (key) => {
		const existing = [...dispatchers].find(([cachedKey]) => areEqual(cachedKey, key))?.[1];
		if (existing) return existing.dispatcher;

		const holder: { current?: ManagedDispatcher<VALUE> } = {};
		const created = makeDispatcher(key, () => {
			if (dispatchers.get(key) === holder.current) dispatchers.delete(key);
		});
		holder.current = created;
		dispatchers.set(key, created);
		return created.dispatcher;
	};
};

const EMPTY_BUTTON: GamepadButton = Object.freeze({ pressed: false, touched: false, value: 0 });

const sameButton = (a: GamepadButton, b: GamepadButton) =>
	a.pressed === b.pressed && a.touched === b.touched && a.value === b.value;

// Native Gamepad fields are prototype getters (spread yields nothing) and browsers may update
// the object in place, so copy each field explicitly. Unchanged buttons retain their identity.
const copyGamepad = (gp: Gamepad, old?: Gamepad): Gamepad => ({
	axes: [...gp.axes],
	buttons: gp.buttons.map(({ pressed, touched, value }, i) => {
		const oldButton = old?.buttons[i];
		return oldButton && sameButton(oldButton, { pressed, touched, value })
			? oldButton
			: { pressed, touched, value };
	}),
	connected: gp.connected,
	id: gp.id,
	index: gp.index,
	mapping: gp.mapping,
	timestamp: gp.timestamp,
	vibrationActuator: gp.vibrationActuator,
});

const initialGamepads: ReadonlyMap<number, Gamepad> = new Map();
let playerClaims: ReadonlyMap<number, number> = new Map();
let polling = false;
let frameId = 0;

const pollGamepads = () => {
	if (!polling) return;
	if (typeof navigator === "undefined" || typeof navigator.getGamepads !== "function") {
		throw new Error("The Gamepad API is not available in this environment.");
	}

	const previous = allGamepadsDispatcher.get();
	const next = new Map<number, Gamepad>();
	let changed = false;

	[...navigator.getGamepads()].forEach((gamepad) => {
		if (!gamepad) return;

		const old = previous.get(gamepad.index);
		if (old && old.timestamp === gamepad.timestamp && old.id === gamepad.id) {
			next.set(gamepad.index, old);
		} else {
			next.set(gamepad.index, copyGamepad(gamepad, old));
			changed = true;
		}
	});

	const nextIndexes = [...next.keys()];
	const previousIndexes = [...previous.keys()];
	const indexesChanged =
		nextIndexes.length !== previousIndexes.length ||
		nextIndexes.some((index, position) => index !== previousIndexes[position]);

	if (indexesChanged) {
		playerClaims = claimPlayers(playerClaims, nextIndexes);
	}
	if (changed || indexesChanged) allGamepadsManaged.fire(next);

	if (polling) frameId = requestAnimationFrame(pollGamepads);
};

const startPolling = () => {
	if (polling) return;
	if (typeof navigator === "undefined" || typeof navigator.getGamepads !== "function") {
		throw new Error("The Gamepad API is not available in this environment.");
	}
	if (typeof requestAnimationFrame !== "function" || typeof cancelAnimationFrame !== "function") {
		throw new Error("Animation frame scheduling is not available in this environment.");
	}
	polling = true;
	try {
		pollGamepads();
	} catch (error) {
		polling = false;
		throw error;
	}
};

const stopPolling = () => {
	if (!polling) return;
	polling = false;
	cancelAnimationFrame(frameId);
	allGamepadsManaged.fire(new Map());
};

const allGamepadsManaged = createManagedDispatcher(initialGamepads, {
	start: startPolling,
	stop: stopPolling,
});
export const allGamepadsDispatcher = allGamepadsManaged.dispatcher;

const claimPlayers = (
	claims: ReadonlyMap<number, number>,
	indexes: readonly number[]
): ReadonlyMap<number, number> => {
	const claimedIndexes = new Set(claims.values());
	const unclaimedIndexes = indexes.filter((index) => !claimedIndexes.has(index));
	if (!unclaimedIndexes.length) return claims;

	const next = new Map(claims);
	unclaimedIndexes.forEach((index) => {
		const player = Array.from({ length: next.size + 1 }, (_, i) => i + 1).find(
			(candidate) => !next.has(candidate)
		)!;
		next.set(player, index);
	});
	return next;
};

const createProjectedDispatcher = <SOURCE, VALUE>(
	getSource: () => GamepadDispatcher<SOURCE>,
	initialValue: VALUE,
	project: (source: SOURCE) => VALUE,
	isEqual: (a: VALUE, b: VALUE) => boolean = Object.is,
	onEmpty?: () => void
): ManagedDispatcher<VALUE> => {
	let sourceUnsubscribe: EventDispatcherUnsub | undefined;
	let latest = initialValue;
	const holder: { managed?: ManagedDispatcher<VALUE> } = {};
	const fire = (value: VALUE) => {
		latest = value;
		holder.managed?.fire(value);
	};

	const managed = createManagedDispatcher(initialValue, {
		start: () => {
			const source = getSource();
			sourceUnsubscribe = source.on("value", (value) => {
				const next = project(value);
				if (isEqual(latest, next)) return;
				fire(next);
			});
		},
		stop: () => {
			sourceUnsubscribe?.();
			sourceUnsubscribe = undefined;
			latest = initialValue;
			managed.fire(initialValue);
		},
		onEmpty,
	});
	holder.managed = managed;
	return managed;
};

export type GamepadControls = Pick<Gamepad, "axes" | "buttons">;

const pickLeastZero = (...values: readonly number[]): number =>
	values.reduce((ret, val) => (Math.abs(val) > Math.abs(ret) ? val : ret), 0);

const mergeGamepads = (gamepads: ReadonlyMap<number, Gamepad>): GamepadControls => {
	const axes: number[] = [];
	const buttons: GamepadButton[] = [];

	gamepads.forEach((gamepad) => {
		gamepad.axes.forEach((value, i) => {
			axes[i] = pickLeastZero(axes[i] ?? 0, value);
		});
		gamepad.buttons.forEach((button, i) => {
			const merged = buttons[i] ?? EMPTY_BUTTON;
			buttons[i] = {
				pressed: merged.pressed || button.pressed,
				touched: merged.touched || button.touched,
				value: pickLeastZero(merged.value, button.value),
			};
		});
	});

	return { axes, buttons };
};

const EMPTY_CONTROLS: GamepadControls = { axes: [], buttons: [] };

export const anyControllerDispatcher = createProjectedDispatcher(
	() => allGamepadsDispatcher,
	EMPTY_CONTROLS,
	mergeGamepads
).dispatcher;

const getPlayerGamepad = (
	gamepads: ReadonlyMap<number, Gamepad>,
	player: number
): Gamepad | undefined => {
	const index = playerClaims.get(player);
	return index === undefined ? undefined : gamepads.get(index);
};

export const playerGamepadDispatcher = createDispatcherFamily<number, Gamepad | undefined>(
	(player, onEmpty) =>
		createProjectedDispatcher(
			() => allGamepadsDispatcher,
			undefined,
			(gamepads) => getPlayerGamepad(gamepads, player),
			Object.is,
			onEmpty
		)
);

export type GamepadAxisOptions = { readonly deadZone?: number };
export type GamepadStickOptions = {
	readonly deadZone?: number | { readonly x: number; readonly y: number };
};
export type GamepadStick = { readonly x: number; readonly y: number };

const DEFAULT_DEAD_ZONE = 0.1;
const applyDeadZone = (value: number, deadZone: number): number =>
	Math.abs(value) < deadZone ? 0 : value;

const resolveStickDeadZone = ({ deadZone = DEFAULT_DEAD_ZONE }: GamepadStickOptions): GamepadStick =>
	typeof deadZone === "number" ? { x: deadZone, y: deadZone } : deadZone;

const resolvePlayerAxis = (
	gamepad: Gamepad | undefined,
	axis: number,
	deadZone: number
): number => applyDeadZone(gamepad?.axes[axis] ?? 0, deadZone);

export const playerGamepadButtonDispatcher = createDispatcherFamily<
	{ readonly player: number; readonly button: number },
	GamepadButton
>(
	({ player, button }, onEmpty) =>
		createProjectedDispatcher(
			() => playerGamepadDispatcher(player),
			EMPTY_BUTTON,
			(gamepad) => gamepad?.buttons[button] ?? EMPTY_BUTTON,
			sameButton,
			onEmpty
		),
	(a, b) => a.player === b.player && a.button === b.button
);

export const playerGamepadAxisDispatcher = createDispatcherFamily<
	{ readonly player: number; readonly axis: number; readonly deadZone: number },
	number
>(
	({ player, axis, deadZone }, onEmpty) =>
		createProjectedDispatcher(
			() => playerGamepadDispatcher(player),
			0,
			(gamepad) => resolvePlayerAxis(gamepad, axis, deadZone),
			Object.is,
			onEmpty
		),
	(a, b) => a.player === b.player && a.axis === b.axis && a.deadZone === b.deadZone
);

export const anyControllerButtonDispatcher = createDispatcherFamily<number, GamepadButton>(
	(button, onEmpty) =>
		createProjectedDispatcher(
			() => anyControllerDispatcher,
			EMPTY_BUTTON,
			(controls) => controls.buttons[button] ?? EMPTY_BUTTON,
			sameButton,
			onEmpty
		)
);

export const anyControllerAxisDispatcher = createDispatcherFamily<
	{ readonly axis: number; readonly deadZone: number },
	number
>(
	({ axis, deadZone }, onEmpty) =>
		createProjectedDispatcher(
			() => anyControllerDispatcher,
			0,
			(controls) => applyDeadZone(controls.axes[axis] ?? 0, deadZone),
			Object.is,
			onEmpty
		),
	(a, b) => a.axis === b.axis && a.deadZone === b.deadZone
);

const anyLeftStickFamily = createDispatcherFamily<
	GamepadStick,
	GamepadStick
>(
	({ x: deadZoneX, y: deadZoneY }, onEmpty) =>
		createProjectedDispatcher(
			() => anyControllerDispatcher,
			{ x: 0, y: 0 },
			(controls) => ({
				x: applyDeadZone(controls.axes[0] ?? 0, deadZoneX),
				y: applyDeadZone(controls.axes[1] ?? 0, deadZoneY),
			}),
			(a, b) => a.x === b.x && a.y === b.y,
			onEmpty
		),
	(a, b) => a.x === b.x && a.y === b.y
);

const anyRightStickFamily = createDispatcherFamily<GamepadStick, GamepadStick>(
	({ x: deadZoneX, y: deadZoneY }, onEmpty) =>
		createProjectedDispatcher(
			() => anyControllerDispatcher,
			{ x: 0, y: 0 },
			(controls) => ({
				x: applyDeadZone(controls.axes[2] ?? 0, deadZoneX),
				y: applyDeadZone(controls.axes[3] ?? 0, deadZoneY),
			}),
			(a, b) => a.x === b.x && a.y === b.y,
			onEmpty
		),
	(a, b) => a.x === b.x && a.y === b.y
);

export const anyLeftStickDispatcher = (options: GamepadStickOptions = {}) =>
	anyLeftStickFamily(resolveStickDeadZone(options));

export const anyRightStickDispatcher = (options: GamepadStickOptions = {}) =>
	anyRightStickFamily(resolveStickDeadZone(options));

export const anyDPadStickDispatcher = createProjectedDispatcher(
	() => anyControllerDispatcher,
	{ x: 0, y: 0 },
	(controls) => {
		const up = controls.buttons[12]?.value ?? 0;
		const down = controls.buttons[13]?.value ?? 0;
		const left = controls.buttons[14]?.value ?? 0;
		const right = controls.buttons[15]?.value ?? 0;
		return { x: right - left, y: down - up };
	},
	(a, b) => a.x === b.x && a.y === b.y
).dispatcher;

const anyDirectionFamily = createDispatcherFamily<GamepadStick, GamepadStick>(
	({ x: deadZoneX, y: deadZoneY }, onEmpty) =>
		createProjectedDispatcher(
			() => anyControllerDispatcher,
			{ x: 0, y: 0 },
			(controls) => {
				const leftX = applyDeadZone(controls.axes[0] ?? 0, deadZoneX);
				const leftY = applyDeadZone(controls.axes[1] ?? 0, deadZoneY);
				const rightX = applyDeadZone(controls.axes[2] ?? 0, deadZoneX);
				const rightY = applyDeadZone(controls.axes[3] ?? 0, deadZoneY);
				const up = controls.buttons[12]?.value ?? 0;
				const down = controls.buttons[13]?.value ?? 0;
				const left = controls.buttons[14]?.value ?? 0;
				const right = controls.buttons[15]?.value ?? 0;

				return {
					x: pickLeastZero(leftX, rightX, right - left),
					y: pickLeastZero(leftY, rightY, down - up),
				};
			},
			(a, b) => a.x === b.x && a.y === b.y,
			onEmpty
		),
	(a, b) => a.x === b.x && a.y === b.y
);

export const anyDirectionDispatcher = (options: GamepadStickOptions = {}) =>
	anyDirectionFamily(resolveStickDeadZone(options));

export const getPlayerGamepadButtonDispatcher = (player: number, button: number | GamepadButtonLabel) =>
	playerGamepadButtonDispatcher({ player, button: resolveButtonIndex(button) });

export const getPlayerGamepadAxisDispatcher = (
	player: number,
	axis: number | GamepadAxisLabel,
	{ deadZone = DEFAULT_DEAD_ZONE }: GamepadAxisOptions = {}
) => playerGamepadAxisDispatcher({ player, axis: resolveAxisIndex(axis), deadZone });

export const getAnyControllerButtonDispatcher = (button: number | GamepadButtonLabel) =>
	anyControllerButtonDispatcher(resolveButtonIndex(button));

export const getAnyControllerAxisDispatcher = (
	axis: number | GamepadAxisLabel,
	{ deadZone = DEFAULT_DEAD_ZONE }: GamepadAxisOptions = {}
) => anyControllerAxisDispatcher({ axis: resolveAxisIndex(axis), deadZone });