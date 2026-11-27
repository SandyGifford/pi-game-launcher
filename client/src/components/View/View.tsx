import clsx from "clsx";
import type { FC, ReactNode } from "react";
import { memo, useLayoutEffect, useRef, useState } from "react";
import { CSSTransition, type TransitionStatus } from "react-transition-group";
import { useCallbackStable } from "../../hooks/useCallbackStable.hook";
import { useWindowHandler } from "../../hooks/useWindowHandler.hook";
import type { InjectableTransitionProps } from "../ui/TransitionInjector/TransitionInjector";
import { ViewProvider } from "./View.ctx";
import classes from "./View.module.scss";

export type ViewProps = InjectableTransitionProps & {
	readonly className?: string;
	readonly children: (transitionStatus: TransitionStatus) => ReactNode;
};

const ViewExitObserver: FC<{
	readonly isPresent: boolean;
	readonly status: TransitionStatus;
	readonly onExited: (() => void) | undefined;
}> = ({ isPresent, status, onExited }) => {
	const wasPresent = useRef(isPresent);

	useLayoutEffect(() => {
		const removed = wasPresent.current && !isPresent;
		wasPresent.current = isPresent;
		if (removed && status === "exited") onExited?.();
	}, [isPresent, status, onExited]);

	return null;
};

export const View: FC<ViewProps> = memo(
	({ className, children, in: isPresent = true, onExited, ...rest }) => {
		const nodeRef = useRef<HTMLDivElement>(null);
		const [isReady, setIsReady] = useState(false);
		const [currentThinkingId, setCurrentThinkingId] = useState<string>();
		const markViewAsReady = useCallbackStable(() => setIsReady(true));
		useWindowHandler(() => setCurrentThinkingId(undefined), [], "focus");

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
				in={isPresent && isReady}
				onExited={onExited}
			>
				{(status) => (
					<ViewProvider
						isReady={isReady && isPresent}
						status={status}
						markViewAsReady={markViewAsReady}
						currentThinkingId={currentThinkingId}
						setCurrentThinkingId={setCurrentThinkingId}
					>
						<div
							ref={nodeRef}
							className={clsx("View", className, classes.root)}
							inert={status !== "entered" || !isPresent}
						>
							<ViewExitObserver isPresent={isPresent} status={status} onExited={onExited} />
							{children(status)}
						</div>
					</ViewProvider>
				)}
			</CSSTransition>
		);
	}
);

View.displayName = "View";
