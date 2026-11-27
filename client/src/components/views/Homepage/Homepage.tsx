import { awaitTime } from "@repo/shared";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import type { FC } from "react";
import { memo, useEffect } from "react";
import { getLaunchables, needsUpdate, restart, shutdown, updateAndReload } from "../../../api";
import { useAppContext } from "../../../contexts/AppContext.ctx";
import { ButtonGroup } from "../../ui/button-group/components/ButtonGroup/ButtonGroup";
import { ButtonGroupButton } from "../../ui/button-group/components/ButtonGroupButton/ButtonGroupButton";
import { ButtonGroupRow } from "../../ui/button-group/components/ButtonGroupRow/ButtonGroupRow";
import { LaunchableButton } from "../../ui/LaunchableButton/LaunchableButton";
import { useMarkViewAsReady } from "../../View/View.ctx";
import classes from "./Homepage.module.scss";

export type HomepageProps = {
	readonly className?: string;
};

export const Homepage: FC<HomepageProps> = memo(({ className }) => {
	const markViewAsReady = useMarkViewAsReady();
	const { setView } = useAppContext();

	const { status, data } = useQuery({
		queryKey: ["launchables"],
		queryFn: async () => (await Promise.all([awaitTime(1000), getLaunchables()]))[1],
		retry: false,
	});

	const { data: updateAvailable } = useQuery({
		queryKey: ["system", "update", "needs"],
		queryFn: async () => (await Promise.all([awaitTime(2000), needsUpdate()]))[1],
		retry: false,
	});

	useEffect(() => {
		if (status !== "pending") markViewAsReady();
	}, [markViewAsReady, status]);

	return (
		<ButtonGroup className={clsx("Homepage", className, classes.root)}>
			<ButtonGroupRow gap="wide">
				{(() => {
					switch (status) {
						case "success":
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
