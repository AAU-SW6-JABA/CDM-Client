<script lang="ts">
	import type { Location } from "$lib/Location";
	import type h337 from "@mars3d/heatmap.js";
	import { onMount } from "svelte";
	import { rescaleLocations } from "$lib/rescaleLocations";
	import debounceFn from "debounce-fn";

	export let locations: Location[];

	let heatmapElement: HTMLElement;

	let maxX: number = 0;
	let maxY: number = 0;

	let heatmapRuntime: h337.Heatmap<"value", "x", "y"> | undefined;

	const drawLocationsDebounced = debounceFn(drawLocations, { wait: 1000 });
	$: drawLocationsDebounced(maxX, maxY, locations, heatmapRuntime);

	onMount(async () => {
		const { default: h337 } = await import("@mars3d/heatmap.js");
		heatmapRuntime = h337.create({
			container: heatmapElement,
		});
	});

	onMount(() => {
		const resizeObserver = new ResizeObserver((entries) => {
			const entry = entries.find(
				(entry) => entry.target === heatmapElement,
			);
			if (!entry) return;
			maxX = entry.contentRect.width;
			maxY = entry.contentRect.height;
		});
		resizeObserver.observe(heatmapElement);
		return () => {
			resizeObserver.disconnect();
		};
	});

	function drawLocations(
		maxX?: number,
		maxY?: number,
		locations?: Location[],
		heatmapRuntime?: h337.Heatmap<"value", "x", "y">,
	) {
		if (!maxX || !maxY || !locations || !heatmapRuntime) {
			return;
		}
		const rescaledLocations = rescaleLocations(
			Math.floor(maxX),
			Math.floor(maxY),
			locations,
		);

		heatmapRuntime.setData({
			max: 3,
			min: 0,
			data: [
				...rescaledLocations.map((data) => {
					return { ...data, value: 1 };
				}),
			],
		});
	}
</script>

<div id="heatmap" bind:this={heatmapElement}></div>

<style>
	#heatmap {
		margin-left: auto;
		margin-right: auto;
		width: 90svw;
		height: 80svh;
	}
</style>
