import { Button, MantineProvider } from "@mantine/core";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import buttonClasses from "./Button.module.scss";
import { mantineTheme } from "./mantine-theme";

it("applies the shared button class alongside component-specific classes", () => {
	const html = renderToStaticMarkup(
		<MantineProvider theme={mantineTheme} env="test">
			<Button classNames={{ root: "custom-root" }}>Launch</Button>
		</MantineProvider>
	);

	expect(html).toContain(buttonClasses.root);
	expect(html).toContain("custom-root");
});

it("uses Mantine button colors while allowing per-button variable overrides", () => {
	const html = renderToStaticMarkup(
		<MantineProvider theme={mantineTheme} env="test">
			<Button color="red" vars={() => ({ root: { "--button-height": "60px" } })}>
				Launch
			</Button>
			<Button color="blue">Blue</Button>
			<Button vars={() => ({ root: { "--button-bg": "rebeccapurple" } })}>Custom</Button>
		</MantineProvider>
	);

	expect(html).toContain("--button-height:60px");
	expect(html).toContain("--button-bg:var(--mantine-color-red-filled)");
	expect(html).toContain("--button-bg:var(--mantine-color-blue-filled)");
	expect(html).toContain("--button-bg:rebeccapurple");
	expect(html).not.toContain("linear-gradient");
});

it("keeps subtle and loading buttons distinct from explicitly disabled buttons", () => {
	const html = renderToStaticMarkup(
		<MantineProvider theme={mantineTheme} env="test">
			<Button variant="subtle">Subtle</Button>
			<Button loading>Loading</Button>
			<Button disabled>Disabled</Button>
		</MantineProvider>
	);
	const buttons = html.match(/<button[^>]*>/g) ?? [];

	expect(buttons).toHaveLength(3);
	expect(buttons[0]).toContain('data-variant="subtle"');
	expect(buttons[0]).not.toContain("--button--background-");
	expect(buttons[1]).not.toContain(buttonClasses.disabled);
	expect(buttons[2]).toContain(buttonClasses.disabled);
});
