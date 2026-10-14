import { launchProcess, update } from "@repo/shared-node";

// A failed update must never keep the device from starting the last working build.
try {
	await update();
} catch (error) {
	console.error("Update failed, starting the current build:", error);
}

await launchProcess("npm", ["run", "pm2:start"]);
