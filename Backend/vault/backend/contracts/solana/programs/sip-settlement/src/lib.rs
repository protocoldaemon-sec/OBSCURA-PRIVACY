//! SIP Settlement Program for Solana
//!
//! Minimal settlement program that handles:
//! - Merkle root storage (batch commitments)
//! - Replay protection (used commitments)
//! - Settlement execution
//!
//! Does NOT handle:
//! - WOTS signature verification (done off-chain)
//! - Privacy logic (handled by SIP layer)
//! - Intent details (never stored on-chain)

use anchor_lang::prelude::*;

#[cfg(not(feature = "no-entrypoint"))]
use solana_security_txt::security_txt;

#[cfg(not(feature = "no-entrypoint"))]
security_txt! {
    name: "SIP Settlement",
    project_url: "https://daemonprotocol.com",
    contacts: "email:admin@daemonprotocol.com",
    policy: "https://daemonprotocol.com/security",
    preferred_languages: "en",
    auditors: "None"
}

declare_id!("BkR8HGcC5T5UhFbCadiUQGqEF2eHCv5Kmx4hz7Anuctq");

pub mod error;
pub mod instructions;
pub mod state;

use instructions::*;

#[program]
pub mod sip_settlement {
    use super::*;

    /// Initialize the settlement state
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        instructions::initialize(ctx)
    }

    /// Update the current Merkle root (new batch)
    pub fn update_root(ctx: Context<UpdateRoot>, new_root: [u8; 32]) -> Result<()> {
        instructions::update_root(ctx, new_root)
    }

    /// Settle a single commitment
    pub fn settle(
        ctx: Context<Settle>,
        commitment: [u8; 32],
        proof: Vec<[u8; 32]>,
        leaf_index: u64,
    ) -> Result<()> {
        instructions::settle(ctx, commitment, proof, leaf_index)
    }

    /// Add an authorized executor
    pub fn add_executor(ctx: Context<ManageExecutor>, executor: Pubkey) -> Result<()> {
        instructions::add_executor(ctx, executor)
    }

    /// Remove an authorized executor
    pub fn remove_executor(ctx: Context<ManageExecutor>, executor: Pubkey) -> Result<()> {
        instructions::remove_executor(ctx, executor)
    }

    /// Start authority transfer (two-step pattern)
    pub fn transfer_authority(ctx: Context<TransferAuthority>, new_authority: Pubkey) -> Result<()> {
        instructions::transfer_authority(ctx, new_authority)
    }

    /// Accept authority transfer
    pub fn accept_authority(ctx: Context<AcceptAuthority>) -> Result<()> {
        instructions::accept_authority(ctx)
    }

    /// Cancel pending authority transfer
    pub fn cancel_authority_transfer(ctx: Context<CancelAuthorityTransfer>) -> Result<()> {
        instructions::cancel_authority_transfer(ctx)
    }
}
