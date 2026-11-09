import type { FC, ReactNode, RefObject } from "react";
import { memo, useEffect, useMemo } from "react";
import classes from "./GroupThinkRow.module.scss";
import clsx from "clsx";
import { TransitionGroup } from "react-transition-group";
import { GroupThinkRowProvider, useGroupThink } from "../../group-think.ctx";
import { useCallbackStable } from "../../../../hooks/useCallbackStable.hook";

export type GroupThinkRowProps = {
	readonly className?: string;
	readonly children?: ReactNode;
};

export const GroupThinkRow: FC<GroupThinkRowProps> = memo(({ className, children }) => {
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
			<TransitionGroup>
				<div className={clsx("GroupThinkRow", className, classes.root)}>{children}</div>
			</TransitionGroup>
		</GroupThinkRowProvider>
	);
});
