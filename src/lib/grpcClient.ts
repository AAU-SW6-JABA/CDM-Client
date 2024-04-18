import type { ProtoGrpcType } from "../../gen/protobuf/cdm_protobuf.ts";
import type { RoutesClient } from "../../gen/protobuf/cdm_protobuf/Routes.ts";
import protoLoader from "@grpc/proto-loader";
import grpc from "@grpc/grpc-js";

import dotenv from "dotenv";

dotenv.config();

export async function createClient(
	address: string | undefined = undefined,
): Promise<RoutesClient> {
	let serverAddress: string;

	if (typeof address !== "string") {
		if (typeof process.env?.PORT !== "string") {
			throw new TypeError("Please define a port in your env file (PORT)");
		} else {
			serverAddress = `localhost:${process.env.PORT}`;
		}
	} else {
		serverAddress = address;
	}

	const protoDefinitionPath = "./CDM-ProtocolBuffer/cdm_protobuf.proto";

	const packageDefinition: protoLoader.PackageDefinition =
		await protoLoader.load(protoDefinitionPath, {});
	const packageObject: ProtoGrpcType["cdm_protobuf"] = (
		grpc.loadPackageDefinition(
			packageDefinition,
		) as unknown as ProtoGrpcType
	).cdm_protobuf;

	/* eslint-disable-next-line  @typescript-eslint/no-unsafe-assignment */
	return new packageObject.Routes(
		serverAddress,
		grpc.credentials.createInsecure(),
	);
}

export const client: RoutesClient = await createClient();
