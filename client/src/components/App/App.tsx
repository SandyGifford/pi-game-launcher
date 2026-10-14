import clsx from "clsx";
import type { FC } from "react";
import { memo, useEffect } from "react";
import { AppContext } from "../../contexts/AppContext.ctx";
import { useInUse } from "../../hooks/useInUse.hook";
import { Homepage } from "../Homepage/Homepage";
import classes from "./App.module.scss";
import { awaitTime } from "@repo/shared";

export type AppProps = {
	readonly className?: string;
};

export const App: FC<AppProps> = memo(({ className }) => {
	const { inUse: thinking, reserveWhile: thinkWhile } = useInUse();

	useEffect(() => {
		thinkWhile(() => awaitTime(1000));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<AppContext thinkWhile={thinkWhile} thinking={thinking}>
			<div className={clsx("App", className, classes.root, thinking && classes["root--thinking"])}>
				<Homepage />
			</div>
		</AppContext>
	);
});
