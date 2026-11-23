import type { Ref } from "react";

export const spreadRef = <T>(val: T, ...refs: readonly (Ref<T> | undefined)[]) =>
	refs.forEach((ref) => {
		if (!ref) return;
		switch (typeof ref) {
			case "function":
				ref(val);
				break;
			case "object":
				ref.current = val;
				break;
		}
	});
