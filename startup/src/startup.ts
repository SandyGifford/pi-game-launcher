import { launchProcess, update } from "@repo/shared-node";

await update();
await launchProcess("npm", ["run", "pm2:start"]);
