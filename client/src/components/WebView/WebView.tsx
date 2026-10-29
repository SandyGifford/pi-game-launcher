import type { FC } from "react";
import { memo } from "react";
import classes from "./WebView.module.scss";
import clsx from "clsx";
import { useViewReady } from "../View/View.ctx";

export type WebViewProps = {
	readonly className?: string;
	readonly url: string;
};

export const WebView: FC<WebViewProps> = memo(({ className, url }) => {
	const viewReady = useViewReady();
	return (
		<iframe className={clsx("WebView", className, classes.root)} onLoad={viewReady} src={url} />
	);
});

WebView.displayName = "WebView";
