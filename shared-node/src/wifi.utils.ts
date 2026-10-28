import type { BSSID, SSID, WifiAccessPoint, WifiSecurity } from "@repo/shared";
import { launchProcess } from "./utils.ts";

export const isSSID = (val: unknown): val is SSID => typeof val === "string";
export const isWifiSecurity = (val: unknown): val is WifiSecurity => typeof val === "string";
export const isBSSID = (val: unknown): val is BSSID =>
	typeof val === "string" && /^(?:[0-9a-f]{2}:){5}[0-9a-f]{2}$/i.test(val);
const capSignal = (val: unknown): number => {
	const num = (() => {
		switch (typeof val) {
			case "string":
				return Number(val);
			case "number":
				return val;
			default:
				return 0;
		}
	})();

	if (isNaN(num)) return 0;
	return Math.min(100, Math.max(0, num)) / 100;
};

export const getWifiList = async (): Promise<readonly WifiAccessPoint[]> => {
	const collected = new Map<SSID | object, WifiAccessPoint>();

	(
		await launchProcess("nmcli", [
			"-t",
			"-f",
			"IN-USE,BSSID,SSID,SIGNAL,SECURITY",
			"dev",
			"wifi",
			"list",
		])
	).stdout
		.split("\n")
		.forEach((line) => {
			const [inUseStr = "", bssidStr, ssid, signalStr = "0", securityStr] = line
				.split(/(?<!\\):/)
				.map((s) => s.trim());

			const security = (securityStr ? securityStr.split(" ") : []).filter((sec) =>
				isWifiSecurity(sec)
			);
			const bssid = bssidStr?.replace(/\\:/g, ":");

			if (!isSSID(ssid)) return;
			if (!isBSSID(bssid)) return;
			// if the raw string indicated SOME sort of security, but we couldn't
			// find a valid value in there, consider the AP invalid:  we're
			// reporting a network without giving consumers enough data to connect
			if (!!securityStr?.length && !security.length) return;

			const hidden = ssid === "";
			const signal = capSignal(signalStr);
			const inUse = inUseStr === "*";

			const ap: WifiAccessPoint = {
				inUse,
				bssid,
				hidden,
				ssid,
				signal,
				security,
				matchingSsids: [],
			};

			const key = hidden ? {} : ssid;
			const existing = collected.get(key);
			if (existing) {
				collected.set(key, { ...existing, matchingSsids: [...existing.matchingSsids, ap] });
			} else collected.set(key, ap);
		});

	return [...collected.values()];
};
