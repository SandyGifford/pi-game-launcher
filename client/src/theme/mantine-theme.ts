import { Button, createTheme, Loader, type MantineColorsTuple } from "@mantine/core";
import clsx from "clsx";
import { ButtonRoot } from "../components/ui/ButtonRoot/ButtonRoot";
import { CustomLoader } from "../components/ui/CustomLoader/CustomLoader";
import buttonClasses from "./Button.module.scss";

const button = Button.extend({
	classNames: (_theme, props) => ({
		root: clsx(buttonClasses.root, props.disabled && buttonClasses.disabled),
	}),
	defaultProps: {
		component: ButtonRoot,
		variant: "filled",
		size: "md",
	},
	vars: (_theme, props) => ({
		root:
			props.variant === "subtle"
				? {}
				: {
						"--button-height": "48px",
						"--button-padding-x": "calc(var(--mantine-spacing-sm) * 2)",
						"--button-fz": "1rem",
						"--button-radius": "var(--mantine-radius-default)",
						"--button-color": "var(--mantine-color-white)",
						"--button-bd": "1px outset var(--button-bg)",
					},
	}),
});

const loader = Loader.extend({
	defaultProps: {
		color: "pop",
		size: "1em",
		type: "launcher",
		loaders: {
			...Loader.defaultLoaders,
			launcher: CustomLoader,
		},
	},
});

const surface: MantineColorsTuple = [
	"#777799",
	"#6e6e92",
	"#67678a",
	"#616181",
	"#5a5a78",
	"#545470",
	"#4d4d67",
	"#47475e",
	"#404055",
	"#333344",
];

const dark: MantineColorsTuple = [
	"#777799",
	"#6e6e92",
	"#67678a",
	"#616181",
	"#5a5a78",
	"#545470",
	"#4d4d67",
	"#47475e",
	"#333344",
	"#181820",
];

const pop: MantineColorsTuple = [
	"#ffdb99",
	"#ffd07a",
	"#ffc55c",
	"#ffbb3d",
	"#ffb01f",
	"#ffa500",
	"#e09100",
	"#c27d00",
	"#a36a00",
	"#664200",
];

const control: MantineColorsTuple = [
	"#7a7a9e",
	"#65658a",
	"#5b5b7c",
	"#4e4e6b",
	"#36364a",
	"#1e1e29",
	"#191922",
	"#13131b",
	"#101016",
	"#0e0e12",
];

export const mantineTheme = createTheme({
	fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
	primaryColor: "pop",
	primaryShade: { light: 5, dark: 5 },
	colors: {
		dark,
		surface,
		pop,
		control,
	},
	defaultRadius: "16px",
	spacing: {
		xs: "4px",
		sm: "8px",
		md: "12px",
		lg: "16px",
		xl: "24px",
	},
	components: {
		Button: button,
		Loader: loader,
	},
});
