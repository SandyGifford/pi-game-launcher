import clsx from "clsx";
import type { FC } from "react";
import { memo } from "react";
import { getLaunchables } from "../../api";
import { usePromise } from "../../hooks";
import { LaunchableButton } from "../LaunchableButton/LaunchableButton";
import classes from "./App.module.scss";

export type AppProps = {
	readonly className?: string | undefined;
};

export const App: FC<AppProps> = memo(({ className }) => {
	const { status, data } = usePromise(getLaunchables, []);

	return (
		<div
			className={clsx(className, classes.root, status === "loading" && classes["root--loading"])}
		>
			<div className={classes.launchables}>
				{(() => {
					switch (status) {
						case "data":
							return data.map((launchable, i) => (
								<LaunchableButton
									className={classes.launchable}
									permaThink
									key={launchable.id}
									launchable={launchable}
								/>
							));
						default:
							return;
					}
				})()}
			</div>
		</div>
	);
});
