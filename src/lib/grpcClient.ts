import type { ProtoGrpcType } from "../../gen/protobuf/cdm_protobuf.ts";
import type { RoutesClient } from "../../gen/protobuf/cdm_protobuf/Routes.ts";
import protoLoader from "@grpc/proto-loader";
import grpc from "@grpc/grpc-js";

import dotenv from "dotenv";

dotenv.config();
if (typeof process.env?.PORT !== "string") {
	throw new TypeError("Please define a port in your env file (PORT)");
}

const protoDefinitionPath = "./CDM-ProtocolBuffer/cdm_protobuf.proto";

const packageDefinition: protoLoader.PackageDefinition = await protoLoader.load(
	protoDefinitionPath,
	{},
);
const packageObject: ProtoGrpcType["cdm_protobuf"] = (
	grpc.loadPackageDefinition(packageDefinition) as unknown as ProtoGrpcType
).cdm_protobuf;

/* eslint-disable-next-line  @typescript-eslint/no-unsafe-assignment */
export const client: RoutesClient = new packageObject.Routes(
	`localhost:${process.env.PORT}`,
	grpc.credentials.createInsecure(),
);
