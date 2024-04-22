import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { URLParams } from "$lib/urlSearchParams";
import { createClient } from "$lib/grpcClient";
import type { GetLocationsResponse__Output } from "../../../../gen/protobuf/cdm_protobuf/GetLocationsResponse";

export const POST: RequestHandler = async ({ request }) => {
	const url = new URL(request.url);
	const serverURL = url.searchParams.get(URLParams.serverUrl);
	const timeIntervalBegin = url.searchParams.get(URLParams.timeIntervalBegin);
	const timeIntervalEnd = url.searchParams.get(URLParams.timeIntervalEnd);

	if (serverURL === "undefined" || serverURL === null ||timeIntervalBegin === "undefined" || timeIntervalBegin === null || timeIntervalEnd === "undefined" || timeIntervalEnd === null) {
		return json({ error: "No server URL provided" }, { status: 400 });
	}

	try {
		const client = await createClient(serverURL);
		client.GetLocationsRoute(
			{},
			(
				err: Error | null,
				val: GetLocationsResponse__Output | undefined,
			) => {
				val?
			},
		);
	} catch (error) {
		return json(
			{ error: "Unable to connect to CDM-Server" },
			{ status: 400 },
		);
	}

	console.log("Client created");
	return json([], { status: 400 });

	/*
	const response = [
		{ x: 2, y: 1 },
		{ x: 3, y: 4 },
		{ x: 90, y: 90 },
		{ x: 70, y: 900 },
		{ x: 300, y: 300 },
		{ x: 900, y: 100 },
	];
	return json(response);*/
};
