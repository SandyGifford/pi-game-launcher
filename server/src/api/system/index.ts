import express from "express";
import { restart, shutdown } from "../../utils.ts";
import { updateApi } from "./update.api.ts";

export const systemApi = express();

systemApi.use("/update", updateApi);

systemApi.post("/shutdown", shutdown);
systemApi.post("/restart", restart);
