import { launchProcess } from "./utils.ts";

export const npmInstall = () => launchProcess("npm", ["i"]);
export const npmBuild = () => launchProcess("npm", ["run", "build"]);
export const updateFromNpm = async () => {
	await npmInstall();
	return await npmBuild();
};
