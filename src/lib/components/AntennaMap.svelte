<script lang="ts">
	import type { AntennaArray } from "$lib/schemas/zodSchemes";

	export let antennas: AntennaArray = [];

	const size = 10;
</script>

<svg id="antennamap">
	{#each antennas as antenna}
		<rect
			class="antenna"
			x={antenna.x - size / 2}
			y={antenna.y - size / 2}
			width={size}
			height={size}
		/>
	{/each}
</svg>

<style>
	#antennamap {
		width: 100%;
		height: 100%;
		translate: 0 -100%;

		& .antenna {
			fill: var(--antenna-color);
		}
	}
</style>
