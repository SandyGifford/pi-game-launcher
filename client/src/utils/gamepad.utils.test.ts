import { expect, it, vi } from "vitest";
import type { GamepadStick } from "./gamepad.utils";

const makeGamepad = (timestamp: number, axes: number[], buttons: GamepadButton[]): Gamepad =>
	({
		axes,
		buttons,
		connected: true,
		id: "test-pad",
		index: 0,
		mapping: "standard",
		timestamp,
		vibrationActuator: {
			type: "dual-rumble",
			playEffect: vi.fn(),
			reset: vi.fn(),
		},
	}) as Gamepad;

it("cascades gamepad values and stops polling after the last unsubscribe", async () => {
	const gamepads: (Gamepad | null)[] = [];
	const scheduledFrames = new Map<number, FrameRequestCallback>();
	let nextFrameId = 0;
	const requestFrame = vi.fn((callback: FrameRequestCallback) => {
		const id = ++nextFrameId;
		scheduledFrames.set(id, callback);
		return id;
	});
	const cancelFrame = vi.fn((id: number) => {
		scheduledFrames.delete(id);
	});

	vi.stubGlobal("navigator", { getGamepads: () => gamepads });
	vi.stubGlobal("requestAnimationFrame", requestFrame);
	vi.stubGlobal("cancelAnimationFrame", cancelFrame);

	const gamepadUtils = await import("./gamepad.utils");
	const anyAxis = gamepadUtils.getAnyControllerAxisDispatcher("LEFT_STICK_X", {
		deadZone: 0.1,
	});
	const anyButton = gamepadUtils.getAnyControllerButtonDispatcher("FACE_BOTTOM");
	const playerGamepad = gamepadUtils.playerGamepadDispatcher(1);
	const direction = gamepadUtils.anyDirectionDispatcher();
	const axisValues: number[] = [];
	const buttonValues: boolean[] = [];
	const playerValues: (Gamepad | undefined)[] = [];
	const directionValues: GamepadStick[] = [];
	const unsubscribers = [
		anyAxis.on("value", (value) => axisValues.push(value)),
		anyButton.on("value", (value) => buttonValues.push(value.pressed)),
		playerGamepad.on("value", (value) => playerValues.push(value)),
		direction.on("value", (value) => directionValues.push(value)),
	];

	const pollNextFrame = () => {
		const entry = scheduledFrames.entries().next().value as
			| [number, FrameRequestCallback]
			| undefined;
		expect(entry).toBeDefined();
		const [id, callback] = entry!;
		scheduledFrames.delete(id);
		callback(0);
	};

	const buttons = Array.from({ length: 17 }, () => ({
		pressed: false,
		touched: false,
		value: 0,
	}));
	buttons[0] = { pressed: true, touched: true, value: 1 };
	gamepads.push(makeGamepad(1, [0.05, 0, 0, 0], buttons));
	pollNextFrame();

	expect(axisValues).toEqual([0]);
	expect(buttonValues).toEqual([false, true]);
	expect(playerValues.at(-1)?.index).toBe(0);

	gamepads[0] = makeGamepad(2, [0.4, 0, 0, 0], buttons);
	pollNextFrame();
	expect(axisValues).toEqual([0, 0.4]);
	expect(directionValues.at(-1)).toEqual({ x: 0.4, y: 0 });

	unsubscribers.forEach((unsubscribe) => unsubscribe());
	expect(scheduledFrames.size).toBe(0);
	expect(cancelFrame).toHaveBeenCalledTimes(1);
});
