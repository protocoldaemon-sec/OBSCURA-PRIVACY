//! Vault error definitions

use anchor_lang::prelude::*;

#[error_code]
pub enum VaultError {
    #[msg("Unauthorized access")]
    Unauthorized,

    #[msg("Vault is paused")]
    VaultPaused,

    #[msg("Commitment already used")]
    CommitmentAlreadyUsed,

    #[msg("Insufficient balance")]
    InsufficientBalance,

    #[msg("Invalid amount (must be > 0)")]
    InvalidAmount,

    #[msg("Invalid recipient")]
    InvalidRecipient,

    #[msg("No pending authority transfer")]
    NoPendingTransfer,

    #[msg("Invalid pending authority")]
    InvalidPendingAuthority,

    #[msg("Arithmetic overflow")]
    Overflow,

    #[msg("Invalid commitment")]
    InvalidCommitment,
}
