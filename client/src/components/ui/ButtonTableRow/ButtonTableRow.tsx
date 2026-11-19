import clsx from "clsx";
import { memo, type ButtonHTMLAttributes, type FC } from "react";
import classes from "./ButtonTableRow.module.scss";

export type ButtonTableRowProps = ButtonHTMLAttributes<HTMLButtonElement>;

export const ButtonTableRow: FC<ButtonTableRowProps> = memo(({ className, children, ...rest }) => {
  return (
    <button className={clsx("ButtonTableRow", className, classes.root)} {...rest}>
      {children}
    </button>
  );
});
