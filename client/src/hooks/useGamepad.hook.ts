import { atom, useAtomValue } from "jotai";
import { atomEffect } from "jotai-effect";
import { atomFamily } from "jotai-family";
import { useMemo } from "react";

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

const EMPTY_BUTTON: GamepadButton = Object.freeze({ pressed: false, touched: false, value: 0 });

const sameButton = (a: GamepadButton, b: GamepadButton) =>
	a.pressed === b.pressed && a.touched === b.touched && a.value === b.value;

// Native Gamepad fields are prototype getters (spread yields nothing) and the browser may
// update the object in place, so fields are copied explicitly to get a new identity.
// Buttons that did not change keep their previous object so subscribers get stable references.
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

// Private: the polling loop is the only writer, and it is the single source of truth for
// which pads exist (absent from the map = not connected).
const gpMapAtom = atom<ReadonlyMap<number, Gamepad>>(new Map());
const gpIndexListAtom = atom<readonly number[]>([]);

// player number (1-based) -> gamepad index. Deliberately never cleared (not even when polling
// stops): a pad that reconnects on the same index regains its player slot. It stays tiny
// (two numbers per pad ever seen).
const gpPlayerClaimsAtom = atom<ReadonlyMap<number, number>>(new Map());

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

const gpPollingAtom = atomEffect((get, set) => {
	let frameId: number;

	const frame = () => {
		const prev = get.peek(gpMapAtom);
		const next = new Map<number, Gamepad>();
		let changed = false;

		[...navigator.getGamepads()].forEach((gp) => {
			if (!gp) return;

			const old = prev.get(gp.index);
			// The spec says timestamp only changes when an axis or button value changes.
			if (old && old.timestamp === gp.timestamp) {
				next.set(gp.index, old);
			} else {
				next.set(gp.index, copyGamepad(gp, old));
				changed = true;
			}
		});

		const nextIndexes = [...next.keys()];
		const prevIndexes = [...prev.keys()];
		const indexesChanged =
			nextIndexes.length !== prevIndexes.length ||
			nextIndexes.some((index, position) => index !== prevIndexes[position]);

		if (changed || indexesChanged) set(gpMapAtom, next);
		if (indexesChanged) {
			set(gpPlayerClaimsAtom, claimPlayers(get.peek(gpPlayerClaimsAtom), nextIndexes));
			set(gpIndexListAtom, nextIndexes);
			[...gpAtomFamily.getParams()].forEach((index) => {
				if (!next.has(index)) gpAtomFamily.remove(index);
			});
		}

		frameId = requestAnimationFrame(frame);
	};
	frame();

	return () => {
		cancelAnimationFrame(frameId);
		set(gpMapAtom, new Map());
		set(gpIndexListAtom, []);
		[...gpAtomFamily.getParams()].forEach((index) => gpAtomFamily.remove(index));
	};
});

// Single chokepoint that mounts the polling effect; unmounting the last subscriber stops it.
const gpIndexesAtom = atom((get) => {
	get(gpPollingAtom);
	return get(gpIndexListAtom);
});

const gpAtomFamily = atomFamily((index: number) =>
	atom((get) => {
		get(gpIndexesAtom);
		return get(gpMapAtom).get(index);
	})
);

const EMPTY_ATOM = atom(() => undefined);

const gpPlayerAtomFamily = atomFamily((player: number) =>
	atom((get) => {
		// Subscribing to the index list also re-resolves the pad atom after its cache entry is pruned.
		get(gpIndexesAtom);
		const index = get(gpPlayerClaimsAtom).get(player);
		return index === undefined ? get(EMPTY_ATOM) : get(gpAtomFamily(index));
	})
);

export type GamepadControls = Pick<Gamepad, "axes" | "buttons">;

const pickLeastZero = (...values: readonly number[]): number =>
	values.reduce((ret, val) => (Math.abs(val) > Math.abs(ret) ? val : ret), 0);

// Merges every connected pad: per axis the largest magnitude wins, per button any press counts.
const gpAnyControllerAtom = atom((get): GamepadControls => {
	// Mounts polling; gpMapAtom alone would never be populated.
	get(gpIndexesAtom);
	const axes: number[] = [];
	const buttons: GamepadButton[] = [];

	get(gpMapAtom).forEach((pad) => {
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
});

// The merged button is rebuilt on every poll change, so the last value is kept per index and
// reused while its contents are unchanged.
const gpAnyButtonAtomFamily = atomFamily((button: number) => {
	let last = EMPTY_BUTTON;
	return atom((get) => {
		const next = get(gpAnyControllerAtom).buttons[button] ?? EMPTY_BUTTON;
		if (!sameButton(last, next)) last = next;
		return last;
	});
});

const DEFAULT_DEAD_ZONE = 0.1;

const applyDeadZone = (value: number, deadZone: number): number =>
	Math.abs(value) < deadZone ? 0 : value;

// The dead zone is applied inside the atoms so values jittering within it never notify subscribers.
const gpAnyAxisAtomFamily = atomFamily(
	({ axis, deadZone }: { readonly axis: number; readonly deadZone: number }) =>
		atom((get) => applyDeadZone(get(gpAnyControllerAtom).axes[axis] ?? 0, deadZone)),
	(a, b) => a.axis === b.axis && a.deadZone === b.deadZone
);

const gpButtonAtomFamily = atomFamily(
	({ player, button }: { readonly player: number; readonly button: number }) =>
		atom((get) => get(gpPlayerAtomFamily(player))?.buttons[button] ?? EMPTY_BUTTON),
	(a, b) => a.player === b.player && a.button === b.button
);

const gpAxisAtomFamily = atomFamily(
	({
		player,
		axis,
		deadZone,
	}: {
		readonly player: number;
		readonly axis: number;
		readonly deadZone: number;
	}) =>
		atom((get) =>
			applyDeadZone(get(gpPlayerAtomFamily(player))?.axes[axis] ?? 0, deadZone)
		),
	(a, b) => a.player === b.player && a.axis === b.axis && a.deadZone === b.deadZone
);

export const usePlayerGamepad = (player: number) => useAtomValue(gpPlayerAtomFamily(player));
export const usePlayerGamepadButton = (player: number, button: number | GamepadButtonLabel) =>
	useAtomValue(
		gpButtonAtomFamily({
			player,
			button: resolveButtonIndex(button),
		})
	);

export type GamepadStick = { readonly x: number; readonly y: number };

export type AxisOptions = { readonly deadZone?: number };
export type StickOptions = {
	readonly deadZone?: number | { readonly x: number; readonly y: number };
};

const resolveStickDeadZone = ({ deadZone = DEFAULT_DEAD_ZONE }: StickOptions): GamepadStick =>
	typeof deadZone === "number" ? { x: deadZone, y: deadZone } : deadZone;

export const usePlayerGamepadAxis = (
	player: number,
	axis: number | GamepadAxisLabel,
	{ deadZone = DEFAULT_DEAD_ZONE }: AxisOptions = {}
) => useAtomValue(gpAxisAtomFamily({ player, axis: resolveAxisIndex(axis), deadZone }));
export const useAnyController = () => useAtomValue(gpAnyControllerAtom);
export const useAnyControllerAxis = (
	axis: number | GamepadAxisLabel,
	{ deadZone = DEFAULT_DEAD_ZONE }: AxisOptions = {}
) => useAtomValue(gpAnyAxisAtomFamily({ axis: resolveAxisIndex(axis), deadZone }));
export const useAnyControllerButton = (button: number | GamepadButtonLabel) =>
	useAtomValue(gpAnyButtonAtomFamily(resolveButtonIndex(button)));
export const useAnyLeftStick = (options: StickOptions = {}): GamepadStick => {
	const deadZone = resolveStickDeadZone(options);
	return {
		x: useAnyControllerAxis("LEFT_STICK_X", { deadZone: deadZone.x }),
		y: useAnyControllerAxis("LEFT_STICK_Y", { deadZone: deadZone.y }),
	};
};
export const useAnyRightStick = (options: StickOptions = {}): GamepadStick => {
	const deadZone = resolveStickDeadZone(options);
	return {
		x: useAnyControllerAxis("RIGHT_STICK_X", { deadZone: deadZone.x }),
		y: useAnyControllerAxis("RIGHT_STICK_Y", { deadZone: deadZone.y }),
	};
};

// Digital, so no dead zone. Same orientation as the sticks: negative is left/up.
export const useAnyDPadStick = (): GamepadStick => {
	const up = useAnyControllerButton("DPAD_UP").value;
	const down = useAnyControllerButton("DPAD_DOWN").value;
	const left = useAnyControllerButton("DPAD_LEFT").value;
	const right = useAnyControllerButton("DPAD_RIGHT").value;

	return { x: right - left, y: down - up };
};

export const useAnyDirection = (options: StickOptions = {}): GamepadStick => {
	const ls = useAnyLeftStick(options);
	const rs = useAnyRightStick(options);
	const dp = useAnyDPadStick();

	return {
		x: useMemo(() => pickLeastZero(ls.x, rs.x, dp.x), [dp.x, ls.x, rs.x]),
		y: useMemo(() => pickLeastZero(ls.y, rs.y, dp.y), [dp.y, ls.y, rs.y]),
	};
};
