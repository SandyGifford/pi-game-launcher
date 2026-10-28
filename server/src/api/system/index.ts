import express from "express";
import { restart, shutdown } from "../../utils.ts";
import { updateApi } from "./update.api.ts";
import { wifiApi } from "./wifi.api.ts";

export const systemApi = express();

systemApi.use("/update", updateApi);
systemApi.use("/wifi", wifiApi);

systemApi.post("/shutdown", shutdown);
systemApi.post("/restart", restart);
