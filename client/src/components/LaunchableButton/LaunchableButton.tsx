import type { Launchable } from "@repo/shared";
import clsx from "clsx";
import type { FC } from "react";
import { memo } from "react";
import { launch } from "../../api";
import { GroupThinkButton } from "../GroupThinkButton/GroupThinkButton";
import classes from "./LaunchableButton.module.scss";

export type LaunchableButtonProps = {
  readonly launchable: Launchable;
} & Omit<GroupThinkButton, "thinkingId" | "children">;

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
