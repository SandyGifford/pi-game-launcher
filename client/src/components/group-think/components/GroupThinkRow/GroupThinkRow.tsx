import type { FC, ReactElement, ReactNode, RefObject } from "react";
import { cloneElement, memo, useEffect, useMemo } from "react";
import classes from "./GroupThinkRow.module.scss";
import clsx from "clsx";
import { TransitionGroup } from "react-transition-group";
import { GroupThinkRowProvider, useGroupThink } from "../../group-think.ctx";
import { useCallbackStable } from "../../../../hooks/useCallbackStable.hook";
import type { InjectableTransitionProps } from "../../../TransitionInjector/TransitionInjector";
import { GroupThinkRowItem } from "../GroupThinkRowItem/GroupThinkRowItem";

// TransitionGroup injects its props into direct children only, so each child is wrapped in a
// GroupThinkRowItem that receives them. They're stripped from the real child so they don't leak.
const wrapInRowItem = (child: ReactElement<InjectableTransitionProps>): ReactElement => {
	const { in: inProp, onExited, appear, enter, exit } = child.props;
	return (
		<GroupThinkRowItem
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
		</GroupThinkRowItem>
	);
};

export type GroupThinkRowProps = {
	readonly className?: string;
	readonly gap?: "narrow" | "normal" | "wide";
	readonly children?: ReactNode;
};

export const GroupThinkRow: FC<GroupThinkRowProps> = memo(
	({ className, gap = "normal", children }) => {
		const { addRefs, removeRefs } = useGroupThink();
		const buttonRefs = useMemo(() => new Set<RefObject<HTMLButtonElement | null>>(), []);
		const addRef = useCallbackStable((ref: RefObject<HTMLButtonElement | null>) =>
			buttonRefs.add(ref)
		);
		const removeRef = useCallbackStable((ref: RefObject<HTMLButtonElement | null>) =>
			buttonRefs.delete(ref)
		);

		useEffect(() => {
			addRefs(buttonRefs);
			return () => removeRefs(buttonRefs);
		}, [addRefs, removeRefs, buttonRefs]);

		return (
			<GroupThinkRowProvider addRef={addRef} removeRef={removeRef}>
				<TransitionGroup
					component="div"
					className={clsx("GroupThinkRow", className, classes.root, classes[`root--gap-${gap}`])}
					childFactory={wrapInRowItem}
				>
					{children}
				</TransitionGroup>
			</GroupThinkRowProvider>
		);
	}
);
