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
	const realMinX = Math.min(
		...locations.map((location) => location.x),
		...antennas.map((antenna) => antenna.x),
	);
	const realMaxX = Math.max(
		...locations.map((location) => location.x),
		...antennas.map((antenna) => antenna.x),
	);
	const realX = Math.max(realMaxX - realMinX, 1);

	const realMinY = Math.min(
		...locations.map((location) => location.y),
		...antennas.map((antenna) => antenna.y),
	);
	const realMaxY = Math.max(
		...locations.map((location) => location.y),
		...antennas.map((antenna) => antenna.y),
	);
	const realY = Math.max(realMaxY - realMinY, 1);

	const scaleX = (maxX - borderPadding * 2) / realX;
	const scaleY = (maxY - borderPadding * 2) / realY;

	const rescaledLocations: LocationArray = [];

	for (const location of locations) {
		rescaledLocations.push({
			...location,
			x: (location.x - realMinX) * scaleX + borderPadding,
			y: (location.y - realMinY) * scaleY + borderPadding,
		});
	}

	const rescaledAntennas: AntennaArray = [];

	for (const antenna of antennas) {
		rescaledAntennas.push({
			...antenna,
			x: (antenna.x - realMinX) * scaleX + borderPadding,
			y: (antenna.y - realMinY) * scaleY + borderPadding,
		});
	}

	return { locations: rescaledLocations, antennas: rescaledAntennas };
}
