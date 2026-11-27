import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import { View } from "./View";
import {
	ViewProvider,
	useMarkViewAsReady,
	useViewThinking,
} from "./View.ctx";

it("keeps unready view content mounted but inert", () => {
	const html = renderToStaticMarkup(<View>{(status) => <span>content: {status}</span>}</View>);

	expect(html).toContain("inert");
	expect(html).toContain("content: exited");
	expect(html.match(/<div\b/g)).toHaveLength(1);
});

it("provides readiness and thinking values together", () => {
	const markViewAsReady = vi.fn();
	const setCurrentThinkingId = vi.fn();
	const readContexts = vi.fn();
	const Consumer = () => {
		readContexts(useMarkViewAsReady(), useViewThinking());
		return null;
	};

	renderToStaticMarkup(
		<ViewProvider
			markViewAsReady={markViewAsReady}
			currentThinkingId="launch"
			setCurrentThinkingId={setCurrentThinkingId}
		>
			<Consumer />
		</ViewProvider>
	);

	expect(readContexts).toHaveBeenCalledWith(
		markViewAsReady,
		{ currentThinkingId: "launch", setCurrentThinkingId }
	);
});
