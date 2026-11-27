import type { TransitionStatus } from "react-transition-group";

const STATUS_PRIORITY: { readonly [STATUS in TransitionStatus]: number } = {
	entered: 0,
	entering: 1,
	exited: 2,
	unmounted: 3,
	exiting: 4,
};

export const resolveNestedTransitionStatuses = (
	status: TransitionStatus,
	...statuses: readonly TransitionStatus[]
): TransitionStatus =>
	statuses.reduce(
		(resolved, next) => (STATUS_PRIORITY[next] > STATUS_PRIORITY[resolved] ? next : resolved),
		status
	);
