[@algorandfoundation/algokit-utils](../README.md) / [types/app](../modules/types_app.md) / AppDeploymentParams

# Interface: AppDeploymentParams

[types/app](../modules/types_app.md).AppDeploymentParams

The parameters to deploy an app

## Hierarchy

- `Omit`<[`CreateAppParams`](types_app.CreateAppParams.md), ``"args"`` \| ``"note"`` \| ``"skipSending"`` \| ``"skipWaiting"``\>

  ↳ **`AppDeploymentParams`**

## Table of contents

### Properties

- [approvalProgram](types_app.AppDeploymentParams.md#approvalprogram)
- [clearStateProgram](types_app.AppDeploymentParams.md#clearstateprogram)
- [createArgs](types_app.AppDeploymentParams.md#createargs)
- [deleteArgs](types_app.AppDeploymentParams.md#deleteargs)
- [deployTimeParams](types_app.AppDeploymentParams.md#deploytimeparams)
- [existingDeployments](types_app.AppDeploymentParams.md#existingdeployments)
- [fee](types_app.AppDeploymentParams.md#fee)
- [from](types_app.AppDeploymentParams.md#from)
- [maxFee](types_app.AppDeploymentParams.md#maxfee)
- [maxRoundsToWaitForConfirmation](types_app.AppDeploymentParams.md#maxroundstowaitforconfirmation)
- [metadata](types_app.AppDeploymentParams.md#metadata)
- [onSchemaBreak](types_app.AppDeploymentParams.md#onschemabreak)
- [onUpdate](types_app.AppDeploymentParams.md#onupdate)
- [schema](types_app.AppDeploymentParams.md#schema)
- [suppressLog](types_app.AppDeploymentParams.md#suppresslog)
- [transactionParams](types_app.AppDeploymentParams.md#transactionparams)
- [updateArgs](types_app.AppDeploymentParams.md#updateargs)

## Properties

### approvalProgram

• **approvalProgram**: `string` \| `Uint8Array`

The approval program as raw teal (string) or compiled teal, base 64 encoded as a byte array (Uint8Array)

#### Inherited from

Omit.approvalProgram

#### Defined in

[src/types/app.ts:89](https://github.com/algorandfoundation/algokit-utils-ts/blob/main/src/types/app.ts#L89)

___

### clearStateProgram

• **clearStateProgram**: `string` \| `Uint8Array`

The clear state program as raw teal (string) or compiled teal, base 64 encoded as a byte array (Uint8Array)

#### Inherited from

Omit.clearStateProgram

#### Defined in

[src/types/app.ts:91](https://github.com/algorandfoundation/algokit-utils-ts/blob/main/src/types/app.ts#L91)

___

### createArgs

• `Optional` **createArgs**: [`AppCallArgs`](../modules/types_app.md#appcallargs)

Any args to pass to any create transaction that is issued as part of deployment

#### Defined in

[src/types/app.ts:244](https://github.com/algorandfoundation/algokit-utils-ts/blob/main/src/types/app.ts#L244)

___

### deleteArgs

• `Optional` **deleteArgs**: [`AppCallArgs`](../modules/types_app.md#appcallargs)

Any args to pass to any delete transaction that is issued as part of deployment

#### Defined in

[src/types/app.ts:248](https://github.com/algorandfoundation/algokit-utils-ts/blob/main/src/types/app.ts#L248)

___

### deployTimeParams

• `Optional` **deployTimeParams**: [`TealTemplateParams`](types_app.TealTemplateParams.md)

Any deploy-time parameters to replace in the TEAL code

#### Defined in

[src/types/app.ts:236](https://github.com/algorandfoundation/algokit-utils-ts/blob/main/src/types/app.ts#L236)

___

### existingDeployments

• `Optional` **existingDeployments**: [`AppLookup`](types_app.AppLookup.md)

Optional cached value of the existing apps for the given creator

#### Defined in

[src/types/app.ts:242](https://github.com/algorandfoundation/algokit-utils-ts/blob/main/src/types/app.ts#L242)

___

### fee

• `Optional` **fee**: [`AlgoAmount`](../classes/types_amount.AlgoAmount.md)

The flat fee you want to pay, useful for covering extra fees in a transaction group or app call

#### Inherited from

Omit.fee

#### Defined in

[src/types/transaction.ts:32](https://github.com/algorandfoundation/algokit-utils-ts/blob/main/src/types/transaction.ts#L32)

___

### from

• **from**: [`SendTransactionFrom`](../modules/types_transaction.md#sendtransactionfrom)

The account (with private key loaded) that will send the µALGOs

#### Inherited from

Omit.from

#### Defined in

[src/types/app.ts:87](https://github.com/algorandfoundation/algokit-utils-ts/blob/main/src/types/app.ts#L87)

___

### maxFee

• `Optional` **maxFee**: [`AlgoAmount`](../classes/types_amount.AlgoAmount.md)

The maximum fee that you are happy to pay (default: unbounded) - if this is set it's possible the transaction could get rejected during network congestion

#### Inherited from

Omit.maxFee

#### Defined in

[src/types/transaction.ts:34](https://github.com/algorandfoundation/algokit-utils-ts/blob/main/src/types/transaction.ts#L34)

___

### maxRoundsToWaitForConfirmation

• `Optional` **maxRoundsToWaitForConfirmation**: `number`

The maximum number of rounds to wait for confirmation, only applies if `skipWaiting` is `undefined` or `false`, default: wait up to 5 rounds

#### Inherited from

Omit.maxRoundsToWaitForConfirmation

#### Defined in

[src/types/transaction.ts:36](https://github.com/algorandfoundation/algokit-utils-ts/blob/main/src/types/transaction.ts#L36)

___

### metadata

• **metadata**: [`AppDeployMetadata`](types_app.AppDeployMetadata.md)

The deployment metadata

#### Defined in

[src/types/app.ts:234](https://github.com/algorandfoundation/algokit-utils-ts/blob/main/src/types/app.ts#L234)

___

### onSchemaBreak

• `Optional` **onSchemaBreak**: [`OnSchemaBreak`](../enums/types_app.OnSchemaBreak.md) \| ``"replace"`` \| ``"fail"``

What action to perform if a schema break is detected

#### Defined in

[src/types/app.ts:238](https://github.com/algorandfoundation/algokit-utils-ts/blob/main/src/types/app.ts#L238)

___

### onUpdate

• `Optional` **onUpdate**: ``"replace"`` \| ``"fail"`` \| [`OnUpdate`](../enums/types_app.OnUpdate.md) \| ``"update"``

What action to perform if a TEAL update is detected

#### Defined in

[src/types/app.ts:240](https://github.com/algorandfoundation/algokit-utils-ts/blob/main/src/types/app.ts#L240)

___

### schema

• **schema**: [`AppStorageSchema`](types_app.AppStorageSchema.md)

The storage schema to request for the created app

#### Inherited from

Omit.schema

#### Defined in

[src/types/app.ts:103](https://github.com/algorandfoundation/algokit-utils-ts/blob/main/src/types/app.ts#L103)

___

### suppressLog

• `Optional` **suppressLog**: `boolean`

Whether to suppress log messages from transaction send, default: do not suppress

#### Inherited from

Omit.suppressLog

#### Defined in

[src/types/transaction.ts:30](https://github.com/algorandfoundation/algokit-utils-ts/blob/main/src/types/transaction.ts#L30)

___

### transactionParams

• `Optional` **transactionParams**: `SuggestedParams`

Optional transaction parameters

#### Inherited from

Omit.transactionParams

#### Defined in

[src/types/app.ts:93](https://github.com/algorandfoundation/algokit-utils-ts/blob/main/src/types/app.ts#L93)

___

### updateArgs

• `Optional` **updateArgs**: [`AppCallArgs`](../modules/types_app.md#appcallargs)

Any args to pass to any update transaction that is issued as part of deployment

#### Defined in

[src/types/app.ts:246](https://github.com/algorandfoundation/algokit-utils-ts/blob/main/src/types/app.ts#L246)
