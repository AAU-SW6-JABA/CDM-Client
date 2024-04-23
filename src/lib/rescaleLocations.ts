import type { LocationArray } from "./schemas/zodSchemes";

export function rescaleLocations(
	maxX: number,
	maxY: number,
	locations: LocationArray,
) {
	const realX = Math.max(...locations.map((location) => location.x));
	const realY = Math.max(...locations.map((location) => location.y));

	const scaleX = maxX / realX;
	const scaleY = maxY / realY;

	const rescaledLocations: LocationArray = [];

	for (const location of locations) {
		rescaledLocations.push({
			identifier: location.identifier,
			calctime: location.calctime,
			x: location.x * scaleX,
			y: location.y * scaleY,
		});
	}

	return rescaledLocations;
}
