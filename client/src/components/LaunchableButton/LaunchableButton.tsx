import type { Launchable } from "@repo/shared";
import clsx from "clsx";
import type { FC } from "react";
import { memo } from "react";
import classes from "./LaunchableButton.module.scss";
import { launch } from "../../api";
import { AsyncButton } from "../AsyncButton/AsyncButton";

export type LaunchableButtonProps = {
	readonly className?: string | undefined;
	readonly launchable: Launchable;
};

export const LaunchableButton: FC<LaunchableButtonProps> = memo(
	({ className, launchable: { id, iconPath, title } }) => {
		return (
			<AsyncButton className={clsx(className, classes.root)} onClick={() => launch(id)}>
				<img className={classes.icon} src={`/icons/${iconPath}`} />
				<span className={classes.title}>{title}</span>
			</AsyncButton>
		);
	}
);
