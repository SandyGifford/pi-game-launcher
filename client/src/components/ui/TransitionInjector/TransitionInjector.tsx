import { arrayOfAll } from "@repo/shared";
import { createContext, useContext, useMemo, type FC, type ReactNode } from "react";
import type { TransitionProps } from "react-transition-group/Transition";

export type InjectableTransitionProps = Pick<
	TransitionProps<HTMLElement>,
	"in" | "onExited" | "appear" | "enter" | "exit"
>;

export type TransitionInjectorProps = InjectableTransitionProps & {
	readonly transitionKey?: unknown;
	readonly children: ReactNode;
};

type CTX = ReadonlyMap<unknown, InjectableTransitionProps>;

const NO_KEY = {};

const ctx = createContext<CTX>(new Map());

export const useInjectedTransition = (
	key: unknown = NO_KEY
): InjectableTransitionProps | undefined => useContext(ctx).get(key);

const INJECTABLE_PROPS = arrayOfAll<keyof InjectableTransitionProps>()(
	"appear",
	"enter",
	"exit",
	"in",
	"onExited"
);

export const TransitionInjector: FC<TransitionInjectorProps> = ({
	transitionKey = NO_KEY,
	children,
	...props
}) => {
	const existing = useContext(ctx);

	return (
		<ctx.Provider
			value={useMemo(
				() => new Map(existing).set(transitionKey, props),
				// eslint-disable-next-line react-hooks/exhaustive-deps
				[existing, ...INJECTABLE_PROPS.map((key) => props[key])]
			)}
		>
			{children}
		</ctx.Provider>
	);
};
