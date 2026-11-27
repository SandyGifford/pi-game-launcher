import type { FC } from "react";
import { memo } from "react";
import classes from "./WebView.module.scss";
import clsx from "clsx";
import { useMarkViewAsReady } from "../../View/View.ctx";

export type WebViewProps = {
	readonly className?: string;
	readonly url: string;
};

export const WebView: FC<WebViewProps> = memo(({ className, url }) => {
	const markViewAsReady = useMarkViewAsReady();
	return (
		<iframe
			className={clsx("WebView", className, classes.root)}
			onLoad={markViewAsReady}
			src={url}
		/>
	);
});

WebView.displayName = "WebView";
