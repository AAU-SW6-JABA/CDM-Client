<script lang="ts">
	import { browser } from "$app/environment";
	import debounce from "debounce-fn";
	import { serverUrl } from "$lib/state/serverUrl";
	import { dateToDatetimeString } from "$lib/dateTools";
	import { URLParams } from "$lib/urlSearchParams";
	import Map from "$lib/components/Map.svelte";
	import {
		type LocationArray,
		type AntennaArray,
		ZodResponseBody,
		ZodLiveResponseBody,
		ZodAntennaResponseBody,
	} from "$lib/schemas/zodSchemes";
	import { DisplayMode } from "$lib/DisplayMode";

	enum AddressStatus {
		Initial = "Write the address of your CDM-Server",
		Valid = "Connection to server established",
		Invalid = "Unable to connect to server",
		Connecting = "Connecting to server...",
	}
	let addressStatus: AddressStatus = AddressStatus.Initial;

	let urlInputElement: HTMLInputElement;
	let inputServerUrl: string = $serverUrl;
	const setNewServerUrlDebounced = debounce(setNewServerUrl, {
		wait: 500,
	});
	$: setNewServerUrlDebounced(inputServerUrl, urlInputElement);
	function setNewServerUrl(
		inputServerUrl: string,
		urlInputElement: HTMLInputElement,
	) {
		if (inputServerUrl && urlInputElement) {
			if (urlInputElement.reportValidity()) {
				$serverUrl = inputServerUrl;
			}
		}
	}

	let timeIntervalBegin = dateToDatetimeString(new Date());
	let timeIntervalOffset = -0.3;

	let locationStream: EventSource | undefined;
	let isLive = false;
	let showAntennas = true;
	$: if (showAntennas && $serverUrl) {
		getAntennasDebounced($serverUrl);
	}

	let displayMode: DisplayMode = DisplayMode.Heatmap;

	let locations: LocationArray = [];
	let antennas: AntennaArray = [];

	const handleNewDataSettingsDebounced = debounce(handleNewDataSettings, {
		wait: 1000,
	});
	$: handleNewDataSettingsDebounced(
		$serverUrl,
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
	const getAntennasDebounced = debounce(getAntennas, {
		wait: 500,
	});
	async function getAntennas(serverUrl: string) {
		const fetchUrl = new URL("/api/getAntennas", window.location.origin);
		fetchUrl.searchParams.set(URLParams.serverUrl, serverUrl);
		const response = await fetch(fetchUrl, {
			method: "POST",
			body: JSON.stringify({ request: {} }),
			headers: {
				"Content-Type": "application/json",
			},
		});

		const parsedResponse = ZodAntennaResponseBody.safeParse(
			await response.json(),
		);

		if (!parsedResponse.success) {
			addressStatus = AddressStatus.Invalid;
			console.warn(
				"Failed to parse antenna response",
				parsedResponse.error,
			);
			return;
		}

		if (!Array.isArray(parsedResponse.data)) {
			addressStatus = AddressStatus.Invalid;
			console.warn(
				"Found error in antenna response data",
				parsedResponse.data.error,
			);
			return;
		}

		antennas = parsedResponse.data;
	}
</script>

<h1>Heatmap</h1>
<fieldset id="settings" class="settings">
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
<fieldset id="antenna-settings" class="settings">
	<legend>Antennas</legend>
	<label>
		Show antennas
		<input type="checkbox" bind:checked={showAntennas} />
	</label>
	<button
		on:click={() => {
			getAntennasDebounced($serverUrl);
		}}
		disabled={!$serverUrl}
	>
		Refresh antennas
	</button>
</fieldset>

<Map {displayMode} {showAntennas} {locations} {antennas} />

<style>
	.settings > * {
		display: block;
	}
	#settings .serverFields {
		display: inline;
	}
</style>
