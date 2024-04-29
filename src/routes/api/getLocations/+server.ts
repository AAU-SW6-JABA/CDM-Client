import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { URLParams } from "$lib/urlSearchParams";
import { createClient } from "$lib/grpcClient";
import type { RoutesClient } from "../../../../gen/protobuf/cdm_protobuf/Routes.ts";
import type { GetLocationsResponse__Output } from "../../../../gen/protobuf/cdm_protobuf/GetLocationsResponse";
import {
	type ResponseBody,
	type LocationArray,
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
	const response: LocationArray = [];

	const url = new URL(request.url);
	const serverURL = url.searchParams.get(URLParams.serverUrl);
	const timeIntervalBegin = url.searchParams.get(URLParams.timeIntervalBegin);
	const timeIntervalEnd = url.searchParams.get(URLParams.timeIntervalEnd);

	let client: RoutesClient;

	if (
		serverURL == null ||
		timeIntervalBegin == null ||
		timeIntervalEnd == null
	) {
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
		const getLocations = () => {
			return new Promise<void>((resolve, reject) => {
				client.GetLocationsRoute(
					{ timeBegin: timeIntervalBegin, timeEnd: timeIntervalEnd },
					(
						err: Error | null,
						val: GetLocationsResponse__Output | undefined,
					) => {
						if (err !== null) {
							requestState.setState(
								RequestStateEnum.ERROR,
								`Error while fetching data: ${err.message}`,
							);
							reject(err);
						} else {
							val?.location?.forEach((location) => {
								if (
									location.identifier &&
									location.calctime &&
									location.x &&
									location.y
								)
									response.push({
										identifier: location.identifier,
										calctime: location.calctime,
										x: location.x,
										y: location.y,
									});
							});

							resolve();
						}
					},
				);
			});
		};

		await getLocations();
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
	response: ResponseBody,
): Response {
	if (requestState.getState().state === RequestStateEnum.ERROR) {
		const response = ZodResponseBody.parse({
			error: requestState.getState().message,
		});
		return json(response, { status: 400 });
	}
	return json(response, { status: 200 });
}
