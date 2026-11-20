import clsx from "clsx";
import { memo, type FC } from "react";
import classes from "./BTR.module.scss";

export type BTRProps = React.DetailedHTMLProps<
	React.HTMLAttributes<HTMLTableRowElement>,
	HTMLTableRowElement
>;

export const BTR: FC<BTRProps> = memo(({ className, children, ...rest }) => {
	return (
		<tr
			className={clsx("BTR", "no-theme", className, classes.root)}
			tabIndex={0}
			role="button"
			{...rest}
		>
			{children}
		</tr>
	);
});
