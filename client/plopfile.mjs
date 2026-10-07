import path from "node:path";

export default function (plop) {
	const invokedDir = process.env.INIT_CWD ?? process.cwd();
	const componentsDir = path.join(import.meta.dirname, "src/components");
	const isInsideComponents =
		invokedDir === componentsDir || invokedDir.startsWith(componentsDir + path.sep);
	const destDir = isInsideComponents ? invokedDir : componentsDir;

	plop.setGenerator("component", {
		description: "React component with a co-located module.scss",
		prompts: [
			{
				type: "input",
				name: "name",
				message: "Component name (PascalCase):",
			},
		],
		actions: [
			{
				type: "add",
				path: path.join(destDir, "{{name}}/{{name}}.tsx"),
				templateFile: "plop-templates/component.tsx.hbs",
			},
			{
				type: "add",
				path: path.join(destDir, "{{name}}/{{name}}.module.scss"),
				templateFile: "plop-templates/component.module.scss.hbs",
			},
		],
	});
}
