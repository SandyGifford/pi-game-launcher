import clsx from "clsx";
import type { FC } from "react";
import { memo } from "react";
import { WifiList } from "../../WifiList/WifiList";
import { useViewReadyOnMount } from "../../View/View.ctx";
import classes from "./Settings.module.scss";

export type SettingsProps = {
	readonly className?: string;
};

export const Settings: FC<SettingsProps> = memo(({ className }) => {
	useViewReadyOnMount();
	return (
		<div className={clsx("Settings", className, classes.root)}>
			<WifiList className={classes.wifi} />
		</div>
	);
});
