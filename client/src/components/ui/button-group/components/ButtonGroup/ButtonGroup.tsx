import clsx from "clsx";
import type { FC, ReactNode } from "react";
import { memo } from "react";
import classes from "./ButtonGroup.module.scss";

export type ButtonGroupProps = {
  readonly className?: string;
  readonly ready?: boolean;
  readonly children?: ReactNode;
};

export const ButtonGroup: FC<ButtonGroupProps> = memo(({ className, ready = true, children }) => (
  <div className={clsx("ButtonGroup", ready && "ButtonGroup--ready", className, classes.root)}>
    {children}
  </div>
));
