import { get, writable, type Writable } from "svelte/store";

import { client } from "$lib/grpcClient";
import type { ClientReadableStream } from "@grpc/grpc-js";
import type { Locations__Output } from "../../gen/protobuf/cdm_protobuf/Locations";

export const clientControllers: Writable<
	Set<ReadableStreamDefaultController<Uint8Array>>
> = writable(new Set());

let clientController: ClientReadableStream<Locations__Output> | undefined;

clientControllers.subscribe((set) => {
	console.log(set);
	if (set.size === 0) {
		if (clientController) {
			clientController.destroy();
			clientController = undefined;
		}
	} else {
		if (!clientController) {
			console.log("Connecting to grpc db");
			clientController = client.SubscribeToLocations({});
			bindStream(clientController);
		}
	}
});

function bindStream(stream: ClientReadableStream<Locations__Output>): void {
	stream.addListener("data", (data) => {
		console.log(data);
		sendDataToClients(data);
	});
}

function sendDataToClients(data) {
	const encoder = new TextEncoder();
	const eventData = encoder.encode(
		`event: locations\ndata:${JSON.stringify(data)}\n\n`,
	);
	for (const clientController of get(clientControllers)) {
		clientController.enqueue(eventData);
	}
}
