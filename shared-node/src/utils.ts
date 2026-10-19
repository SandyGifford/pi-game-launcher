import { parseToPrimitive, type PrimitiveType, type PrimitiveTypeMap } from "@repo/shared";
import { spawn, type ChildProcess, type SpawnOptions } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { BUILT_SHA_PATH, CLIENT_DIST_DIR, ROOT_DIR } from "./consts.ts";
import { getHeadSha, updateFromGit } from "./git.utils.ts";
import { updateFromNpm } from "./npm.utils.ts";

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
	readonly code: number;
};

export const spawnChild = (command: string, args: readonly string[], options?: SpawnOptions) =>
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
		child.once("close", (code, signal) => {
			if (code !== 0) {
				const exitReason = code === null ? `signal ${signal ?? "unknown"}` : `exit code ${code}`;
				const output = stderr.trim() || stdout.trim();
				rejectResult(
					new Error(`Command ${command} failed with ${exitReason}${output ? `:\n${output}` : ""}`)
				);
				return;
			}

			resolveResult({ stdout, stderr, code });
		});
	});
};

export const readBuiltSha = () =>
	readFile(BUILT_SHA_PATH, "utf8").then(
		(sha) => sha.trim(),
		() => null
	);
export const writeBuiltSha = (sha: string) => writeFile(BUILT_SHA_PATH, `${sha}\n`);

export const update = async () => {
	const pulled = await updateFromGit();
	const head = await getHeadSha();
	if (pulled || !existsSync(CLIENT_DIST_DIR) || (await readBuiltSha()) !== head) {
		await updateFromNpm();
		await writeBuiltSha(head);
	}
};
