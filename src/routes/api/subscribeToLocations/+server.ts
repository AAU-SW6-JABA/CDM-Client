import type { RequestHandler } from "./$types";
import { clientControllers } from "$lib/grpcLiveConnections.server";

export const GET: RequestHandler = () => {
	let controller: ReadableStreamDefaultController<Uint8Array>;

	return new Response(
		new ReadableStream({
			start: (controller) => {
				clientControllers.update((set) => {
					set.add(controller);
					return set;
				});
			},
			cancel: () => {
				if (controller) {
					clientControllers.update((set) => {
						set.delete(controller);
						return set;
					});
				}
			},
		}),
		{
			// These headers are important for the browser to detect an SSE request
			headers: {
				"Content-Type": "text/event-stream",
				Connection: "keep-alive",
				"Cache-Control": "no-cache",
			},
		},
	);
};
