import clsx from "clsx";
import type { FC, ReactNode } from "react";
import { memo, useRef, useState } from "react";
import { CSSTransition, type TransitionStatus } from "react-transition-group";
import { useCallbackStable } from "../../hooks/useCallbackStable.hook";
import { ViewProvider } from "./View.ctx";
import classes from "./View.module.scss";

export type ViewProps = {
	readonly className?: string;
	readonly children: (transitionStatus: TransitionStatus) => ReactNode;
};

export const View: FC<ViewProps> = memo(({ className, children, ...rest }) => {
	const nodeRef = useRef<HTMLDivElement>(null);
	const [isReady, setIsReady] = useState(false);
	const viewReady = useCallbackStable(() => setIsReady(true));

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
			in={isReady}
			{...rest}
		>
			{(status) => (
				<ViewProvider viewReady={viewReady}>
					<div className={clsx("View", clsx(className, classes.root))} ref={nodeRef}>
						{children(status)}
					</div>
				</ViewProvider>
			)}
		</CSSTransition>
	);
});

View.displayName = "View";
