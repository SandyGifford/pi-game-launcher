import { eventDispatcher } from "../event-dispatcher/event-dispatcher";
import { eventDispatcherFamily } from "../event-dispatcher/event-dispatcher-family";
import { reducerEventDispatcher } from "../event-dispatcher/event-dispatcher-reducer";

export type GamepadState = Omit<Gamepad, "vibrationActuator">;
export type GamepadControls = Pick<Gamepad, "axes" | "buttons">;
export type GamepadStick = { readonly x: number; readonly y: number };

type GamepadByIndexMap = ReadonlyMap<number, GamepadState>;
type GamepadIndexByPlayerMap = ReadonlyMap<number, number>;
type GamepadByPlayerMap = ReadonlyMap<number, GamepadState>;

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

// Gives each not-yet-claimed index the lowest free player number; existing claims never move.
const claimPlayers = (
	claims: ReadonlyMap<number, number>,
	indexes: readonly number[]
): ReadonlyMap<number, number> => {
	const claimed = new Set(claims.values());
	const unclaimed = indexes.filter((index) => !claimed.has(index));
	if (!unclaimed.length) return claims;

	const next = new Map(claims);
	unclaimed.forEach((index) => {
		const player = Array.from({ length: next.size + 1 }, (_, i) => i + 1).find(
			(p) => !next.has(p)
		)!;
		next.set(player, index);
	});
	return next;
};

const mergeArrays = <T>(
	arr: readonly T[],
	old: readonly T[] | undefined,
	areEqual: (a: T, b: T) => boolean = (a, b) => a === b
): readonly T[] => {
	if (!old || arr.length !== old.length) return arr;
	let changed = false;
	const ret = arr.map((v, i) => {
		// lengths are equal, we can safely assume old[i] is T
		if (areEqual(v, old[i]!)) return old[i]!;
		else {
			changed = true;
			return v;
		}
	});

	if (changed) return ret;
	return old;
};

const sameButton = (a: GamepadButton, b: GamepadButton) =>
	a.pressed === b.pressed && a.touched === b.touched && a.value === b.value;

const copyButton = (btn: GamepadButton): GamepadButton => ({
	pressed: btn.pressed,
	touched: btn.touched,
	value: btn.value,
});

const getGamepadState = (gp: Gamepad | GamepadState, old?: GamepadState): GamepadState => {
	const axes = mergeArrays([...gp.axes], old?.axes);
	const buttons = mergeArrays(gp.buttons.map(copyButton), old?.buttons, sameButton);

	if (
		old &&
		axes === old.axes &&
		buttons === old.buttons &&
		gp.connected === old.connected &&
		gp.id === old.id &&
		gp.index === old.index &&
		gp.mapping === old.mapping &&
		gp.timestamp === old.timestamp
	)
		return old;

	return {
		axes,
		buttons,
		connected: gp.connected,
		id: gp.id,
		index: gp.index,
		mapping: gp.mapping,
		timestamp: gp.timestamp,
	};
};

const gpByIndexDisp = eventDispatcher<GamepadByIndexMap>(new Map());
gpByIndexDisp.on("mount", () => {
	let frameId = 0;

	const frame = () => {
		// Scheduled first so a throwing listener can't kill the loop, and so an unmount during
		// this frame cancels the id that is actually pending.
		frameId = requestAnimationFrame(frame);

		const prev = gpByIndexDisp.get();
		const next = new Map<number, GamepadState>();
		let changed = false;

		[...navigator.getGamepads()].forEach((gp) => {
			if (!gp) return;

			const old = prev.get(gp.index);
			// The spec says timestamp only changes when an axis or button value changes.
			if (old && old.timestamp === gp.timestamp) {
				next.set(gp.index, old);
			} else {
				next.set(gp.index, getGamepadState(gp, old));
				changed = true;
			}
		});

		const nextIndexes = [...next.keys()];
		const prevIndexes = [...prev.keys()];
		const indexesChanged =
			nextIndexes.length !== prevIndexes.length ||
			nextIndexes.some((index, position) => index !== prevIndexes[position]);

		if (changed || indexesChanged) gpByIndexDisp.fire(next);
	};
	// If the first frame throws we never return the cleanup, so cancel the queued frame ourselves.
	try {
		frame();
	} catch (e) {
		cancelAnimationFrame(frameId);
		throw e;
	}
	return () => {
		cancelAnimationFrame(frameId);
	};
});

const indexByPlayerDisp = reducerEventDispatcher<GamepadIndexByPlayerMap>()(
	new Map(),
	[gpByIndexDisp],
	([gpByIndex], current) => claimPlayers(current, [...gpByIndex.keys()])
);

const gpByPlayerDisp = reducerEventDispatcher<GamepadByPlayerMap>()(
	new Map(),
	[gpByIndexDisp, indexByPlayerDisp],
	([gpByIndex, indexByPlayer], current) => {
		let changed = false;
		const next = [...indexByPlayer.entries()].reduce((map, [player, index]) => {
			const gp = gpByIndex.get(index);
			if (gp) {
				const gps = getGamepadState(gp, current.get(player));
				if (gp !== gps) {
					map.set(player, gps);
					changed = true;
				}
			}
			return map;
		}, new Map<number, GamepadState>());

		if (changed) return next;
		return current;
	}
);

const gpByPlayerDispFamily = eventDispatcherFamily((player: number) =>
	reducerEventDispatcher<GamepadState | undefined>()(undefined, [gpByPlayerDisp], ([gpByPlayer]) =>
		gpByPlayer.get(player)
	)
);

const EMPTY_BUTTON: GamepadButton = { pressed: false, touched: false, value: 0 };
const EMPTY_CONTROLS: GamepadControls = {
	axes: [],
	buttons: [],
};

const pickLeastZero = (...values: readonly number[]): number =>
	values.reduce((ret, val) => (Math.abs(val) > Math.abs(ret) ? val : ret), 0);

const allGPControlsDist = reducerEventDispatcher<GamepadControls>()(
	EMPTY_CONTROLS,
	[gpByIndexDisp],
	([gpByIndex]) => {
		const axes: number[] = [];
		const buttons: GamepadButton[] = [];

		[...gpByIndex.values()].forEach((pad) => {
			pad.axes.forEach((value, i) => {
				axes[i] = pickLeastZero(axes[i] ?? 0, value);
			});

			pad.buttons.forEach((button, i) => {
				const merged = buttons[i] ?? EMPTY_BUTTON;
				buttons[i] = {
					pressed: merged.pressed || button.pressed,
					touched: merged.touched || button.touched,
					value: pickLeastZero(merged.value, button.value),
				};
			});
		});

		return { axes, buttons };
	}
);

const gamepadSticksEqual = (a: GamepadStick, b: GamepadStick): boolean =>
	a.x === b.x && a.y === b.y;

const allGPDirectionsDist = reducerEventDispatcher<GamepadStick>()(
	{ x: 0, y: 0 },
	[allGPControlsDist],
	([{ axes, buttons }], current) => {
		const ls: GamepadStick = {
			x: axes[resolveAxisIndex("LEFT_STICK_X")] ?? 0,
			y: axes[resolveAxisIndex("LEFT_STICK_Y")] ?? 0,
		};
		const rs: GamepadStick = {
			x: axes[resolveAxisIndex("RIGHT_STICK_X")] ?? 0,
			y: axes[resolveAxisIndex("RIGHT_STICK_Y")] ?? 0,
		};

		const up = buttons[resolveButtonIndex("DPAD_UP")]?.value || 0;
		const down = buttons[resolveButtonIndex("DPAD_DOWN")]?.value || 0;
		const left = buttons[resolveButtonIndex("DPAD_LEFT")]?.value || 0;
		const right = buttons[resolveButtonIndex("DPAD_RIGHT")]?.value || 0;

		const dp: GamepadStick = { x: right - left, y: down - up };

		const next: GamepadStick = {
			x: pickLeastZero(ls.x, rs.x, dp.x),
			y: pickLeastZero(ls.y, rs.y, dp.y),
		};

		return gamepadSticksEqual(current, next) ? current : next;
	}
);

export const allGamepadDirection = allGPDirectionsDist.getReadonly();
export const gamepadByPlayerFamily = gpByPlayerDispFamily.getReadonly();
