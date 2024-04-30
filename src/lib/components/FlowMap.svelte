<script lang="ts">
	import type { Location, LocationArray } from "$lib/schemas/zodSchemes";
	import debounceFn from "debounce-fn";
	import FlowNode from "./FlowNode.svelte";

	export let locations: LocationArray;

	let flowNodes: { from: Location; to: Location }[] = [];

	const drawLocationsDebounced = debounceFn(drawLocations, { wait: 1000 });
	$: drawLocationsDebounced(locations);

	function drawLocations(locations?: LocationArray) {
		if (!locations) {
			return;
		}

		const newFlowNodes: Map<string, { from: Location; to: Location }> =
			new Map();
		for (const location of locations) {
			if (newFlowNodes.has(location.identifier)) {
				const entry = newFlowNodes.get(location.identifier)!;
				if (location.calctime < entry.from.calctime) {
					entry.from = location;
				}
				if (location.calctime > entry.to.calctime) {
					entry.to = location;
				}
			} else {
				newFlowNodes.set(location.identifier, {
					from: location,
					to: location,
				});
			}
		}

		flowNodes = [...newFlowNodes.values()];
	}
</script>

<svg id="flowmap">
	{#each flowNodes as flowNode}
		<FlowNode from={flowNode.from} to={flowNode.to}></FlowNode>
	{/each}
	<!-- Arrowhead used at the end of edges -->
	<defs>
		<marker
			class="arrowhead"
			id="arrowhead"
			viewBox="0 0 15 15"
			refX="10"
			refY="5"
			markerWidth="6"
			markerHeight="6"
			orient="auto-start-reverse"
		>
			<path d="M 5 0 L 15 5 L 5 10 z" />
		</marker>
	</defs>
</svg>

<style>
	#flowmap {
		width: 100%;
		height: 100%;
	}
</style>
