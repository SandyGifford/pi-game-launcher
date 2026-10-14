import { app } from "./app.ts";

const port = Number(process.env["PORT"] ?? 3000);

/* const server =  */ app.listen(port, () => {
	console.log(`Server listening on port ${port}`);
});
