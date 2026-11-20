import { useQuery } from "@tanstack/react-query";
import { Button } from "@mantine/core";
import clsx from "clsx";
import type { FC } from "react";
import { memo } from "react";
import { getWifiList } from "../../api";
import { AnimatedList } from "../animated-list/components/AnimatedList/AnimatedList";
import { AnimatedListItem } from "../animated-list/components/AnimatedListItem/AnimatedListItem";
import classes from "./WifiList.module.scss";
import { Signal } from "../Signal/Signal";
import { Loading } from "../ui/Loading/Loading";

export type WifiListProps = {
	readonly className?: string;
};

export const WifiList: FC<WifiListProps> = memo(({ className }) => {
	const { data, isFetching } = useQuery({
		queryKey: ["wifi-list"],
		queryFn: getWifiList,
		refetchOnMount: true,
		refetchOnWindowFocus: true,
		refetchInterval: 10000,
	});

	return (
		<div className={clsx("WifiList", className, classes.root)}>
			<h1 className={clsx(classes.header, isFetching && classes["header--loading"])}>
				<span className={classes.header__text}>Available WiFi networks</span>{" "}
				<Loading className={clsx(classes.header__loader)} stop={!isFetching} />
			</h1>
			<AnimatedList>
				{data
					?.filter(({ hidden }) => !hidden)
					.map(({ ssid, bssid, inUse, security, signal }) => (
						<AnimatedListItem key={bssid}>
							<Button
								variant="subtle"
								className={classes.network}
								classNames={{
									inner: classes.network__inner,
									label: classes.network__label,
								}}
							>
								<div className={classes.inUse}>{inUse && "•"}</div>
								<div className={classes.ssid}>{ssid}</div>
								<div className={classes.security}>{security.length ? "🔒" : undefined}</div>
								<Signal className={classes.signal} strength={signal} />
							</Button>
						</AnimatedListItem>
					))}
			</AnimatedList>
		</div>
	);
});
