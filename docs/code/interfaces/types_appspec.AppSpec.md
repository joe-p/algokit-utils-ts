[@algorandfoundation/algokit-utils](../README.md) / [types/appspec](../modules/types_appspec.md) / AppSpec

# Interface: AppSpec

[types/appspec](../modules/types_appspec.md).AppSpec

## Table of contents

### Properties

- [bare\_call\_config](types_appspec.AppSpec.md#bare_call_config)
- [contract](types_appspec.AppSpec.md#contract)
- [hints](types_appspec.AppSpec.md#hints)
- [schema](types_appspec.AppSpec.md#schema)
- [source](types_appspec.AppSpec.md#source)
- [state](types_appspec.AppSpec.md#state)

## Properties

### bare\_call\_config

• **bare\_call\_config**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `clear_state?` | [`CallConfigValue`](../modules/types_appspec.md#callconfigvalue) |
| `close_out?` | [`CallConfigValue`](../modules/types_appspec.md#callconfigvalue) |
| `delete_application?` | [`CallConfigValue`](../modules/types_appspec.md#callconfigvalue) |
| `no_op?` | [`CallConfigValue`](../modules/types_appspec.md#callconfigvalue) |
| `opt_in?` | [`CallConfigValue`](../modules/types_appspec.md#callconfigvalue) |
| `update_application?` | [`CallConfigValue`](../modules/types_appspec.md#callconfigvalue) |

#### Defined in

[src/types/appspec.ts:9](https://github.com/algorandfoundation/algokit-utils-ts/blob/main/src/types/appspec.ts#L9)

___

### contract

• **contract**: `ABIContractParams`

#### Defined in

[src/types/appspec.ts:7](https://github.com/algorandfoundation/algokit-utils-ts/blob/main/src/types/appspec.ts#L7)

___

### hints

• **hints**: [`HintSpec`](../modules/types_appspec.md#hintspec)

#### Defined in

[src/types/appspec.ts:4](https://github.com/algorandfoundation/algokit-utils-ts/blob/main/src/types/appspec.ts#L4)

___

### schema

• **schema**: [`SchemaSpec`](types_appspec.SchemaSpec.md)

#### Defined in

[src/types/appspec.ts:5](https://github.com/algorandfoundation/algokit-utils-ts/blob/main/src/types/appspec.ts#L5)

___

### source

• **source**: [`AppSources`](types_appspec.AppSources.md)

#### Defined in

[src/types/appspec.ts:6](https://github.com/algorandfoundation/algokit-utils-ts/blob/main/src/types/appspec.ts#L6)

___

### state

• **state**: [`StateSchemaSpec`](types_appspec.StateSchemaSpec.md)

#### Defined in

[src/types/appspec.ts:8](https://github.com/algorandfoundation/algokit-utils-ts/blob/main/src/types/appspec.ts#L8)
