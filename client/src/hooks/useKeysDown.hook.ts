import { useRef, type DependencyList } from "react";
import { useWindowHandler } from "./useWindowHandler.hook";

export const useKeysDown = (
	cb: (keysDown: { readonly [KEY in string]: true }) => unknown,
	dependencies: DependencyList
) => {
	const keysDownRef = useRef<{ [KEY in string]: true }>({});

	useWindowHandler(
		(e) => {
			keysDownRef.current[e.key] = true;
			cb({ ...keysDownRef.current });
		},
		dependencies,
		"keydown"
	);
	useWindowHandler((e) => delete keysDownRef.current[e.key], [], "keyup");
};
