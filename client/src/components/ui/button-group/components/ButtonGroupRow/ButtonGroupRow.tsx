import clsx from "clsx";
import type { FC, HTMLAttributes, ReactElement, ReactNode, RefObject } from "react";
import { cloneElement, memo, useRef } from "react";
import { TransitionGroup } from "react-transition-group";
import type { TransitionProps } from "react-transition-group/Transition";
import type { InjectableTransitionProps } from "../../../TransitionInjector/TransitionInjector";
import { ButtonGroupRowItem } from "../ButtonGroupRowItem/ButtonGroupRowItem";
import classes from "./ButtonGroupRow.module.scss";

// TransitionGroup injects its props into direct children only, so each child is wrapped in a
// ButtonGroupRowItem that receives them. They're stripped from the real child so they don't leak.
const wrapInRowItem = (child: ReactElement<InjectableTransitionProps>): ReactElement => {
	const { in: inProp, onExited, appear, enter, exit } = child.props;
	return (
		<ButtonGroupRowItem
			key={child.key}
			in={inProp}
			onExited={onExited}
			appear={appear}
			enter={enter}
			exit={exit}
		>
			{cloneElement(child, {
				in: undefined,
				onExited: undefined,
				appear: undefined,
				enter: undefined,
				exit: undefined,
			})}
		</ButtonGroupRowItem>
	);
};

// TransitionGroup is a class component, so a ref on it wouldn't reach the DOM node
const RowElement: FC<
	HTMLAttributes<HTMLDivElement> & { readonly elRef: RefObject<HTMLDivElement | null> }
> = ({ elRef, ...rest }) => <div ref={elRef} {...rest} />;

export type ButtonGroupRowProps = {
	readonly className?: string;
	readonly gap?: "narrow" | "normal" | "wide";
	readonly children?: ReactNode;
};

export const ButtonGroupRow: FC<ButtonGroupRowProps> = memo(
	({ className, gap = "normal", children }) => {
		const rowRef = useRef<HTMLDivElement>(null);

		return (
			<TransitionGroup
				component={RowElement}
				elRef={rowRef}
				className={clsx("ButtonGroupRow", className, classes.root, classes[`root--gap-${gap}`])}
				childFactory={wrapInRowItem}
			>
				{children as ReactElement<TransitionProps<HTMLElement>>[]}
			</TransitionGroup>
		);
	}
);
