import { expect, it, vi } from "vitest";
import {
	EventDispatcherListenerError,
	EventDispatcherMountError,
	EventDispatcherUnmountError,
} from "./event-dispatcher.errors";
import { eventDispatcher } from "./event-dispatcher";
import { eventDispatcherFamily } from "./event-dispatcher-family";
import type { EventDispatcher } from "./event-dispatcher.types";

const catchError = (fn: () => unknown): unknown => {
	try {
		fn();
	} catch (e) {
		return e;
	}
	return undefined;
};

it("reuses keyed dispatchers and evicts them after the final listener unsubscribes", () => {
	const family = eventDispatcherFamily(
		(_value: { readonly id: number }) => eventDispatcher(0),
		{ getKey: ({ id }: { readonly id: number }) => id }
	);
	const first = family({ id: 1 });
	expect(family({ id: 1 })).toBe(first);
	expect(family({ id: 2 })).not.toBe(first);

	const listener = vi.fn();
	const unsubscribe = first.on("value", listener);
	first.fire(10);
	expect(listener).toHaveBeenCalledWith(10);
	unsubscribe();

	expect(family({ id: 1 })).not.toBe(first);
});

it("preserves the concrete stateful dispatcher type in the family", () => {
	const family = eventDispatcherFamily<number, EventDispatcher<number>>((value) =>
		eventDispatcher(value)
	);
	const dispatcher = family(42);

	expect(dispatcher.get()).toBe(42);
});

it("does not let an old dispatcher evict its replacement", () => {
	const family = eventDispatcherFamily<number, EventDispatcher<number>>(
		() => eventDispatcher(0)
	);
	const first = family(1);
	family.remove(1);
	const replacement = family(1);

	const staleListener = vi.fn();
	const unsubscribe = first.on("value", staleListener);
	unsubscribe();

	expect(family(1)).toBe(replacement);
});

it("supports explicit removal and clearing", () => {
	const family = eventDispatcherFamily((value: number) => eventDispatcher(value));
	const first = family(1);
	const second = family(2);

	family.remove(1);
	expect(family(1)).not.toBe(first);
	expect(family(2)).toBe(second);

	family.clear();
	expect(family(1)).not.toBe(first);
	expect(family(2)).not.toBe(second);
});

it("delivers to every listener even if one throws, then reports all errors", () => {
	const dispatcher = eventDispatcher(0);
	const after = vi.fn();
	const boom = new Error("boom");
	const bang = new Error("bang");
	dispatcher.on("value", () => {
		throw boom;
	});
	dispatcher.on("value", after);
	dispatcher.on("value", () => {
		throw bang;
	});

	const error = catchError(() => dispatcher.fire(1));
	expect(error).toBeInstanceOf(EventDispatcherListenerError);
	expect((error as EventDispatcherListenerError).cause).toBe(boom);
	expect((error as EventDispatcherListenerError).errors).toEqual([boom, bang]);
	expect(after).toHaveBeenCalledWith(1);
});

it("rolls back a subscription whose mount listener throws", () => {
	const dispatcher = eventDispatcher(0);
	const cleanup = vi.fn();
	const unmount = vi.fn();
	const boom = new Error("boom");
	dispatcher.on("mount", () => cleanup);
	dispatcher.on("mount", () => {
		throw boom;
	});
	dispatcher.on("unmount", unmount);

	const listener = vi.fn();
	const error = catchError(() => dispatcher.on("value", listener));
	expect(error).toBeInstanceOf(EventDispatcherMountError);
	expect((error as EventDispatcherMountError).cause).toBe(boom);
	expect(cleanup).toHaveBeenCalledTimes(1);
	expect(unmount).toHaveBeenCalledTimes(1);

	dispatcher.fire(1);
	expect(listener).not.toHaveBeenCalled();
});

it("runs every cleanup and unmount listener when one throws", () => {
	const dispatcher = eventDispatcher(0);
	const boom = new Error("boom");
	const second = vi.fn();
	const unmount = vi.fn();
	dispatcher.on("mount", () => () => {
		throw boom;
	});
	dispatcher.on("mount", () => second);
	dispatcher.on("unmount", unmount);
	const unsubscribe = dispatcher.on("value", () => {});

	const error = catchError(unsubscribe);
	expect(error).toBeInstanceOf(EventDispatcherUnmountError);
	expect((error as EventDispatcherUnmountError).cause).toBe(boom);
	expect(second).toHaveBeenCalledTimes(1);
	expect(unmount).toHaveBeenCalledTimes(1);

	// cleanups were cleared, so a fresh subscription mounts again
	const mounted = vi.fn();
	dispatcher.on("mount", mounted);
	dispatcher.on("value", () => {});
	expect(mounted).toHaveBeenCalledTimes(1);
});
