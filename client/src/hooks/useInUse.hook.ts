import { useEffect, useRef, useState } from "react";
import { useCallbackStable } from "./useCallbackStable.hook";
import { useIsMountedRef } from "./useIsMountedRef.hook";

export type UseInUseOptions = {
	readonly forceInUse?: boolean;
	readonly permaInUse?: boolean | number;
};

export const useInUse = (options: UseInUseOptions = {}) => {
	const { forceInUse, permaInUse } = options;
	const [inUseCount, setInUseCount] = useState(0);

	const hasBeenInUseRef = useRef(false);
	const inUse = !!inUseCount || forceInUse || (permaInUse === true && hasBeenInUseRef.current);

	const isMountedRef = useIsMountedRef();

	const reserve = useCallbackStable(() => setInUseCount((count) => count + 1));
	const release = useCallbackStable(
		(noDelay?: boolean) =>
			new Promise<void>((res) =>
				setTimeout(
					() => {
						if (isMountedRef.current) setInUseCount((count) => count - 1);
						res();
					},
					!noDelay && typeof permaInUse === "number" ? permaInUse : 0
				)
			)
	);

	const reserveWhile = useCallbackStable(async <R>(fn: () => R): Promise<R> => {
		reserve();
		try {
			const res = await fn();
			hasBeenInUseRef.current = true;
			release();
			return res;
		} catch (e) {
			release(true);
			throw e;
		}
	});

	useEffect(() => {
		if (permaInUse !== true) hasBeenInUseRef.current = false;
	}, [permaInUse]);

	return { reserve, release, reserveWhile, inUse, inUseCount };
};
