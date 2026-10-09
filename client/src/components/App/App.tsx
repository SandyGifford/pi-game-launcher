import clsx from "clsx";
import type { FC } from "react";
import { memo, useState } from "react";
import { getLaunchables, needsUpdate, updateAndReload } from "../../api";
import { usePromise, useWindowHandler } from "../../hooks";
import { LaunchableButton } from "../LaunchableButton/LaunchableButton";
import { OtherButton } from "../OtherButton/OtherButton";
import classes from "./App.module.scss";
import { TransitionGroup } from "react-transition-group";
import { awaitTime } from "@repo/shared";

export type AppProps = {
	readonly className?: string;
};

export const App: FC<AppProps> = memo(({ className }) => {
	const { status, data } = usePromise(getLaunchables, []);
	const { data: updateAvailable } = usePromise(async () => {
		// delay update button so it grabs attention by popping in
		await awaitTime(1000);
		return await needsUpdate();
	}, []);

	const [thinkingID, setThinkingID] = useState<string>();

	useWindowHandler(() => setThinkingID(undefined), [], "focus");

	return (
		<div
			className={clsx(
				"App",
				className,
				classes.root,
				status === "loading" && classes["root--loading"]
			)}
		>
			<div className={classes.launchables}>
				{(() => {
					switch (status) {
						case "data":
							return data.map((launchable) => (
								<LaunchableButton
									key={launchable.id}
									className={classes.launchable}
									launchable={launchable}
									currentThinkingId={thinkingID}
									setCurrentThinkingId={setThinkingID}
								/>
							));
						default:
							return;
					}
				})()}
			</div>
			<TransitionGroup className={classes.others}>
				{updateAvailable && (
					<OtherButton
						key="update-available"
						thinkingId="UPDATE_AVAILABLE"
						currentThinkingId={thinkingID}
						setCurrentThinkingId={setThinkingID}
						onClick={async () => {
							await updateAndReload();
						}}
					>
						update available!
					</OtherButton>
				)}
				<OtherButton
					key="configure"
					currentThinkingId={thinkingID}
					setCurrentThinkingId={setThinkingID}
					onClick={async () => {}}
				>
					configure
				</OtherButton>
			</TransitionGroup>
		</div>
	);
});
