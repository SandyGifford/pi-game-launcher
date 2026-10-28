import type { ConditionalPick, Primitive, Tagged } from "type-fest";

export type LaunchableID = Tagged<string, "LaunchableID">;
export type LaunchableArguments = readonly string[];

export type LaunchAction =
	{ readonly action: "none" } | { readonly action: "redirect"; readonly url: string };
export type LaunchActionType = LaunchAction["action"];

type LaunchableBase<TYPE extends string> = {
	readonly id: LaunchableID;
	readonly type: TYPE;
	readonly title: string;
	readonly iconPath: string;
};

export type AppLaunchable = LaunchableBase<"APP"> & {
	readonly appPath: string;
	readonly launchArguments?: LaunchableArguments;
};
export type ShellLaunchable = LaunchableBase<"SHELL"> & {
	readonly scriptPath: string;
	readonly launchArguments?: LaunchableArguments;
};
export type URLLaunchable = LaunchableBase<"URL"> & {
	readonly url: string;
	readonly noFrame?: boolean;
};

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

export type Fn = (...args: readonly never[]) => unknown;
export type PromisifyHandler<FN extends Fn> = (
	...args: Parameters<FN>
) => ReturnType<FN> | Promise<ReturnType<FN>>;
export type PromisifyProps<
	P extends object,
	K extends keyof P & keyof ConditionalPick<P, Fn | undefined>,
> = Omit<P, K> & {
	readonly [KEY in K]?: PromisifyHandler<Extract<NonNullable<P[KEY]>, Fn>>;
};

// Wifi

export type BSSID = Tagged<
	`${string}${string}:${string}${string}:${string}${string}:${string}${string}:${string}${string}:${string}${string}`,
	"BSSID"
>;
export type SSID = Tagged<string, "SSID">;
export type WifiSecurity = Tagged<string, "WifiSecurity">;

export type WifiAccessPoint = {
	readonly ssid: SSID;
	readonly inUse: boolean;
	readonly bssid: BSSID;
	readonly hidden: boolean;
	readonly signal: number;
	readonly security: readonly WifiSecurity[];
	readonly matchingSsids: readonly WifiAccessPoint[];
};
