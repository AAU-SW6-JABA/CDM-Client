<script lang="ts">
	import { onMount } from "svelte";
	import { rescaleLocations } from "$lib/rescaleLocations";
	import FlowNode from "./FlowNode.svelte";
	import debounceFn from "debounce-fn";
	import type { Location, LocationArray } from "$lib/schemas/zodSchemes";

	export let locations: LocationArray;

	let flowmapElement: SVGSVGElement;

	let maxX: number = 0;
	let maxY: number = 0;

	let flowNodes: { from: Location; to: Location }[] = [];

	const drawLocationsDebounced = debounceFn(drawLocations, { wait: 1000 });
	$: drawLocationsDebounced(maxX, maxY, locations);

	onMount(() => {
		const resizeObserver = new ResizeObserver((entries) => {
			const entry = entries.find(
				(entry) => entry.target === flowmapElement,
			);
			if (!entry) return;
			maxX = entry.contentRect.width;
			maxY = entry.contentRect.height;
		});
		resizeObserver.observe(flowmapElement);
		return () => {
			resizeObserver.disconnect();
		};
	});

	function drawLocations(
		maxX?: number,
		maxY?: number,
		locations?: LocationArray,
	) {
		if (!maxX || !maxY || !locations) {
			return;
		}
		const rescaledLocations = rescaleLocations(maxX, maxY, locations);

		const newFlowNodes: Map<string, { from: Location; to: Location }> =
			new Map();
		for (const location of rescaledLocations) {
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

<svg id="flowmap" bind:this={flowmapElement}>
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
		margin-left: auto;
		margin-right: auto;
		width: 90svw;
		height: 80svh;
	}
</style>
