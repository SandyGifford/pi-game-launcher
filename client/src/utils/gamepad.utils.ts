import { eventDispatcher } from "../event-dispatcher/event-dispatcher";
import { eventDispatcherFamily } from "../event-dispatcher/event-dispatcher-family";
import { bindDispatcher } from "../event-dispatcher/event-dispatcher.utils";

export type GamepadState = Omit<Gamepad, "vibrationActuator">;
type GamepadByIndexMap = ReadonlyMap<number, GamepadState>;
type GamepadIndexByPlayerMap = ReadonlyMap<number, number>;
type GamepadByPlayerMap = ReadonlyMap<number, GamepadState>;

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

const gpByIndexDisp = eventDispatcher<GamepadByIndexMap>({
	initialState: new Map(),
});
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

const indexByPlayerDisp = eventDispatcher<GamepadIndexByPlayerMap>({ initialState: new Map() });
const gpByPlayerDisp = eventDispatcher<GamepadByPlayerMap>({ initialState: new Map() });

bindDispatcher(indexByPlayerDisp, [gpByIndexDisp], ([gpByIndex], current) =>
	claimPlayers(current, [...gpByIndex.keys()])
);

bindDispatcher(
	gpByPlayerDisp,
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

const gpByPlayerDispFamily = eventDispatcherFamily((player: number) => {
	const disp = eventDispatcher<GamepadState | undefined>({ initialState: undefined });
	bindDispatcher(disp, [gpByPlayerDisp], ([gpByPlayer]) => gpByPlayer.get(player));
	return disp;
});

export const gamepadByPlayerFamily = gpByPlayerDispFamily.getReadonly();
