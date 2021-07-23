import Net from "@rbxts/net";
import { Option, Result } from "@rbxts/rust-classes";
import t from "@rbxts/t";
import { $print } from "rbxts-transform-debug";

// type $GuidTree<K extends string, T> = { readonly [P in keyof T]: `guid@${K}:${P & string}` };
// declare function $guids<K extends string, T extends Record<string, true>>(namespace: K, values: T): $GuidTree<K, T>;
// const { Name } = $guids("Test", {
// 	Name: true,
// });

const {
	Create,
	Namespace,
	Event,
	Function,
	AsyncFunction,
	ServerAsyncFunction,
	ServerToClientEvent,
	ClientToServerEvent,
} = Net.Definitions;

const RustResultSerializer = Net.Serialization.CreateClassSerializer(Result, {
	Serialize: (value: Result<defined, defined>) => {
		if (value.isOk()) {
			return { okValue: value.okValue };
		} else {
			return { errValue: value.unwrapErr() };
		}
	},
	Deserialize: (serialized) => {
		if (serialized.okValue !== undefined) {
			return Result.ok(serialized.okValue);
		} else {
			return Result.err(serialized.errValue);
		}
	},
});

const RustOptionSerializer = Net.Serialization.CreateClassSerializer(Option, {
	Serialize: (value: Option<defined>) => {
		if (value.isSome()) {
			return { value };
		} else {
			return { value: undefined };
		}
	},
	Deserialize: (serialized) => {
		return Option.wrap(serialized.value);
	},
});

const Remotes = Create(
	{
		TestStandaloneEvent: ServerToClientEvent<[message2: string]>(),
		TestStandaloneClientEvent: ClientToServerEvent<[message: string]>(),
		TestingFunctions: Namespace({
			CallServerAndAddNumbers: ServerAsyncFunction<(a: number, b: number) => number>(),
		}),
		TestingEvents: Namespace({
			PrintMessage: ClientToServerEvent<[message: string]>(),
		}),
		Legacy: Namespace({
			LegacyEvent: Event<[message: string], [message2: number]>(),
			LegacyFunction: Function<(server: number) => string>(),
			LegacyAsyncFunction: AsyncFunction<(server: number) => string, (client: number) => string>(),
		}),
	},
	{
		GlobalMiddleware: [
			Net.Middleware.Global((remote, data, player) => {
				$print("call from", player, "via", remote, ...data);
			}),
		],
		Serializers: [RustResultSerializer, RustOptionSerializer],
	},
);

export default Remotes;
