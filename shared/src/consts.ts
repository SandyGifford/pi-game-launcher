import type { Launchable, LaunchableID, PrimitiveType, PrimitiveTypeMap } from "./types.ts";
import { addLaunchableIds } from "./utils.ts";

export const LAUNCHABLES: readonly Launchable[] = addLaunchableIds([
	{
		type: "APP",
		title: "Steam",
		iconPath: "steam.png",
		appPath: "STEAM_APP_PATH",
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

export const PRIMITIVE_META: {
	readonly [TYPE in PrimitiveType]: { readonly parse: (value: string) => PrimitiveTypeMap[TYPE] };
} = {
	bigint: { parse: (value) => BigInt(value) },
	boolean: { parse: (value) => Boolean(value) },
	null: { parse: () => null },
	number: { parse: (value) => Number(value) },
	string: { parse: (value) => value },
	symbol: { parse: () => Symbol() },
	undefined: { parse: () => undefined },
};
