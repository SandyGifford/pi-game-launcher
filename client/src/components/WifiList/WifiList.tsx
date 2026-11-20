import type { FC } from "react";
import { memo } from "react";
import classes from "./WifiList.module.scss";
import clsx from "clsx";
import { Signal } from "../Signal/Signal";
import { BTR } from "../ui/BTR/BTR";
import { useQuery } from "@tanstack/react-query";
import { getWifiList } from "../../api";
import { TransitionGroup } from "react-transition-group";
import { AutoRefTransition } from "../ui/AutoRefTransition/AutoRefTransition";

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
		<table className={clsx("WifiList", className, classes.root)}>
			<thead>
				<tr>
					<th></th>
					<th>name</th>
					<th>security</th>
					<th></th>
				</tr>
			</thead>
			<TransitionGroup component="tbody">
				{data
					?.filter(({ hidden }) => !hidden)
					.map(({ ssid, bssid, inUse, security, signal }) => (
						<AutoRefTransition timeout={500} key={bssid}>
							{(state) => (
								<BTR className={classes[`row--${state}`]}>
									<td>
										<div>{inUse && "•"}</div>
									</td>
									<td>
										<div>{ssid}</div>
									</td>
									<td>
										<div>{security}</div>
									</td>
									<td>
										<div>
											<Signal strength={signal} />
										</div>
									</td>
								</BTR>
							)}
						</AutoRefTransition>
					))}
			</TransitionGroup>
		</table>
	);
});
