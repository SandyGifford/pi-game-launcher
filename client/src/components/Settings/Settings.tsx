import type { FC } from "react";
import { memo } from "react";
import classes from "./Settings.module.scss";
import clsx from "clsx";

export type SettingsProps = {
	readonly className?: string;
};

export const Settings: FC<SettingsProps> = memo(({ className }) => {
	return <div className={clsx("Settings", className, classes.root)}></div>;
});
