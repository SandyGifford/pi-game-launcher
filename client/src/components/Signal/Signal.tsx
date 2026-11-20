import type { FC } from "react";
import { memo } from "react";
import classes from "./Signal.module.scss";
import clsx from "clsx";
import { mapTimes } from "@repo/shared";

export type SignalProps = {
	readonly className?: string;
	readonly bars?: number;
	readonly strength: number;
};

export const Signal: FC<SignalProps> = memo(({ className, bars = 3, strength }) => {
	const partialBarIndex = Math.floor(strength * bars);
	const partialFill = strength * bars - partialBarIndex;

	return (
		<div
			className={clsx("Signal", className, classes.root)}
			style={{
				"--Signal--bar-total": bars,
			}}
		>
			{mapTimes(bars, (i) => {
				return (
					<div
						className={classes.bar}
						key={i}
						style={{
							"--Signal--bar-index": i,
							"--Signal--bar-strength": (() => {
								if (partialBarIndex === i) return partialFill;
								return i / bars < strength ? 1 : 0;
							})(),
						}}
					/>
				);
			})}
		</div>
	);
});
