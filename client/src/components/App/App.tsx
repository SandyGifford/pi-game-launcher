import clsx from "clsx";
import type { FC } from "react";
import { memo } from "react";
import { Homepage } from "../Homepage/Homepage";
import classes from "./App.module.scss";

export type AppProps = {
	readonly className?: string;
};

export const App: FC<AppProps> = memo(({ className }) => {
	return (
		<div className={clsx("App", className, classes.root)}>
			<Homepage />
		</div>
	);
});
