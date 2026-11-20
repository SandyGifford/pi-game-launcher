import clsx from "clsx";
import type { FC, ReactElement, ReactNode } from "react";
import { Children, cloneElement, memo, useEffect, useMemo, useRef, useState } from "react";
import { useCallbackStable } from "../../../../hooks/useCallbackStable.hook";
import { AnimatedListProvider, type AnimatedListCtxUseHeight } from "../../animated-list.ctx";
import {
	isAnimatedListItemElement,
	type AnimatedListItemProps,
} from "../AnimatedListItem/AnimatedListItem";
import classes from "./AnimatedList.module.scss";
import { TransitionGroup } from "react-transition-group";

export type AnimatedListProps = {
	readonly className?: string;
	readonly children?: ReactNode;
};

export const AnimatedList: FC<AnimatedListProps> = memo(({ className, children }) => {
	const [heightMap, setHeightMap] = useState<{ readonly [KEY in string]: number }>({});
	const mountOrderRef = useRef(new Map<string, ReactElement<AnimatedListItemProps>>());

	const fullHeight = useMemo(
		() => Object.values(heightMap).reduce((total, height) => total + height, 0),
		[heightMap]
	);

	const useHeight = useCallbackStable<AnimatedListCtxUseHeight>((key, height) => {
		// eslint-disable-next-line react-hooks/rules-of-hooks
		useEffect(() => {
			const hasKey = typeof key === "string";
			if (hasKey) setHeightMap((current) => ({ ...current, [key]: height }));
			return () => {
				if (hasKey) setHeightMap(({ [key]: _, ...current }) => ({ ...current }));
			};
		}, [height, key]);
	});

	let currentTop = 0;
	const currentKeys = new Set<string>();

	Children.toArray(children).forEach((child, index) => {
		if (!isAnimatedListItemElement(child)) return;

		const key = child.props.listKey ?? child.key ?? undefined;
		const reactKey = child.key ?? String(index);
		const fixedTop = currentTop;
		currentTop += (typeof key === "string" && heightMap[key]) || 0;
		currentKeys.add(reactKey);

		mountOrderRef.current.set(
			reactKey,
			cloneElement(child, {
				...child.props,
				listKey: key,
				fixedTop,
				style: { zIndex: index, ...child.props.style },
			})
		);
	});

	for (const key of mountOrderRef.current.keys()) {
		if (!currentKeys.has(key)) {
			mountOrderRef.current.delete(key);
		}
	}

	return (
		<ul
			className={clsx("AnimatedList", className, classes.root)}
			style={{ "--AnimatedList--height": `${fullHeight}px` }}
		>
			<AnimatedListProvider useHeight={useHeight}>
				<TransitionGroup component={null}>{[...mountOrderRef.current.values()]}</TransitionGroup>
			</AnimatedListProvider>
		</ul>
	);
});
