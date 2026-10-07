import {
	parseToPrimitive,
	type Launchable,
	type PrimitiveType,
	type PrimitiveTypeMap,
} from "@repo/shared";
import { spawn } from "node:child_process";
import { LAUNCHABLE_META } from "./consts.ts";

export function getEnvironmentValue(name: string): string;
export function getEnvironmentValue<TYPE extends PrimitiveType>(
	name: string,
	primType: TYPE
): PrimitiveTypeMap[TYPE];
export function getEnvironmentValue<R>(name: string, process: (value: string) => R): R;
export function getEnvironmentValue(
	name: string,
	processor: ((value: string) => unknown) | PrimitiveType = "string"
): unknown {
	const value = process.env[name];
	if (value === undefined) throw new Error(`Environment variable ${name} is not set`);

	switch (typeof processor) {
		case "string":
			return parseToPrimitive(value, processor);
		case "function":
			return processor(value);
	}
}

export const launchProcess = (command: string, args: readonly string[]): Promise<void> =>
	new Promise((resolveLaunch, rejectLaunch) => {
		const child = spawn(command, args, {
			detached: true,
			stdio: "ignore",
		});

		child.once("error", rejectLaunch);
		child.once("spawn", () => {
			child.unref();
			resolveLaunch();
		});
	});

export const launch = async (launchable: Launchable): Promise<void> => {
	const { type } = launchable;
	await LAUNCHABLE_META[type].launch(launchable as never);
};
