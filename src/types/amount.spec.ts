import { describe, expect, test } from '@jest/globals'
import { algos, microAlgos, transactionFees } from '../'

describe('amount', () => {
  test('toString on 1', () => {
    expect(`${microAlgos(1)}`).toBe(`1 µALGO`)
  })
  test('toString on big amount', () => {
    expect(`${algos(100)}`).toBe(`100,000,000 µALGOs`)
  })
  test('value coersion to microalgos', () => {
    expect(+microAlgos(100)).toBe(100)
  })
  test('microalgos to microalgos', () => {
    expect(microAlgos(100).microAlgos).toBe(100)
  })
  test('algos to microalgos', () => {
    expect(algos(100).microAlgos).toBe(100_000_000)
  })
  test('algos to algos', () => {
    expect(algos(100).algos).toBe(100)
  })
  test('small microalgos to algos', () => {
    expect(microAlgos(1000).algos).toBe(0.001)
  })
  test('large microalgos to algos', () => {
    expect(microAlgos(100_000_000).algos).toBe(100)
  })
  test('single transaction fee', () => {
    expect(transactionFees(1).microAlgos).toBe(1_000)
  })
  test('multiple transaction fees', () => {
    expect(transactionFees(10).microAlgos).toBe(10_000)
  })
})
