import express from "express";

export const systemUpdateApi = express();

// eventually this will check for system updates
systemUpdateApi.get("/needs", async (req, res) => res.send(false));

// eventually this will run system updates
systemUpdateApi.post("/", async (req, res) => res.send());
