import { get, writable, type Writable } from "svelte/store";
import { createClient } from "$lib/grpcClient";
import type { ClientReadableStream } from "@grpc/grpc-js";
import type { Locations__Output } from "../../gen/protobuf/cdm_protobuf/Locations";
import type { RoutesClient } from "../../gen/protobuf/cdm_protobuf/Routes";

export const clientControllers: Writable<
	Map<string, Set<ReadableStreamDefaultController<Uint8Array>>>
> = writable(new Map());

const databases: Map<
	string,
	{
		client: RoutesClient;
		stream: ClientReadableStream<Locations__Output>;
	}
> = new Map();

clientControllers.subscribe(async (map) => {
	for (const [serverUrl, set] of map) {
		const database = databases.get(serverUrl);
		if (set.size === 0) {
			if (database) {
				database.stream.destroy();
				database.client.close();
				databases.delete(serverUrl);
			}
		} else {
			if (!database) {
				const sendDataToClients = (data: Locations__Output) => {
					const encoder = new TextEncoder();
					const eventData = encoder.encode(
						`event: locations\ndata:${JSON.stringify(data)}\n\n`,
					);
					const controllers =
						get(clientControllers).get(serverUrl) ?? new Set();
					for (const clientController of controllers) {
						try {
							clientController.enqueue(eventData);
						} catch (error) {
							controllers.delete(clientController);
							clientControllers.update((map) => map);
						}
					}
				};

				console.log(`Connecting to grpc db at ${serverUrl}`);
				const client = await createClient(serverUrl);
				const stream = client.SubscribeToLocations({});
				stream.addListener("data", (data: Locations__Output) => {
					sendDataToClients(data);
				});
				databases.set(serverUrl, {
					client,
					stream,
				});
			}
		}
	}
});
