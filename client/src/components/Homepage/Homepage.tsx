import { awaitTime } from "@repo/shared";
import clsx from "clsx";
import type { FC } from "react";
import { memo } from "react";
import { TransitionGroup } from "react-transition-group";
import { getLaunchables, needsUpdate, restart, shutdown, updateAndReload } from "../../api";
import { useAppContext } from "../../contexts/AppContext.ctx";
import { usePromise } from "../../hooks/usePromise.hook";
import { GroupThink } from "../group-think/components/GroupThink/GroupThink";
import { GroupThinkRow } from "../group-think/components/GroupThinkRow/GroupThinkRow";
import { LaunchableButton } from "../LaunchableButton/LaunchableButton";
import { OtherButton } from "../OtherButton/OtherButton";
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
		<GroupThink
			className={clsx("Homepage", className, classes.root, isReady && classes["root--ready"])}
		>
			<GroupThinkRow className={classes.launchables}>
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
			</GroupThinkRow>
			<TransitionGroup>
				<GroupThinkRow className={classes.others}>
					{updateAvailable && (
						<OtherButton
							key="update-available"
							thinkingId="UPDATE_AVAILABLE"
							onClick={async () => {
								await updateAndReload();
							}}
						>
							update available!
						</OtherButton>
					)}
					<OtherButton key="configure" onClick={async () => {}}>
						configure
					</OtherButton>
					<OtherButton key="shutdown" thinkingId="SHUTDOWN" onClick={shutdown}>
						shutdown
					</OtherButton>
					<OtherButton key="restart" thinkingId="RESTART" onClick={restart}>
						restart
					</OtherButton>
					<OtherButton
						key="test"
						onClick={() => setView("WEB", "https://play.geforcenow.com/mall/#/loginwall")}
					>
						test
					</OtherButton>
				</GroupThinkRow>
			</TransitionGroup>
		</GroupThink>
	);
});

Homepage.displayName = "Homepage";
