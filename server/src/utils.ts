import {
	parseToPrimitive,
	type Launchable,
	type LaunchableID,
	type PrimitiveType,
	type PrimitiveTypeMap,
} from "@repo/shared";
import { spawn } from "node:child_process";
import { LAUNCHABLE_META, LAUNCHABLES_MAP } from "./consts.ts";
import type { LaunchableLaunchAction, NewLaunchable } from "./types.ts";

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

export const launch = async (launchable: Launchable): Promise<LaunchableLaunchAction> =>
	(await LAUNCHABLE_META[launchable.type].launch(launchable as never)) || { action: "none" };

let lastId = 1;
export const processNewLaunchables = (
	launchables: readonly NewLaunchable[]
): readonly Launchable[] =>
	launchables.map((launchable) => ({
		...launchable,
		id: `${lastId++}` as LaunchableID,
	}));

export const isLaunchableId = (id: unknown): id is LaunchableID => {
	if (typeof id !== "string") return false;
	return id in LAUNCHABLES_MAP;
};
