import { Modal, TextInput, type TextInputProps } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import clsx from "clsx";
import type { ReactElement, Ref } from "react";
import { forwardRef, memo, useState } from "react";
import { AutoRefTransition } from "../ui/AutoRefTransition/AutoRefTransition";
import classes from "./TextEntry.module.scss";

export type TextEntryCompleteHandler = (value: string) => unknown;

export type TextEntryChild = ReactElement<{ readonly ref?: Ref<HTMLElement> }>;

export type TextEntryProps = {
	readonly className?: string;
	readonly defaultValue?: string;
	readonly onClose?: () => unknown;
	readonly onComplete?: TextEntryCompleteHandler;
	readonly children?:
		| TextEntryChild
		| ((args: { readonly open: () => void; readonly close: () => void }) => TextEntryChild);
} & Omit<TextInputProps, "children" | "value" | "defaultValue">;

const DURATION_MS = 500;

export const TextEntry = memo(
	forwardRef<HTMLElement, TextEntryProps>(
		(
			{
				className,
				style,
				defaultValue = "",
				onChange,
				onKeyDown,
				onClose,
				onComplete,
				children,
				...rest
			},
			extRef
		) => {
			const [opened, { close }] = useDisclosure(false);
			const [value] = useState(defaultValue);

			return (
				<>
					<Modal
						opened={opened}
						onClose={close}
						title="Text entry"
						withCloseButton={false}
						classNames={{
							inner: classes.modalInner,
							content: classes.modalContent,
							header: classes.modalHeader,
							body: classes.modalBody,
						}}
						transitionProps={{
							duration: DURATION_MS,
							transition: {
								in: { opacity: 1 },
								out: { opacity: 1 },
								transitionProperty: "opacity",
							},
						}}
					>
						<AutoRefTransition in={opened} appear mountOnEnter timeout={DURATION_MS}>
							{(state) => (
								<TextInput
									aria-label={rest.label ? undefined : "Text entry"}
									data-autofocus
									{...rest}
									className={clsx("TextEntry", className, classes.root, classes[`root--${state}`])}
									value={value}
								/>
							)}
						</AutoRefTransition>
					</Modal>
				</>
			);
		}
	)
);
