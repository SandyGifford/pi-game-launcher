import { awaitTime } from "@repo/shared";
import clsx from "clsx";
import type { FC } from "react";
import { memo, useEffect, useRef, useState } from "react";
import { TransitionGroup } from "react-transition-group";
import { getLaunchables, needsUpdate, updateAndReload } from "../../api";
import { useAlwaysRef } from "../../hooks/useAlwaysRef.hook";
import { useCallbackStable } from "../../hooks/useCallbackStable.hook";
import { usePromise } from "../../hooks/usePromise.hook";
import { useWindowHandler } from "../../hooks/useWindowHandler.hook";
import { allGamepadDirection } from "../../utils/gamepad.utils";
import { LaunchableButton } from "../LaunchableButton/LaunchableButton";
import { OtherButton } from "../OtherButton/OtherButton";
import classes from "./Homepage.module.scss";

export type HomepageProps = {
	readonly className?: string;
};

const STICK_THRESHOLD = 0.5;

export const Homepage: FC<HomepageProps> = memo(({ className }) => {
	const rowRefs = [useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null)] as const;
	const rowRefsRef = useAlwaysRef(rowRefs);

	const { status, data } = usePromise(
		async () => (await Promise.all([awaitTime(1000), getLaunchables()]))[1],
		[]
	);
	const { data: updateAvailable } = usePromise(
		// delay update button so it grabs attention by popping in
		async () => (await Promise.all([awaitTime(2000), needsUpdate()]))[1],
		[]
	);

	const isReady = status === "data";

	const [thinkingID, setThinkingID] = useState<string>();

	useWindowHandler(() => setThinkingID(undefined), [], "focus");

	const move = useCallbackStable(
		({
			up,
			down,
			left,
			right,
		}: {
			readonly up?: boolean;
			readonly down?: boolean;
			readonly left?: boolean;
			readonly right?: boolean;
		}) => {
			const rows = rowRefsRef.current;

			const rowElements = rows.map((row) => [...(row.current?.querySelectorAll("button") || [])]);
			const focused = document.activeElement;

			let rowIndex = rows.findIndex((r) => r.current?.contains(focused));
			let colIndex = rowElements[rowIndex]?.findIndex((c) => c === focused);

			if (rowIndex !== -1 && colIndex !== -1 && colIndex !== undefined) {
				if (up) rowIndex = Math.max(0, rowIndex - 1);
				if (down) rowIndex = Math.min(rows.length - 1, rowIndex + 1);
				if (left) colIndex = Math.max(0, colIndex - 1);
				if (right) colIndex = Math.min(rows.length - 1, colIndex + 1);
			} else {
				rowIndex = up ? rows.length - 1 : 0;
				colIndex = left ? (rowElements[rowIndex]?.length ?? 0) - 1 : 0;
			}

			rowElements[rowIndex]?.[colIndex]?.focus();
		}
	);

	useEffect(() =>
		allGamepadDirection.on("value", ({ x, y }) =>
			move({
				up: y <= -STICK_THRESHOLD,
				down: y >= STICK_THRESHOLD,
				left: x <= -STICK_THRESHOLD,
				right: x >= STICK_THRESHOLD,
			})
		)
	);

	useWindowHandler(
		(e) => {
			switch (e.key) {
				case "ArrowUp":
					move({ up: true });
					break;
				case "ArrowDown":
					move({ down: true });
					break;
				case "ArrowLeft":
					move({ left: true });
					break;
				case "ArrowRight":
					move({ right: true });
					break;
			}
		},
		[move],
		"keydown"
	);

	return (
		<div className={clsx("Homepage", className, classes.root, isReady && classes["root--ready"])}>
			<div className={classes.launchables} ref={rowRefs[0]}>
				{(() => {
					switch (status) {
						case "data":
							return data.map((launchable) => (
								<LaunchableButton
									key={launchable.id}
									className={classes.launchable}
									launchable={launchable}
									currentThinkingId={thinkingID}
									setCurrentThinkingId={setThinkingID}
								/>
							));
						default:
							return;
					}
				})()}
			</div>
			<TransitionGroup>
				<div className={classes.others} ref={rowRefs[1]}>
					{updateAvailable && (
						<OtherButton
							key="update-available"
							thinkingId="UPDATE_AVAILABLE"
							currentThinkingId={thinkingID}
							setCurrentThinkingId={setThinkingID}
							onClick={async () => {
								await updateAndReload();
							}}
						>
							update available!
						</OtherButton>
					)}
					<OtherButton
						key="configure"
						currentThinkingId={thinkingID}
						setCurrentThinkingId={setThinkingID}
						onClick={async () => {}}
					>
						configure
					</OtherButton>
				</div>
			</TransitionGroup>
		</div>
	);
});
