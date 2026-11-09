import type { FC, HTMLAttributes, ReactElement, ReactNode, RefObject } from "react";
import { cloneElement, memo, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import classes from "./GroupThinkRow.module.scss";
import clsx from "clsx";
import { TransitionGroup } from "react-transition-group";
import type { TransitionProps } from "react-transition-group/Transition";
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

// TransitionGroup is a class component, so a ref on it wouldn't reach the DOM node
const RowElement: FC<
	HTMLAttributes<HTMLDivElement> & { readonly elRef: RefObject<HTMLDivElement | null> }
> = ({ elRef, ...rest }) => <div ref={elRef} {...rest} />;

export type GroupThinkRowProps = {
	readonly className?: string;
	readonly gap?: "narrow" | "normal" | "wide";
	readonly children?: ReactNode;
};

export const GroupThinkRow: FC<GroupThinkRowProps> = memo(
	({ className, gap = "normal", children }) => {
		const { addRefs, removeRefs, rootRef, ready } = useGroupThink();
		const rowRef = useRef<HTMLDivElement>(null);

		// Scale in from the centre of the GroupThink. Offsets are used because, unlike
		// bounding rects, they ignore the row's own (scaled) transform.
		useLayoutEffect(() => {
			const root = rootRef.current;
			const row = rowRef.current;
			if (!root || !row) return;

			let x = 0;
			let y = 0;

			for (let el: HTMLElement | null = row; el && el !== root;) {
				x += el.offsetLeft;
				y += el.offsetTop;
				el = el.offsetParent as HTMLElement | null;
			}

			row.style.transformOrigin = `${root.clientWidth / 2 - x}px ${root.clientHeight / 2 - y}px`;
		}, [rootRef, ready]);
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
					component={RowElement}
					elRef={rowRef}
					className={clsx("GroupThinkRow", className, classes.root, classes[`root--gap-${gap}`])}
					childFactory={wrapInRowItem}
				>
					{children as ReactElement<TransitionProps<HTMLElement>>[]}
				</TransitionGroup>
			</GroupThinkRowProvider>
		);
	}
);
