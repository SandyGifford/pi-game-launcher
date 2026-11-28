import { afterEach, expect, it, vi } from "vitest";
import { moveFocus } from "./move-focus.utils";

type Rect = Pick<DOMRect, "left" | "right" | "top" | "bottom">;

const setup = (rects: Rect[], activeIndex?: number) => {
	const documentState: { activeElement: MockButton | undefined } = { activeElement: undefined };
	class MockButton {
		readonly rect: Rect;
		constructor(rect: Rect) {
			this.rect = rect;
		}
		getBoundingClientRect() {
			return this.rect;
		}
		focus() {
			documentState.activeElement = this;
		}
	}

	const buttons = rects.map((rect) => new MockButton(rect));
	documentState.activeElement = activeIndex === undefined ? undefined : buttons[activeIndex];
	vi.stubGlobal("document", documentState);
	vi.stubGlobal("HTMLButtonElement", MockButton);
	const container = {
		getBoundingClientRect: (): DOMRect => ({
			left: 0,
			right: 500,
			top: 0,
			bottom: 500,
			x: 0,
			y: 0,
			width: 500,
			height: 500,
			toJSON: () => ({}),
		}),
		contains: (element: unknown) => buttons.some((button) => button === element),
		querySelectorAll: () => buttons,
	} as unknown as HTMLElement;

	return { buttons, container, documentState };
};

afterEach(() => vi.unstubAllGlobals());

it.each([
	{ direction: { x: 0, y: 1 }, forward: { left: 0, right: 100, top: 80, bottom: 120 } },
	{ direction: { x: 0, y: -1 }, forward: { left: 0, right: 100, top: -20, bottom: 20 } },
	{ direction: { x: 1, y: 0 }, forward: { left: 80, right: 120, top: 0, bottom: 100 } },
	{ direction: { x: -1, y: 0 }, forward: { left: -20, right: 20, top: 0, bottom: 100 } },
])(
	"moves to an overlapping button in the requested direction: $direction",
	({ direction, forward }) => {
		const { buttons, container, documentState } = setup(
			[forward, { left: 0, right: 100, top: 0, bottom: 100 }],
			1
		);

		moveFocus(direction, container);

		expect(documentState.activeElement).toBe(buttons[0]);
	}
);

it("rejects buttons whose centers are behind, and prefers aligned candidates over closer fallbacks", () => {
	const { buttons, container, documentState } = setup(
		[
			{ left: 0, right: 100, top: -80, bottom: -10 },
			{ left: 120, right: 160, top: 105, bottom: 125 },
			{ left: 0, right: 100, top: 150, bottom: 170 },
			{ left: 0, right: 100, top: 0, bottom: 100 },
		],
		3
	);

	moveFocus({ x: 0, y: 1 }, container);

	expect(documentState.activeElement).toBe(buttons[2]);
});

it("ignores a button whose far edge only touches the active button's near edge", () => {
	const { buttons, container, documentState } = setup(
		[
			{ left: 0, right: 100, top: -80, bottom: 0 },
			{ left: 0, right: 100, top: 0, bottom: 100 },
		],
		1
	);

	moveFocus({ x: 0, y: 1 }, container);

	expect(documentState.activeElement).toBe(buttons[1]);
});

it("chooses the nearest non-aligned candidate when no aligned candidate exists", () => {
	const { buttons, container, documentState } = setup(
		[
			{ left: 120, right: 160, top: 200, bottom: 220 },
			{ left: 120, right: 160, top: 110, bottom: 130 },
			{ left: 0, right: 100, top: 0, bottom: 100 },
		],
		2
	);

	moveFocus({ x: 0, y: 1 }, container);

	expect(documentState.activeElement).toBe(buttons[1]);
});

it("ranks eligible overlapping candidates by center distance", () => {
	const { buttons, container, documentState } = setup(
		[
			{ left: 0, right: 100, top: 0, bottom: 140 },
			{ left: 0, right: 100, top: 70, bottom: 110 },
			{ left: 0, right: 100, top: 0, bottom: 100 },
		],
		2
	);

	moveFocus({ x: 0, y: 1 }, container);

	expect(documentState.activeElement).toBe(buttons[0]);
});

it.each([
	{ direction: { x: 0, y: 1 }, expected: 2 },
	{ direction: { x: 0, y: -1 }, expected: 0 },
])("moves past overlapping neighbors in the requested direction: $direction", ({ direction, expected }) => {
	const { buttons, container, documentState } = setup(
		[
			{ left: 0, right: 100, top: -80, bottom: 10 },
			{ left: 0, right: 100, top: 0, bottom: 100 },
			{ left: 0, right: 100, top: 90, bottom: 180 },
		],
		1
	);

	moveFocus(direction, container);

	expect(documentState.activeElement).toBe(buttons[expected]);
});

it("leaves focus unchanged when no button is in the requested direction", () => {
	const { buttons, container, documentState } = setup(
		[
			{ left: 0, right: 100, top: -80, bottom: -10 },
			{ left: 0, right: 100, top: 0, bottom: 100 },
		],
		1
	);

	moveFocus({ x: 0, y: 1 }, container);

	expect(documentState.activeElement).toBe(buttons[1]);
});

it.each([
	{ direction: { x: 0, y: 1 }, expected: 0 },
	{ direction: { x: 0, y: -1 }, expected: 1 },
])(
	"starts at the appropriate container edge without an active button: $direction",
	({ direction, expected }) => {
		const { buttons, container, documentState } = setup([
			{ left: 10, right: 30, top: 20, bottom: 40 },
			{ left: 10, right: 30, top: 400, bottom: 420 },
		]);

		moveFocus(direction, container);

		expect(documentState.activeElement).toBe(buttons[expected]);
	}
);

