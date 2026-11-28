import clsx from "clsx";
import type { FC, ReactNode } from "react";
import { memo, useRef, useState } from "react";
import { CSSTransition, type TransitionStatus } from "react-transition-group";
import { useEventDispatcher } from "../../event-dispatcher/event-dispatcher.react";
import { useCallbackStable } from "../../hooks/useCallbackStable.hook";
import { useWindowHandler } from "../../hooks/useWindowHandler.hook";
import { allGamepadDirection } from "../../utils/gamepad.utils";
import { resolveNestedTransitionStatuses } from "../../utils/transition.utils";
import type { InjectableTransitionProps } from "../ui/TransitionInjector/TransitionInjector";
import { ViewProvider } from "./View.ctx";
import classes from "./View.module.scss";
import { useKeysDown } from "../../hooks/useKeysDown.hook";

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

		const move = useCallbackStable(
			(
				{ x = 0, y = 0 }: { readonly x?: number; readonly y?: number },
				cached: Map<HTMLElement, DOMRect> = new Map()
			) => {
				const view = nodeRef.current;
				if (!view) return;

				const getRect = (el: HTMLElement): DOMRect => {
					if (cached.has(el)) return cached.get(el)!;
					const rect = el.getBoundingClientRect();
					cached.set(el, rect);
					return rect;
				};

				const viewRect = getRect(view);
				const active =
					document.activeElement instanceof HTMLButtonElement &&
					view.contains(document.activeElement)
						? document.activeElement
						: undefined;
				const btns = [...view.querySelectorAll("button:not(:disabled):not([data-disabled])")];

				const fromRect = active && getRect(active);

				type DOMEdge = Extract<keyof DOMRect, "top" | "left" | "right" | "bottom">;

				const focusBestEl = (
					direction: number,
					axisStartProp: DOMEdge,
					axisEndProp: DOMEdge,
					crossStartProp: DOMEdge,
					crossEndProp: DOMEdge
				) => {
					let bestEl: HTMLButtonElement | undefined;

					const dir = direction / Math.abs(direction);
					const initCapStart = fromRect?.[crossStartProp] ?? viewRect[crossStartProp];
					const initCapEnd = fromRect?.[crossEndProp] ?? viewRect[crossEndProp];
					const initStart =
						direction > 0
							? (fromRect?.[axisEndProp] ?? viewRect[axisStartProp])
							: (fromRect?.[axisStartProp] ?? viewRect[axisEndProp]);
					let bestStart = initStart;
					let bestOverlaps = false;

					btns.forEach((btn) => {
						if (!(btn instanceof HTMLButtonElement)) return;

						const rect = getRect(btn);

						const capStart = rect[crossStartProp];
						const capEnd = rect[crossEndProp];
						const start = direction > 0 ? rect[axisStartProp] : rect[axisEndProp];
						const overlaps = !(capEnd <= initCapStart) && !(capStart >= initCapEnd);

						if (start * dir < initStart * dir) return;

						if (
							!bestEl ||
							(overlaps && !bestOverlaps) ||
							(overlaps === bestOverlaps && start * dir < bestStart * dir)
						) {
							bestEl = btn;
							bestStart = start;
							bestOverlaps = overlaps;
						}
					});

					bestEl?.focus();

					return bestEl;
				};

				if (x) {
					focusBestEl(x, "left", "right", "top", "bottom");
					if (y) move({ x: 0, y }, cached);
				} else if (y) {
					focusBestEl(y, "top", "bottom", "left", "right");
				}
			}
		);

		useEventDispatcher(allGamepadDirection, move);

		useKeysDown(
			({ ArrowUp, ArrowDown, ArrowLeft, ArrowRight }) =>
				move({
					x: (ArrowRight ? 1 : 0) + (ArrowLeft ? -1 : 0),
					y: (ArrowDown ? 1 : 0) + (ArrowUp ? -1 : 0),
				}),
			[move]
		);

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
