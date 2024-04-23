<script lang="ts">
	import type { Location } from "$lib/Location";
	import { browser } from "$app/environment";
	import debounce from "debounce-fn";
	import { URLParams } from "$lib/urlSearchParams";
	import FlowMap from "$lib/components/FlowMap.svelte";
	import HeatMap from "$lib/components/HeatMap.svelte";

	enum AddressStatus {
		Initial = "Write the address of your CDM-Server",
		Valid = "Connection to server established",
		Invalid = "Unable to connect to server",
		Connecting = "Connecting to server...",
	}
	let addressStatus: AddressStatus = AddressStatus.Initial;
	let addressParagraphElement: HTMLParagraphElement;

	let urlInputElement: HTMLInputElement;
	let inputServerUrl: string;
	let serverUrl: string;
	$: if (inputServerUrl && urlInputElement) {
		if (urlInputElement.reportValidity()) {
			serverUrl = inputServerUrl;
		}
	}

	let timeIntervalBegin = dateToDatetimeString(new Date());
	let timeIntervalOffset = 5;

	let locationStream: EventSource | undefined;
	let isLive = false;

	let locations: Location[] = [];
	$: if (isLive && browser) {
		if (!locationStream) {
			console.log("Connecting to mr. server pweese");
			locationStream = new EventSource("/api/subscribeToLocations");
			locationStream.addEventListener("locations", handleNewLocations);
		}
	} else {
		if (locationStream) {
			locationStream.close();
			locationStream.removeEventListener("locations", handleNewLocations);
			locationStream = undefined;
		}
	}

	function handleNewLocations(event: MessageEvent<any>) {
		console.log(event);
	}

	$: {
		getLocationsDebounced(serverUrl);
		addressStatus = AddressStatus.Connecting;
	}

	const getLocationsDebounced = debounce(getLocations, { wait: 1000 });
	async function getLocations(url: string) {
		if (!browser) return;

		const timeIntervalBeginUnix = new Date(timeIntervalBegin).getTime();
		const timeIntervalOffsetUnix =
			timeIntervalBeginUnix + timeIntervalOffset * 60 * 1000;

		const fetchUrl = new URL("/api/getLocations", window.location.origin);
		fetchUrl.searchParams.set(URLParams.serverUrl, url);
		fetchUrl.searchParams.set(
			URLParams.timeIntervalBegin,
			timeIntervalBeginUnix.toString(),
		);
		fetchUrl.searchParams.set(
			URLParams.timeIntervalEnd,
			timeIntervalOffsetUnix.toString(),
		);
		const response = await fetch(fetchUrl, {
			method: "POST",
			body: JSON.stringify({ request: {} }),
			headers: {
				"Content-Type": "application/json",
			},
		});

		if (!response.ok) {
			addressStatus = AddressStatus.Invalid;
			return;
		}

		locations = await response.json();
		addressStatus = AddressStatus.Valid;
	}

	function dateToDatetimeString(date: Date): string {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, "0");
		const day = String(date.getDate()).padStart(2, "0");
		const hours = String(date.getHours()).padStart(2, "0");
		const minutes = String(date.getMinutes()).padStart(2, "0");
		return `${year}-${month}-${day}T${hours}:${minutes}`;
	}
</script>

<h1>Heatmap</h1>
<fieldset id="settings">
	<legend>Settings</legend>
	<label class="serverFields">
		Use server
		<input
			type="url"
			bind:this={urlInputElement}
			bind:value={inputServerUrl}
			placeholder="e.g. localhost:3000"
		/>
	</label>
	<p
		class="serverFields"
		style="margin-left: 1em;"
		bind:this={addressParagraphElement}
	>
		<i> {addressStatus} </i>
	</p>
	<label>
		Show live locations
		<input type="checkbox" bind:checked={isLive} />
	</label>
	<label>
		Show locations collected at
		<input
			type="datetime-local"
			bind:value={timeIntervalBegin}
			disabled={isLive}
		/>
	</label>
	<label>
		Filter locations earlier than
		<input type="number" bind:value={timeIntervalOffset} />
		minutes
	</label>
</fieldset>
<HeatMap {locations}></HeatMap>
<FlowMap {locations}></FlowMap>

<style>
	#settings > * {
		display: block;
	}
	#settings .serverFields {
		display: inline;
	}
</style>
