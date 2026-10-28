import express from "express";
import { restart, shutdown } from "../../utils.ts";
import { systemUpdateApi } from "./update.api.ts";

export const systemApi = express();

systemApi.use("/update", systemUpdateApi);

systemApi.post("/shutdown", shutdown);
systemApi.post("/restart", restart);
