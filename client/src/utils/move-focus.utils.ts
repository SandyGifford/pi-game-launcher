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
		const initCapStart = fromRect?.[crossStartProp] ?? viewRect[crossStartProp];
		const initCapEnd = fromRect?.[crossEndProp] ?? viewRect[crossEndProp];
		const initStart =
			direction > 0
				? (fromRect?.[axisEndProp] ?? viewRect[axisStartProp])
				: (fromRect?.[axisStartProp] ?? viewRect[axisEndProp]);
		let bestStart = initStart;
		let bestOverlaps = false;

		btns.forEach((btn) => {
			if (!(btn instanceof HTMLButtonElement)) return;

			const rect = getRect(btn);

			const capStart = rect[crossStartProp];
			const capEnd = rect[crossEndProp];
			const start = direction > 0 ? rect[axisStartProp] : rect[axisEndProp];
			const overlaps = !(capEnd <= initCapStart) && !(capStart >= initCapEnd);

			if (start * dir < initStart * dir) return;

			if (
				!bestEl ||
				(overlaps && !bestOverlaps) ||
				(overlaps === bestOverlaps && start * dir < bestStart * dir)
			) {
				bestEl = btn;
				bestStart = start;
				bestOverlaps = overlaps;
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
