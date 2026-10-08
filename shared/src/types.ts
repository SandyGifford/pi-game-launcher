import type { Primitive, Tagged } from "type-fest";

export type LaunchableID = Tagged<string, "LaunchableID">;
export type LaunchableArguments = readonly string[];

type LaunchableBase<TYPE extends string> = {
	readonly id: LaunchableID;
	readonly type: TYPE;
	readonly title: string;
	readonly iconPath: string;
	readonly launchArguments: LaunchableArguments;
};

export type AppLaunchable = LaunchableBase<"APP"> & { readonly appPath: string };
export type ShellLaunchable = LaunchableBase<"SHELL"> & { readonly scriptPath: string };
export type URLLaunchable = LaunchableBase<"URL"> & { readonly url: string };

export type Launchable = AppLaunchable | ShellLaunchable | URLLaunchable;
export type LaunchableType = Launchable["type"];

export type PrimitiveType =
	"string" | "number" | "bigint" | "boolean" | "symbol" | "null" | "undefined";

export type Satisfies<T, U extends T> = U;

export type PrimitiveTypeMap = Satisfies<
	{ readonly [TYPE in PrimitiveType]: Primitive },
	{
		readonly string: string;
		readonly number: number;
		readonly bigint: bigint;
		readonly boolean: boolean;
		readonly symbol: symbol;
		readonly null: null;
		readonly undefined: undefined;
	}
>;
