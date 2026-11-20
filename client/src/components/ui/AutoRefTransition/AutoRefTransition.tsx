import type { FC, ReactElement, Ref } from "react";
import { cloneElement, isValidElement, memo, useRef } from "react";
import { Transition } from "react-transition-group";
import type { TransitionProps } from "react-transition-group/Transition";

export type AutoRefTransitionProps = TransitionProps<HTMLElement>;

export const AutoRefTransition: FC<AutoRefTransitionProps> = memo(({ children, ...rest }) => {
	const ref = useRef<HTMLElement>(null);
	return (
		<Transition {...rest} nodeRef={ref}>
			{(...args) => {
				const resolved = (() => {
					if (typeof children === "function") return children(...args);
					return children;
				})();

				if (isValidElement(resolved))
					return cloneElement(resolved as ReactElement<{ readonly ref: Ref<HTMLElement> }>, {
						...(resolved.props as object),
						ref,
					});

				return resolved;
			}}
		</Transition>
	);
});

AutoRefTransition.displayName = "AutoRefTransition";
