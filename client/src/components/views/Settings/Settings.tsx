import type { FC } from "react";
import { memo } from "react";
import classes from "./Settings.module.scss";
import clsx from "clsx";
import { useQuery } from "@tanstack/react-query";
import { getWifiList } from "../../../api";
import { BTR } from "../../ui/BTR/BTR";
import { Signal } from "../../Signal/Signal";

export type SettingsProps = {
	readonly className?: string;
};

export const Settings: FC<SettingsProps> = memo(({ className }) => {
	const { data } = useQuery({
		queryKey: ["wifi-list"],
		queryFn: getWifiList,
		retry: false,
	});

	return (
		<div className={clsx("Settings", className, classes.root)}>
			<table>
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
									<td>{inUse && "v"}</td>
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
		</div>
	);
});
