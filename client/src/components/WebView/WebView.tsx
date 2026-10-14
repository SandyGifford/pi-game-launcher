import type { FC } from "react";
import { memo } from "react";
import classes from "./WebView.module.scss";
import clsx from "clsx";

export type WebViewProps = {
	readonly className?: string;
	readonly url: string;
};

export const WebView: FC<WebViewProps> = memo(({ className, url }) => {
	return <iframe className={clsx("WebView", className, classes.root)} src={url} />;
});
