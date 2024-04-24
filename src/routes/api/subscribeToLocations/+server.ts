import type { RequestHandler } from "./$types";
import { URLParams } from "$lib/urlSearchParams";
import { clientControllers } from "$lib/grpcLiveConnections.server";

export const GET: RequestHandler = ({ request }) => {
	let controller: ReadableStreamDefaultController<Uint8Array>;

	const url = new URL(request.url);
	const serverURL = url.searchParams.get(URLParams.serverUrl);
	if (!serverURL) {
		throw new Error(
			"TODO: sorry bastian my error handling is peepeepoopoo please dont get mad at me",
		);
	}

	return new Response(
		new ReadableStream({
			start: (controller) => {
				clientControllers.update((map) => {
					if (!map.has(serverURL)) {
						map.set(serverURL, new Set());
					}
					const set = map.get(serverURL)!;
					set.add(controller);
					return map;
				});
			},
			cancel: () => {
				if (controller) {
					clientControllers.update((map) => {
						const set = map.get(serverURL);
						set?.delete(controller);
						return map;
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
