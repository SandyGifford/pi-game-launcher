import { PRIMITIVE_META } from "./consts.ts";
import type { PrimitiveType, PrimitiveTypeMap } from "./types.ts";

export const parseToPrimitive = <TYPE extends PrimitiveType>(
	value: string,
	primType: TYPE
): PrimitiveTypeMap[TYPE] => PRIMITIVE_META[primType].parse(value);

export const toError = (error: unknown): Error => {
	if (error instanceof Error) return error;
	if (typeof error === "string") return new Error(error);
	if (typeof (error as { message?: unknown } | null | undefined)?.message === "string")
		return new Error((error as { message: string }).message);
	return new Error(`unknown error: ${String(error)}`);
};

export const awaitTime = (ms: number) => new Promise((res) => setTimeout(res, ms));
