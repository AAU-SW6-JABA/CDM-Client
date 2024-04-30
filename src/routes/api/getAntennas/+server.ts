import type { RequestHandler } from "./$types";
import type { RoutesClient } from "../../../../gen/protobuf/cdm_protobuf/Routes.ts";
import type { GetAntennasResponse__Output } from "../../../../gen/protobuf/cdm_protobuf/GetAntennasResponse";
import { json } from "@sveltejs/kit";
import { URLParams } from "$lib/urlSearchParams";
import { createClient } from "$lib/grpcClient";
import {
	type AntennaResponseBody,
	type AntennaArray,
	ZodResponseBody,
} from "$lib/schemas/zodSchemes";

enum RequestStateEnum {
	INIT = 0,
	ERROR = 1,
}

class RequestState {
	private state: RequestStateEnum;
	private message: string | undefined;

	constructor(state: RequestStateEnum, message?: string) {
		this.state = state;
		if (message) this.message = message;
	}

	setState(state: RequestStateEnum, message?: string) {
		this.state = state;
		if (message) this.message = message;
	}

	getState(): { state: RequestStateEnum; message?: string } {
		return { state: this.state, message: this.message };
	}
}

export const POST: RequestHandler = async ({ request }) => {
	const requestState = new RequestState(RequestStateEnum.INIT);
	const response: AntennaArray = [];

	const url = new URL(request.url);
	const serverURL = url.searchParams.get(URLParams.serverUrl);

	let client: RoutesClient;

	if (serverURL === null) {
		requestState.setState(
			RequestStateEnum.ERROR,
			"Invalid request parameters",
		);
		return createResponse(requestState, response);
	}

	try {
		client = await createClient(serverURL);
	} catch (error) {
		requestState.setState(
			RequestStateEnum.ERROR,
			`Unable to create gRPC client for CDM-Server on ${serverURL}`,
		);
		return createResponse(requestState, response);
	}

	try {
		const getAntennas = () => {
			return new Promise<void>((resolve, reject) => {
				client.GetAntennasRoute(
					{},
					(
						err: Error | null,
						val: GetAntennasResponse__Output | undefined,
					) => {
						if (err !== null) {
							requestState.setState(
								RequestStateEnum.ERROR,
								`Error while fetching data: ${err.message}`,
							);
							reject(err);
						} else {
							for (const antenna of val?.antenna || []) {
								if (
									antenna.aid !== undefined &&
									antenna.x !== undefined &&
									antenna.y !== undefined
								) {
									response.push({
										aid: antenna.aid,
										x: antenna.x,
										y: antenna.y,
									});
								}
							}

							resolve();
						}
					},
				);
			});
		};

		await getAntennas();
	} catch (error) {
		requestState.setState(
			RequestStateEnum.ERROR,
			`Error while connecting to gRPC server: ${error}`,
		);
		return createResponse(requestState, response);
	}

	if (requestState.getState().state === RequestStateEnum.ERROR) {
		return createResponse(requestState, response);
	}

	return createResponse(requestState, response);
};

function createResponse(
	requestState: RequestState,
	response: AntennaResponseBody,
): Response {
	if (requestState.getState().state === RequestStateEnum.ERROR) {
		const response = ZodResponseBody.parse({
			error: requestState.getState().message,
		});
		return json(response, { status: 400 });
	}
	return json(response, { status: 200 });
}
