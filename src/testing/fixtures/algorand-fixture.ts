import { getTestAccount, runWhenIndexerCaughtUp, TransactionLogger } from '../'
import { algos, getAlgoClient, getAlgoIndexerClient, getAlgoKmdClient, getDefaultLocalNetConfig, lookupTransactionById } from '../../'
import { AlgorandFixture, AlgorandFixtureConfig, AlgorandTestAutomationContext, GetTestAccountParams } from '../../types/testing'

/**
 * Creates a test fixture for automated testing against Algorand.
 * By default it tests against a default LocalNet instance, but you can pass in an algod and indexer if you want to test against, say, TestNet.
 *
 * @example ```typescript
 * const algorand = algorandFixture()
 *
 * beforeEach(algorand.beforeEach, 10_000)
 *
 * test('My test', () => {
 *     const {algod, indexer, testAccount, ...} = algorand.context
 * })
 * ```
 *
 * @param fixtureConfig The fixture configuration
 * @returns The fixture
 */
export const algorandFixture = (fixtureConfig?: AlgorandFixtureConfig): AlgorandFixture => {
  const algod = fixtureConfig?.algod ?? getAlgoClient(getDefaultLocalNetConfig('algod'))
  const indexer = fixtureConfig?.indexer ?? getAlgoIndexerClient(getDefaultLocalNetConfig('indexer'))
  const kmd = fixtureConfig?.kmd ?? getAlgoKmdClient(getDefaultLocalNetConfig('kmd'))
  let context: AlgorandTestAutomationContext

  const beforeEach = async () => {
    const transactionLogger = new TransactionLogger()
    context = {
      algod: transactionLogger.capture(algod),
      indexer: indexer,
      kmd: kmd,
      testAccount: await getTestAccount({ initialFunds: fixtureConfig?.testAccountFunding ?? algos(10), suppressLog: true }, algod, kmd),
      generateAccount: (params: GetTestAccountParams) => getTestAccount(params, algod, kmd),
      transactionLogger: transactionLogger,
      waitForIndexer: () => transactionLogger.waitForIndexer(indexer),
      waitForIndexerTransaction: (transactionId: string) => runWhenIndexerCaughtUp(() => lookupTransactionById(transactionId, indexer)),
    }
  }

  return {
    get context() {
      return context
    },
    beforeEach,
  }
}
