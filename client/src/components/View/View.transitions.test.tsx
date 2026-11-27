import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { TransitionStatus } from "react-transition-group";
import { expect, it, vi } from "vitest";
import { View } from "./View";

const transitionCalls = vi.hoisted(
	() => [] as { readonly in: boolean | undefined; readonly onExited: (() => void) | undefined }[]
);

vi.mock("react-transition-group", () => ({
	CSSTransition: ({
		in: isIn,
		onExited,
		children,
	}: {
		readonly in?: boolean;
		readonly onExited?: () => void;
		readonly children: (status: TransitionStatus) => ReactNode;
	}) => {
		transitionCalls.push({ in: isIn, onExited });
		return children(isIn ? "entered" : "exited");
	},
}));

it("keeps the navigation transition present while the view is unready", () => {
	transitionCalls.length = 0;
	const onExited = vi.fn();
	const html = renderToStaticMarkup(
		<View in onExited={onExited}>
			{(status) => <span>{status}</span>}
		</View>
	);

	expect(transitionCalls).toEqual([
		{ in: true, onExited },
		{ in: false, onExited: undefined },
	]);
	expect(html).toContain("<span>exited</span>");
});

it("hands navigation exit to the group even if readiness never arrives", () => {
	transitionCalls.length = 0;
	const onExited = vi.fn();
	renderToStaticMarkup(
		<View in={false} onExited={onExited}>
			{() => null}
		</View>
	);

	expect(transitionCalls).toEqual([
		{ in: false, onExited },
		{ in: false, onExited: undefined },
	]);
});
