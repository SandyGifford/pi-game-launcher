import type { FC } from "react";
import { memo } from "react";
import classes from "./App.module.scss";
import clsx from "clsx";
import { LAUNCHABLES } from "@repo/shared";
import { LaunchableButton } from "../LaunchableButton/LaunchableButton";

export type AppProps = {
	readonly className?: string | undefined;
};

export const App: FC<AppProps> = memo(({ className }) => {
	return (
		<div className={clsx(className, classes.root)}>
			<div className={classes.launchables}>
				{LAUNCHABLES.map((launchable) => (
					<LaunchableButton
						className={classes.launchable}
						key={launchable.id}
						launchable={launchable}
					/>
				))}
			</div>
		</div>
	);
});
