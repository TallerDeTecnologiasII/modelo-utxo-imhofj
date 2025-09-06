import { Transaction, TransactionInput } from './types';
import { UTXOPoolManager } from './utxo-pool';
import { verify } from './utils/crypto';
import {
  ValidationResult,
  ValidationError,
  VALIDATION_ERRORS,
  createValidationError
} from './errors';

export class TransactionValidator {
  constructor(private utxoPool: UTXOPoolManager) {}

  /**
   * Validate a transaction
   * @param {Transaction} transaction - The transaction to validate
   * @returns {ValidationResult} The validation result
   */
  validateTransaction(transaction: Transaction): ValidationResult {
    const errors: ValidationError[] = [];

    const utxos = new Set<string>();
    let totalInputValue = 0;
    let totalOutputValue = 0;

    for (const input of transaction.inputs) {
      
      // Existencias de UTXO
      const utxo = this.utxoPool.getUTXO(input.utxoId.txId, input.utxoId.outputIndex);
      if (!utxo) {
        errors.push(
          createValidationError(
            VALIDATION_ERRORS.UTXO_NOT_FOUND,
            `Input UTXO not found: ${input.utxoId}`
          )
        );
        continue;
      }

      // Verificacion de firma
      const txDataForSigning = this.createTransactionDataForSigning_(transaction);
      const isSignatureValid = verify(txDataForSigning, input.signature, input.owner);
      if (!isSignatureValid) {
        errors.push(
          createValidationError(
            VALIDATION_ERRORS.INVALID_SIGNATURE,
            `Invalid signature for input UTXO: ${input.utxoId}`
          )
        );
      }

      // Prevencion de doble gasto
      if (utxos.has(JSON.stringify(input.utxoId))) {
        errors.push(
          createValidationError(
            VALIDATION_ERRORS.DOUBLE_SPENDING,
            `Double spending detected for UTXO: ${input.utxoId}`
          )
        );
      } else {
        utxos.add(JSON.stringify(input.utxoId));
      }

      totalInputValue += utxo.amount;
    }

    for (const output of transaction.outputs) {
      if (output.amount < 0) {
        errors.push(
          createValidationError(
            VALIDATION_ERRORS.NEGATIVE_AMOUNT,
            `Output value must be positive: ${output.amount}`
          )
        );
      } else if (output.amount === 0) {
        errors.push(
          createValidationError(
            VALIDATION_ERRORS.ZERO_AMOUNT,
            `Output value must be greater than zero`
          )
        );
      }
      totalOutputValue += output.amount;
    }

    // Verificacion de balance
    if (totalInputValue !== totalOutputValue) {
      errors.push(
        createValidationError(
          VALIDATION_ERRORS.AMOUNT_MISMATCH,
          `Total input value (${totalInputValue}) does not total output value (${totalOutputValue})`
        )
      );
    }

    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Create a deterministic string representation of the transaction for signing
   * This excludes the signatures to prevent circular dependencies
   * @param {Transaction} transaction - The transaction to create a data for signing
   * @returns {string} The string representation of the transaction for signing
   */
  private createTransactionDataForSigning_(transaction: Transaction): string {
    const unsignedTx = {
      id: transaction.id,
      inputs: transaction.inputs.map(input => ({
        utxoId: input.utxoId,
        owner: input.owner
      })),
      outputs: transaction.outputs,
      timestamp: transaction.timestamp
    };

    return JSON.stringify(unsignedTx);
  }
}
