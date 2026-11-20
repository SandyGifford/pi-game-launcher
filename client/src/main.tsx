import "@mantine/core/styles.css";

import { MantineProvider } from "@mantine/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./components/App/App";
import { mantineTheme } from "./theme/mantine-theme";

import "./styles.scss";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<MantineProvider theme={mantineTheme} forceColorScheme="dark">
			<QueryClientProvider client={queryClient}>
				<App />
			</QueryClientProvider>
		</MantineProvider>
	</StrictMode>
);
