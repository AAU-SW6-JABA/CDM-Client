<script lang="ts">
	import { browser } from "$app/environment";
	import debounce from "debounce-fn";
	import { dateToDatetimeString } from "$lib/dateTools";
	import { URLParams } from "$lib/urlSearchParams";
	import FlowMap from "$lib/components/FlowMap.svelte";
	import HeatMap from "$lib/components/HeatMap.svelte";
	import {
		type LocationArray,
		ZodResponseBody,
		ZodLiveResponseBody,
	} from "$lib/schemas/zodSchemes";

	enum DisplayMode {
		Heatmap = "heatmap",
		Flowmap = "flowmap",
	}

	enum AddressStatus {
		Initial = "Write the address of your CDM-Server",
		Valid = "Connection to server established",
		Invalid = "Unable to connect to server",
		Connecting = "Connecting to server...",
	}
	let addressStatus: AddressStatus = AddressStatus.Initial;

	let urlInputElement: HTMLInputElement;
	let inputServerUrl: string;
	let serverUrl: string;
	$: if (inputServerUrl && urlInputElement) {
		if (urlInputElement.reportValidity()) {
			serverUrl = inputServerUrl;
		}
	}

	let timeIntervalBegin = dateToDatetimeString(new Date());
	let timeIntervalOffset = -5;

	let locationStream: EventSource | undefined;
	let isLive = false;

	let displayMode: DisplayMode = DisplayMode.Heatmap;

	let locations: LocationArray = [];

	const handleNewDataSettingsDebounced = debounce(handleNewDataSettings, {
		wait: 1000,
	});
	$: handleNewDataSettingsDebounced(
		serverUrl,
		isLive,
		timeIntervalBegin,
		timeIntervalOffset,
	);
	function handleNewDataSettings(
		serverUrl: string,
		isLive: boolean,
		timeIntervalBegin: string,
		timeIntervalOffset: number,
	) {
		if (!browser) return;
		locations = [];
		if (serverUrl) {
			subscribeToLocations(serverUrl, isLive, timeIntervalOffset);
			if (!isLive) {
				getLocations(serverUrl, timeIntervalBegin, timeIntervalOffset);
			}
		} else {
			subscribeToLocations("", false, 0);
		}
	}

	function subscribeToLocations(
		serverUrl: string,
		isLive: boolean,
		timeIntervalOffset: number,
	) {
		if (isLive) {
			getLocations(
				serverUrl,
				dateToDatetimeString(new Date()),
				timeIntervalOffset,
			);
			if (locationStream) {
				const previousServerUrl = new URL(
					locationStream.url,
				).searchParams.get(URLParams.serverUrl);
				if (previousServerUrl !== serverUrl) {
					closeLocationStream();
				}
			}
			if (!locationStream) {
				openLocationStream(serverUrl);
			}
		} else {
			closeLocationStream();
		}
	}
	function openLocationStream(serverUrl: string) {
		if (locationStream !== undefined) {
			throw new TypeError(
				"Can't open the location stream when it is already active",
			);
		}
		const subscribeUrl = new URL(
			"/api/subscribeToLocations",
			window.location.origin,
		);
		subscribeUrl.searchParams.set(URLParams.serverUrl, serverUrl);
		locationStream = new EventSource(subscribeUrl);
		locationStream.addEventListener("locations", handleNewLocations);
	}
	function closeLocationStream() {
		if (locationStream && locationStream.OPEN) {
			locationStream?.close();
			locationStream?.removeEventListener(
				"locations",
				handleNewLocations,
			);
			locationStream = undefined;
		}
	}
	function handleNewLocations(event: MessageEvent<string>) {
		const earliestTime =
			new Date(timeIntervalBegin).getTime() + timeIntervalOffset;
		const previousValidLocations = locations.filter((location) => {
			return Boolean(location.calctime > earliestTime);
		});

		const parsedResponse = ZodLiveResponseBody.safeParse(
			JSON.parse(event.data),
		);
		if (!parsedResponse.success) {
			addressStatus = AddressStatus.Invalid;
			console.warn("Failed to parse live response", parsedResponse.error);
			return;
		}
		const newLocations = parsedResponse.data.location;

		locations = [...previousValidLocations, ...newLocations];
	}

	async function getLocations(
		serverUrl: string,
		timeIntervalBegin: string,
		timeIntervalOffset: number,
	) {
		addressStatus = AddressStatus.Connecting;

		const timeIntervalBeginUnix = new Date(timeIntervalBegin).getTime();
		const timeIntervalOffsetUnix =
			timeIntervalBeginUnix + timeIntervalOffset * 60 * 1000;

		const fetchUrl = new URL("/api/getLocations", window.location.origin);
		fetchUrl.searchParams.set(URLParams.serverUrl, serverUrl);
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

		const parsedResponse = ZodResponseBody.safeParse(await response.json());

		if (!parsedResponse.success) {
			addressStatus = AddressStatus.Invalid;
			console.warn("Failed to parse response", parsedResponse.error);
			return;
		}

		if (!Array.isArray(parsedResponse.data)) {
			addressStatus = AddressStatus.Invalid;
			console.warn(
				"Found error in response data",
				parsedResponse.data.error,
			);
			return;
		}

		locations = parsedResponse.data;
		addressStatus = AddressStatus.Valid;
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
	<p class="serverFields" style="margin-left: 1em;">
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
	<label>
		Show as
		<select bind:value={displayMode}>
			<option value={DisplayMode.Heatmap}>Heatmap</option>
			<option value={DisplayMode.Flowmap}>Flowmap</option>
		</select>
	</label>
</fieldset>

{#if displayMode === DisplayMode.Heatmap}
	<HeatMap {locations}></HeatMap>
{:else if displayMode === DisplayMode.Flowmap}
	<FlowMap {locations}></FlowMap>
{/if}

<style>
	#settings > * {
		display: block;
	}
	#settings .serverFields {
		display: inline;
	}
</style>
