import express from "express";
import { launchablesApi } from "./launchables.api.ts";
import { systemApi } from "./system/index.ts";

export const api = express();

api.use("/launchables", launchablesApi);
api.use("/system", systemApi);
