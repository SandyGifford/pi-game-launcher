import express from "express";

export const updateApi = express();

// eventually this will check for system updates
updateApi.get("/needs", async (req, res) => res.send(false));

// eventually this will run system updates
updateApi.post("/", async (req, res) => res.send());
