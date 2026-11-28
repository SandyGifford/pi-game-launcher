export type Vec2 = { readonly x: number; readonly y: number };

const _moveFocus = (
	{ x, y }: Vec2,
	cached: Map<HTMLElement, DOMRect>,
	container: HTMLElement | undefined
) => {
	if (!container) return;

	const getRect = (el: HTMLElement): DOMRect => {
		if (cached.has(el)) return cached.get(el)!;
		const rect = el.getBoundingClientRect();
		cached.set(el, rect);
		return rect;
	};

	const viewRect = getRect(container);
	const active =
		document.activeElement instanceof HTMLButtonElement &&
		container.contains(document.activeElement)
			? document.activeElement
			: undefined;
	const btns = [...container.querySelectorAll("button:not(:disabled):not([data-disabled])")];

	const fromRect = active && getRect(active);

	type DOMEdge = Extract<keyof DOMRect, "top" | "left" | "right" | "bottom">;

	const focusBestEl = (
		direction: number,
		axisStartProp: DOMEdge,
		axisEndProp: DOMEdge,
		crossStartProp: DOMEdge,
		crossEndProp: DOMEdge
	) => {
		let bestEl: HTMLButtonElement | undefined;

		const dir = direction / Math.abs(direction);
		const initCrossStart = fromRect?.[crossStartProp] ?? viewRect[crossStartProp];
		const initCrossEnd = fromRect?.[crossEndProp] ?? viewRect[crossEndProp];
		const initAxisPosition = fromRect
			? (fromRect[axisStartProp] + fromRect[axisEndProp]) / 2
			: viewRect[direction > 0 ? axisStartProp : axisEndProp];
		let bestAxisPosition = 0;
		let bestCrossOverlaps = false;

		btns.forEach((btn) => {
			if (!(btn instanceof HTMLButtonElement) || btn === active) return;

			const rect = getRect(btn);

			const crossStart = rect[crossStartProp];
			const crossEnd = rect[crossEndProp];
			const axisPosition = (rect[axisStartProp] + rect[axisEndProp]) / 2;
			const crossOverlaps = !(crossEnd <= initCrossStart) && !(crossStart >= initCrossEnd);

			if (axisPosition * dir <= initAxisPosition * dir) return;

			if (
				!bestEl ||
				(crossOverlaps && !bestCrossOverlaps) ||
				(crossOverlaps === bestCrossOverlaps && axisPosition * dir < bestAxisPosition * dir)
			) {
				bestEl = btn;
				bestAxisPosition = axisPosition;
				bestCrossOverlaps = crossOverlaps;
			}
		});

		bestEl?.focus();

		return bestEl;
	};

	if (x) {
		focusBestEl(x, "left", "right", "top", "bottom");
		if (y) _moveFocus({ x: 0, y }, cached, container);
	} else if (y) {
		focusBestEl(y, "top", "bottom", "left", "right");
	}
};

export const moveFocus = (vec: Vec2, container: HTMLElement | undefined) =>
	_moveFocus(vec, new Map(), container);
