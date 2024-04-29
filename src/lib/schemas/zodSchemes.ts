import { z } from "zod";

export const ZodResponseError = z.object({
	error: z.string(),
});

export type ResponseError = z.infer<typeof ZodResponseError>;

export const ZodLocation = z.object({
	identifier: z.string(),
	calctime: z.number(),
	x: z.number(),
	y: z.number(),
});

export type Location = z.infer<typeof ZodLocation>;

export const ZodLocationArray = z.array(ZodLocation).default([]);

export type LocationArray = z.infer<typeof ZodLocationArray>;

export const ZodResponseBody = z.union([ZodResponseError, ZodLocationArray]);

export type ResponseBody = z.infer<typeof ZodResponseBody>;

export const ZodLiveResponseBody = z.object({
	location: ZodLocationArray,
});

export type LiveResponseBody = z.infer<typeof ZodLiveResponseBody>;

export const ZodAntenna = z.object({
	aid: z.number(),
	x: z.number(),
	y: z.number(),
});

export type Antenna = z.infer<typeof ZodAntenna>;

export const ZodAntennaArray = z.array(ZodAntenna).default([]);

export type AntennaArray = z.infer<typeof ZodAntennaArray>;

export const ZodAntennaResponseBody = z.union([
	ZodResponseError,
	ZodAntennaArray,
]);

export type AntennaResponseBody = z.infer<typeof ZodAntennaResponseBody>;
