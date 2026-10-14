import type { TransitionStatus } from "react-transition-group";
import type { VIEW_RENDERERS } from "../consts";
import { type ArraySlice } from "type-fest";

export type ViewName = keyof typeof VIEW_RENDERERS;

export type ViewBaseParams = { readonly transitionStatus: TransitionStatus };

export type ViewParameters<VIEW extends ViewName> = ArraySlice<
	Parameters<(typeof VIEW_RENDERERS)[VIEW]>,
	1
>;

export type SetView = <VIEW extends ViewName>(name: VIEW, ...args: ViewParameters<VIEW>) => void;
