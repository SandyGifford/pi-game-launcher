import clsx from "clsx";
import type { FC, ReactNode } from "react";
import { useRef } from "react";
import { CSSTransition } from "react-transition-group";
import type { InjectableTransitionProps } from "../../../TransitionInjector/TransitionInjector";
import classes from "./ButtonGroupRowItem.module.scss";

export type ButtonGroupRowItemProps = InjectableTransitionProps & {
	readonly children?: ReactNode;
};

export const ButtonGroupRowItem: FC<ButtonGroupRowItemProps> = ({ children, ...transitionProps }) => {
	const ref = useRef<HTMLDivElement>(null);

	return (
		<CSSTransition
			nodeRef={ref}
			timeout={500}
			classNames={{
				enter: classes["root--enter"],
				enterActive: classes["root--enter-active"],
				enterDone: classes["root--enter-done"],
				exit: classes["root--exit"],
				exitActive: classes["root--exit-active"],
				exitDone: classes["root--exit-done"],
			}}
			{...transitionProps}
		>
			<div
				className={clsx("ButtonGroupRowItem", classes.root)}
				ref={ref}
				inert={transitionProps.in === false}
			>
				{children}
			</div>
		</CSSTransition>
	);
};
