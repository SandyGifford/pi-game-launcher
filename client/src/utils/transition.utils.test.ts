import { expect, it } from "vitest";
import { resolveNestedTransitionStatuses } from "./transition.utils";

it("reports the least advanced entrance status", () => {
	expect(resolveNestedTransitionStatuses("entered", "entering")).toBe("entering");
	expect(resolveNestedTransitionStatuses("entering", "exited", "entered")).toBe("exited");
	expect(resolveNestedTransitionStatuses("entered", "unmounted")).toBe("unmounted");
});

it("reports exiting until every exit has finished", () => {
	expect(resolveNestedTransitionStatuses("entered", "exiting")).toBe("exiting");
	expect(resolveNestedTransitionStatuses("exited", "exiting")).toBe("exiting");
	expect(resolveNestedTransitionStatuses("entering", "exiting", "unmounted")).toBe("exiting");
});

it("preserves a single status", () => {
	expect(resolveNestedTransitionStatuses("entered")).toBe("entered");
	expect(resolveNestedTransitionStatuses("exited")).toBe("exited");
});
