import clsx from "clsx";
import type { FC, ReactNode } from "react";
import { memo } from "react";
import classes from "./ButtonGroup.module.scss";

export type ButtonGroupProps = {
  readonly className?: string;
  readonly children?: ReactNode;
};

export const ButtonGroup: FC<ButtonGroupProps> = memo(({ className, children }) => (
  <div className={clsx("ButtonGroup", className, classes.root)}>
    {children}
  </div>
));
