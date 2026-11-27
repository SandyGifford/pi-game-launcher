import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { ViewProvider } from "../../View/View.ctx";
import { ButtonRoot } from "./ButtonRoot";
import classes from "./ButtonRoot.module.scss";

it.each(["entering", "exiting"] as const)(
	"adds the %s transition status to the button",
	(status) => {
		const html = renderToStaticMarkup(
			<ViewProvider
				isReady={status === "entering"}
				status={status}
				markViewAsReady={() => void 0}
				currentThinkingId={undefined}
				setCurrentThinkingId={() => void 0}
			>
				<ButtonRoot>button</ButtonRoot>
			</ViewProvider>
		);

		expect(html).toContain(classes[`root--${status}`]);
	}
);
