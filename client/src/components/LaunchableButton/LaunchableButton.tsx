import type { Launchable } from "@repo/shared";
import clsx from "clsx";
import type { FC } from "react";
import { memo } from "react";
import classes from "./LaunchableButton.module.scss";
import { launch } from "../../api";
import { AsyncButton, type AsyncButtonProps } from "../AsyncButton/AsyncButton";

export type LaunchableButtonProps = {
	readonly launchable: Launchable;
} & AsyncButtonProps;

export const LaunchableButton: FC<LaunchableButtonProps> = memo(
	({ className, launchable: { id, iconPath, title }, onClick, ...rest }) => {
		return (
			<AsyncButton
				className={clsx(className, classes.root)}
				onClick={async (e) => {
					await launch(id);
					await onClick?.(e);
				}}
				{...rest}
			>
				<img className={classes.icon} src={`/icons/${iconPath}`} />
				<span className={classes.title}>{title}</span>
			</AsyncButton>
		);
	}
);
