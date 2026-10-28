import express from "express";
import { getWifiList } from "@repo/shared-node";

export const wifiApi = express();

wifiApi.get("/list", async (req, res) => res.send(await getWifiList()));
