import clsx from "clsx";
import type { FC } from "react";
import { memo, useRef } from "react";
import { CSSTransition } from "react-transition-group";
import { GroupThinkButton, type GroupThinkButton } from "../GroupThinkButton/GroupThinkButton";
import classes from "./OtherButton.module.scss";

export type OtherButtonProps = Pick<
	GroupThinkButton,
	"thinkingId" | "currentThinkingId" | "setCurrentThinkingId" | "onClick" | "children"
> & {
	readonly className?: string;
};

export const OtherButton: FC<OtherButtonProps> = memo(
	({
		className,
		children,
		currentThinkingId,
		setCurrentThinkingId,
		onClick,
		thinkingId,
		...rest
	}) => {
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
				{...rest}
			>
				<div className={clsx("OtherButton", className, classes.root)} ref={ref}>
					<GroupThinkButton
						className={classes.button}
						thinkingId={thinkingId}
						currentThinkingId={currentThinkingId}
						setCurrentThinkingId={setCurrentThinkingId}
						onClick={onClick}
					>
						{children}
					</GroupThinkButton>
				</div>
			</CSSTransition>
		);
	}
);
