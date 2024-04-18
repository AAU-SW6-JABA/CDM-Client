const timeMap = new Map<() => unknown, number>();

export function debounce<P extends Array<unknown>, R>(
	func: (...args: P) => R,
	minWait: number,
	maxWait: number,
	...params: P
) {
	let time = timeMap.get(func);

	if (!time) {
		time = Date.now();
		timeMap.set(func, time);
	}

	const elapsed = Date.now() - time;

	if (elapsed > maxWait || elapsed) {
	}
}
