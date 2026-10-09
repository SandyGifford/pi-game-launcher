import clsx from "clsx";
import type { FC } from "react";
import { memo } from "react";
import { HomepageButton, type HomepageButtonProps } from "../HomepageButton/HomepageButton";
import classes from "./OtherButton.module.scss";

export type OtherButtonProps = {} & HomepageButtonProps;

export const OtherButton: FC<OtherButtonProps> = memo(({ className, children, ...rest }) => {
	return (
		<HomepageButton className={clsx("OtherButton", className, classes.root)} {...rest}>
			{children}
		</HomepageButton>
	);
});
