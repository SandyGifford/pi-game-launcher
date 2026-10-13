import { expect, it, vi } from "vitest";
import {
	createEventDispatcher,
	eventDispatcherFamily,
	type EventDispatcher,
	type StatefulEventDispatcher,
} from "./event-dispatcher.utils";

it("requires a first listener and reuses keyed dispatchers until they unmount", () => {
	const family = eventDispatcherFamily(
		(_value: { readonly id: number }) => createEventDispatcher({ initialState: 0 }),
		({ id }: { readonly id: number }) => id
	);
	const firstListener = vi.fn();
	const first = family({ id: 1 }, firstListener);

	const secondListener = vi.fn();
	expect(family({ id: 1 }, secondListener)).toBe(first);
	expect(family({ id: 2 }, vi.fn())).not.toBe(first);
	first.fire(10);
	expect(firstListener).toHaveBeenCalledWith(10);
	expect(secondListener).toHaveBeenCalledWith(10);

	first.off("value", firstListener);
	first.off("value", secondListener);
	expect(family({ id: 1 }, vi.fn())).not.toBe(first);
});

it("preserves the concrete stateful dispatcher type in the family", () => {
	const family = eventDispatcherFamily<number, StatefulEventDispatcher<number>>((value) =>
		createEventDispatcher({ initialState: value })
	);
	const dispatcher = family(42, () => {});

	expect(dispatcher.get()).toBe(42);
	dispatcher.off("value", () => {});
});

it("does not let an old dispatcher evict its replacement", () => {
	const family = eventDispatcherFamily<number, EventDispatcher<number>, number>(
		() => createEventDispatcher<number>(),
		(value) => value
	);
	const firstListener = vi.fn();
	const first = family(1, firstListener);
	first.off("value", firstListener);
	const replacement = family(1, () => {});

	const staleListener = vi.fn();
	first.on("value", staleListener);
	first.off("value", staleListener);

	expect(family(1, vi.fn())).toBe(replacement);
});

it("uses the value itself as the key when no key selector is provided", () => {
	const family = eventDispatcherFamily((value: number) => createEventDispatcher<number>());
	const first = family(1, () => {});

	expect(family(1, () => {})).toBe(first);
	expect(family(2, () => {})).not.toBe(first);
});
