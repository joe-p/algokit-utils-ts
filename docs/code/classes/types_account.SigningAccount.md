[@algorandfoundation/algokit-utils](../README.md) / [types/account](../modules/types_account.md) / SigningAccount

# Class: SigningAccount

[types/account](../modules/types_account.md).SigningAccount

Account wrapper that supports a rekeyed account

## Implements

- `default`

## Table of contents

### Constructors

- [constructor](types_account.SigningAccount.md#constructor)

### Properties

- [\_account](types_account.SigningAccount.md#_account)
- [\_sender](types_account.SigningAccount.md#_sender)

### Accessors

- [addr](types_account.SigningAccount.md#addr)
- [sender](types_account.SigningAccount.md#sender)
- [signer](types_account.SigningAccount.md#signer)
- [sk](types_account.SigningAccount.md#sk)

## Constructors

### constructor

• **new SigningAccount**(`account`, `sender`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `account` | `default` |
| `sender` | `undefined` \| `string` |

#### Defined in

[src/types/account.ts:90](https://github.com/algorandfoundation/algokit-utils-ts/blob/main/src/types/account.ts#L90)

## Properties

### \_account

• `Private` **\_account**: `default`

#### Defined in

[src/types/account.ts:56](https://github.com/algorandfoundation/algokit-utils-ts/blob/main/src/types/account.ts#L56)

___

### \_sender

• `Private` **\_sender**: `string`

#### Defined in

[src/types/account.ts:57](https://github.com/algorandfoundation/algokit-utils-ts/blob/main/src/types/account.ts#L57)

## Accessors

### addr

• `get` **addr**(): `string`

Algorand address of the sender

#### Returns

`string`

#### Implementation of

Account.addr

#### Defined in

[src/types/account.ts:62](https://github.com/algorandfoundation/algokit-utils-ts/blob/main/src/types/account.ts#L62)

___

### sender

• `get` **sender**(): `default`

Algorand account of the sender address and signer private key

#### Returns

`default`

#### Defined in

[src/types/account.ts:83](https://github.com/algorandfoundation/algokit-utils-ts/blob/main/src/types/account.ts#L83)

___

### signer

• `get` **signer**(): `default`

Algorand account of the underlying signing account

#### Returns

`default`

#### Defined in

[src/types/account.ts:76](https://github.com/algorandfoundation/algokit-utils-ts/blob/main/src/types/account.ts#L76)

___

### sk

• `get` **sk**(): `Readonly`<`Uint8Array`\>

Secret key belonging to the signer

#### Returns

`Readonly`<`Uint8Array`\>

#### Implementation of

Account.sk

#### Defined in

[src/types/account.ts:69](https://github.com/algorandfoundation/algokit-utils-ts/blob/main/src/types/account.ts#L69)
