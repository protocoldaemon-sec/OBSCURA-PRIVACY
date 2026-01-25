//! SIP Vault Program for Solana
//!
//! Asset custody with commitment-based access control.
//! Mirrors the EVM SIPVault.sol functionality:
//! - Deposit SOL/SPL tokens with commitment tracking
//! - Withdrawal via authorized settlement
//! - Replay protection via used commitments
//!
//! Key security properties:
//! - Assets can only be released with valid authorization
//! - Commitments can only be used once (replay protection)
//! - Settlement contract is the only authority for releases

use anchor_lang::prelude::*;
use anchor_lang::solana_program::keccak;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

#[cfg(not(feature = "no-entrypoint"))]
use solana_security_txt::security_txt;

#[cfg(not(feature = "no-entrypoint"))]
security_txt! {
    name: "SIP Vault",
    project_url: "https://daemonprotocol.com",
    contacts: "email:admin@daemonprotocol.com",
    policy: "https://daemonprotocol.com/security",
    preferred_languages: "en",
    auditors: "None"
}

declare_id!("VauLt1111111111111111111111111111111111111");

pub mod error;
pub mod instructions;
pub mod state;

use instructions::*;

#[program]
pub mod sip_vault {
    use super::*;

    /// Initialize the vault state
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        instructions::initialize(ctx)
    }

    /// Deposit native SOL to vault
    pub fn deposit_native(ctx: Context<DepositNative>, amount: u64) -> Result<()> {
        instructions::deposit_native(ctx, amount)
    }

    /// Deposit SPL tokens to vault
    pub fn deposit_token(ctx: Context<DepositToken>, amount: u64) -> Result<()> {
        instructions::deposit_token(ctx, amount)
    }

    /// Execute authorized withdrawal (SOL)
    pub fn withdraw_native(
        ctx: Context<WithdrawNative>,
        commitment: [u8; 32],
        amount: u64,
    ) -> Result<()> {
        instructions::withdraw_native(ctx, commitment, amount)
    }

    /// Execute authorized withdrawal (SPL token)
    pub fn withdraw_token(
        ctx: Context<WithdrawToken>,
        commitment: [u8; 32],
        amount: u64,
    ) -> Result<()> {
        instructions::withdraw_token(ctx, commitment, amount)
    }

    /// Set settlement authority
    pub fn set_settlement(ctx: Context<SetSettlement>, settlement: Pubkey) -> Result<()> {
        instructions::set_settlement(ctx, settlement)
    }

    /// Transfer authority (two-step pattern)
    pub fn transfer_authority(ctx: Context<TransferAuthority>, new_authority: Pubkey) -> Result<()> {
        instructions::transfer_authority(ctx, new_authority)
    }

    /// Accept authority transfer
    pub fn accept_authority(ctx: Context<AcceptAuthority>) -> Result<()> {
        instructions::accept_authority(ctx)
    }

    /// Pause the vault (emergency)
    pub fn pause(ctx: Context<Pause>) -> Result<()> {
        instructions::pause(ctx)
    }

    /// Unpause the vault
    pub fn unpause(ctx: Context<Unpause>) -> Result<()> {
        instructions::unpause(ctx)
    }
}
