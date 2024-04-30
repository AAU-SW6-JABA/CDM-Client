import { goto } from "$app/navigation";
import { writable, type Writable } from "svelte/store";

const urlParamKey: string = "url";

let initialValue = "";

// Get the value from the URL at load
if ("location" in globalThis) {
	const params = new URLSearchParams(globalThis.location.search);
	const urlValue = params.get(urlParamKey);
	if(urlValue && URL.canParse(urlValue)){
		initialValue = urlValue;
	}
}

export const serverUrl: Writable<string> = writable(initialValue);


// If the value updates, set it in the URL
if ("location" in globalThis && "history" in globalThis) {
	serverUrl.subscribe((serverUrl) => {
		const url = new URL(globalThis.location.href);
		if(serverUrl){
			url.searchParams.set(urlParamKey, serverUrl);
		}else{
			url.searchParams.delete(urlParamKey);
		}
		goto(url, { replaceState: true, keepFocus: true });
	});
}
