/* global module */
module.exports = {
	apps: [
		{
			name: "pi-game-launcher",
			cwd: "./server",
			script: "src/main.ts",
			interpreter: "node",
			node_args: ["--env-file-if-exists=../.env.defaults", "--env-file-if-exists=../.env"],
			autorestart: true,
		},
	],
};
