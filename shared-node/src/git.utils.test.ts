import { beforeEach, describe, expect, it, vi } from "vitest";

const { launchProcess } = vi.hoisted(() => ({ launchProcess: vi.fn() }));
vi.mock("./utils.ts", () => ({ launchProcess }));

import { gitIsBehind } from "./git.utils.ts";

describe("gitIsBehind", () => {
	beforeEach(() => launchProcess.mockReset());

	it("recognizes multi-digit behind counts", async () => {
		launchProcess
			.mockResolvedValueOnce({ stdout: "", stderr: "", code: 0 })
			.mockResolvedValueOnce({
				stdout: "## main...origin/main [behind 10]\n",
				stderr: "",
				code: 0,
			});

		await expect(gitIsBehind()).resolves.toBe(true);
	});
});
