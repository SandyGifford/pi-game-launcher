import type { LaunchableID } from "@repo/shared";
import clsx from "clsx";
import type { FC } from "react";
import { memo, useMemo, useState } from "react";
import { getLaunchables } from "../../api";
import { usePromise, useWindowHandler } from "../../hooks";
import { LaunchableButton } from "../LaunchableButton/LaunchableButton";
import classes from "./App.module.scss";

export type AppProps = {
	readonly className?: string;
};

export const App: FC<AppProps> = memo(({ className }) => {
	const { status, data } = usePromise(getLaunchables, []);

	const [thinkingMap, setThinkingMap] = useState<{ readonly [ID in LaunchableID]: boolean }>({});
	const thinking = useMemo(
		() => Object.values(thinkingMap).some((thinking) => thinking),
		[thinkingMap]
	);

	useWindowHandler(() => setThinkingMap({}), [], "focus");

	return (
		<div
			className={clsx(className, classes.root, status === "loading" && classes["root--loading"])}
		>
			<div className={classes.launchables}>
				{(() => {
					switch (status) {
						case "data":
							return data.map((launchable) => (
								<LaunchableButton
									className={classes.launchable}
									onThinkingChange={(thinking) =>
										setThinkingMap((thinkingMap) =>
											thinking ? { ...thinkingMap, [launchable.id]: thinking } : thinkingMap
										)
									}
									disabled={thinking}
									// once an ID is marked as thinking, keep it thinking until the window blurs
									forceThinking={thinkingMap[launchable.id]}
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
