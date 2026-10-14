import { launchProcess } from "./utils.ts";

export class GitError extends Error {}
export class GitAheadError extends GitError {
	public readonly aheadCount: number;

	constructor(aheadCount: number) {
		super(`Repo is ahead by ${aheadCount} commit(s)`);
		this.aheadCount = aheadCount;
	}
}
export class GitRepoGoneError extends GitError {
	constructor() {
		super("Could not find upstream repo");
	}
}

export const gitFetch = () => launchProcess("git", ["fetch"]);
export const gitIsBehind = async () => {
	await gitFetch();
	const { stdout } = await launchProcess("git", ["status", "-sb"]);
	const status = stdout.trimEnd();
	const [, aheadStr, behindStr] =
		status.match(/\[(?:(?:ahead (\d+)(?:, )?)?(?:behind (\d+))?)\]$/) || [];
	const ahead = Number(aheadStr);
	const behind = Number(behindStr);
	if (!isNaN(ahead) && ahead) throw new GitAheadError(ahead);
	const [goneStr] = status.match(/\[gone\]$/) || [];
	const gone = !!goneStr;
	if (gone) throw new GitRepoGoneError();
	return !!behind;
};
export const getHeadSha = async () =>
	(await launchProcess("git", ["rev-parse", "HEAD"])).stdout.trim();
export const gitPull = async () => {
	await gitFetch();
	return launchProcess("git", ["pull"]);
};

export const updateFromGit = async (): Promise<boolean> => {
	const behind = await gitIsBehind();
	if (!behind) return false;
	await gitPull();
	return true;
};
