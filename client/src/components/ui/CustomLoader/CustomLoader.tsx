import clsx from "clsx";
import type { ComponentProps, FC } from "react";
import type { LoaderProps } from "@mantine/core";
import classes from "./CustomLoader.module.scss";

type MantineLoaderComponent = NonNullable<
	NonNullable<LoaderProps["loaders"]>["oval"]
>;
type CustomLoaderProps = ComponentProps<MantineLoaderComponent> & {
	readonly size?: unknown;
	readonly variant?: unknown;
};

export const CustomLoader: FC<CustomLoaderProps> = ({
	className,
	style,
	size: _size,
	variant: _variant,
	...rest
}) => (
	<div className={clsx(className, classes.indicator)} style={style} {...rest} />
);
