import type { FC } from "react";
import { memo } from "react";
import classes from "./Settings.module.scss";
import clsx from "clsx";
import { useQuery } from "@tanstack/react-query";
import { getWifiList } from "../../../api";
import { ButtonTableRow } from "../../ui/ButtonTableRow/ButtonTableRow";

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
						<th>SSID</th>
					</tr>
				</thead>
				<tbody>
					{data?.map(
						({ ssid, bssid, hidden, inUse }) =>
							!hidden && (
								<ButtonTableRow key={bssid}>
									<td>{inUse && "v"}</td>
									<td>{ssid}</td>
								</ButtonTableRow>
							)
					)}
				</tbody>
			</table>
		</div>
	);
});
