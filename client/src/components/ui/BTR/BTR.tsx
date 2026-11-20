import clsx from "clsx";
import { forwardRef, memo } from "react";
import classes from "./BTR.module.scss";

export type BTRProps = React.DetailedHTMLProps<
	React.HTMLAttributes<HTMLTableRowElement>,
	HTMLTableRowElement
>;

export const BTR = memo(
	forwardRef<HTMLTableRowElement, BTRProps>(({ className, children, ...rest }, ref) => {
		return (
			<tr
				className={clsx("BTR", "no-theme-button", className, classes.root)}
				tabIndex={0}
				role="button"
				ref={ref}
				{...rest}
			>
				{children}
			</tr>
		);
	})
);
