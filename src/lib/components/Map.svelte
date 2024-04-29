<script lang="ts">
	import type { AntennaArray, LocationArray } from "$lib/schemas/zodSchemes";
	import { onMount } from "svelte";
	import { DisplayMode } from "$lib/DisplayMode";
	import { rescaleLocations } from "$lib/rescaleLocations";
	import FlowMap from "$lib/components/FlowMap.svelte";
	import HeatMap from "$lib/components/HeatMap.svelte";
	import AntennaMap from "./AntennaMap.svelte";

	export let displayMode: DisplayMode;
	export let showAntennas: boolean;
	export let antennas: AntennaArray;
	export let locations: LocationArray;

	let mapElement: HTMLElement;
	let maxX: number;
	let maxY: number;

	let rescaledLocations: LocationArray = [];
	let rescaledAntennas: AntennaArray = [];

	$: handleData(maxX, maxY, locations, antennas);
	function handleData(
		maxX: number,
		maxY: number,
		locations: LocationArray,
		antennas: AntennaArray,
	) {
		if (
			!maxX ||
			!maxY ||
			!locations ||
			!antennas ||
			(locations.length === 0 && antennas.length === 0)
		) {
			return;
		}
		const rescaled = rescaleLocations(maxX, maxY, locations, antennas);
		rescaledLocations = rescaled.locations;
		rescaledAntennas = rescaled.antennas;
	}

	onMount(() => {
		const resizeObserver = new ResizeObserver((entries) => {
			const entry = entries.find((entry) => entry.target === mapElement);
			if (!entry) return;
			maxX = entry.contentRect.width;
			maxY = entry.contentRect.height;
		});
		resizeObserver.observe(mapElement);
		return () => {
			resizeObserver.disconnect();
		};
	});
</script>

<div id="map" bind:this={mapElement}>
	{#if displayMode === DisplayMode.Heatmap}
		<HeatMap {maxX} {maxY} locations={rescaledLocations} />
	{:else if displayMode === DisplayMode.Flowmap}
		<FlowMap locations={rescaledLocations} />
	{/if}
	{#if showAntennas}
		<AntennaMap antennas={rescaledAntennas} />
	{/if}
</div>

<style>
	#map {
		margin: 0 auto;
		width: 90svw;
		height: 60svh;
	}
</style>
