//! Vault instructions

use anchor_lang::prelude::*;
use anchor_lang::solana_program::{keccak, system_instruction};
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

use crate::error::VaultError;
use crate::state::*;

/// Seeds for PDAs
pub const VAULT_SEED: &[u8] = b"sip_vault";
pub const DEPOSIT_SEED: &[u8] = b"deposit";
pub const COMMITMENT_SEED: &[u8] = b"used_commitment";
pub const TOKEN_VAULT_SEED: &[u8] = b"token_vault";

// ============ Initialize ============

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = VaultState::LEN,
        seeds = [VAULT_SEED],
        bump
    )]
    pub vault_state: Account<'info, VaultState>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
    let state = &mut ctx.accounts.vault_state;
    state.authority = ctx.accounts.authority.key();
    state.pending_authority = Pubkey::default();
    state.settlement = ctx.accounts.authority.key(); // Initially, authority is also settlement
    state.sol_balance = 0;
    state.deposit_nonce = 0;
    state.withdrawal_nonce = 0;
    state.paused = false;
    state.bump = ctx.bumps.vault_state;

    msg!("Vault initialized. Authority: {}", state.authority);
    Ok(())
}

// ============ Deposit Native SOL ============

#[derive(Accounts)]
#[instruction(amount: u64)]
pub struct DepositNative<'info> {
    #[account(
        mut,
        seeds = [VAULT_SEED],
        bump = vault_state.bump
    )]
    pub vault_state: Account<'info, VaultState>,

    #[account(
        init,
        payer = depositor,
        space = DepositRecord::LEN,
        seeds = [DEPOSIT_SEED, &(vault_state.deposit_nonce + 1).to_le_bytes()],
        bump
    )]
    pub deposit_record: Account<'info, DepositRecord>,

    #[account(mut)]
    pub depositor: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn deposit_native(ctx: Context<DepositNative>, amount: u64) -> Result<()> {
    let state = &ctx.accounts.vault_state;
    
    // Check not paused
    require!(!state.paused, VaultError::VaultPaused);
    require!(amount > 0, VaultError::InvalidAmount);

    // Transfer SOL to vault PDA
    let ix = system_instruction::transfer(
        &ctx.accounts.depositor.key(),
        &ctx.accounts.vault_state.key(),
        amount,
    );
    anchor_lang::solana_program::program::invoke(
        &ix,
        &[
            ctx.accounts.depositor.to_account_info(),
            ctx.accounts.vault_state.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
        ],
    )?;

    // Update state
    let state = &mut ctx.accounts.vault_state;
    state.deposit_nonce += 1;
    state.sol_balance = state.sol_balance.checked_add(amount).ok_or(VaultError::Overflow)?;

    // Compute commitment
    let commitment = compute_deposit_commitment(
        &ctx.accounts.depositor.key(),
        amount,
        &Pubkey::default(), // SOL = default pubkey
        state.deposit_nonce,
        Clock::get()?.unix_timestamp,
    );

    // Store deposit record
    let record = &mut ctx.accounts.deposit_record;
    record.commitment = commitment;
    record.depositor = ctx.accounts.depositor.key();
    record.amount = amount;
    record.token_mint = Pubkey::default();
    record.deposited_at = Clock::get()?.unix_timestamp;
    record.nonce = state.deposit_nonce;
    record.bump = ctx.bumps.deposit_record;

    msg!("Deposited {} lamports. Commitment: {:?}", amount, commitment);
    Ok(())
}

// ============ Deposit SPL Token ============

#[derive(Accounts)]
#[instruction(amount: u64)]
pub struct DepositToken<'info> {
    #[account(
        mut,
        seeds = [VAULT_SEED],
        bump = vault_state.bump
    )]
    pub vault_state: Account<'info, VaultState>,

    #[account(
        init,
        payer = depositor,
        space = DepositRecord::LEN,
        seeds = [DEPOSIT_SEED, &(vault_state.deposit_nonce + 1).to_le_bytes()],
        bump
    )]
    pub deposit_record: Account<'info, DepositRecord>,

    #[account(mut)]
    pub depositor: Signer<'info>,

    #[account(mut)]
    pub depositor_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub vault_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn deposit_token(ctx: Context<DepositToken>, amount: u64) -> Result<()> {
    let state = &ctx.accounts.vault_state;
    
    require!(!state.paused, VaultError::VaultPaused);
    require!(amount > 0, VaultError::InvalidAmount);

    // Transfer tokens to vault
    let cpi_accounts = Transfer {
        from: ctx.accounts.depositor_token_account.to_account_info(),
        to: ctx.accounts.vault_token_account.to_account_info(),
        authority: ctx.accounts.depositor.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    token::transfer(cpi_ctx, amount)?;

    // Update state
    let state = &mut ctx.accounts.vault_state;
    state.deposit_nonce += 1;

    // Compute commitment
    let mint = ctx.accounts.depositor_token_account.mint;
    let commitment = compute_deposit_commitment(
        &ctx.accounts.depositor.key(),
        amount,
        &mint,
        state.deposit_nonce,
        Clock::get()?.unix_timestamp,
    );

    // Store deposit record
    let record = &mut ctx.accounts.deposit_record;
    record.commitment = commitment;
    record.depositor = ctx.accounts.depositor.key();
    record.amount = amount;
    record.token_mint = mint;
    record.deposited_at = Clock::get()?.unix_timestamp;
    record.nonce = state.deposit_nonce;
    record.bump = ctx.bumps.deposit_record;

    msg!("Deposited {} tokens. Commitment: {:?}", amount, commitment);
    Ok(())
}

// ============ Withdraw Native SOL ============

#[derive(Accounts)]
#[instruction(commitment: [u8; 32], amount: u64)]
pub struct WithdrawNative<'info> {
    #[account(
        mut,
        seeds = [VAULT_SEED],
        bump = vault_state.bump
    )]
    pub vault_state: Account<'info, VaultState>,

    #[account(
        init,
        payer = executor,
        space = UsedCommitment::LEN,
        seeds = [COMMITMENT_SEED, &commitment],
        bump
    )]
    pub used_commitment: Account<'info, UsedCommitment>,

    /// CHECK: Recipient receives SOL
    #[account(mut)]
    pub recipient: AccountInfo<'info>,

    #[account(mut)]
    pub executor: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn withdraw_native(
    ctx: Context<WithdrawNative>,
    commitment: [u8; 32],
    amount: u64,
) -> Result<()> {
    let state = &ctx.accounts.vault_state;
    
    // Check authorization
    require!(
        state.is_authorized(&ctx.accounts.executor.key()),
        VaultError::Unauthorized
    );
    require!(!state.paused, VaultError::VaultPaused);
    require!(amount > 0, VaultError::InvalidAmount);
    require!(state.sol_balance >= amount, VaultError::InsufficientBalance);

    // Transfer SOL from vault PDA to recipient
    let vault_state_info = ctx.accounts.vault_state.to_account_info();
    **vault_state_info.try_borrow_mut_lamports()? -= amount;
    **ctx.accounts.recipient.try_borrow_mut_lamports()? += amount;

    // Update state
    let state = &mut ctx.accounts.vault_state;
    state.sol_balance = state.sol_balance.checked_sub(amount).ok_or(VaultError::Overflow)?;
    state.withdrawal_nonce += 1;

    // Mark commitment as used
    let used = &mut ctx.accounts.used_commitment;
    used.commitment = commitment;
    used.used_at = Clock::get()?.unix_timestamp;
    used.executor = ctx.accounts.executor.key();
    used.amount = amount;
    used.recipient = ctx.accounts.recipient.key();
    used.bump = ctx.bumps.used_commitment;

    msg!("Withdrawn {} lamports to {}. Commitment: {:?}", 
        amount, ctx.accounts.recipient.key(), commitment);
    Ok(())
}

// ============ Withdraw SPL Token ============

#[derive(Accounts)]
#[instruction(commitment: [u8; 32], amount: u64)]
pub struct WithdrawToken<'info> {
    #[account(
        mut,
        seeds = [VAULT_SEED],
        bump = vault_state.bump
    )]
    pub vault_state: Account<'info, VaultState>,

    #[account(
        init,
        payer = executor,
        space = UsedCommitment::LEN,
        seeds = [COMMITMENT_SEED, &commitment],
        bump
    )]
    pub used_commitment: Account<'info, UsedCommitment>,

    #[account(mut)]
    pub vault_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub recipient_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub executor: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn withdraw_token(
    ctx: Context<WithdrawToken>,
    commitment: [u8; 32],
    amount: u64,
) -> Result<()> {
    let state = &ctx.accounts.vault_state;
    
    require!(
        state.is_authorized(&ctx.accounts.executor.key()),
        VaultError::Unauthorized
    );
    require!(!state.paused, VaultError::VaultPaused);
    require!(amount > 0, VaultError::InvalidAmount);

    // Transfer tokens from vault to recipient
    let seeds = &[VAULT_SEED, &[state.bump]];
    let signer = &[&seeds[..]];
    
    let cpi_accounts = Transfer {
        from: ctx.accounts.vault_token_account.to_account_info(),
        to: ctx.accounts.recipient_token_account.to_account_info(),
        authority: ctx.accounts.vault_state.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
    token::transfer(cpi_ctx, amount)?;

    // Update state
    let state = &mut ctx.accounts.vault_state;
    state.withdrawal_nonce += 1;

    // Mark commitment as used
    let used = &mut ctx.accounts.used_commitment;
    used.commitment = commitment;
    used.used_at = Clock::get()?.unix_timestamp;
    used.executor = ctx.accounts.executor.key();
    used.amount = amount;
    used.recipient = ctx.accounts.recipient_token_account.key();
    used.bump = ctx.bumps.used_commitment;

    msg!("Withdrawn {} tokens. Commitment: {:?}", amount, commitment);
    Ok(())
}

// ============ Admin Functions ============

#[derive(Accounts)]
pub struct SetSettlement<'info> {
    #[account(
        mut,
        seeds = [VAULT_SEED],
        bump = vault_state.bump,
        has_one = authority
    )]
    pub vault_state: Account<'info, VaultState>,

    pub authority: Signer<'info>,
}

pub fn set_settlement(ctx: Context<SetSettlement>, settlement: Pubkey) -> Result<()> {
    let state = &mut ctx.accounts.vault_state;
    let old_settlement = state.settlement;
    state.settlement = settlement;
    
    msg!("Settlement updated: {} -> {}", old_settlement, settlement);
    Ok(())
}

#[derive(Accounts)]
pub struct TransferAuthority<'info> {
    #[account(
        mut,
        seeds = [VAULT_SEED],
        bump = vault_state.bump,
        has_one = authority
    )]
    pub vault_state: Account<'info, VaultState>,

    pub authority: Signer<'info>,
}

pub fn transfer_authority(ctx: Context<TransferAuthority>, new_authority: Pubkey) -> Result<()> {
    require!(new_authority != Pubkey::default(), VaultError::InvalidPendingAuthority);
    
    let state = &mut ctx.accounts.vault_state;
    state.pending_authority = new_authority;
    
    msg!("Authority transfer initiated to: {}", new_authority);
    Ok(())
}

#[derive(Accounts)]
pub struct AcceptAuthority<'info> {
    #[account(
        mut,
        seeds = [VAULT_SEED],
        bump = vault_state.bump
    )]
    pub vault_state: Account<'info, VaultState>,

    pub new_authority: Signer<'info>,
}

pub fn accept_authority(ctx: Context<AcceptAuthority>) -> Result<()> {
    let state = &mut ctx.accounts.vault_state;
    
    require!(
        state.pending_authority != Pubkey::default(),
        VaultError::NoPendingTransfer
    );
    require!(
        ctx.accounts.new_authority.key() == state.pending_authority,
        VaultError::Unauthorized
    );

    let old_authority = state.authority;
    state.authority = state.pending_authority;
    state.pending_authority = Pubkey::default();

    msg!("Authority transferred: {} -> {}", old_authority, state.authority);
    Ok(())
}

#[derive(Accounts)]
pub struct Pause<'info> {
    #[account(
        mut,
        seeds = [VAULT_SEED],
        bump = vault_state.bump,
        has_one = authority
    )]
    pub vault_state: Account<'info, VaultState>,

    pub authority: Signer<'info>,
}

pub fn pause(ctx: Context<Pause>) -> Result<()> {
    let state = &mut ctx.accounts.vault_state;
    state.paused = true;
    msg!("Vault paused");
    Ok(())
}

#[derive(Accounts)]
pub struct Unpause<'info> {
    #[account(
        mut,
        seeds = [VAULT_SEED],
        bump = vault_state.bump,
        has_one = authority
    )]
    pub vault_state: Account<'info, VaultState>,

    pub authority: Signer<'info>,
}

pub fn unpause(ctx: Context<Unpause>) -> Result<()> {
    let state = &mut ctx.accounts.vault_state;
    state.paused = false;
    msg!("Vault unpaused");
    Ok(())
}

// ============ Helper Functions ============

fn compute_deposit_commitment(
    depositor: &Pubkey,
    amount: u64,
    token_mint: &Pubkey,
    nonce: u64,
    timestamp: i64,
) -> [u8; 32] {
    let mut data = Vec::with_capacity(128);
    data.extend_from_slice(b"SIP_DEPOSIT");
    data.extend_from_slice(depositor.as_ref());
    data.extend_from_slice(&amount.to_le_bytes());
    data.extend_from_slice(token_mint.as_ref());
    data.extend_from_slice(&nonce.to_le_bytes());
    data.extend_from_slice(&timestamp.to_le_bytes());
    keccak::hash(&data).to_bytes()
}
