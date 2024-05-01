<slot />

<style>
	:root {
		color-scheme: light dark;
		--color: light-dark(black, rgb(230, 237, 243));
		--antenna-color: light-dark(#3d81bd, #3d81bd);
		--flow-color: light-dark(#25972c, #25972c);
		--background-color: light-dark(white, #0d1117);
	}
	:global(html) {
		color: var(--color);
		background-color: var(--background-color);
	}
</style>
