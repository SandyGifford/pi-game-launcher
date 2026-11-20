import clsx from "clsx";
import type { FC, ReactNode } from "react";
import { Children, cloneElement, memo, useEffect, useMemo, useState } from "react";
import { useCallbackStable } from "../../../../hooks/useCallbackStable.hook";
import { AnimatedListProvider, type AnimatedListCtxUseHeight } from "../../animated-list.ctx";
import { isAnimatedListItemElement } from "../AnimatedListItem/AnimatedListItem";
import classes from "./AnimatedList.module.scss";
import { TransitionGroup } from "react-transition-group";

export type AnimatedListProps = {
	readonly className?: string;
	readonly children?: ReactNode;
};

export const AnimatedList: FC<AnimatedListProps> = memo(({ className, children }) => {
	const [heightMap, setHeightMap] = useState<{ readonly [KEY in string]: number }>({});

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

	return (
		<ul
			className={clsx("AnimatedList", className, classes.root)}
			style={{ "--AnimatedList--height": `${fullHeight}px` }}
		>
			<AnimatedListProvider useHeight={useHeight}>
				<TransitionGroup component={null}>
					{Children.toArray(children).map((c) => {
						if (isAnimatedListItemElement(c)) {
							const key = c.props.listKey ?? c.key ?? undefined;
							const fixedTop = currentTop;

							currentTop += (typeof key === "string" && heightMap[key]) || 0;

							return cloneElement(c, { ...c.props, listKey: key, fixedTop });
						}
						return undefined;
					})}
				</TransitionGroup>
			</AnimatedListProvider>
		</ul>
	);
});
