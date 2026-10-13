import {
	EventDispatcherBindingSubError,
	EventDispatcherBindingUnsubError,
} from "./event-dispatcher.errors";
import type {
	EventDispatcher,
	EventDispatcherUnsub,
	ReadonlyEventDispatcher,
} from "./event-dispatcher.types";

export type EventDispatcherArrayValues<S extends readonly ReadonlyEventDispatcher<unknown>[]> = {
	[K in keyof S]: S[K] extends ReadonlyEventDispatcher<infer V> ? V : never;
};

export const bindDispatcher = <const S extends readonly ReadonlyEventDispatcher<unknown>[], TARGET>(
	target: EventDispatcher<TARGET>,
	sources: S,
	project: (values: EventDispatcherArrayValues<S>, current: TARGET) => TARGET,
	areEqual: (a: TARGET, b: TARGET) => boolean = Object.is
): EventDispatcherUnsub => {
	// Always reads every source fresh, whichever one fired.
	const sync = () => {
		const current = target.get();
		const next = project(sources.map((s) => s.get()) as EventDispatcherArrayValues<S>, current);
		if (!areEqual(next, current)) target.fire(next);
	};

	return target.on("mount", () => {
		const unsubs: EventDispatcherUnsub[] = [];
		const unsubAll = () => {
			const errors: unknown[] = [];
			unsubs.splice(0).forEach((fn) => {
				try {
					fn();
				} catch (e) {
					errors.push(e);
				}
			});
			if (errors.length)
				throw new EventDispatcherBindingUnsubError(
					"Something went wrong in a binding while unsubbing",
					errors
				);
		};

		try {
			sources.forEach((s) => unsubs.push(s.on("value", sync)));
			sync();
		} catch (e) {
			try {
				unsubAll();
			} catch {
				//
			}
			throw new EventDispatcherBindingSubError("Something went wrong in a binding while subbing", [
				e,
			]);
		}
		return unsubAll;
	});
};
