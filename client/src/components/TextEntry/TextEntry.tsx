import { Modal, TextInput, type TextInputProps } from "@mantine/core";
import { useCallbackRef } from "@mantine/hooks";
import clsx from "clsx";
import type { ChangeEventHandler, ReactElement, Ref } from "react";
import { forwardRef, memo, useState } from "react";
import { useCallbackStable } from "../../hooks/useCallbackStable.hook";
import classes from "./TextEntry.module.scss";

export type TextEntryCompleteHandler = (value: string) => unknown;

export type TextEntryChild = ReactElement<{ readonly ref?: Ref<HTMLElement> }>;

export type TextEntryProps = {
	readonly className?: string;
	readonly defaultValue?: string;
	readonly opened?: boolean;
	readonly onClose?: (value: string) => unknown;
	readonly onSubmit?: (value: string) => unknown;
	readonly onCancel?: () => unknown;
} & Omit<TextInputProps, "children" | "value" | "defaultValue" | "onSubmit">;

export const TextEntry = memo(
	forwardRef<HTMLInputElement, TextEntryProps>(
		(
			{
				className,
				style,
				defaultValue = "",
				onKeyDown,
				onClose,
				onCancel,
				onSubmit,
				onChange,
				opened,
				...rest
			},
			extRef
		) => {
			const [value, setValue] = useState(defaultValue);

			const handleCancel = useCallbackStable(() => {
				onClose?.(defaultValue);
				onCancel?.();
			});

			const handleChange = useCallbackRef<ChangeEventHandler<HTMLInputElement>>((e) => {
				setValue(e.target.value);
				onChange?.(e);
			});

			return (
				<>
					<Modal opened={!!opened} onClose={handleCancel}>
						<TextInput
							ref={extRef}
							size="xl"
							className={clsx("TextEntry", className, classes.root)}
							data-autofocus
							onChange={handleChange}
							value={value}
							{...rest}
						/>
					</Modal>
				</>
			);
		}
	)
);
