import { resolve } from "node:path";

export const ROOT_DIR = resolve(import.meta.dirname, "../../");
export const SERVER_DIR = resolve(ROOT_DIR, "server");
export const CLIENT_DIR = resolve(ROOT_DIR, "client");
export const CLIENT_DIST_DIR = resolve(CLIENT_DIR, "dist");
export const SHELL_SCRIPTS_DIR = resolve(SERVER_DIR, "shell-scripts");
export const STATIC_DIR = resolve(SERVER_DIR, "static");
