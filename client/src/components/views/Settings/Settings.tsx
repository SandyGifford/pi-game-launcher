import clsx from "clsx";
import type { FC } from "react";
import { memo } from "react";
import { WifiList } from "../../WifiList/WifiList";
import classes from "./Settings.module.scss";

export type SettingsProps = {
	readonly className?: string;
};

export const Settings: FC<SettingsProps> = memo(({ className }) => {
	return (
		<div className={clsx("Settings", className, classes.root)}>
			<WifiList className={classes.wifi} />
		</div>
	);
});
