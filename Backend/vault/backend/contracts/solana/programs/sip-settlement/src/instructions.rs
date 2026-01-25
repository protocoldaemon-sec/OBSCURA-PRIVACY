//! Program instructions

use anchor_lang::prelude::*;
use anchor_lang::solana_program::keccak;

use crate::error::SipError;
use crate::state::*;

/// Seeds for the settlement state PDA
pub const SETTLEMENT_SEED: &[u8] = b"settlement";
pub const COMMITMENT_SEED: &[u8] = b"commitment";
pub const BATCH_SEED: &[u8] = b"batch";

/// Initialize the settlement state
#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = SettlementState::LEN,
        seeds = [SETTLEMENT_SEED],
        bump
    )]
    pub settlement_state: Account<'info, SettlementState>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
    let state = &mut ctx.accounts.settlement_state;
    state.authority = ctx.accounts.authority.key();
    state.pending_authority = Pubkey::default();
    state.current_root = [0u8; 32];
    state.batch_id = 0;
    state.executor_count = 0;
    state.executors = [Pubkey::default(); MAX_EXECUTORS];
    state.bump = ctx.bumps.settlement_state;

    msg!("Settlement state initialized");
    Ok(())
}

/// Update the Merkle root
#[derive(Accounts)]
#[instruction(new_root: [u8; 32])]
pub struct UpdateRoot<'info> {
    #[account(
        mut,
        seeds = [SETTLEMENT_SEED],
        bump = settlement_state.bump
    )]
    pub settlement_state: Account<'info, SettlementState>,

    #[account(
        init,
        payer = executor,
        space = BatchRoot::LEN,
        seeds = [BATCH_SEED, &(settlement_state.batch_id + 1).to_le_bytes()],
        bump
    )]
    pub batch_root: Account<'info, BatchRoot>,

    #[account(mut)]
    pub executor: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn update_root(ctx: Context<UpdateRoot>, new_root: [u8; 32]) -> Result<()> {
    let state = &ctx.accounts.settlement_state;
    
    // Check executor authorization
    require!(
        state.is_executor(&ctx.accounts.executor.key()),
        SipError::Unauthorized
    );

    // Check root is not zero
    require!(new_root != [0u8; 32], SipError::InvalidRoot);

    // Update state
    let state = &mut ctx.accounts.settlement_state;
    state.batch_id += 1;
    state.current_root = new_root;

    // Store batch root record
    let batch = &mut ctx.accounts.batch_root;
    batch.batch_id = state.batch_id;
    batch.root = new_root;
    batch.created_at = Clock::get()?.unix_timestamp;
    batch.executor = ctx.accounts.executor.key();
    batch.bump = ctx.bumps.batch_root;

    msg!("Root updated: batch_id={}", state.batch_id);
    Ok(())
}

/// Settle a commitment
#[derive(Accounts)]
#[instruction(commitment: [u8; 32], proof: Vec<[u8; 32]>, leaf_index: u64)]
pub struct Settle<'info> {
    #[account(
        seeds = [SETTLEMENT_SEED],
        bump = settlement_state.bump
    )]
    pub settlement_state: Account<'info, SettlementState>,

    #[account(
        init,
        payer = payer,
        space = UsedCommitment::LEN,
        seeds = [COMMITMENT_SEED, &commitment],
        bump
    )]
    pub used_commitment: Account<'info, UsedCommitment>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn settle(
    ctx: Context<Settle>,
    commitment: [u8; 32],
    proof: Vec<[u8; 32]>,
    leaf_index: u64,
) -> Result<()> {
    let state = &ctx.accounts.settlement_state;

    // Validate proof length
    require!(!proof.is_empty(), SipError::EmptyProof);
    require!(proof.len() <= MAX_PROOF_LENGTH, SipError::ProofTooLong);

    // Verify Merkle proof
    let valid = verify_merkle_proof(&commitment, &proof, leaf_index, &state.current_root);
    require!(valid, SipError::InvalidProof);

    // Mark as used (the account creation acts as replay protection)
    let used = &mut ctx.accounts.used_commitment;
    used.commitment = commitment;
    used.batch_id = state.batch_id;
    used.settled_at = Clock::get()?.unix_timestamp;
    used.executor = ctx.accounts.payer.key();
    used.bump = ctx.bumps.used_commitment;

    msg!("Commitment settled");
    Ok(())
}

/// Manage executor (add/remove)
#[derive(Accounts)]
pub struct ManageExecutor<'info> {
    #[account(
        mut,
        seeds = [SETTLEMENT_SEED],
        bump = settlement_state.bump,
        has_one = authority
    )]
    pub settlement_state: Account<'info, SettlementState>,

    pub authority: Signer<'info>,
}

pub fn add_executor(ctx: Context<ManageExecutor>, executor: Pubkey) -> Result<()> {
    let state = &mut ctx.accounts.settlement_state;

    // Check not already present
    for i in 0..state.executor_count as usize {
        require!(state.executors[i] != executor, SipError::ExecutorAlreadyExists);
    }

    // Check capacity
    require!(
        (state.executor_count as usize) < MAX_EXECUTORS,
        SipError::MaxExecutorsReached
    );

    // Add executor
    let idx = state.executor_count as usize;
    state.executors[idx] = executor;
    state.executor_count += 1;

    msg!("Executor added: {}", executor);
    Ok(())
}

pub fn remove_executor(ctx: Context<ManageExecutor>, executor: Pubkey) -> Result<()> {
    let state = &mut ctx.accounts.settlement_state;

    // Find executor index
    let mut found_idx: Option<usize> = None;
    for i in 0..state.executor_count as usize {
        if state.executors[i] == executor {
            found_idx = Some(i);
            break;
        }
    }

    let idx = found_idx.ok_or(SipError::ExecutorNotFound)?;

    // Swap with last and decrement count (more efficient than shifting)
    let last_idx = state.executor_count as usize - 1;
    if idx != last_idx {
        state.executors[idx] = state.executors[last_idx];
    }
    state.executors[last_idx] = Pubkey::default();
    state.executor_count -= 1;

    msg!("Executor removed: {}", executor);
    Ok(())
}

/// Transfer authority (two-step pattern)
#[derive(Accounts)]
pub struct TransferAuthority<'info> {
    #[account(
        mut,
        seeds = [SETTLEMENT_SEED],
        bump = settlement_state.bump,
        has_one = authority
    )]
    pub settlement_state: Account<'info, SettlementState>,

    pub authority: Signer<'info>,
}

pub fn transfer_authority(ctx: Context<TransferAuthority>, new_authority: Pubkey) -> Result<()> {
    require!(new_authority != Pubkey::default(), SipError::InvalidPendingAuthority);
    
    let state = &mut ctx.accounts.settlement_state;
    state.pending_authority = new_authority;

    msg!("Authority transfer initiated to: {}", new_authority);
    Ok(())
}

/// Accept authority transfer
#[derive(Accounts)]
pub struct AcceptAuthority<'info> {
    #[account(
        mut,
        seeds = [SETTLEMENT_SEED],
        bump = settlement_state.bump
    )]
    pub settlement_state: Account<'info, SettlementState>,

    pub new_authority: Signer<'info>,
}

pub fn accept_authority(ctx: Context<AcceptAuthority>) -> Result<()> {
    let state = &mut ctx.accounts.settlement_state;
    
    require!(
        state.pending_authority != Pubkey::default(),
        SipError::NoPendingTransfer
    );
    require!(
        ctx.accounts.new_authority.key() == state.pending_authority,
        SipError::Unauthorized
    );

    let old_authority = state.authority;
    state.authority = state.pending_authority;
    state.pending_authority = Pubkey::default();

    msg!("Authority transferred from {} to {}", old_authority, state.authority);
    Ok(())
}

/// Cancel authority transfer
#[derive(Accounts)]
pub struct CancelAuthorityTransfer<'info> {
    #[account(
        mut,
        seeds = [SETTLEMENT_SEED],
        bump = settlement_state.bump,
        has_one = authority
    )]
    pub settlement_state: Account<'info, SettlementState>,

    pub authority: Signer<'info>,
}

pub fn cancel_authority_transfer(ctx: Context<CancelAuthorityTransfer>) -> Result<()> {
    let state = &mut ctx.accounts.settlement_state;
    state.pending_authority = Pubkey::default();

    msg!("Authority transfer cancelled");
    Ok(())
}

/// Verify Merkle proof
/// 
/// Matches the TypeScript implementation with 0x01 prefix for internal nodes
fn verify_merkle_proof(
    leaf: &[u8; 32],
    proof: &[[u8; 32]],
    mut index: u64,
    root: &[u8; 32],
) -> bool {
    let mut computed_hash = *leaf;

    for sibling in proof {
        if index & 1 == 1 {
            // Current is right child
            computed_hash = hash_pair(sibling, &computed_hash);
        } else {
            // Current is left child
            computed_hash = hash_pair(&computed_hash, sibling);
        }
        index >>= 1;
    }

    computed_hash == *root
}

/// Hash two nodes together with domain separation
/// Matches TypeScript: prefix with 0x01
fn hash_pair(left: &[u8; 32], right: &[u8; 32]) -> [u8; 32] {
    let mut data = [0u8; 65];
    data[0] = 0x01;
    data[1..33].copy_from_slice(left);
    data[33..65].copy_from_slice(right);
    keccak::hash(&data).to_bytes()
}
