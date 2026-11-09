import type { Launchable } from "@repo/shared";
import clsx from "clsx";
import type { FC } from "react";
import { memo } from "react";
import { launch } from "../../api";
import classes from "./LaunchableButton.module.scss";
import {
	GroupThinkButton,
	type GroupThinkButtonProps,
} from "../group-think/components/GroupThinkButton/GroupThinkButton";

export type LaunchableButtonProps = {
	readonly launchable: Launchable;
} & Omit<GroupThinkButtonProps, "thinkingId" | "children">;

export const LaunchableButton: FC<LaunchableButtonProps> = memo(
	({ className, launchable: { id, iconPath, title }, onClick, ...rest }) => {
		return (
			<GroupThinkButton
				className={clsx("LaunchableButton", className, classes.root)}
				onClick={async (e) => {
					await launch(id);
					await onClick?.(e);
				}}
				thinkingId={id}
				{...rest}
			>
				<img className={classes.icon} src={`/icons/${iconPath}`} />
				<span className={classes.title}>{title}</span>
			</GroupThinkButton>
		);
	}
);

LaunchableButton.displayName = "LaunchableButton";
