import {
	awaitTime,
	parseToPrimitive,
	type Launchable,
	type LaunchableID,
	type LaunchAction,
	type PrimitiveType,
	type PrimitiveTypeMap,
} from "@repo/shared";
import { spawn, type ChildProcess, type SpawnOptions } from "node:child_process";
import { LAUNCHABLE_META, LAUNCHABLES_MAP, ROOT_DIR } from "./consts.ts";
import type { NewLaunchable } from "./types.ts";

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

export type ProcessResult = {
	readonly stdout: string;
	readonly stderr: string;
	readonly code: number | null;
};

const spawnChild = (command: string, args: readonly string[], options?: SpawnOptions) =>
	new Promise<ChildProcess>((resolveSpawn, rejectSpawn) => {
		const child = spawn(command, args, { cwd: ROOT_DIR, ...options });

		child.once("error", rejectSpawn);
		child.once("spawn", () => resolveSpawn(child));
	});

export const launchProcessDetached = async (
	command: string,
	args: readonly string[],
	options?: Omit<SpawnOptions, "stdio" | "detached">
): Promise<void> => {
	const child = await spawnChild(command, args, { detached: true, stdio: "ignore", ...options });
	child.unref();
};

export const launchProcess = async (
	command: string,
	args: readonly string[],
	options?: Omit<SpawnOptions, "stdio">
): Promise<ProcessResult> => {
	const child = await spawnChild(command, args, { stdio: ["ignore", "pipe", "pipe"], ...options });

	return new Promise((resolveResult, rejectResult) => {
		let stdout = "";
		let stderr = "";

		child.stdout?.setEncoding("utf8").on("data", (chunk: string) => (stdout += chunk));
		child.stderr?.setEncoding("utf8").on("data", (chunk: string) => (stderr += chunk));
		child.once("error", rejectResult);
		child.once("close", (code) => resolveResult({ stdout, stderr, code }));
	});
};

export const launch = async (launchable: Launchable): Promise<LaunchAction> =>
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

export const shutdown = async () => {
	// await spawnChild("shutdown", ["-h", "now"]);
	await awaitTime(1000);
	console.log("=>", "shutdown");
};
export const restart = async () => {
	// await spawnChild("reboot", []);
	await awaitTime(1000);
	console.log("=>", "restart");
};
