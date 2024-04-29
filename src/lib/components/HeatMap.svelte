<script lang="ts">
	import type { LocationArray } from "$lib/schemas/zodSchemes";
	import type h337 from "@mars3d/heatmap.js";
	import { onMount } from "svelte";
	import debounceFn from "debounce-fn";

	export let maxX: number;
	export let maxY: number;
	$: elementX = maxX ? Math.floor(maxX) : 100;
	$: elementY = maxY ? Math.floor(maxY) : 100;

	export let locations: LocationArray;

	let heatmapElement: HTMLElement;

	let heatmapRuntime: h337.Heatmap<"value", "x", "y"> | undefined;

	const drawLocationsDebounced = debounceFn(drawLocations, { wait: 1000 });
	$: drawLocationsDebounced(locations, heatmapRuntime);

	onMount(async () => {
		const { default: h337 } = await import("@mars3d/heatmap.js");
		heatmapRuntime = h337.create({
			container: heatmapElement,
		});
	});

	function drawLocations(
		locations?: LocationArray,
		heatmapRuntime?: h337.Heatmap<"value", "x", "y">,
	) {
		if (!locations || !heatmapRuntime) {
			return;
		}

		heatmapRuntime.setData({
			max: 3,
			min: 0,
			data: [
				...locations.map((data) => {
					return {
						x: Math.round(data.x),
						y: Math.round(data.y),
						value: 1,
					};
				}),
			],
		});
	}
</script>

<div
	id="heatmap"
	style="
		width: {elementX}px;
		height: {elementY}px;
	"
	bind:this={heatmapElement}
></div>

<style>
</style>
