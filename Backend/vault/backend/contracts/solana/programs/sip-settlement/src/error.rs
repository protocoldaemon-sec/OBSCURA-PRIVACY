//! Program errors

use anchor_lang::prelude::*;

#[error_code]
pub enum SipError {
    #[msg("Unauthorized: caller is not an authorized executor")]
    Unauthorized,

    #[msg("Invalid Merkle proof")]
    InvalidProof,

    #[msg("Commitment has already been used")]
    CommitmentAlreadyUsed,

    #[msg("Invalid root: cannot be zero")]
    InvalidRoot,

    #[msg("Maximum executors reached")]
    MaxExecutorsReached,

    #[msg("Executor not found")]
    ExecutorNotFound,

    #[msg("Executor already exists")]
    ExecutorAlreadyExists,

    #[msg("Proof too long: maximum depth is 32")]
    ProofTooLong,

    #[msg("Proof is empty")]
    EmptyProof,

    #[msg("Invalid pending authority")]
    InvalidPendingAuthority,

    #[msg("No pending authority transfer")]
    NoPendingTransfer,
}
