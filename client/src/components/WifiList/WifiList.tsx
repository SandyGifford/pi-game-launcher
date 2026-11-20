import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import type { FC } from "react";
import { memo } from "react";
import { getWifiList } from "../../api";
import { AnimatedList } from "../animated-list/components/AnimatedList/AnimatedList";
import { AnimatedListItem } from "../animated-list/components/AnimatedListItem/AnimatedListItem";
import classes from "./WifiList.module.scss";
import { Signal } from "../Signal/Signal";

export type WifiListProps = {
	readonly className?: string;
};

export const WifiList: FC<WifiListProps> = memo(({ className }) => {
	const { data } = useQuery({
		queryKey: ["wifi-list"],
		queryFn: getWifiList,
		retry: false,
	});

	return (
		<AnimatedList className={clsx("WifiList", className, classes.root)}>
			{data
				?.filter(({ hidden }) => !hidden)
				.map(({ ssid, bssid, inUse, security, signal }) => (
					<AnimatedListItem key={bssid}>
						<button className={clsx("no-theme", classes.network)}>
							<div className={classes.inUse}>{inUse && "•"}</div>
							<div className={classes.ssid}>{ssid}</div>
							<div className={classes.security}>{security.length ? "🔒" : undefined}</div>
							<Signal className={classes.signal} strength={signal} />
						</button>
					</AnimatedListItem>
				))}
		</AnimatedList>
	);
});
