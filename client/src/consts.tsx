import type { LaunchAction, LaunchActionType } from "@repo/shared";
import type { ReactNode } from "react";
import { Homepage } from "./components/Homepage/Homepage";
import { WebView } from "./components/WebView/WebView";
import type { ViewBaseParams, ViewName, ViewParameters } from "./types/view.types";
import { Settings } from "./components/Settings/Settings";

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
	WEB: (props, url: string) => <WebView url={url} />,
} satisfies {
	readonly [NAME in string]: (props: ViewBaseParams, ...args: never[]) => ReactNode;
};

export const VIEW_META: {
	readonly [VIEW in ViewName]: { readonly getKey?: (...args: ViewParameters<VIEW>) => string };
} = {
	HOME: {},
	SETTINGS: {},
	WEB: {
		getKey: (url) => `web--${url}`,
	},
};
