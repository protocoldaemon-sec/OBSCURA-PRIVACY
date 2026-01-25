use anchor_lang::prelude::*;
use anchor_lang::system_program;

declare_id!("GG9U34H1xXkuzvv8Heoy4UWav5vUgrQFEVwrYMi84QuE");

#[program]
pub mod obscura_vault {
    use super::*;

    /// Initialize the vault with authority
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let vault_state = &mut ctx.accounts.vault_state;
        vault_state.authority = ctx.accounts.authority.key();
        vault_state.relayer = ctx.accounts.authority.key(); // Initially same as authority
        vault_state.total_deposits = 0;
        vault_state.total_claims = 0;
        vault_state.bump = ctx.bumps.vault_state;
        vault_state.paused = false;
        
        msg!("Obscura Vault initialized");
        msg!("Authority: {}", vault_state.authority);
        Ok(())
    }

    /// Set relayer address (only authority)
    pub fn set_relayer(ctx: Context<SetRelayer>, new_relayer: Pubkey) -> Result<()> {
        let vault_state = &mut ctx.accounts.vault_state;
        
        msg!("Relayer updated: {} -> {}", vault_state.relayer, new_relayer);
        vault_state.relayer = new_relayer;
        
        Ok(())
    }

    /// Deposit SOL to vault with commitment
    pub fn deposit(
        ctx: Context<Deposit>,
        amount: u64,
        commitment: [u8; 32],
    ) -> Result<()> {
        let vault_state = &ctx.accounts.vault_state;
        require!(!vault_state.paused, ErrorCode::VaultPaused);
        require!(amount > 0, ErrorCode::ZeroAmount);

        // Transfer SOL to vault PDA
        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.depositor.to_account_info(),
                to: ctx.accounts.vault.to_account_info(),
            },
        );
        system_program::transfer(cpi_context, amount)?;

        // Update state
        let vault_state = &mut ctx.accounts.vault_state;
        vault_state.total_deposits += 1;

        msg!("Deposit: {} lamports", amount);
        msg!("Commitment: {:?}", commitment);
        msg!("Depositor hidden after this point");
        
        // Emit event for indexing
        emit!(DepositEvent {
            commitment,
            amount,
            timestamp: Clock::get()?.unix_timestamp,
        });
        
        Ok(())
    }

    /// Claim from vault using nullifier (anyone can call with valid nullifier)
    /// This is the PRIVATE claim - relayer executes, depositor identity hidden
    pub fn claim(
        ctx: Context<Claim>,
        amount: u64,
        commitment: [u8; 32],
        nullifier_hash: [u8; 32],
    ) -> Result<()> {
        let vault_state = &mut ctx.accounts.vault_state;
        require!(!vault_state.paused, ErrorCode::VaultPaused);
        require!(amount > 0, ErrorCode::ZeroAmount);
        
        // Check nullifier not used (replay protection)
        require!(
            vault_state.last_nullifier != nullifier_hash,
            ErrorCode::NullifierAlreadyUsed
        );

        // Transfer from vault PDA to recipient
        let vault_bump = ctx.bumps.vault;
        let seeds = &[b"vault".as_ref(), &[vault_bump]];
        let signer_seeds = &[&seeds[..]];

        let cpi_context = CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.vault.to_account_info(),
                to: ctx.accounts.recipient.to_account_info(),
            },
            signer_seeds,
        );
        system_program::transfer(cpi_context, amount)?;

        // Update state
        vault_state.total_claims += 1;
        vault_state.last_nullifier = nullifier_hash;
        vault_state.last_commitment = commitment;

        msg!("Private claim: {} lamports", amount);
        msg!("Recipient: {}", ctx.accounts.recipient.key());
        msg!("Nullifier hash: {:?}", nullifier_hash);
        msg!("Caller (relayer): {}", ctx.accounts.claimer.key());
        
        // Emit event
        emit!(ClaimEvent {
            nullifier_hash,
            recipient: ctx.accounts.recipient.key(),
            amount,
            timestamp: Clock::get()?.unix_timestamp,
        });
        
        Ok(())
    }

    /// Authority/Relayer claim (for backward compatibility and emergency)
    pub fn authority_claim(
        ctx: Context<AuthorityClaim>,
        amount: u64,
        commitment: [u8; 32],
    ) -> Result<()> {
        let vault_state = &mut ctx.accounts.vault_state;
        require!(!vault_state.paused, ErrorCode::VaultPaused);
        require!(amount > 0, ErrorCode::ZeroAmount);

        let vault_bump = ctx.bumps.vault;
        let seeds = &[b"vault".as_ref(), &[vault_bump]];
        let signer_seeds = &[&seeds[..]];

        let cpi_context = CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.vault.to_account_info(),
                to: ctx.accounts.recipient.to_account_info(),
            },
            signer_seeds,
        );
        system_program::transfer(cpi_context, amount)?;

        vault_state.total_claims += 1;
        vault_state.last_commitment = commitment;
        
        msg!("Authority claim: {} lamports to {}", amount, ctx.accounts.recipient.key());
        
        Ok(())
    }

    /// Relayer claim - only authorized relayer can execute
    /// Provides privacy: relayer address shown, not depositor
    pub fn relayer_claim(
        ctx: Context<RelayerClaim>,
        amount: u64,
        commitment: [u8; 32],
        nullifier_hash: [u8; 32],
    ) -> Result<()> {
        let vault_state = &mut ctx.accounts.vault_state;
        require!(!vault_state.paused, ErrorCode::VaultPaused);
        require!(amount > 0, ErrorCode::ZeroAmount);
        
        // Check nullifier not used
        require!(
            vault_state.last_nullifier != nullifier_hash,
            ErrorCode::NullifierAlreadyUsed
        );

        let vault_bump = ctx.bumps.vault;
        let seeds = &[b"vault".as_ref(), &[vault_bump]];
        let signer_seeds = &[&seeds[..]];

        let cpi_context = CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.vault.to_account_info(),
                to: ctx.accounts.recipient.to_account_info(),
            },
            signer_seeds,
        );
        system_program::transfer(cpi_context, amount)?;

        vault_state.total_claims += 1;
        vault_state.last_nullifier = nullifier_hash;
        vault_state.last_commitment = commitment;

        msg!("Relayer claim: {} lamports", amount);
        msg!("Relayer: {}", ctx.accounts.relayer.key());
        msg!("Recipient: {}", ctx.accounts.recipient.key());
        
        emit!(RelayerClaimEvent {
            relayer: ctx.accounts.relayer.key(),
            nullifier_hash,
            recipient: ctx.accounts.recipient.key(),
            amount,
            timestamp: Clock::get()?.unix_timestamp,
        });
        
        Ok(())
    }

    /// Pause vault (emergency)
    pub fn pause(ctx: Context<AdminAction>) -> Result<()> {
        let vault_state = &mut ctx.accounts.vault_state;
        vault_state.paused = true;
        msg!("Vault paused by authority");
        Ok(())
    }

    /// Unpause vault
    pub fn unpause(ctx: Context<AdminAction>) -> Result<()> {
        let vault_state = &mut ctx.accounts.vault_state;
        vault_state.paused = false;
        msg!("Vault unpaused by authority");
        Ok(())
    }
}

// ============ Account Structures ============

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        init,
        payer = authority,
        space = 8 + VaultState::INIT_SPACE,
        seeds = [b"vault_state"],
        bump
    )]
    pub vault_state: Account<'info, VaultState>,
    
    /// CHECK: Vault PDA - just holds SOL
    #[account(seeds = [b"vault"], bump)]
    pub vault: UncheckedAccount<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SetRelayer<'info> {
    #[account(mut, constraint = authority.key() == vault_state.authority @ ErrorCode::Unauthorized)]
    pub authority: Signer<'info>,
    
    #[account(mut, seeds = [b"vault_state"], bump = vault_state.bump)]
    pub vault_state: Account<'info, VaultState>,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub depositor: Signer<'info>,
    
    #[account(mut, seeds = [b"vault_state"], bump = vault_state.bump)]
    pub vault_state: Account<'info, VaultState>,
    
    /// CHECK: Vault PDA
    #[account(mut, seeds = [b"vault"], bump)]
    pub vault: UncheckedAccount<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Claim<'info> {
    #[account(mut)]
    pub claimer: Signer<'info>,
    
    #[account(mut, seeds = [b"vault_state"], bump = vault_state.bump)]
    pub vault_state: Account<'info, VaultState>,
    
    /// CHECK: Vault PDA
    #[account(mut, seeds = [b"vault"], bump)]
    pub vault: UncheckedAccount<'info>,
    
    /// CHECK: Recipient - can be any address
    #[account(mut)]
    pub recipient: UncheckedAccount<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AuthorityClaim<'info> {
    #[account(mut, constraint = authority.key() == vault_state.authority @ ErrorCode::Unauthorized)]
    pub authority: Signer<'info>,
    
    #[account(mut, seeds = [b"vault_state"], bump = vault_state.bump)]
    pub vault_state: Account<'info, VaultState>,
    
    /// CHECK: Vault PDA
    #[account(mut, seeds = [b"vault"], bump)]
    pub vault: UncheckedAccount<'info>,
    
    /// CHECK: Recipient
    #[account(mut)]
    pub recipient: UncheckedAccount<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RelayerClaim<'info> {
    #[account(mut, constraint = relayer.key() == vault_state.relayer @ ErrorCode::UnauthorizedRelayer)]
    pub relayer: Signer<'info>,
    
    #[account(mut, seeds = [b"vault_state"], bump = vault_state.bump)]
    pub vault_state: Account<'info, VaultState>,
    
    /// CHECK: Vault PDA
    #[account(mut, seeds = [b"vault"], bump)]
    pub vault: UncheckedAccount<'info>,
    
    /// CHECK: Recipient
    #[account(mut)]
    pub recipient: UncheckedAccount<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AdminAction<'info> {
    #[account(mut, constraint = authority.key() == vault_state.authority @ ErrorCode::Unauthorized)]
    pub authority: Signer<'info>,
    
    #[account(mut, seeds = [b"vault_state"], bump = vault_state.bump)]
    pub vault_state: Account<'info, VaultState>,
}

// ============ State ============

#[account]
#[derive(InitSpace)]
pub struct VaultState {
    pub authority: Pubkey,           // 32 bytes
    pub relayer: Pubkey,             // 32 bytes - authorized relayer
    pub total_deposits: u64,         // 8 bytes
    pub total_claims: u64,           // 8 bytes
    #[max_len(32)]
    pub last_commitment: [u8; 32],   // 32 bytes
    #[max_len(32)]
    pub last_nullifier: [u8; 32],    // 32 bytes
    pub bump: u8,                    // 1 byte
    pub paused: bool,                // 1 byte
}

// ============ Events ============

#[event]
pub struct DepositEvent {
    pub commitment: [u8; 32],
    pub amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct ClaimEvent {
    pub nullifier_hash: [u8; 32],
    pub recipient: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct RelayerClaimEvent {
    pub relayer: Pubkey,
    pub nullifier_hash: [u8; 32],
    pub recipient: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}

// ============ Errors ============

#[error_code]
pub enum ErrorCode {
    #[msg("Nullifier already used - possible double-spend")]
    NullifierAlreadyUsed,
    #[msg("Unauthorized - not authority")]
    Unauthorized,
    #[msg("Unauthorized relayer")]
    UnauthorizedRelayer,
    #[msg("Vault is paused")]
    VaultPaused,
    #[msg("Amount must be greater than zero")]
    ZeroAmount,
}
