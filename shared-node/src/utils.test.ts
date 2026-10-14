import { describe, expect, it } from "vitest";
import { launchProcess } from "./utils.ts";

describe("launchProcess", () => {
	it("returns output from a successful command", async () => {
		const result = await launchProcess(process.execPath, [
			"-e",
			"process.stdout.write(\"complete\")",
		]);

		expect(result).toEqual({ stdout: "complete", stderr: "", code: 0 });
	});

	it("rejects when a command exits unsuccessfully", async () => {
		await expect(
			launchProcess(process.execPath, [
				"-e",
				"process.stderr.write(\"failed\"); process.exit(7)",
			])
		).rejects.toThrow(/failed with exit code 7:\nfailed/);
	});
});
