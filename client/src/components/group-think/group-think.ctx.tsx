import type { RefObject } from "react";
import { createQuickCtx } from "../../utils/createQuickCtx.utils";
import type { GroupThinkButtonThinkingID } from "./components/GroupThinkButton/GroupThinkButton";

export type GroupThinkCtx = {
	readonly addRefs: (ref: ReadonlySet<RefObject<HTMLButtonElement | null>>) => void;
	readonly removeRefs: (ref: ReadonlySet<RefObject<HTMLButtonElement | null>>) => void;
	readonly currentThinkingId: GroupThinkButtonThinkingID | undefined;
	readonly setCurrentThinkingId: (id: GroupThinkButtonThinkingID) => void;
};

export const [, GroupThinkProvider, useGroupThink] = createQuickCtx<GroupThinkCtx>("GroupThink", {
	currentThinkingId: undefined,
	setCurrentThinkingId: () => void 0,
	addRefs: () => void 0,
	removeRefs: () => void 0,
})(["currentThinkingId", "setCurrentThinkingId", "addRefs", "removeRefs"]);

export type GroupThinkRowCtx = {
	readonly addRef: (ref: RefObject<HTMLButtonElement | null>) => void;
	readonly removeRef: (ref: RefObject<HTMLButtonElement | null>) => void;
};

export const [, GroupThinkRowProvider, useGroupThinkRow] = createQuickCtx<GroupThinkRowCtx>(
	"GroupThinkRow",
	{
		addRef: () => void 0,
		removeRef: () => void 0,
	}
)(["addRef", "removeRef"]);
