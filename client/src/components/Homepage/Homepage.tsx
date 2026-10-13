import clsx from "clsx";
import type { FC } from "react";
import { memo, useMemo, useState, useSyncExternalStore } from "react";
import { getLaunchables, needsUpdate, updateAndReload } from "../../api";
import { usePromise } from "../../hooks/usePromise.hook";
import { useWindowHandler } from "../../hooks/useWindowHandler.hook";
import { LaunchableButton } from "../LaunchableButton/LaunchableButton";
import { OtherButton } from "../OtherButton/OtherButton";
import classes from "./Homepage.module.scss";
import { TransitionGroup } from "react-transition-group";
import { awaitTime } from "@repo/shared";
import { gamepadByPlayerFamily } from "../../utils/gamepad.utils";

export type HomepageProps = {
	readonly className?: string;
};

export const Homepage: FC<HomepageProps> = memo(({ className }) => {
	const { status, data } = usePromise(
		async () => (await Promise.all([awaitTime(1000), getLaunchables()]))[1],
		[]
	);
	const { data: updateAvailable } = usePromise(
		// delay update button so it grabs attention by popping in
		async () => (await Promise.all([awaitTime(2000), needsUpdate()]))[1],
		[]
	);

	const isReady = status === "data";

	const [thinkingID, setThinkingID] = useState<string>();

	useWindowHandler(() => setThinkingID(undefined), [], "focus");
	const playerDist = useMemo(() => gamepadByPlayerFamily(2), []);
	const state = useSyncExternalStore(playerDist.onValue, playerDist.get);
	console.log("=>", state);

	return (
		<div className={clsx("Homepage", className, classes.root, isReady && classes["root--ready"])}>
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
