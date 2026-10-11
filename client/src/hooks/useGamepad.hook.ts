import { atom, useAtomValue } from "jotai";

export type GamepadGetter = () => Gamepad | undefined;

const gpMapAtom = atom<ReadonlyMap<number, GamepadGetter>>(new Map());
gpMapAtom.onMount = (setAtom) => {
	setAtom(() => {
		const map = new Map<number, GamepadGetter>();

		navigator.getGamepads().forEach((gp) => {
			if (!gp) return;
			map.set(gp.index, () => navigator.getGamepads()[gp.index] || undefined);
		});
		return map;
	});

	const gpConnected = (e: WindowEventMap["gamepadconnected"]) => {
		const index = e.gamepad.index;

		setAtom((getterMap) => {
			const map = new Map(getterMap);
			map.set(index, () => navigator.getGamepads()[index] || undefined);
			return map;
		});
	};

	const gpDisconnected = (e: WindowEventMap["gamepaddisconnected"]) => {
		const index = e.gamepad.index;

		setAtom((getterMap) => {
			const map = new Map(getterMap);
			map.delete(index);
			return map;
		});
	};

	window.addEventListener("gamepadconnected", gpConnected);
	window.addEventListener("gamepaddisconnected", gpDisconnected);

	return () => {
		window.removeEventListener("gamepadconnected", gpConnected);
		window.removeEventListener("gamepaddisconnected", gpDisconnected);
	};
};

const gpArrayAtom = atom<readonly GamepadGetter[]>((get) => Array.from(get(gpMapAtom).values()));

const EMPTY_GETTER: GamepadGetter = () => undefined;

const gpAtom = atom<GamepadGetter>((get) => get(gpArrayAtom).find((gp) => !!gp()) || EMPTY_GETTER);

export const useGamepads = () => useAtomValue(gpArrayAtom);
export const useGamepad = () => useAtomValue(gpAtom);
