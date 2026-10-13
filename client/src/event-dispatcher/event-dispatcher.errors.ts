export abstract class EventDispatcherError extends Error {}

/** Thrown when several callbacks are run in isolation; `cause` is the first failure. */
export abstract class EventDispatcherMultiError extends EventDispatcherError {
	readonly errors: readonly unknown[];

	constructor(message: string, errors: readonly unknown[]) {
		super(message, { cause: errors[0] });
		this.errors = errors;
	}
}

/** A value listener threw during `fire` (or while reporting the current state on `on`). */
export class EventDispatcherListenerError extends EventDispatcherMultiError {}

/** A mount listener threw. The listener that was being added has been rolled back. */
export class EventDispatcherMountError extends EventDispatcherMultiError {}

/** An unmount listener or a mount cleanup threw. All of them still ran. */
export class EventDispatcherUnmountError extends EventDispatcherMultiError {}
