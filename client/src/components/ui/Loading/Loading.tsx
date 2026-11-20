import type { FC } from "react";
import { memo } from "react";
import classes from "./Loading.module.scss";
import clsx from "clsx";

export type LoadingProps = {
	readonly className?: string;
	readonly stop?: boolean;
};

export const Loading: FC<LoadingProps> = memo(({ className, stop }) => {
	return (
		<div
			className={clsx("Loading", className, classes.root, !stop && classes["root--animate"])}
		></div>
	);
});
