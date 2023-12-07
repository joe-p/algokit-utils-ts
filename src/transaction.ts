import algosdk from 'algosdk'
import { Buffer } from 'buffer'
import { Config } from './'
import { AlgoAmount } from './types/amount'
import { ABIReturn } from './types/app'
import {
  AtomicTransactionComposerToSend,
  SendAtomicTransactionComposerResults,
  SendTransactionFrom,
  SendTransactionParams,
  SendTransactionResult,
  TransactionGroupToSend,
  TransactionNote,
  TransactionToSign,
} from './types/transaction'
import { toNumber } from './util'
import Algodv2 = algosdk.Algodv2
import AtomicTransactionComposer = algosdk.AtomicTransactionComposer
import EncodedSignedTransaction = algosdk.EncodedSignedTransaction
import modelsv2 = algosdk.modelsv2
import SuggestedParams = algosdk.SuggestedParams
import Transaction = algosdk.Transaction
import TransactionSigner = algosdk.TransactionSigner
import TransactionWithSigner = algosdk.TransactionWithSigner

export const MAX_TRANSACTION_GROUP_SIZE = 16
export const MAX_REFERENCES = 8
export const MAX_ACCOUNT_REFERENCES = 4

/** Encodes a transaction note into a byte array ready to be included in an Algorand transaction.
 *
 * @param note The transaction note
 * @returns the transaction note ready for inclusion in a transaction
 *
 *  Case on the value of `data` this either be:
 *   * `null` | `undefined`: `undefined`
 *   * `string`: The string value
 *   * Uint8Array: passthrough
 *   * Arc2TransactionNote object: ARC-0002 compatible transaction note
 *   * Else: The object/value converted into a JSON string representation
 */
export function encodeTransactionNote(note?: TransactionNote): Uint8Array | undefined {
  if (note == null || typeof note === 'undefined') {
    return undefined
  } else if (typeof note === 'object' && note.constructor === Uint8Array) {
    return note
  } else if (typeof note === 'object' && 'dAppName' in note) {
    const arc2Payload = `${note.dAppName}:${note.format}${typeof note.data === 'string' ? note.data : JSON.stringify(note.data)}`
    const encoder = new TextEncoder()
    return encoder.encode(arc2Payload)
  } else {
    const n = typeof note === 'string' ? note : JSON.stringify(note)
    const encoder = new TextEncoder()
    return encoder.encode(n)
  }
}

/** Encodes a transaction lease into a 32-byte array ready to be included in an Algorand transaction.
 *
 * @param lease The transaction lease as a string or binary array or null/undefined if there is no lease
 * @returns the transaction lease ready for inclusion in a transaction or `undefined` if there is no lease
 * @throws if the length of the data is > 32 bytes or empty
 * @example algokit.encodeLease('UNIQUE_ID')
 * @example algokit.encodeLease(new Uint8Array([1, 2, 3]))
 */
export function encodeLease(lease?: string | Uint8Array): Uint8Array | undefined {
  if (lease === null || typeof lease === 'undefined') {
    return undefined
  } else if (typeof lease === 'object' && lease.constructor === Uint8Array) {
    if (lease.length === 0 || lease.length > 32) {
      throw new Error(
        `Received invalid lease; expected something with length between 1 and 32, but received bytes with length ${lease.length}`,
      )
    }
    if (lease.length === 32) return lease
    const lease32 = new Uint8Array(32)
    lease32.set(lease, 0)
    return lease32
  } else if (typeof lease === 'string') {
    if (lease.length === 0 || lease.length > 32) {
      throw new Error(
        `Received invalid lease; expected something with length between 1 and 32, but received '${lease}' with length ${lease.length}`,
      )
    }
    const encoder = new TextEncoder()
    const lease32 = new Uint8Array(32)
    lease32.set(encoder.encode(lease), 0)
    return lease32
  } else {
    throw new Error(`Unknown lease type received of ${typeof lease}`)
  }
}

/**
 * Returns the public address of the given transaction sender.
 * @param sender A transaction sender
 * @returns The public address
 */
export const getSenderAddress = function (sender: SendTransactionFrom) {
  return 'addr' in sender ? sender.addr : sender.address()
}

const memoize = <T = unknown, R = unknown>(fn: (val: T) => R) => {
  const cache = new Map()
  const cached = function (this: unknown, val: T) {
    return cache.has(val) ? cache.get(val) : cache.set(val, fn.call(this, val)) && cache.get(val)
  }
  cached.cache = cache
  return cached as (val: T) => R
}

/**
 * Given a transaction in a variety of supported formats, returns a TransactionWithSigner object ready to be passed to an
 * AtomicTransactionComposer's addTransaction method.
 * @param transaction One of: A TransactionWithSigner object (returned as is), a TransactionToSign object (signer is obtained from the
 * signer property), a Transaction object (signer is extracted from the defaultSender parameter), an async SendTransactionResult returned by
 * one of algokit utils' helpers (signer is obtained from the defaultSender parameter)
 * @param defaultSender The default sender to be used to obtain a signer where the object provided to the transaction parameter does not
 * include a signer.
 * @returns A TransactionWithSigner object.
 */
export const getTransactionWithSigner = async (
  transaction: TransactionWithSigner | TransactionToSign | Transaction | Promise<SendTransactionResult>,
  defaultSender?: SendTransactionFrom,
): Promise<TransactionWithSigner> => {
  if ('txn' in transaction) return transaction
  if (defaultSender === undefined)
    throw new Error('Default sender must be provided when passing in a transaction object that does not contain its own signer')
  return transaction instanceof Promise
    ? {
        txn: (await transaction).transaction,
        signer: getSenderTransactionSigner(defaultSender),
      }
    : 'transaction' in transaction
    ? {
        txn: transaction.transaction,
        signer: getSenderTransactionSigner(transaction.signer),
      }
    : {
        txn: transaction,
        signer: getSenderTransactionSigner(defaultSender),
      }
}

/**
 * Returns a `TransactionSigner` for the given transaction sender.
 * This function has memoization, so will return the same transaction signer for a given sender.
 * @param sender A transaction sender
 * @returns A transaction signer
 */
export const getSenderTransactionSigner = memoize(function (sender: SendTransactionFrom): TransactionSigner {
  return 'signer' in sender
    ? sender.signer
    : 'lsig' in sender
    ? algosdk.makeLogicSigAccountTransactionSigner(sender)
    : algosdk.makeBasicAccountTransactionSigner(sender)
})

/**
 * Signs a single transaction by the given signer.
 * @param transaction The transaction to sign
 * @param signer The signer to sign
 * @returns The signed transaction as a `Uint8Array`
 */
export const signTransaction = async (transaction: Transaction, signer: SendTransactionFrom) => {
  return 'sk' in signer
    ? transaction.signTxn(signer.sk)
    : 'lsig' in signer
    ? algosdk.signLogicSigTransactionObject(transaction, signer).blob
    : 'sign' in signer
    ? signer.sign(transaction)
    : (await signer.signer([transaction], [0]))[0]
}

/** Prepares a transaction for sending and then (if instructed) signs and sends the given transaction to the chain.
 *
 * @param send The details for the transaction to prepare/send, including:
 *   * `transaction`: The unsigned transaction
 *   * `from`: The account to sign the transaction with: either an account with private key loaded or a logic signature account
 *   * `config`: The sending configuration for this transaction
 * @param algod An algod client
 *
 * @returns An object with transaction (`transaction`) and (if `skipWaiting` is `false` or `undefined`) confirmation (`confirmation`)
 */
export const sendTransaction = async function (
  send: {
    transaction: Transaction
    from: SendTransactionFrom
    sendParams?: SendTransactionParams
  },
  algod: Algodv2,
): Promise<SendTransactionResult> {
  const { transaction, from, sendParams } = send
  const { skipSending, skipWaiting, fee, maxFee, suppressLog, maxRoundsToWaitForConfirmation, atc } = sendParams ?? {}

  controlFees(transaction, { fee, maxFee })

  if (atc) {
    atc.addTransaction({ txn: transaction, signer: getSenderTransactionSigner(from) })
    return { transaction }
  }

  if (skipSending) {
    return { transaction }
  }

  let txnToSend = transaction

  // Pack resources if the transaction is an appcall and packResources wasn't explicitly set to false
  if (txnToSend.type === algosdk.TransactionType.appl && sendParams?.packResources !== false) {
    const newAtc = new AtomicTransactionComposer()
    newAtc.addTransaction({ txn: txnToSend, signer: getSenderTransactionSigner(from) })
    const packed = await packResources(algod, newAtc)
    txnToSend = packed.buildGroup()[0].txn
  }

  const signedTransaction = await signTransaction(txnToSend, from)

  await algod.sendRawTransaction(signedTransaction).do()

  Config.getLogger(suppressLog).info(`Sent transaction ID ${txnToSend.txID()} ${txnToSend.type} from ${getSenderAddress(from)}`)

  let confirmation: modelsv2.PendingTransactionResponse | undefined = undefined
  if (!skipWaiting) {
    confirmation = await waitForConfirmation(txnToSend.txID(), maxRoundsToWaitForConfirmation ?? 5, algod)
  }

  return { transaction: txnToSend, confirmation }
}

/**
 * Get all of the unamed resources used by the group in the given ATC
 *
 * @param algod The algod client to use for the simulation
 * @param atc The ATC containing the txn group
 * @returns The unnamed resources accessed by the group and by each transaction in the group
 */
export async function getUnnamedResourcesAccessed(algod: algosdk.Algodv2, atc: algosdk.AtomicTransactionComposer) {
  const simReq = new algosdk.modelsv2.SimulateRequest({
    txnGroups: [],
    allowUnnamedResources: true,
  })

  const result = await atc.simulate(algod, simReq)

  const groupResponse = result.simulateResponse.txnGroups[0]

  if (groupResponse.failureMessage) {
    throw Error(`Error during resource packing simulation in transaction ${groupResponse.failedAt}: ${groupResponse.failureMessage}`)
  }

  return {
    group: groupResponse.unnamedResourcesAccessed,
    txns: groupResponse.txnResults.map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (t: any) => t.unnamedResourcesAccessed,
    ) as algosdk.modelsv2.SimulateUnnamedResourcesAccessed[],
  }
}

/**
 * Take an existing ATC and return a new ATC with packed resources
 *
 * @param algod The algod client to use for the simulation
 * @param atc The ATC containing the txn group
 * @returns A new ATC with the resources packed into the transactions
 *
 * @privateRemarks
 *
 * This entire function will eventually be implemented in simulate upstream in algod. The simulate endpoint will return
 * an array of refference arrays for each transaction, so this eventually will eventually just call simulate and set the
 * reference arraysm in the transactions to the reference arrays returned by simulate.
 *
 * See https://github.com/algorand/go-algorand/pull/5684
 *
 */
export async function packResources(algod: algosdk.Algodv2, atc: algosdk.AtomicTransactionComposer) {
  const unnamedResourcesAccessed = await getUnnamedResourcesAccessed(algod, atc)
  const group = atc.buildGroup()

  unnamedResourcesAccessed.txns.forEach((r, i) => {
    if (r === undefined) return

    if (r.boxes || r.extraBoxRefs) throw Error('Unexpected boxes at the transaction level')
    if (r.appLocals) throw Error('Unexpected app local at the transaction level')
    if (r.assetHoldings) throw Error('Unexpected asset holding at the transaction level')

    // Do accounts first because the account limit is 4
    r.accounts?.forEach((a) => {
      group[i].txn.appAccounts?.push(algosdk.decodeAddress(a))
    })

    r.apps?.forEach((a) => {
      group[i].txn.appForeignApps?.push(Number(a))
    })

    r.assets?.forEach((a) => {
      group[i].txn.appForeignAssets?.push(Number(a))
    })

    const accounts = group[i].txn.appAccounts?.length || 0
    if (accounts > MAX_ACCOUNT_REFERENCES) throw Error(`Account reference limit of ${MAX_ACCOUNT_REFERENCES} exceeded in transaction ${i}`)

    const assets = group[i].txn.appForeignAssets?.length || 0
    const apps = group[i].txn.appForeignApps?.length || 0
    const boxes = group[i].txn.boxes?.length || 0

    if (accounts + assets + apps + boxes > MAX_REFERENCES) {
      throw Error(`Resource reference limit of ${MAX_REFERENCES} exceeded in transaction ${i}`)
    }
  })

  const findTxnBelowRefLimit = (
    txns: algosdk.TransactionWithSigner[],
    type: 'account' | 'assetHolding' | 'appLocal' | 'other' = 'other',
  ) => {
    const txnIndex = txns.findIndex((t) => {
      const accounts = t.txn.appAccounts?.length || 0
      if (type === 'account') return accounts < MAX_ACCOUNT_REFERENCES

      const assets = t.txn.appForeignAssets?.length || 0
      const apps = t.txn.appForeignApps?.length || 0
      const boxes = t.txn.boxes?.length || 0

      if (type === 'assetHolding' || type === 'appLocal') {
        return accounts + assets + apps + boxes < MAX_REFERENCES - 1 && accounts < MAX_ACCOUNT_REFERENCES
      }

      return accounts + assets + apps + boxes < MAX_REFERENCES
    })

    if (txnIndex === -1) {
      throw Error('No more transactions below reference limit. Add another app call to the group.')
    }

    return txnIndex
  }

  const g = unnamedResourcesAccessed.group

  if (g) {
    // Do cross-reference resources first because they are the most restrictive in terms
    // of which transactions can be used
    g.appLocals?.forEach((a) => {
      const txnIndex = findTxnBelowRefLimit(group, 'appLocal')
      group[txnIndex].txn.appForeignApps?.push(Number(a.app))
      group[txnIndex].txn.appAccounts?.push(algosdk.decodeAddress(a.account))
    })

    g.assetHoldings?.forEach((a) => {
      const txnIndex = findTxnBelowRefLimit(group, 'assetHolding')
      group[txnIndex].txn.appForeignAssets?.push(Number(a.asset))
      group[txnIndex].txn.appAccounts?.push(algosdk.decodeAddress(a.account))
    })

    // Do accounts next because the account limit is 4
    g.accounts?.forEach((a) => {
      const txnIndex = findTxnBelowRefLimit(group, 'account')
      group[txnIndex].txn.appAccounts?.push(algosdk.decodeAddress(a))
    })

    g.boxes?.forEach((b) => {
      const txnIndex = findTxnBelowRefLimit(group)
      group[txnIndex].txn.boxes?.push({ appIndex: Number(b.app), name: b.name })
    })

    g.assets?.forEach((a) => {
      const txnIndex = findTxnBelowRefLimit(group)
      group[txnIndex].txn.appForeignAssets?.push(Number(a))
    })

    g.apps?.forEach((a) => {
      const txnIndex = findTxnBelowRefLimit(group)
      group[txnIndex].txn.appForeignApps?.push(Number(a))
    })

    if (g.extraBoxRefs) {
      for (let i = 0; i < g.extraBoxRefs; i += 1) {
        const txnIndex = findTxnBelowRefLimit(group)
        group[txnIndex].txn.boxes?.push({ appIndex: 0, name: new Uint8Array(0) })
      }
    }
  }

  const newAtc = new algosdk.AtomicTransactionComposer()

  group.forEach((t) => {
    // eslint-disable-next-line no-param-reassign
    t.txn.group = undefined
    newAtc.addTransaction(t)
  })

  return newAtc
}

/**
 * Signs and sends transactions that have been collected by an `AtomicTransactionComposer`.
 * @param atcSend The parameters controlling the send, including:
 *  * `atc` The `AtomicTransactionComposer`
 *  * `sendParams` The parameters to control the send behaviour
 * @param algod An algod client
 * @returns An object with transaction IDs, transactions, group transaction ID (`groupTransactionId`) if more than 1 transaction sent, and (if `skipWaiting` is `false` or unset) confirmation (`confirmation`)
 */
export const sendAtomicTransactionComposer = async function (atcSend: AtomicTransactionComposerToSend, algod: Algodv2) {
  const { atc: givenAtc, sendParams } = atcSend

  let atc: AtomicTransactionComposer

  const hasAppCalls = () =>
    givenAtc
      .buildGroup()
      .map((t) => t.txn.type)
      .includes(algosdk.TransactionType.appl)

  // If packResources is true OR if packResources is undefined and there are app calls, then pack resources
  if (sendParams?.packResources || (sendParams?.packResources === undefined && hasAppCalls())) {
    atc = await packResources(algod, givenAtc)
  } else {
    atc = givenAtc
  }

  const transactionsWithSigner = atc.buildGroup()

  const transactionsToSend = transactionsWithSigner.map((t) => {
    return t.txn
  })
  let groupId: string | undefined = undefined
  if (transactionsToSend.length > 1) {
    groupId = transactionsToSend[0].group ? Buffer.from(transactionsToSend[0].group).toString('base64') : ''
    Config.getLogger(sendParams?.suppressLog).info(`Sending group of ${transactionsToSend.length} transactions (${groupId})`, {
      transactionsToSend,
    })

    Config.getLogger(sendParams?.suppressLog).debug(
      `Transaction IDs (${groupId})`,
      transactionsToSend.map((t) => t.txID()),
    )
  }

  try {
    const result = await atc.execute(algod, sendParams?.maxRoundsToWaitForConfirmation ?? 5)

    if (transactionsToSend.length > 1) {
      Config.getLogger(sendParams?.suppressLog).info(`Group transaction (${groupId}) sent with ${transactionsToSend.length} transactions`)
    } else {
      Config.getLogger(sendParams?.suppressLog).info(
        `Sent transaction ID ${transactionsToSend[0].txID()} ${transactionsToSend[0].type} from ${algosdk.encodeAddress(
          transactionsToSend[0].from.publicKey,
        )}`,
      )
    }

    let confirmations: modelsv2.PendingTransactionResponse[] | undefined = undefined
    if (!sendParams?.skipWaiting) {
      confirmations = await Promise.all(
        transactionsToSend.map(async (t) =>
          modelsv2.PendingTransactionResponse.from_obj_for_encoding(await algod.pendingTransactionInformation(t.txID()).do()),
        ),
      )
    }

    return {
      groupId,
      confirmations,
      txIds: transactionsToSend.map((t) => t.txID()),
      transactions: transactionsToSend,
      returns: result.methodResults.map(
        (r) =>
          ({
            decodeError: r.decodeError,
            returnValue: r.returnValue,
            rawReturnValue: r.rawReturnValue,
          }) as ABIReturn,
      ),
    } as SendAtomicTransactionComposerResults
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    Config.logger.info('Received error executing Atomic Transaction Composer, for more information enable the debug flag')
    if (Config.debug && typeof e === 'object') {
      e.traces = []
      Config.logger.debug(
        'Received error executing Atomic Transaction Composer and debug flag enabled; attempting simulation to get more information',
      )
      const simulate = await performAtomicTransactionComposerSimulate(atc, algod)
      if (simulate.txnGroups[0].failedAt) {
        for (const txn of simulate.txnGroups[0].txnResults) {
          e.traces.push({
            trace: txn.execTrace?.get_obj_for_encoding(),
            appBudget: txn.appBudgetConsumed,
            logicSigBudget: txn.logicSigBudgetConsumed,
            logs: txn.txnResult.logs,
            message: simulate.txnGroups[0].failureMessage,
          })
        }
      }
    }
    throw e
  }
}

/**
 * Performs a dry run of the transactions loaded into the given AtomicTransactionComposer`
 * @param atc The AtomicTransactionComposer` with transaction(s) loaded
 * @param algod An Algod client
 * @returns The dryrun result
 */
export async function performAtomicTransactionComposerDryrun(atc: AtomicTransactionComposer, algod: Algodv2) {
  const signedTransactions = await atc.gatherSignatures()
  const txns = signedTransactions.map((t) => {
    return algosdk.decodeSignedTransaction(t)
  })
  const dryrun = await algosdk.createDryrun({ client: algod, txns })
  return new algosdk.DryrunResult(await algod.dryrun(dryrun).do())
}

/**
 * Performs a simulation of the transactions loaded into the given AtomicTransactionComposer.
 * @param atc The AtomicTransactionComposer with transaction(s) loaded.
 * @param algod An Algod client to perform the simulation.
 * @returns The simulation result, which includes various details about how the transactions would be processed.
 */
export async function performAtomicTransactionComposerSimulate(atc: AtomicTransactionComposer, algod: Algodv2) {
  const unsignedTransactionsSigners = atc.buildGroup()
  const decodedSignedTransactions = unsignedTransactionsSigners.map((ts) => algosdk.encodeUnsignedSimulateTransaction(ts.txn))

  const simulateRequest = new modelsv2.SimulateRequest({
    allowEmptySignatures: true,
    allowMoreLogging: true,
    execTraceConfig: new modelsv2.SimulateTraceConfig({
      enable: true,
      scratchChange: true,
      stackChange: true,
    }),
    txnGroups: [
      new modelsv2.SimulateRequestTransactionGroup({
        txns: decodedSignedTransactions.map((txn) => algosdk.decodeObj(txn)) as EncodedSignedTransaction[],
      }),
    ],
  })
  const simulateResult = await algod.simulateTransactions(simulateRequest).do()
  return simulateResult
}

/**
 * Signs and sends a group of [up to 16](https://developer.algorand.org/docs/get-details/atomic_transfers/#create-transactions) transactions to the chain
 *
 * @param groupSend The group details to send, with:
 *   * `transactions`: The array of transactions to send along with their signing account
 *   * `sendParams`: The parameters to dictate how the group is sent
 * @param algod An algod client
 * @returns An object with transaction IDs, transactions, group transaction ID (`groupTransactionId`) if more than 1 transaction sent, and (if `skipWaiting` is `false` or unset) confirmation (`confirmation`)
 */
export const sendGroupOfTransactions = async function (groupSend: TransactionGroupToSend, algod: Algodv2) {
  const { transactions, signer, sendParams } = groupSend

  const defaultTransactionSigner = signer ? getSenderTransactionSigner(signer) : undefined

  const transactionsWithSigner = await Promise.all(
    transactions.map(async (t) => {
      if ('signer' in t)
        return {
          txn: t.transaction,
          signer: getSenderTransactionSigner(t.signer),
          sender: t.signer,
        }

      const txn = 'then' in t ? (await t).transaction : t
      if (!signer) {
        throw new Error(`Attempt to send transaction ${txn.txID()} as part of a group transaction, but no signer parameter was provided.`)
      }

      return {
        txn,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        signer: defaultTransactionSigner!,
        sender: signer,
      }
    }),
  )

  const atc = new AtomicTransactionComposer()
  transactionsWithSigner.forEach((txn) => atc.addTransaction(txn))

  return (await sendAtomicTransactionComposer({ atc, sendParams }, algod)) as Omit<SendAtomicTransactionComposerResults, 'returns'>
}

/**
 * Wait until the transaction is confirmed or rejected, or until `timeout`
 * number of rounds have passed.
 *
 * @param algod An algod client
 * @param transactionId The transaction ID to wait for
 * @param maxRoundsToWait Maximum number of rounds to wait
 *
 * @return Pending transaction information
 * @throws Throws an error if the transaction is not confirmed or rejected in the next `timeout` rounds
 */
export const waitForConfirmation = async function (
  transactionId: string,
  maxRoundsToWait: number | bigint,
  algod: Algodv2,
): Promise<modelsv2.PendingTransactionResponse> {
  if (maxRoundsToWait < 0) {
    throw new Error(`Invalid timeout, received ${maxRoundsToWait}, expected > 0`)
  }

  // Get current round
  const status = modelsv2.NodeStatusResponse.from_obj_for_encoding(await algod.status().do())
  if (status === undefined) {
    throw new Error('Unable to get node status')
  }

  // Loop for up to `timeout` rounds looking for a confirmed transaction
  const startRound = BigInt(status.lastRound) + 1n
  let currentRound = startRound
  while (currentRound < startRound + BigInt(maxRoundsToWait)) {
    try {
      const pendingInfo = modelsv2.PendingTransactionResponse.from_obj_for_encoding(
        await algod.pendingTransactionInformation(transactionId).do(),
      )
      if (pendingInfo !== undefined) {
        const confirmedRound = pendingInfo.confirmedRound
        if (confirmedRound && confirmedRound > 0) {
          return pendingInfo
        } else {
          const poolError = pendingInfo.poolError
          if (poolError != null && poolError.length > 0) {
            // If there was a pool error, then the transaction has been rejected!
            throw new Error(`Transaction ${transactionId} was rejected; pool error: ${poolError}`)
          }
        }
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: unknown) {
      if ((e as Error).name === 'URLTokenBaseHTTPError') {
        currentRound++
        continue
      }
    }

    await algod.statusAfterBlock(toNumber(currentRound)).do()
    currentRound++
  }

  throw new Error(`Transaction ${transactionId} not confirmed after ${maxRoundsToWait} rounds`)
}

/**
 * Limit the acceptable fee to a defined amount of µALGOs.
 * This also sets the transaction to be flatFee to ensure the transaction only succeeds at
 * the estimated rate.
 * @param transaction The transaction to cap or suggested params object about to be used to create a transaction
 * @param maxAcceptableFee The maximum acceptable fee to pay
 */
export function capTransactionFee(transaction: algosdk.Transaction | SuggestedParams, maxAcceptableFee: AlgoAmount) {
  // If a flat fee hasn't already been defined
  if (!transaction.flatFee) {
    // Once a transaction has been constructed by algosdk, transaction.fee indicates what the total transaction fee
    // Will be based on the current suggested fee-per-byte value.
    if (transaction.fee > maxAcceptableFee.microAlgos) {
      throw new Error(
        `Cancelled transaction due to high network congestion fees. Algorand suggested fees would cause this transaction to cost ${transaction.fee} µALGOs. Cap for this transaction is ${maxAcceptableFee.microAlgos} µALGOs.`,
      )
    } else if (transaction.fee > algosdk.ALGORAND_MIN_TX_FEE) {
      Config.logger.warn(`Algorand network congestion fees are in effect. This transaction will incur a fee of ${transaction.fee} µALGOs.`)
    }

    // Now set the flat on the transaction. Otherwise the network may increase the fee above our cap and perform the transaction.
    transaction.flatFee = true
  }
}

/**
 * Allows for control of fees on a `Transaction` or `SuggestedParams` object
 * @param transaction The transaction or suggested params
 * @param feeControl The fee control parameters
 */
export function controlFees<T extends SuggestedParams | Transaction>(
  transaction: T,
  feeControl: { fee?: AlgoAmount; maxFee?: AlgoAmount },
) {
  const { fee, maxFee } = feeControl
  if (fee) {
    transaction.fee = fee.microAlgos
    transaction.flatFee = true
  }

  if (maxFee !== undefined) {
    capTransactionFee(transaction, maxFee)
  }

  return transaction
}

/**
 * Returns suggested transaction parameters from algod unless some are already provided.
 * @param params Optionally provide parameters to use
 * @param algod Algod algod
 * @returns The suggested transaction parameters
 */
export async function getTransactionParams(params: SuggestedParams | undefined, algod: Algodv2) {
  return params ? { ...params } : await algod.getTransactionParams().do()
}

/**
 * Returns the array of transactions currently present in the given `AtomicTransactionComposer`
 * @param atc The atomic transaction composer
 * @returns The array of transactions with signers
 */
export function getAtomicTransactionComposerTransactions(atc: AtomicTransactionComposer) {
  try {
    return atc.clone().buildGroup()
  } catch {
    return []
  }
}
