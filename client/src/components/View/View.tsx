import clsx from "clsx";
import type { FC, ReactNode } from "react";
import { memo, useRef, useState } from "react";
import { CSSTransition, type TransitionStatus } from "react-transition-group";
import { useCallbackStable } from "../../hooks/useCallbackStable.hook";
import { useWindowHandler } from "../../hooks/useWindowHandler.hook";
import { resolveNestedTransitionStatuses } from "../../utils/transition.utils";
import type { InjectableTransitionProps } from "../ui/TransitionInjector/TransitionInjector";
import { ViewProvider } from "./View.ctx";
import classes from "./View.module.scss";

export type ViewProps = InjectableTransitionProps & {
	readonly className?: string;
	readonly children: (transitionStatus: TransitionStatus) => ReactNode;
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
					enter: classes["root--transition-enter"],
					enterActive: classes["root--transition-enter-active"],
					enterDone: classes["root--transition-enter-done"],
					exit: classes["root--transition-exit"],
					exitActive: classes["root--transition-exit-active"],
					exitDone: classes["root--transition-exit-done"],
				}}
				{...rest}
				in={isPresent}
				onExited={onExited}
			>
				{(transitionStatus) => (
					<CSSTransition
						nodeRef={nodeRef}
						timeout={500}
						in={isPresent && isReady}
						classNames={{
							enter: classes["root--opacity-enter"],
							enterActive: classes["root--opacity-enter-active"],
							enterDone: classes["root--opacity-enter-done"],
							exit: classes["root--opacity-exit"],
							exitActive: classes["root--opacity-exit-active"],
							exitDone: classes["root--opacity-exit-done"],
						}}
					>
						{(opacityStatus) => {
							const status = resolveNestedTransitionStatuses(transitionStatus, opacityStatus);
							return (
								<ViewProvider
									isReady={isReady && isPresent}
									status={opacityStatus}
									markViewAsReady={markViewAsReady}
									currentThinkingId={currentThinkingId}
									setCurrentThinkingId={setCurrentThinkingId}
								>
									<div
										ref={nodeRef}
										className={clsx("View", className, classes.root)}
										inert={status !== "entered" || !isPresent}
									>
										{children(status)}
									</div>
								</ViewProvider>
							);
						}}
					</CSSTransition>
				)}
			</CSSTransition>
		);
	}
);

View.displayName = "View";
