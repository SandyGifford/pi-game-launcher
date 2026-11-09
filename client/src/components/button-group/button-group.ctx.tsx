import type { RefObject } from "react";
import { createQuickCtx } from "../../utils/createQuickCtx.utils";
import type { ButtonGroupButtonThinkingID } from "./components/ButtonGroupButton/ButtonGroupButton";

export type ButtonGroupCtx = {
	readonly rootRef: RefObject<HTMLElement | null>;
	readonly ready: boolean;
	readonly addRefs: (ref: ReadonlySet<RefObject<HTMLButtonElement | null>>) => void;
	readonly removeRefs: (ref: ReadonlySet<RefObject<HTMLButtonElement | null>>) => void;
	readonly currentThinkingId: ButtonGroupButtonThinkingID | undefined;
	readonly setCurrentThinkingId: (id: ButtonGroupButtonThinkingID) => void;
};

export const [, ButtonGroupProvider, useButtonGroup] = createQuickCtx<ButtonGroupCtx>("ButtonGroup", {
	rootRef: { current: null },
	ready: true,
	currentThinkingId: undefined,
	setCurrentThinkingId: () => void 0,
	addRefs: () => void 0,
	removeRefs: () => void 0,
})(["rootRef", "ready", "currentThinkingId", "setCurrentThinkingId", "addRefs", "removeRefs"]);

export type ButtonGroupRowCtx = {
	readonly addRef: (ref: RefObject<HTMLButtonElement | null>) => void;
	readonly removeRef: (ref: RefObject<HTMLButtonElement | null>) => void;
};

export const [, ButtonGroupRowProvider, useButtonGroupRow] = createQuickCtx<ButtonGroupRowCtx>(
	"ButtonGroupRow",
	{
		addRef: () => void 0,
		removeRef: () => void 0,
	}
)(["addRef", "removeRef"]);
