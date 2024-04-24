<script lang="ts">
	import type { Location } from "$lib/schemas/zodSchemes";

	export let from: Location;
	export let to: Location;

	$: isStationary = Boolean(from.x === to.x && from.y === to.y);
</script>

{#if !isStationary}
	<line
		x1={from.x}
		y1={from.y}
		x2={to.x}
		y2={to.y}
		marker-end="url(#arrowhead)"
	/>
{/if}

<circle cx={from.x} cy={from.y} r="5"></circle>

<style>
	line {
		stroke: blue;
		stroke-width: 5px;
	}
	circle {
		fill: blue;
	}
</style>
