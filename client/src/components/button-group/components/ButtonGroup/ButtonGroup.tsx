import type { FC, ReactNode, RefObject } from "react";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import classes from "./ButtonGroup.module.scss";
import clsx from "clsx";
import { ButtonGroupProvider } from "../../button-group.ctx";
import { useCallbackStable } from "../../../../hooks/useCallbackStable.hook";
import { useWindowHandler } from "../../../../hooks/useWindowHandler.hook";
import { clamp } from "../../../../utils/numbers.utils";
import { allGamepadDirection, type GamepadStick } from "../../../../utils/gamepad.utils";

const STICK_THRESHOLD = 0.5;

const getElementCenter = (el: HTMLElement) => {
	const { left, width } = el.getBoundingClientRect();
	return left + width / 2;
};

const findClosestElementIndex = (position: number, els: readonly HTMLElement[]): number => {
	const firstIndexOver = els.findIndex((el) => getElementCenter(el) > position);

	const beforeIndex = firstIndexOver - 1;
	const afterIndex = firstIndexOver;

	if (afterIndex < 0) return els.length - 1;
	if (beforeIndex < 0) return 0;

	const before = els[beforeIndex];
	const after = els[afterIndex];

	if (!after) return els.length - 1;
	if (!before) return 0;

	const beforePosition = getElementCenter(before);
	const afterPosition = getElementCenter(after);

	const beforeDist = Math.abs(position - beforePosition);
	const afterDist = Math.abs(position - afterPosition);

	return beforeDist < afterDist ? beforeIndex : afterIndex;
};

export type ButtonGroupProps = {
	readonly className?: string;
	readonly ready?: boolean;
	readonly children?: ReactNode;
};

export const ButtonGroup: FC<ButtonGroupProps> = memo(({ className, ready = true, children }) => {
	const rootRef = useRef<HTMLDivElement>(null);
	const buttonRefs = useMemo(() => new Set<ReadonlySet<RefObject<HTMLButtonElement | null>>>(), []);
	const addRefs = useCallbackStable((refs: ReadonlySet<RefObject<HTMLButtonElement | null>>) =>
		buttonRefs.add(refs)
	);
	const removeRefs = useCallbackStable((refs: ReadonlySet<RefObject<HTMLButtonElement | null>>) =>
		buttonRefs.delete(refs)
	);
	const [currentThinkingId, setCurrentThinkingId] = useState<string>();
	useWindowHandler(() => setCurrentThinkingId(undefined), [], "focus");

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
			const rows = [...buttonRefs].map((row) =>
				[...row]
					.map(({ current }) => current)
					.filter((el): el is HTMLButtonElement => !!el && !el.closest("[inert]"))
			);
			const focused = document.activeElement;

			let colIndex: number = -1;
			let rowIndex = rows.findIndex((row) => {
				const index = row.findIndex((el) => el === focused);
				if (index !== -1) {
					colIndex = index;
					return true;
				}
				return false;
			});

			if (focused instanceof HTMLButtonElement && rowIndex !== -1 && colIndex !== -1) {
				const changeRow = (newRowIndex: number) => {
					newRowIndex = clamp(newRowIndex, 0, rows.length - 1);
					const currentPosition = getElementCenter(focused);
					rowIndex = newRowIndex;
					const buttons = rows[rowIndex];
					if (buttons) colIndex = findClosestElementIndex(currentPosition, buttons);
				};

				if (up) changeRow(rowIndex - 1);
				if (down) changeRow(rowIndex + 1);
				if (left) colIndex = colIndex - 1;
				if (right) colIndex = colIndex + 1;
			} else {
				rowIndex = up ? Infinity : 0;
				colIndex = left ? Infinity : 0;
			}

			rowIndex = clamp(rowIndex, 0, rows.length - 1);
			colIndex = clamp(colIndex, 0, (rows[rowIndex]?.length ?? 0) - 1);

			rows[rowIndex]?.[colIndex]?.focus();
		}
	);

	useEffect(() => {
		const listener = ({ x, y }: GamepadStick) =>
			move({
				up: y <= -STICK_THRESHOLD,
				down: y >= STICK_THRESHOLD,
				left: x <= -STICK_THRESHOLD,
				right: x >= STICK_THRESHOLD,
			});

		allGamepadDirection.on("value", listener);

		return () => allGamepadDirection.off("value", listener);
	});

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
		<ButtonGroupProvider
			rootRef={rootRef}
			ready={ready}
			addRefs={addRefs}
			removeRefs={removeRefs}
			currentThinkingId={currentThinkingId}
			setCurrentThinkingId={setCurrentThinkingId}
		>
			<div
				className={clsx("ButtonGroup", ready && "ButtonGroup--ready", className, classes.root)}
				ref={rootRef}
			>
				{children}
			</div>
		</ButtonGroupProvider>
	);
});
