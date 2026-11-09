import clsx from "clsx";
import type { FC } from "react";
import { memo } from "react";
import type { GroupThinkButtonProps } from "../group-think/components/GroupThinkButton/GroupThinkButton";
import { GroupThinkButton } from "../group-think/components/GroupThinkButton/GroupThinkButton";

export type OtherButtonProps = Pick<
	GroupThinkButtonProps,
	"thinkingId" | "onClick" | "children"
> & {
	readonly className?: string;
};

export const OtherButton: FC<OtherButtonProps> = memo(
	({ className, children, onClick, thinkingId }) => (
		<GroupThinkButton
			className={clsx("OtherButton", className)}
			thinkingId={thinkingId}
			onClick={onClick}
		>
			{children}
		</GroupThinkButton>
	)
);

OtherButton.displayName = "OtherButton";
