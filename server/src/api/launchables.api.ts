import express from "express";
import { LAUNCHABLES, LAUNCHABLES_MAP } from "../consts.ts";
import { isLaunchableId, launch } from "../utils.ts";

export const launchablesApi = express();

launchablesApi.post("/:id/launch", async (req, res) => {
  const res500 = (message: string) => res.status(500).send({ type: "ERROR", message });

  const id = req.params.id;
  if (!isLaunchableId(id)) {
    res500(`Invalid ID: ${id}`);
    return;
  }

  const launchable = LAUNCHABLES_MAP[id];

  // this shouldn't be possible, but it keeps TypeScript happy
  if (!launchable) {
    res500(`Could not find Launchable: ${id}`);
    return;
  }

  res.send(await launch(launchable));
});

launchablesApi.get("/", async (req, res) => res.send(LAUNCHABLES));
