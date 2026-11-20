import clsx from "clsx";
import type { FC, ReactNode } from "react";
import { Children, cloneElement, memo, useEffect, useState } from "react";
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

	return (
		<ul className={clsx("AnimatedList", className, classes.root)}>
			<AnimatedListProvider useHeight={useHeight}>
				<TransitionGroup component={null}>
					{Children.toArray(children).map((c) => {
						if (isAnimatedListItemElement(c)) {
							const key = c.props.listKey ?? c.key ?? undefined;
							const fixedHeight =
								c.props.fixedHeight ?? (typeof key === "string" ? heightMap[key] : undefined);
							return cloneElement(c, { ...c.props, listKey: key, fixedHeight });
						}
						return c;
					})}
				</TransitionGroup>
			</AnimatedListProvider>
		</ul>
	);
});
