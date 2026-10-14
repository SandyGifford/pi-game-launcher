import clsx from "clsx";
import type { FC, ReactNode } from "react";
import { memo, useRef } from "react";
import { CSSTransition, type TransitionStatus } from "react-transition-group";
import classes from "./View.module.scss";

export type ViewProps = {
	readonly className?: string;
	readonly children: (transitionStatus: TransitionStatus) => ReactNode;
};

export const View: FC<ViewProps> = memo(({ className, children, ...rest }) => {
	const nodeRef = useRef<HTMLDivElement>(null);

	return (
		<CSSTransition
			nodeRef={nodeRef}
			timeout={500}
			classNames={{
				enter: classes["root--enter"],
				enterActive: classes["root--enter-active"],
				enterDone: classes["root--enter-done"],
				exit: classes["root--exit"],
				exitActive: classes["root--exit-active"],
				exitDone: classes["root--exit-done"],
			}}
			{...rest}
		>
			{(status) => (
				<div className={clsx("View", clsx(className, classes.root))} ref={nodeRef}>
					{children(status)}
				</div>
			)}
		</CSSTransition>
	);
});
