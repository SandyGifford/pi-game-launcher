import { type LaunchableID } from "@repo/shared";
import clsx from "clsx";
import type { FC } from "react";
import { memo, useState } from "react";
import { getLaunchables, needsUpdate, updateAndReload } from "../../api";
import { usePromise, useWindowHandler } from "../../hooks";
import { AsyncButton } from "../AsyncButton/AsyncButton";
import { LaunchableButton } from "../LaunchableButton/LaunchableButton";
import classes from "./App.module.scss";

export type AppProps = {
	readonly className?: string;
};

export const App: FC<AppProps> = memo(({ className }) => {
	const { status, data } = usePromise(getLaunchables, []);
	const { data: updateAvailable } = usePromise(needsUpdate, []);

	const [thinkingBtn, setThinkingBtn] = useState<LaunchableID | "UPDATE_AVAILABLE">();
	const thinking = !!thinkingBtn;

	useWindowHandler(() => setThinkingBtn(undefined), [], "focus");

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
									onThinkingChange={(thinking) => thinking && setThinkingBtn(launchable.id)}
									disabled={thinking}
									forceThinking={thinkingBtn === launchable.id}
									key={launchable.id}
									launchable={launchable}
								/>
							));
						default:
							return;
					}
				})()}
			</div>
			<div className={clsx(classes.other, !updateAvailable && classes["other--hidden"])}>
				<AsyncButton
					onClick={async () => {
						await updateAndReload();
					}}
					disabled={thinking}
					forceThinking={thinkingBtn === "UPDATE_AVAILABLE"}
				>
					update available!
				</AsyncButton>
			</div>
		</div>
	);
});
