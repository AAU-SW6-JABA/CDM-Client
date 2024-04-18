import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { URLParams } from "$lib/urlSearchParams";
import { createClient } from "$lib/grpcClient";

export const POST: RequestHandler = async ({ request }) => {
	const url = new URL(request.url);
	const serverURL = url.searchParams.get(URLParams.serverUrl);

	console.log(`Server url: ${serverURL}. Type: ${typeof serverURL}`);

	if (serverURL === "undefined" || serverURL === null) {
		return json({ error: "No server URL provided" }, { status: 400 });
	}

	try {
		const client = await createClient(serverURL);
	} catch (error) {}

	console.log("Client created");

	const response = [
		{ x: 2, y: 1 },
		{ x: 3, y: 4 },
		{ x: 90, y: 90 },
		{ x: 70, y: 900 },
		{ x: 300, y: 300 },
		{ x: 900, y: 100 },
	];
	return json(response);
};
