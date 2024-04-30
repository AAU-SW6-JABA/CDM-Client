import type { AntennaArray, LocationArray } from "./schemas/zodSchemes";

const borderPadding = 30;

export function rescaleLocations(
	maxX: number,
	maxY: number,
	locations: LocationArray,
	antennas: AntennaArray,
): {
	locations: LocationArray;
	antennas: AntennaArray;
} {
	const realX = Math.max(
		1,
		...locations.map((location) => location.x),
		...antennas.map((antenna) => antenna.x),
	);
	const realY = Math.max(
		1,
		...locations.map((location) => location.y),
		...antennas.map((antenna) => antenna.y),
	);

	const scaleX = (maxX - borderPadding * 2) / realX;
	const scaleY = (maxY - borderPadding * 2) / realY;

	const rescaledLocations: LocationArray = [];

	for (const location of locations) {
		rescaledLocations.push({
			...location,
			x: location.x * scaleX + borderPadding,
			y: location.y * scaleY + borderPadding,
		});
	}

	const rescaledAntennas: AntennaArray = [];

	for (const antenna of antennas) {
		rescaledAntennas.push({
			...antenna,
			x: antenna.x * scaleX + borderPadding,
			y: antenna.y * scaleY + borderPadding,
		});
	}

	return { locations: rescaledLocations, antennas: rescaledAntennas };
}
