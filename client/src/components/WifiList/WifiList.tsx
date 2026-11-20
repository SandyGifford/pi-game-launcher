import type { FC } from "react";
import { memo } from "react";
import classes from "./WifiList.module.scss";
import clsx from "clsx";
import { Signal } from "../Signal/Signal";
import { BTR } from "../ui/BTR/BTR";
import { useQuery } from "@tanstack/react-query";
import { getWifiList } from "../../api";

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
			<tbody>
				{data?.map(
					({ ssid, bssid, hidden, inUse, security, signal }) =>
						!hidden && (
							<BTR key={bssid}>
								<td>{inUse && "•"}</td>
								<td>{ssid}</td>
								<td>{security}</td>
								<td>
									<Signal strength={signal} />
								</td>
							</BTR>
						)
				)}
			</tbody>
		</table>
	);
});
