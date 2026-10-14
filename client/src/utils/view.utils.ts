import type { ReactNode } from "react";
import type { ViewBaseParams, ViewName, ViewParameters } from "../types/view.types";
import { VIEW_RENDERERS } from "../consts";

export const renderView = <VIEW extends ViewName>(
	view: VIEW,
	baseProps: ViewBaseParams,
	...args: ViewParameters<VIEW>
): ReactNode =>
	(VIEW_RENDERERS[view] as (baseProps: ViewBaseParams) => ReactNode)(baseProps, ...(args as []));
