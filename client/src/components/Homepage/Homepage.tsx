import { awaitTime } from "@repo/shared";
import clsx from "clsx";
import type { FC } from "react";
import { memo } from "react";
import { getLaunchables, needsUpdate, restart, shutdown, updateAndReload } from "../../api";
import { useAppContext } from "../../contexts/AppContext.ctx";
import { usePromise } from "../../hooks/usePromise.hook";
import { ButtonGroup } from "../button-group/components/ButtonGroup/ButtonGroup";
import { ButtonGroupRow } from "../button-group/components/ButtonGroupRow/ButtonGroupRow";
import { LaunchableButton } from "../LaunchableButton/LaunchableButton";
import { ButtonGroupButton } from "../button-group/components/ButtonGroupButton/ButtonGroupButton";
import { useViewReadyOnMount } from "../View/View.ctx";
import classes from "./Homepage.module.scss";

export type HomepageProps = {
	readonly className?: string;
};

export const Homepage: FC<HomepageProps> = memo(({ className }) => {
	useViewReadyOnMount();
	const { setView } = useAppContext();

	const { status, data } = usePromise(
		// slightly delay apppearance of launchable buttons
		async () => (await Promise.all([awaitTime(1000), getLaunchables()]))[1],
		[]
	);

	const { data: updateAvailable } = usePromise(
		// delay update button so it grabs attention by popping in
		async () => (await Promise.all([awaitTime(2000), needsUpdate()]))[1],
		[]
	);

	const isReady = status === "data";

	return (
		<ButtonGroup className={clsx("Homepage", className, classes.root)} ready={isReady}>
			<ButtonGroupRow gap="wide">
				{(() => {
					switch (status) {
						case "data":
							return data.map((launchable) => (
								<LaunchableButton
									key={launchable.id}
									className={classes.launchable}
									launchable={launchable}
								/>
							));
						default:
							return;
					}
				})()}
			</ButtonGroupRow>
			<ButtonGroupRow className={classes.others}>
				{updateAvailable && (
					<ButtonGroupButton
						key="update-available"
						thinkingId="UPDATE_AVAILABLE"
						onClick={async () => {
							await updateAndReload();
						}}
					>
						update available!
					</ButtonGroupButton>
				)}
				<ButtonGroupButton key="configure" onClick={() => setView("SETTINGS")}>
					configure
				</ButtonGroupButton>
				<ButtonGroupButton key="shutdown" thinkingId="SHUTDOWN" onClick={shutdown}>
					shutdown
				</ButtonGroupButton>
				<ButtonGroupButton key="restart" thinkingId="RESTART" onClick={restart}>
					restart
				</ButtonGroupButton>
			</ButtonGroupRow>
		</ButtonGroup>
	);
});

Homepage.displayName = "Homepage";
