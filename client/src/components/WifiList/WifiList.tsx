import { Button, Loader } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import type { FC } from "react";
import { memo } from "react";
import { getWifiList } from "../../api";
import { AnimatedList } from "../animated-list/components/AnimatedList/AnimatedList";
import { AnimatedListItem } from "../animated-list/components/AnimatedListItem/AnimatedListItem";
import { Signal } from "../Signal/Signal";
import { IconLock } from "@tabler/icons-react";
import classes from "./WifiList.module.scss";

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
				<Loader className={clsx(classes.header__loader)} size="sm" />
			</h1>
			<AnimatedList>
				{data
					?.filter(({ hidden }) => !hidden)
					.map(({ ssid, bssid, inUse, security, signal }) => (
						<AnimatedListItem key={bssid}>
							<Button variant="subtle">
								<div className={classes.inUse}>{inUse && "•"}</div>
								<div className={classes.ssid}>{ssid}</div>
								<div className={classes.security}>{security.length ? <IconLock size="small" stroke={1} /> : undefined}</div>
								<Signal className={classes.signal} strength={signal} />
							</Button>
						</AnimatedListItem>
					))}
			</AnimatedList>
		</div>
	);
});
