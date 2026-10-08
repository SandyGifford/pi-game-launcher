import type { Launchable, LaunchableID, LaunchableType } from "@repo/shared";
import { realpath, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { processLaunchables, getEnvironmentValue, launchProcess } from "./utils.ts";

export const ROOT_DIR = resolve(import.meta.dirname, "../../");
export const SERVER_DIR = resolve(ROOT_DIR, "server");
export const CLIENT_DIR = resolve(ROOT_DIR, "client");
export const SHELL_SCRIPTS_DIR = resolve(SERVER_DIR, "shell-scripts");
export const STATIC_DIR = resolve(SERVER_DIR, "static");

export const LAUNCHABLES: readonly Launchable[] = processLaunchables([
	{
		type: "APP",
		title: "Steam",
		iconPath: "steam.png",
		appPath: "STEAM_APP_PATH",
		launchArguments: ["-bigpicture"],
	},
	{
		type: "URL",
		title: "GeForce NOW",
		iconPath: "geforce-now.png",
		url: "GEFORCE_NOW_URL",
	},
]);

export const LAUNCHABLES_MAP = LAUNCHABLES.reduce(
	(map, launchable) => ({ ...map, [launchable.id]: launchable }),
	{} as { readonly [ID in LaunchableID]: Launchable }
);

export const LAUNCHABLE_META: {
	readonly [TYPE in LaunchableType]: {
		readonly launch: (
			launchable: Extract<Launchable, { readonly type: TYPE }>
		) => unknown | Promise<unknown>;
	};
} = {
	APP: {
		launch: ({ appPath, launchArguments }) =>
			launchProcess(getEnvironmentValue(appPath), launchArguments),
	},
	URL: {
		launch: ({ url, launchArguments }) =>
			launchProcess("chromium", ["--kiosk", getEnvironmentValue(url), ...launchArguments]),
	},
	SHELL: {
		launch: async ({ scriptPath, launchArguments }) => {
			const configuredScriptPath = getEnvironmentValue(scriptPath);
			const absoluteScriptPath = await realpath(resolve(SHELL_SCRIPTS_DIR, configuredScriptPath));

			if (!(await stat(absoluteScriptPath)).isFile())
				throw new Error(`Shell script path is not a file: ${scriptPath}`);

			await launchProcess("sh", [absoluteScriptPath, ...launchArguments]);
		},
	},
};
