import { LAUNCHABLES_MAP, PRIMITIVE_META } from "./consts.ts";
import type {
	Launchable,
	LaunchableID,
	NewLaunchable,
	PrimitiveType,
	PrimitiveTypeMap,
} from "./types.ts";

let id = 1;

export const addLaunchableIds = (launchables: readonly NewLaunchable[]): readonly Launchable[] =>
	launchables.map((launchable) => ({ ...launchable, id: `${id++}` }) as Launchable);

export const isLaunchableId = (id: unknown): id is LaunchableID => {
	if (typeof id !== "string") return false;
	return id in LAUNCHABLES_MAP;
};

export const parseToPrimitive = <TYPE extends PrimitiveType>(
	value: string,
	primType: TYPE
): PrimitiveTypeMap[TYPE] => PRIMITIVE_META[primType].parse(value);
