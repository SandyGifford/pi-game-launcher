import { atom, useAtomValue } from "jotai";
import { atomEffect } from "jotai-effect";
import { atomFamily } from "jotai-family";

// Native Gamepad fields are prototype getters (spread yields nothing) and the browser may
// update the object in place, so fields are copied explicitly to get a new identity.
const copyGamepad = (gp: Gamepad): Gamepad => ({
	axes: [...gp.axes],
	buttons: gp.buttons.map(({ pressed, touched, value }) => ({ pressed, touched, value })),
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
				next.set(gp.index, copyGamepad(gp));
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
		const index = get(gpIndexesAtom)[player - 1];
		return index === undefined ? get(EMPTY_ATOM) : get(gpAtomFamily(index));
	})
);

const gpButtonAtomFamily = atomFamily(
	({ player, button }: { readonly player: number; readonly button: number }) =>
		atom((get) => get(gpPlayerAtomFamily(player))?.buttons[button]?.pressed ?? false),
	(a, b) => a.player === b.player && a.button === b.button
);

const gpAxisAtomFamily = atomFamily(
	({ player, axis }: { readonly player: number; readonly axis: number }) =>
		atom((get) => get(gpPlayerAtomFamily(player))?.axes[axis] ?? 0),
	(a, b) => a.player === b.player && a.axis === b.axis
);

export const usePlayerGamepad = (player: number) => useAtomValue(gpPlayerAtomFamily(player));
export const usePlayerGamepadButton = (player: number, button: number) =>
	useAtomValue(gpButtonAtomFamily({ player, button }));
export const usePlayerGamepadAxis = (player: number, axis: number) =>
	useAtomValue(gpAxisAtomFamily({ player, axis }));
