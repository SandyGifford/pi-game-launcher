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
