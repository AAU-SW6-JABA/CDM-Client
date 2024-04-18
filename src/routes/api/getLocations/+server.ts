import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

import { client } from "$lib/grpcClient";

export const POST: RequestHandler = async ({ request }) => {
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
