import clsx from "clsx";
import type { ComponentPropsWithoutRef } from "react";
import { forwardRef } from "react";
import classes from "./ButtonRoot.module.scss";

export type ButtonRootProps = ComponentPropsWithoutRef<"button">;

export const ButtonRoot = forwardRef<HTMLButtonElement, ButtonRootProps>(
	({ className, ...rest }, ref) => (
		<button ref={ref} className={clsx("ButtonRoot", classes.root, className)} {...rest} />
	)
);

ButtonRoot.displayName = "ButtonRoot";
