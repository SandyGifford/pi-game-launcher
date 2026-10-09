import { APIError } from "./errors.ts";
import { launchProcess } from "./utils.ts";

export class GitError extends APIError {}
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
	const [, aheadStr, behindStr] =
		stdout.match(/\[(?:(?:ahead (\d)(?:, )?)?(?:behind (\d))?)\]$/) || [];
	const ahead = Number(aheadStr);
	const behind = Number(behindStr);
	if (!isNaN(ahead) && ahead) throw new GitAheadError(ahead);
	const [goneStr] = stdout.match(/\[gone\]$/) || [];
	const gone = !!goneStr;
	if (gone) throw new GitRepoGoneError();
	return !!behind;
};
export const gitPull = async () => {
	await gitFetch();
	return launchProcess("git", ["pull"]);
};

export const updateFromGit = async () => {
	const behind = await gitIsBehind();
	if (!behind) return;
	await gitPull();
};
