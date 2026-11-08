import type { LaunchAction, LaunchActionType } from "@repo/shared";
import type { ReactNode } from "react";
import { Homepage } from "./components/Homepage/Homepage";
import { Settings } from "./components/Settings/Settings";
import { WebView } from "./components/WebView/WebView";
import type { ViewBaseParams } from "./types/view.types";

export const LAUNCH_ACTION_META: {
	readonly [ACTION in LaunchActionType]: {
		readonly act: (action: Extract<LaunchAction, { readonly action: ACTION }>) => unknown;
	};
} = {
	none: { act: () => void 0 },
	redirect: { act: ({ url }) => window.location.assign(url) },
};

export const VIEW_RENDERERS = {
	HOME: () => <Homepage />,
	SETTINGS: () => <Settings />,
	WEB: (props, url: string) => <WebView url={url} key={`web--${url}`} />,
} satisfies {
	readonly [NAME in string]: (props: ViewBaseParams, ...args: never[]) => ReactNode;
};
