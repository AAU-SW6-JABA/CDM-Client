import type { ProtoGrpcType } from "../../gen/protobuf/cdm_protobuf.ts";
import type { RoutesClient } from "../../gen/protobuf/cdm_protobuf/Routes.ts";
import protoLoader from "@grpc/proto-loader";
import grpc from "@grpc/grpc-js";

export async function createClient(address: string): Promise<RoutesClient> {
	const protoDefinitionPath = "./CDM-ProtocolBuffer/cdm_protobuf.proto";

	const packageDefinition: protoLoader.PackageDefinition =
		await protoLoader.load(protoDefinitionPath, {});
	const packageObject: ProtoGrpcType["cdm_protobuf"] = (
		grpc.loadPackageDefinition(
			packageDefinition,
		) as unknown as ProtoGrpcType
	).cdm_protobuf;

	/* eslint-disable-next-line  @typescript-eslint/no-unsafe-assignment */
	return new packageObject.Routes(address, grpc.credentials.createInsecure());
}
