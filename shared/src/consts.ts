import type { PrimitiveType, PrimitiveTypeMap } from "./types.ts";

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
