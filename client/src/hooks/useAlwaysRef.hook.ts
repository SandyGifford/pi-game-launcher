import { useRef, type RefObject } from "react";

export const useAlwaysRef = <T>(val: T): RefObject<T> => {
	const ref = useRef(val);
	ref.current = val;
	return ref;
};
