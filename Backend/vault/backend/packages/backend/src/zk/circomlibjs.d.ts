/**
 * Type declarations for circomlibjs
 * Minimal types for Poseidon hash function
 */

declare module 'circomlibjs' {
  export interface Poseidon {
    (inputs: bigint[]): bigint;
    F: {
      toObject(value: bigint): bigint;
    };
  }

  export function buildPoseidon(): Promise<Poseidon>;
}
