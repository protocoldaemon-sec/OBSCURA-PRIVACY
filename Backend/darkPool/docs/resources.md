> ## Documentation Index
> Fetch the complete documentation index at: https://docs.arcium.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Intro to Arcium

Arcium is a decentralized private computation network that enables secure processing of encrypted data through Multi-Party Computation (MPC). It solves a fundamental problem in Web3: how to process sensitive data while maintaining privacy. Traditionally, computation requires data to be decrypted, making it vulnerable to attacks and exposing private information. Arcium changes this by allowing computations to run on fully encrypted data.

## What Arcium Enables

As a Solana developer, Arcium gives you the ability to:

1. **Build Privacy-Preserving Applications**: Add privacy to your applications without adopting a new blockchain, programming language, or workflow. Arcium maintains full composability within familiar ecosystems.
2. **Use Familiar Tooling**: Leverage the Arcis framework, which extends Solana's Anchor tooling. Built in Rust, it allows you to add privacy simply by marking functions as confidential—no cryptography knowledge required.
3. **Process Sensitive Data**: Run computations on encrypted data without ever decrypting it. This means sensitive information like user balances, trade orders, or personal data can be processed securely.

## How It Works

Your application (MXE) works with encrypted data in three simple steps:

1. Client encrypts data and sends it to your MXE program
2. Your program submits the computation to Arcium's network of MPC nodes
3. Nodes process the data while keeping it encrypted, then return the results

The entire process happens onchain through Solana, with each step verified and coordinated by Arcium's programs. For larger computations, an optional callback server handles results that don't fit in a single transaction.

## Common Use Cases

1. **Confidential DeFi**: Build dark pools, aka private order books, where trade sizes and prices remain hidden, enabling truly permissionless confidential trading without front-running or market manipulation.
2. **Secure AI**: Enable AI model inference and training on sensitive data while keeping the data encrypted.
3. **Confidential Gaming**: Build hidden information games where player moves and state remain private until revealed (e.g., card games, strategy games, auctions).

## Getting Started

Arcium provides a familiar development experience for Solana developers:

* Use the `arcium` CLI (a wrapper over `anchor` CLI) to build Solana programs with Arcium
* Write confidential instructions in Rust using the Arcis framework
* Integrate with your Solana programs using the TypeScript client library

Follow these steps to get started:

1. [Install Arcium](/developers/installation) - Set up the development environment and tools
2. [Hello World](/developers/hello-world) - Create your first confidential instruction
3. [Computation Lifecycle](/developers/computation-lifecycle) - Understand how confidential computations work
4. [TypeScript SDK Reference](https://ts.arcium.com/api) - Complete API documentation for TypeScript client libraries

The network is currently in Public Testnet. Join our [Discord](https://discord.com/invite/arcium) to join our community and start building.
> ## Documentation Index
> Fetch the complete documentation index at: https://docs.arcium.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Overview

## Quick Install (Recommended)

On Mac and Linux, run this single command to install Arcium:

```bash  theme={null}
curl --proto '=https' --tlsv1.2 -sSfL https://install.arcium.com/ | bash
```

`arcup` is a tool for managing versioning of the Arcium tooling (including the CLI and Arx Node). More info on it can be found [here](/developers/installation/arcup).

This script will:

* Check for all required dependencies
* Install Linux build dependencies automatically (if needed)
* Download and install `arcup` for your platform
* Install the latest Arcium CLI (command-line interface for interacting with the Arcium network and managing computations)
* Install the Arx Node (the core node software that performs encrypted computations in the network)

### Prerequisites

Before running the installation script, make sure you have these dependencies installed:

* **Rust**: Install from [here](https://www.rust-lang.org/tools/install)
* **Solana CLI 2.3.0**: Install from [here](https://docs.solana.com/cli/install-solana-cli-tools), then run `solana-keygen new`
* **Yarn**: Install from [here](https://yarnpkg.com/getting-started/install)
* **Anchor 0.32.1**: Install from [here](https://www.anchor-lang.com/docs/installation)
* **Docker & Docker Compose**: Install Docker from [here](https://docs.docker.com/engine/install/) and Docker Compose from [here](https://docs.docker.com/compose/install/)

The installation script will check for all these dependencies and provide clear instructions if any are missing.

## Manual Installation

If you prefer to install manually, you can still use the traditional method. arcup is a tool for managing versioning of the arcium tooling (including the CLI and Arx Node). More info on it can be found [here](/developers/installation/arcup).

Install `arcup`. We currently support 4 pre-built targets, listed below. We do not support Windows at the moment.

* `aarch64_linux`
* `x86_64_linux`
* `aarch64_macos`
* `x86_64_macos`

You can install it by replacing `<YOUR_TARGET>` with the target you want to install, and running the following command:

<CodeGroup>
  ```bash Arch Linux theme={null}
  TARGET=aarch64_linux && curl "https://bin.arcium.com/download/arcup_${TARGET}_0.6.3" -o ~/.cargo/bin/arcup && chmod +x ~/.cargo/bin/arcup
  ```

  ```bash x86 Linux theme={null}
  TARGET=x86_64_linux && curl "https://bin.arcium.com/download/arcup_${TARGET}_0.6.3" -o ~/.cargo/bin/arcup && chmod +x ~/.cargo/bin/arcup
  ```

  ```bash Apple Silicon theme={null}
  TARGET=aarch64_macos && curl "https://bin.arcium.com/download/arcup_${TARGET}_0.6.3" -o ~/.cargo/bin/arcup && chmod +x ~/.cargo/bin/arcup
  ```

  ```bash Intel Mac theme={null}
  TARGET=x86_64_macos && curl "https://bin.arcium.com/download/arcup_${TARGET}_0.6.3" -o ~/.cargo/bin/arcup && chmod +x ~/.cargo/bin/arcup
  ```
</CodeGroup>

Install the latest version of the CLI using `arcup`:

```bash  theme={null}
arcup install
```

Verify the installation:

```bash  theme={null}
arcium --version
```

## Issues

Installation might fail due to a variety of reasons. This section contains a list of the most common issues and their solutions, taken from Anchor's installation guide.

### Platform-Specific Issues

**Windows Users:** Arcium is not currently supported on Windows. We recommend using Windows Subsystem for Linux (WSL2) with Ubuntu for the best experience.

**Linux Systems:** You may need additional dependencies. On Ubuntu/Debian:

```bash  theme={null}
sudo apt-get update && sudo apt-get upgrade && sudo apt-get install -y pkg-config build-essential libudev-dev libssl-dev
```

### Incorrect `$PATH`

Rust binaries, including `arcup` and `arcium`, are installed to the `~/.cargo/bin` directory. Since this directory is required to be in the `PATH` environment variable, Rust installation tries to set it up automatically, but it might fail to do so on some platforms.

To verify that the `PATH` environment variable was set up correctly, run:

```shell  theme={null}
which arcium
```

The output should look like (with your username):

```
/home/user/.cargo/bin/arcium
```

**Shell-Specific PATH Issues:**

If `which arcium` returns nothing, add the cargo bin directory to your PATH:

* **Bash/Zsh:** Add to `~/.bashrc` or `~/.zshrc`:

  ```bash  theme={null}
  export PATH="$HOME/.cargo/bin:$PATH"
  ```
* **Fish:** Add to `~/.config/fish/config.fish`:

  ```bash  theme={null}
  set -gx PATH $HOME/.cargo/bin $PATH
  ```

After editing, restart your terminal or run `source ~/.bashrc` (or equivalent for your shell).
> ## Documentation Index
> Fetch the complete documentation index at: https://docs.arcium.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Arcup Version Manager

The `arcup` version manager enables easy installation and management of the Arcium Networks' tooling suite, consisting of the Arcium CLI binary, the Arx Node Docker image, and the Postgres Docker image (needed to run the Callback Server). With a single command you can install all of the necessary tools, as well as update all of them when there are new releases.

The [Quick Start](#quick-start) section below takes you through basic `arcup` onboarding, however you can find more detailed installation instructions [here](/developers/installation). Also, see the [Versioning section below](#inter-component-versioning) for details on how versioning is handled between the different components of the Arcium Network.

## Quick Start

First, delete any local versions of the CLI, or Arx Node (Docker) that you may currently have installed on your machine (if you don't have any currently installed, you can skip this step):

```bash  theme={null}
rm $HOME/.cargo/bin/arcium
docker images | grep "arcium-hq" | awk '{print $1":"$2}' | xargs docker rmi -f
```

Verify that you do not have any versions of the CLI, or Arx Node (Docker) installed on your machine now:

```bash  theme={null}
arcium --version # Should return "No such file or directory"
docker images # Should not show any arcium-related images
```

Next, install `arcup` on your machine by following [these steps](/developers/installation#manual-installation). Then run the `arcup` install command:

```bash  theme={null}
arcup install # Will install the latest releases of the Arcium components
```

Now verify that everything is installed correctly:

```bash  theme={null}
arcium --version # Should show the latest CLI version
arcup version # Shows the currently installed versions of all of the Arcium components
docker images # Should list the images for the Arx Node, and Postgres
```

You can also install older versions using the `install` command (and specifying a version), as well as deleting installed versions with the `delete` command, and switching between already installed versions using the `use` command. See the [Available Commands](#available-commands) section below for full details.

## Inter-Component Versioning

The `arcup` version manager is based on [semver](https://semver.org/) (`MAJOR.MINOR.PATCH`). With `arcup`, the `PATCH` version number need not be in-sync across the different components, however the `MAJOR.MINOR` version number will always be in-sync across all of the Arcium components. As such, `PATCH` changes are always non-breaking with respect to the other Arcium components.

For example, if the current versions are:

* CLI: `0.4.5`
* Arx Node: `0.4.15`

If a breaking change is made to the CLI (e.g. increment to `0.6.3`), the `MINOR` version number of Nodes is also incremented (so both would become `0.6.3`). However, if only a (non-breaking) `PATCH` upgrade is made to tooling, then tooling would increment to `0.6.3` and node would remain unchanged.

## Available Commands

```bash  theme={null}
install  Install the latest (or a specific) version of Arcium components (Arx Node and CLI)
update   Update all Arcium components (Arx Node and CLI) to the latest version
list     List all installed versions
version  Show currently active version
use      Switch to using a specific installed version
delete   Delete a specific version
help     Print this message or the help of the given subcommand(s)
```
> ## Documentation Index
> Fetch the complete documentation index at: https://docs.arcium.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Hello World with Arcium

## Hello World

The Arcium tooling suite for writing MXEs (MPC eXecution Environments) is built on top of [Anchor](https://www.anchor-lang.com/), so if you're familiar with Anchor, you should find Arcium to be a familiar experience, except that you're using the `arcium` CLI instead of `anchor`.

To initialize a new MXE project, you can therefore simply run:

```bash  theme={null}
arcium init <project-name>
```

This will create a new project with the given name and initialize it with a basic structure. The structure is the same as in an Anchor project with two differences, so it is not repeated here (for an explanation of the Anchor project structure, see the [Anchor documentation](https://www.anchor-lang.com/docs/quickstart/local)). The two differences are:

* The `Arcium.toml` file, which contains the configuration for the Arcium tooling suite.
* The `encrypted-ixs` directory. This is where we write all our code that is meant to operate on encrypted data and therefore runs in MPC. This code is written using our own Rust framework called [Arcis](/developers/arcis). This will already be populated with a simple example called `add_together.rs`. Let's take a closer look at it.

### Our first encrypted instruction

```rust  theme={null}
use arcis::*;

#[encrypted]
mod circuits {
    use arcis::*;

    pub struct InputValues {
        v1: u8,
        v2: u8,
    }

    #[instruction]
    pub fn add_together(input_ctxt: Enc<Shared, InputValues>) -> Enc<Shared, u16> {
        let input = input_ctxt.to_arcis();
        let sum = input.v1 as u16 + input.v2 as u16;
        input_ctxt.owner.from_arcis(sum)
    }
}
```

Let's go through it line by line. `use arcis::*;` imports all the necessary types and functions for writing encrypted instructions with Arcis. The `#[encrypted]` attribute marks a module that contains encrypted instructions. Inside this module, we define a struct `InputValues` that contains the two values we want to encrypt and pass to the encrypted instruction.

The `#[instruction]` macro marks the function as an entry point for MPC execution. While you can write helper functions without this attribute, only functions marked with `#[instruction]` will be compiled into individual circuits that can be called onchain.

The function `add_together` takes an encrypted input parameter of type `Enc<Shared, InputValues>`. Let's break this down:

* `Enc<Owner, Data>` is Arcium's encrypted data type
* `Shared` means the data is encrypted with a shared secret between the client and MXE (both can decrypt it)
* `InputValues` is the actual data structure being encrypted (our struct with v1 and v2)
* The alternative to `Shared` is `Mxe`, where only the MXE can decrypt the data

Inside the function:

1. `input_ctxt.to_arcis()` converts the input into a form we can operate on within the MPC environment.
2. We perform the addition operation, casting the u8 values to u16 to prevent overflow.
3. `input_ctxt.owner.from_arcis(sum)` converts the encrypted sum into an encrypted format that can be stored onchain, while maintaining encryption with the shared secret between the client and the MXE.

### Calling it from Solana

Now that we've written our first confidential instruction, let's see how we can use it from within a Solana program. Our default project already contains a Solana program in the `programs/` directory. Let's take a closer look at it too:

```rust  theme={null}
use anchor_lang::prelude::*;
use arcium_anchor::prelude::*;

// This constant identifies our encrypted instruction for onchain operations
// comp_def_offset() generates a unique identifier from the function name
const COMP_DEF_OFFSET_ADD_TOGETHER: u32 = comp_def_offset("add_together");

declare_id!("YOUR_PROGRAM_ID_HERE");

#[arcium_program]
pub mod hello_world {
    use super::*;

    pub fn init_add_together_comp_def(ctx: Context<InitAddTogetherCompDef>) -> Result<()> {
        init_comp_def(ctx.accounts, None, None)?;
        Ok(())
    }

    pub fn add_together(
        ctx: Context<AddTogether>,
        computation_offset: u64,
        ciphertext_0: [u8; 32],
        ciphertext_1: [u8; 32],
        pub_key: [u8; 32],
        nonce: u128,
    ) -> Result<()> {
        let args = ArgBuilder::new()
            .x25519_pubkey(pub_key)
            .plaintext_u128(nonce)
            .encrypted_u8(ciphertext_0)
            .encrypted_u8(ciphertext_1)
            .build();

        ctx.accounts.sign_pda_account.bump = ctx.bumps.sign_pda_account;

        queue_computation(
            ctx.accounts,
            computation_offset,
            args,
            None,
            vec![AddTogetherCallback::callback_ix(
                computation_offset,
                &ctx.accounts.mxe_account,
                &[]
            )?],
            1,
            0,  // cu_price_micro: priority fee in microlamports
        )?;
        Ok(())
    }

    #[arcium_callback(encrypted_ix = "add_together")]
    pub fn add_together_callback(
        ctx: Context<AddTogetherCallback>,
        output: SignedComputationOutputs<AddTogetherOutput>,
    ) -> Result<()> {
        let o = match output.verify_output(
            &ctx.accounts.cluster_account,
            &ctx.accounts.computation_account
        ) {
            Ok(AddTogetherOutput { field_0 }) => field_0,
            Err(e) => {
                msg!("Error: {}", e);
                return Err(ErrorCode::AbortedComputation.into())
            },
        };

        emit!(SumEvent {
            sum: o.ciphertexts[0],
            nonce: o.nonce.to_le_bytes(),
        });
        Ok(())
    }
}
```

For brevity, the `InitAddTogetherCompDef`, `AddTogether`, and `AddTogetherCallback` account structs are not included here, but they are automatically generated when you run `arcium init`. Here's a simplified version of what `AddTogether` looks like:

```rust  theme={null}
#[derive(Accounts)]
#[instruction(computation_offset: u64)]
pub struct AddTogether<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    // ... other required Arcium accounts (see program/ section for full details)
}
```

You can read more about them and the invocation of confidential instructions inside Solana programs [here](/developers/program).

The key things to note here are that every MXE program is identified by the `#[arcium_program]` macro (which replaces Anchor's `#[program]` macro) and that for every confidential instruction, we generally have three instructions in the Solana program:

* `init_add_together_comp_def`: This is the instruction that initializes the confidential instruction definition. It is used to set up the computation definition and is therefore only called once prior to the first invocation of the confidential instruction. More info on this can be found [here](/developers/program/computation-def-accs).
* `add_together`: This is the instruction that invokes the confidential instruction. It takes in the arguments for the confidential instruction and queues it for execution using the Arcium program. More info on this can be found [here](/developers/program).
* `add_together_callback`: This is the instruction that is called by the MPC cluster when the confidential instruction has finished executing which returns our result. More info on this can be found [here](/developers/program).

This is due to the general flow of computations throughout Arcium, which you can read more about [here](/developers/computation-lifecycle).

## Building and testing

Similar to Anchor, the confidential instructions and Solana programs can be built using `arcium build`. Testing is done using the `@arcium-hq/client` TypeScript library (more information can be found [here](/developers/js-client-library)) by default and can be run using `arcium test` (make sure you have installed the npm dependencies prior by running `yarn` or `npm install` in your project directory). By default, this runs against a local cluster. To test against devnet or mainnet, use `arcium test --cluster devnet` (requires cluster configuration in `Arcium.toml` - see the [migration guide](/developers/migration/migration-v0.5-to-v0.6#6-optional-configure-arciumtoml-for-non-localnet-testing)).

Let's take a quick look at the default test file. Note that some helper functions and imports are excluded for brevity, but you can find the complete examples in your generated project:

```typescript  theme={null}
describe("Hello World", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.HelloWorld as Program<HelloWorld>;
  const provider = anchor.getProvider();

  const arciumEnv = getArciumEnv();

  it("Is initialized!", async () => {
    const owner = readKpJson(`${os.homedir()}/.config/solana/id.json`);

    console.log("Initializing add together computation definition");
    const initATSig = await initAddTogetherCompDef(program, owner, false);
    console.log(
      "Add together computation definition initialized with signature",
      initATSig
    );

    const privateKey = x25519.utils.randomSecretKey();
    const publicKey = x25519.getPublicKey(privateKey);
    const mxePublicKey = await getMXEPublicKeyWithRetry(
      provider as anchor.AnchorProvider,
      program.programId
    );

    console.log("MXE x25519 pubkey is", mxePublicKey);
    const sharedSecret = x25519.getSharedSecret(privateKey, mxePublicKey);
    const cipher = new RescueCipher(sharedSecret);

    const val1 = BigInt(1);
    const val2 = BigInt(2);
    const plaintext = [val1, val2];

    const nonce = randomBytes(16);
    const ciphertext = cipher.encrypt(plaintext, nonce);

    const sumEventPromise = awaitEvent("sumEvent");
    const computationOffset = new anchor.BN(randomBytes(8), "hex");

    const queueSig = await program.methods
      .addTogether(
        computationOffset,
        Array.from(ciphertext[0]),
        Array.from(ciphertext[1]),
        Array.from(publicKey),
        new anchor.BN(deserializeLE(nonce).toString())
      )
      .accountsPartial({
        computationAccount: getComputationAccAddress(
          arciumEnv.arciumClusterOffset,
          computationOffset
        ),
        clusterAccount: getClusterAccAddress(arciumEnv.arciumClusterOffset),
        mxeAccount: getMXEAccAddress(program.programId),
        mempoolAccount: getMempoolAccAddress(arciumEnv.arciumClusterOffset),
        executingPool: getExecutingPoolAccAddress(arciumEnv.arciumClusterOffset),
        compDefAccount: getCompDefAccAddress(
          program.programId,
          Buffer.from(getCompDefAccOffset("add_together")).readUInt32LE()
        ),
      })
      .rpc({ commitment: "confirmed" });
    console.log("Queue sig is ", queueSig);

    const finalizeSig = await awaitComputationFinalization(
      provider as anchor.AnchorProvider,
      computationOffset,
      program.programId,
      "confirmed"
    );
    console.log("Finalize sig is ", finalizeSig);

    const sumEvent = await sumEventPromise;
    const decrypted = cipher.decrypt([sumEvent.sum], sumEvent.nonce)[0];
    expect(decrypted).to.equal(val1 + val2);
  });
});
```

This test demonstrates the complete flow of encrypted computations in Arcium. Here's what each key step does:

* `initAddTogetherCompDef`: Call the `init_add_together_comp_def` instruction to initialize the confidential instruction definition. (only need to be called once after the program is deployed)
* `getMXEPublicKeyWithRetry`: Fetch the MXE's x25519 public key.
* `x25519.utils.randomSecretKey`: Generate a random private key for the x25519 key exchange.
* `x25519.getPublicKey`: Generate the public key corresponding to the private key we generated above.
* `x25519.getSharedSecret`: Generate the shared secret with the MXE cluster using a x25519 key exchange.
* `cipher = new RescueCipher(sharedSecret)`: Initialize the Rescue cipher (the constructor internally performs a key derivation based on the Rescue-Prime hash function, you can learn more [here](/developers/encryption))
* `cipher.encrypt`: Encrypt the inputs for the confidential instruction.
* `awaitEvent`: Wait for the `sumEvent` event to be emitted by the program on finalization of the computation (in the callback instruction).
* `addTogether`: Call the `add_together` instruction to invoke the confidential instruction.
* `awaitComputationFinalization`: Since waiting for an Arcium computation is not the same as waiting for one Solana transaction (because the MPC cluster must finish the computation and invoke the callback), this function is used, which is provided by the Arcium TypeScript library.

## Ready to Deploy?

Now that you have built and tested your MXE locally, you are probably eager to see it running on devnet! Head over to our [deployment guide](/developers/deployment) where we'll walk you through getting your MXE live on Solana devnet. We'll cover everything from choosing the right RPC endpoint to initializing your computation definitions.

## What's Next?

Now that you have built your first MXE, you are ready to deploy it to testnet. Follow the [deployment guide](/developers/deployment) to get your MXE running on Solana devnet and test with real encrypted computations.

### Learn Arcis

To build more complex circuits, learn the Arcis framework:

* **[Thinking in MPC](/developers/arcis/mental-model)** — Understand why Arcis has constraints like fixed loops and both-branches-execute
* **[Quick Reference](/developers/arcis/quick-reference)** — Syntax cheatsheet for when you're coding

### Build Your Application

From there, you can build more sophisticated applications by learning about [input/output patterns](/developers/arcis/input-output) for working with encrypted data, [callback accounts](/developers/program/callback-accs) for persistent state, and [JavaScript client integration](/developers/js-client-library/encryption) for frontend development.

For inspiration, browse our [examples repo](https://github.com/arcium-hq/examples/) to see voting systems, games, and DeFi applications built with Arcium. If you need help, join our [Discord community](https://discord.gg/arcium) where other builders share tips and get support.
> ## Documentation Index
> Fetch the complete documentation index at: https://docs.arcium.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Computation Lifecycle

Before diving into the details of the tooling, it's useful to understand the general architecture of Arcium. The below diagram gives a high-level overview of the lifecycle of a typical interaction with Arcium (we call these "computations").

```mermaid  theme={null}
sequenceDiagram
participant Client
participant MXE Program
participant Arcium Program
participant MPC Cluster
participant Callback Server

Client->>Client: Encrypt params
Client->>MXE Program: Invoke computation with encrypted params
MXE Program->>Arcium Program: Handle & format params and send to Arcium Program
Arcium Program->>Arcium Program: Queue Computation in Cluster's Mempool
MPC Cluster->>Arcium Program: Fetch new computation from mempool
MPC Cluster->>MPC Cluster: Compute using MPC
MPC Cluster->>Arcium Program: Callback with Result
MPC Cluster->>Callback Server: Send additional data (if any)
Callback Server->>Callback Server: Handle data update to onchain accounts
Callback Server->>MXE Program: Invoke callback instruction (if additional data was sent)
Arcium Program->>Arcium Program: Verify Result
Arcium Program->>MXE Program: Invoke callback instruction with result
MXE Program->>MXE Program: Handle Result
MXE Program->>Client: Notify of completion
```

We have 4 key actors here (with one additional participant if needed):

* The client: The party that wants to perform a computation, usually the user of your MXE. This is implemented using the [Arcium TypeScript Client Library](/developers/js-client-library).
* The MXE Program: Your app. An MXE (MPC eXecution Environment) consists of everything needed to perform computations and is implemented using the [Arcium program tooling](/developers/program):
  * A smart contract that is deployed on the blockchain and is used to format and submit computations to Arcium.
  * A set of confidential instructions (we call these "computation definitions") that are used to define what parameters are needed for the computation and what the computation is. Writing these is done using [Arcis](/developers/arcis).
  * Some metadata about the MXE, most importantly the MPC cluster we would like to use to compute our computations.
* The Arcium Program: The program in charge of assigning, scheduling, and verifying computations for the various MPC clusters to perform.
* The MPC Cluster: The parties that are performing the client's computations using MPC.
* The Callback Server: A server that is used to handle additional data from the MPC cluster. This is optional and only needed for cases when the computation result is more than what can fit in a single Solana transaction.
> ## Documentation Index
> Fetch the complete documentation index at: https://docs.arcium.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Overview

Encrypted data is passed as an `Enc<Owner, T>` generic type, where `Owner` specifies who can decrypt the data (either `Shared` or `Mxe`), and `T` is the underlying data type being encrypted. In the case of `Mxe`, the nodes collectively can decrypt the data under dishonest majority assumptions, whereas if the `Owner` is `Shared`, then the data was encrypted using a shared secret between the client and the MXE. Underneath the hood, this generic wrapper type contains the encrypted data, as well as the public key (only for `Shared` owner) and nonce used to encrypt the data.

Encrypted data can be decrypted globally or selectively to a given user. For global decryption, you can call `reveal` method on any variable of [supported data type](/developers/arcis/types). Read more about how we enable this using re-encryption (aka sealing) in Arcium [here](/developers/encryption/sealing).

Private inputs are encrypted using the arithmetization-oriented symmetric [Rescue cipher](https://eprint.iacr.org/2019/426). Prior to the encryption, a [x25519](https://www.rfc-editor.org/rfc/rfc7748.html#page-7) elliptic curve Diffie-Hellman key exchange is performed between the client and the cluster to derive a common shared secret. The Rescue key is derived by hashing the shared secret with the [Rescue-Prime](https://eprint.iacr.org/2020/1143.pdf) hash function, as described in [Section 4](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-56Cr2.pdf), Option 1.  This increases the min-entropy of the key.\
Note:

1. Since the x25519 key exchange natively returns shared secrets in the finite field with $p = 2^{255} - 19$ elements, we implemented Rescue over the field $\mathbb{F}_{p}$. States in the context of Rescue are elements of the $m$-dimensional vector space $\mathbb{F}_p^m$, i.e., the Rescue cipher transforms vectors of size $m$ to vectors of the same size.
2. The security level $s$ of the cipher is set to 128 bits.
3. We use the Rescue block cipher in [Counter (CTR) mode](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-38a.pdf) (see Section 6.5), with fixed $m = 5$. The choice $m = 5$ is motivated by the fact that it is the smallest value that attains the minimum of recommended rounds (10), given the fixed finite field and security level. The `counter`s are of the form `[nonce, i, 0, 0, 0]`, where `nonce` are 16 random bytes provided by the user.
4. The hash function used for key derivation is Rescue-Prime over $\mathbb{F}_{2^{255}-19}$, with `rate = 7` and `capacity = 5` (i.e., $m = 12$) and output truncated to 5 field elements. The target security level $s$ is set to 256. According to [Section 2.2](https://eprint.iacr.org/2020/1143.pdf), this offers 256 bits of security against collision, preimage and second-preimage attacks for any field of size at least 102 bits.

The decryption of `input_enc: Enc<Owner, T>` can conveniently be obtained by calling `input_enc.to_arcis()` (the nodes do not learn `input`, they simply convert the ciphertext to secret-shares of `input` by running the Rescue decryption circuit in MPC). If the owner is `Shared`, the MXE and the client perform a key exchange first. Similarly, `owner.from_arcis(output)` encrypts the secret-shared `output` by running the Rescue encryption circuit in MPC.\
Note:

1. After decrypting the user-provided inputs, the MXE increments the `nonce` by 1 and uses it for encrypting the outputs. For the forthcoming interaction with the MXE, a new `nonce` must be provided.
2. The performance will benefit from reducing the number of calls to `owner.from_arcis(..)` (per owner). Ideally, put all data encrypted to `owner` in one struct.
> ## Documentation Index
> Fetch the complete documentation index at: https://docs.arcium.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Sealing aka re-encryption

Suppose you're Alice, and you have secret data onchain, and you want to share it with Bob. Or it could be that you want to compute a function on your sensitive data, and share the result with Bob without revealing the data, or the result to anyone else.

Arcium can re-encrypt any data to a given public key. This is known as "sealing" in cryptography—restricting data access to specific recipients.

This is useful for a variety of reasons, such as compliance, end-to-end privacy, and more.

```rust  theme={null}
#[encrypted]
mod circuits {
    use arcis::*;

    #[instruction]
    pub fn verify_loan_eligibility(
        alice_balance: Enc<Shared, u64>,
        min_balance_required: Enc<Mxe, u64>,
        loan_officer: Shared
    ) -> Enc<Shared, bool> {
        let balance = alice_balance.to_arcis();
        let threshold = min_balance_required.to_arcis();

        // Check if Alice meets minimum balance for loan without revealing her exact balance
        let is_eligible = balance >= threshold;

        // Re-encrypt the result for the loan officer
        loan_officer.from_arcis(is_eligible)
    }
}
```

In this example, we have a confidential function `verify_loan_eligibility` that takes Alice's encrypted balance (encrypted with a shared secret between Alice and the MXE), the minimum balance requirement (encrypted only for the MXE), and a `Shared` type parameter representing the loan officer who will receive the result.

The function checks if Alice meets the minimum balance requirement for loan eligibility without revealing her actual balance to anyone. The boolean result is then re-encrypted specifically for the loan officer using their public key. This way, Alice's financial privacy is preserved - the loan officer only learns whether she's eligible, not her actual balance, and ARX nodes never see plaintext—they operate only on secret shares.

> ## Documentation Index
> Fetch the complete documentation index at: https://docs.arcium.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Overview

> Introduction to Arcis, a Rust-based framework for writing secure MPC circuits on the Arcium network

Arcis is a Rust-based framework for writing secure multi-party computation (MPC) circuits that run on the Arcium network. Create privacy-preserving applications that compute over encrypted data using familiar Rust syntax.

## What Arcis Code Looks Like

Arcis code is standard Rust with special annotations for MPC execution:

```rust  theme={null}
use arcis::*;

#[encrypted]
mod my_circuit {
    use arcis::*;

    #[instruction]
    pub fn add_private(a: Enc<Shared, u64>, b: Enc<Shared, u64>) -> Enc<Shared, u64> {
        let x = a.to_arcis();  // Encrypted → secret shares
        let y = b.to_arcis();
        a.owner.from_arcis(x + y)  // Secret shares → encrypted
    }
}
```

This computes `a + b` where both inputs remain encrypted throughout. No node ever sees the plaintext values.

<CardGroup cols={2}>
  <Card title="Thinking in MPC" icon="brain" href="/developers/arcis/mental-model">
    Understand why MPC circuits work differently and the mental model behind Arcis.
  </Card>

  <Card title="Hello World" icon="rocket" href="/developers/hello-world">
    Build your first Arcis circuit with a hands-on tutorial.
  </Card>

  <Card title="Examples" icon="github" href="https://github.com/arcium-hq/examples">
    Real-world circuits: voting, games, DeFi applications.
  </Card>

  <Card title="Quick Reference" icon="graduation-cap" href="/developers/arcis/quick-reference">
    Quick reference cheatsheet for Arcis syntax and patterns.
  </Card>
</CardGroup>

## Key Features

* **Rust-based**: Use Rust's type safety and performance for MPC development.
* **Circuit-oriented**: Write MPC circuits using familiar Rust syntax with constraints for fixed circuit structure.
* **Privacy-focused**: Compute over encrypted data without revealing the underlying information.
> ## Documentation Index
> Fetch the complete documentation index at: https://docs.arcium.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Thinking in MPC

> Understand the mental model behind Arcis and why MPC circuits work differently from regular code

Arcis lets you write Rust that computes on encrypted data. But MPC (Multi-Party Computation) has fundamental constraints that affect how you write code. This page explains *why* these constraints exist so you can write effective Arcis programs.

<Tip>
  **Use this page** to build intuition for how Arcis works. Understanding these concepts will help you write efficient circuits. If you prefer hands-on learning, try the [Hello World tutorial](/developers/hello-world) alongside this guide.
</Tip>

## How Secret Sharing Works

When you call `.to_arcis()` on encrypted data, it does not decrypt the data. Instead, it converts the ciphertext into **secret shares** distributed across ARX nodes (Arcium's MPC execution nodes).

Think of it like splitting a secret number into random pieces:

```
Secret value: 42

Node A holds: 17  (random)
Node B holds: 93  (random)  
Node C holds: -68 (calculated so shares sum to 42)
```

**Key insight:** Each node sees only random-looking data. No single node learns anything about the original value. But when nodes compute together following the MPC protocol, the math works out correctly.

<Note>
  **Security guarantee**: All ARX nodes would need to collude together to reconstruct the secret. As long as even one node refuses to participate, the secret remains protected.
</Note>

```rust  theme={null}
#[instruction]
pub fn double_secret(input: Enc<Shared, u64>) -> Enc<Shared, u64> {
    // Convert encrypted data to secret shares across nodes
    let value = input.to_arcis();
    
    // Each node multiplies their share by 2
    // The shares still reconstruct to the correct answer!
    let result = value * 2;
    
    // Convert secret shares to encrypted output
    input.owner.from_arcis(result)
}
```

This is why Arcis code looks like normal Rust but runs on encrypted data—the MPC protocol handles the complexity of computing on shares.

## The Circuit is Compiled Once

Here's the crucial insight: **your Arcis code compiles into a fixed circuit structure before any data flows through it.**

```mermaid  theme={null}
flowchart LR
    A["Rust Code<br/>(compile)"] --> B["Fixed Circuit<br/>Structure"] --> C["Secret Shares<br/>Flow Through"]
```

The circuit structure—which operations happen, in what order, how many times—is locked in at compile time. Secret data flows through this fixed structure at runtime.

**This is the root cause of all Arcis constraints.** If the circuit structure could change based on secret data, observers could learn information by watching *how* the computation runs, not just *what* it outputs.

## Both Branches Always Execute

In normal code, `if/else` picks one branch to run:

```rust  theme={null}
// Normal Rust: only ONE branch executes
if condition {
    do_expensive_thing();  // Runs if true
} else {
    do_cheap_thing();      // Runs if false
}
```

In Arcis, when the condition is **not a compile-time constant**, both branches execute:

```rust  theme={null}
// Arcis: BOTH branches execute, condition selects the result
let secret_value = encrypted_input.to_arcis();  // Now secret-shared across nodes
let is_large = secret_value > 1000;             // Comparison result is also secret

if is_large {        // No single node knows this value
    expensive()      // Always runs
} else {
    cheap()          // Always runs
}
// Cost = cost(expensive) + cost(cheap)
```

In the example above, after `.to_arcis()`, no individual node knows the actual value—each holds a random-looking share. The condition `is_large` is itself secret-shared, meaning no node can determine which branch "should" execute. The MPC protocol executes both branches, then uses the secret condition to select which result to keep—without revealing which branch applied.

**The rule:** If a condition is not a compile-time constant, Arcis executes both branches. This includes:

* Conditions derived from secret data (via `.to_arcis()`)
* Conditions using public runtime parameters

**The exception:** Compile-time constants like `if true { ... }` or `if CONST > 5 { ... }` allow single-branch execution because the value is known during circuit compilation.

<Note>
  **Compile-time constant**: A value the Arcis compiler can determine before circuit generation—literals like `10`, `const` declarations, or expressions involving only constants. Values from function parameters or `.to_arcis()` results are NOT compile-time constants.
</Note>

<Warning>
  **Cost implication**: The cost of an `if/else` is the sum of both branches, not the max. Keep branches balanced when possible.
</Warning>

## Fixed Iteration Counts

Loops must have iteration counts known at compile time:

```rust  theme={null}
// ✓ Works: iteration count is fixed
for i in 0..100 {
    process(data[i]);
}

// ✗ Won't compile: iteration count depends on runtime value
while secret_value < threshold {
    secret_value += 1;
}
```

**Why no `while` loops?** The number of iterations would depend on secret data:

* Secret starts at 10 → 90 iterations → takes X time
* Secret starts at 99 → 1 iteration → takes X/90 time

Execution time would leak information about the secret value.

**Why no `break` or `continue`?** Same reason—early exit based on secret data reveals information:

```rust  theme={null}
// ✗ Won't compile
for i in 0..1000 {
    if found_match { break; }  // Would reveal when match occurred
}
```

## Fixed-Size Data Only

Variable-length types like `Vec`, `String`, and `HashMap` are not supported:

```rust  theme={null}
// ✗ Not supported
let items: Vec<u8> = vec![];
let name: String = String::new();

// ✓ Use fixed-size alternatives
let items: [u8; 100] = [0; 100];
let name: [u8; 32] = [0; 32];
```

**Why?** The circuit compiler must know exactly how much memory and how many operations your circuit needs. A `Vec` that might hold 10 or 10,000 elements would create a circuit of unknown size.

## Reveal and Encryption Placement

The `.reveal()` and `.from_arcis()` methods **cannot be called inside `if/else` blocks** when the condition is not a compile-time constant:

```rust  theme={null}
// ✗ Won't compile - reveal inside conditional
if secret_condition {
    value.reveal()  // Error: cannot call reveal in conditional execution
}

// ✓ Works - select first, then reveal outside
let selected = if secret_condition { a } else { b };
selected.reveal()
```

**Why?** Both branches execute in isolation before results are merged. `.reveal()` broadcasts data to all parties—a global side effect that cannot be undone during the merge. If reveal happened inside a branch, it would leak which branch was taken.

The same applies to `.from_arcis()`:

```rust  theme={null}
// ✗ Won't compile
if secret_condition {
    owner.from_arcis(value)  // Error
}

// ✓ Works
let result = if secret_condition { a } else { b };
owner.from_arcis(result)
```

## Dynamic Indexing is O(n)

When the index is known at compile time, array access is O(1):

```rust  theme={null}
let x = arr[5];  // Compile-time index: O(1)
```

When the index depends on secret data, it becomes O(n):

```rust  theme={null}
let x = arr[secret_idx];  // Secret index: O(n)
```

**Why?** The circuit cannot reveal which index was accessed. It must check all positions and select the right one without leaking which position matched. For small arrays this is fine; for large arrays, consider your access patterns carefully.

## Cost Model

Not all operations are equal in MPC. Here's a practical cost ranking:

| Operation                      | Relative Cost          | Notes                       |
| ------------------------------ | ---------------------- | --------------------------- |
| Addition, subtraction          | Nearly free            | Local computation on shares |
| Multiplication by constant     | Nearly free            | Local computation           |
| Multiplication                 | Cheap                  | Optimized via preprocessing |
| Comparisons (`<`, `>`, `==`)   | Expensive              | Bit-by-bit operations       |
| Division, modulo by power of 2 | Expensive              | Bit shift operations        |
| Division, modulo (general)     | Very expensive         | Iterative algorithms        |
| Dynamic array indexing         | O(n)                   | Must check all positions    |
| Sorting                        | O(n·log²(n)·bit\_size) | Fixed comparison pattern    |

<Tip>
  **Optimization tip:** Batch operations when possible. Multiple `.from_arcis()` calls have overhead—restructure to minimize conversions between encrypted and secret-shared forms.
</Tip>

## Rust Patterns That Need Adjustment

Arcis is Rust, but some common patterns need adaptation:

| Standard Rust                 | Arcis Equivalent             | Why                           |
| ----------------------------- | ---------------------------- | ----------------------------- |
| `Vec<T>`                      | `[T; N]`                     | Fixed size required           |
| `String`                      | `[u8; N]`                    | Fixed size required           |
| `while condition { }`         | `for i in 0..MAX { }`        | Fixed iterations              |
| `match`                       | Nested `if/else`             | `match` not supported yet     |
| `break`, `continue`, `return` | Restructure logic            | No early exit                 |
| `.filter()`                   | Manual loop with conditional | Would produce variable length |
| `HashMap`                     | Arrays with manual lookup    | Fixed size required           |

## Syntax Constraints

A few syntax rules to keep in mind:

* **`if`, `else`, and `else if` all work normally** — but remember: when the condition is not a compile-time constant, both branches execute (MPC cost = sum of all branches)
* **`.reveal()` and `.from_arcis()` cannot be called inside `if/else` blocks when the condition is not a compile-time constant** — if the condition is a compile-time constant (like `if true`), only one branch runs and reveal is allowed inside
* **No `match`**: Use `if/else` chains instead
* **No early `return`**: Functions must have a single exit point
* **No `while`, `loop`, `break`, `continue`**: Use `for` loops with fixed bounds
* **Enums**: Not supported yet

## What You Learned

* **Secret sharing splits data across nodes** — no single node sees the actual value
* **Circuits are fixed at compile time** — structure cannot depend on secret data
* **Both branches execute** — MPC cost is the sum, not max
* **Loops need fixed bounds** — no `while`, `break`, or `continue`
* **Use fixed-size types** — `[T; N]` instead of `Vec<T>`
* **Reveal outside conditionals** — `.reveal()` and `.from_arcis()` are global operations
* **Dynamic indexing is O(n)** — the circuit checks all positions
* **Comparisons are expensive** — additions and multiplications are cheap

## What's Next?

Now that you understand the mental model:

<CardGroup cols={3}>
  <Card title="Types" icon="brackets-curly" href="/developers/arcis/types">
    Supported types including integers, arrays, and encrypted types.
  </Card>

  <Card title="Input/Output" icon="arrow-right-arrow-left" href="/developers/arcis/input-output">
    Working with `Enc<Owner, T>` for encrypted data.
  </Card>

  <Card title="Operations" icon="grid-2" href="/developers/arcis/operations">
    Complete operation support matrix.
  </Card>
</CardGroup>

Or for quick syntax lookup:

<Card title="Quick Reference" icon="graduation-cap" href="/developers/arcis/quick-reference">
  Concise syntax lookup while coding.
</Card>
> ## Documentation Index
> Fetch the complete documentation index at: https://docs.arcium.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Types

> Supported types in Arcis: integers, floats, arrays, structs, and encrypted types

The following types are supported:

* `u8`, `u16`, `u32`, `u64`, `u128`, `usize`, `i8`, `i16`, `i32`, `i64`, `i128`, `isize`
* `f64`, `f32` (emulated as fixed-point with 52 fractional bits; supported range is `[-2^75, 2^75)`. Values outside this range are unsupported.)
* tuples of supported types, including `()`
* fixed-length arrays of a supported type
* slices with compile-time known length (e.g., `&arr[..]` from fixed arrays, or `&[u8]` parameters in stdlib APIs like SHA3)
* compile-time known ranges
* (mutable) references to a supported type
* user-defined structs of supported types
* functions (but not as input or output of an encrypted instruction)
* `ArcisX25519Pubkey`, an Arcis public key wrapper.
* Arcis-defined `Enc`, `Mxe` and `Shared`.
* `Pack<T>`, a wrapper for bit-packing data into fewer field elements for onchain storage.
* `EncData<T>`, encrypted data without embedded cipher info. Use with `.to_arcis_with_pubkey_and_nonce()` when multiple values share the same key.
* `BaseField`, a Curve25519 field element (F\_{2^255-19}, stored in 256 bits) used as the native type for circuit computations.

<Warning>
  **Float emulation**: Arcis emulates `f64`/`f32` as fixed-point with 52 fractional bits. This differs from IEEE 754 floats:

  * Different precision characteristics than standard floats
  * Supported range: `[-2^75, 2^75)`
  * **Float literals outside this range produce a compile-time error:** `"Arcis only supports inputs in the range [-2**75, 2**75)"`
  * **Computed values outside this range are silently clamped** to the boundary values
</Warning>

## Encryption Types

| Type             | Description                                 |
| ---------------- | ------------------------------------------- |
| `Enc<Shared, T>` | Data encrypted for client + MXE             |
| `Enc<Mxe, T>`    | Data encrypted for MXE only                 |
| `EncData<T>`     | Raw encrypted data (advanced use—see below) |
| `Shared`         | Owner type for client-shared encryption     |
| `Mxe`            | Owner type for MXE-only encryption          |

The `Owner` type parameter determines who can decrypt:

* **`Shared`**: Both client and MXE can decrypt. Use for user inputs/outputs that need client-side verification.
* **`Mxe`**: Only the MXE cluster can decrypt. Use for internal protocol state that users should not access.

## Public Key Types

| Type                        | Description                                  |
| --------------------------- | -------------------------------------------- |
| `ArcisX25519Pubkey`         | Arcis X25519 public key wrapper              |
| `SolanaPublicKey`           | Solana public key (32 bytes)                 |
| `SerializedSolanaPublicKey` | Serialized form using `{lo: u128, hi: u128}` |

## Example

```rust  theme={null}
use arcis::*;

#[encrypted]
mod types_example {
    use arcis::*;

    #[derive(Copy, Clone)]
    struct GameState {
        score: u64,
        level: u8,
    }

    #[instruction]
    fn example(
        user_data: Enc<Shared, u64>,
        state: Enc<Mxe, GameState>,
    ) -> Enc<Shared, u64> {
        let value = user_data.to_arcis();
        user_data.owner.from_arcis(value * 2)
    }
}
```

## Advanced: EncData\<T>

`EncData<T>` stores just the encrypted ciphertext without owner metadata. Compare:

| Type            | Contains                         | Use Case                                   |
| --------------- | -------------------------------- | ------------------------------------------ |
| `Enc<Owner, T>` | Owner (cipher context) + EncData | Standard encrypted input/output            |
| `EncData<T>`    | Just ciphertext                  | Performance optimization when sharing keys |

**When to use `EncData<T>`:** When multiple inputs share the same public key, `Enc<Shared, T>` duplicates the key-derivation circuit for each input. Instead, use `EncData<T>` with a shared key:

```rust  theme={null}
#[instruction]
fn optimized_sum(
    key: ArcisX25519Pubkey,
    t_nonce: u128, t: EncData<u64>,
    u_nonce: u128, u: EncData<u64>,
) -> u64 {
    // Decrypt both values using shared key (avoids duplicate key-derivation circuits)
    let t_val = t.to_arcis_with_pubkey_and_nonce(key, t_nonce);
    let u_val = u.to_arcis_with_pubkey_and_nonce(key, u_nonce);

    // Compute sum and reveal result
    (t_val + u_val).reveal()
}
```

<Warning>
  `EncData<T>` is an advanced optimization with security implications:

  * **Nonce uniqueness:** Each (key, nonce) pair must be unique. Reusing nonces compromises security.
  * **Silent failures:** Using the wrong key or nonce produces garbage data without error—MPC cannot add runtime validation since that would leak information.

  For most use cases, use `Enc<Shared, T>` or `Enc<Mxe, T>`, which handle key management automatically.
</Warning>

## Unsupported Types

In particular, Arcis does not currently support `HashMap`, `Vec`, `String` (we do not support types with a variable `len`). Constant-size byte strings (like `b"hello_world"`) are supported.

The `Enc` type defines the encrypted data input, which is used as `Enc<Owner, T>` where `Owner` can be either `Mxe` or `Shared`, signaling which party can decrypt data of type `T`. You can read more about dealing with encrypted inputs/outputs [here](/developers/arcis/input-output).

<Note>
  **Storage representation:** All values are stored as 256-bit Curve25519 field elements. A `u8` uses the same storage as a `u128`—integer type bounds are enforced at compile time, not by storage size. Use `Pack<T>` to compress multiple small values into fewer field elements for onchain efficiency.
</Note>

## What's Next?

<CardGroup cols={2}>
  <Card title="Input/Output" icon="arrow-right-arrow-left" href="/developers/arcis/input-output">
    Working with `Enc<Owner, T>` for encrypted inputs and outputs.
  </Card>

  <Card title="Operations" icon="grid-2" href="/developers/arcis/operations">
    Complete operation support matrix and iterator reference.
  </Card>
</CardGroup>

<Card title="Primitives" icon="cube" href="/developers/arcis/primitives">
  RNG, crypto, and `Pack<T>` for efficient storage.
</Card>

> ## Documentation Index
> Fetch the complete documentation index at: https://docs.arcium.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Input/Output

> Working with Enc types for encrypted inputs and outputs in Arcis circuits

Inputs and outputs in confidential instructions are handled the same way. The Arcium network does not mutate any state itself. Both can be encrypted or plaintext.

Encrypted data is passed as an `Enc<Owner, T>` generic type. See [Types](/developers/arcis/types#encryption-types) for the full reference on `Enc<Shared, T>` vs `Enc<Mxe, T>`.

## Data Visibility

Parameters and return values have different visibility levels during MPC execution:

| Type                            | Who Sees Plaintext              |
| ------------------------------- | ------------------------------- |
| Plaintext (`u64`, `bool`, etc.) | All ARX nodes                   |
| `Enc<Shared, T>`                | Client + MXE (after decryption) |
| `Enc<Mxe, T>`                   | MXE only                        |

<Warning>
  Plaintext parameters are visible to all ARX nodes during computation. Use `Enc<Shared, T>` for sensitive user data.
</Warning>

### Return Value Requirements

Values returned from an `#[instruction]` must be in a form that can leave the MPC circuit:

* **Encrypted:** Call `.from_arcis()` to produce `Enc<Owner, T>`. The ciphertext is public bytes; the plaintext remains protected.
* **Revealed:** Call `.reveal()` to produce plaintext. The value becomes visible to everyone.

Secret-shared values (intermediate results from `.to_arcis()`) cannot be returned directly—they exist only within the MPC computation.

## Example

```rust  theme={null}
use arcis::*;

#[encrypted]
mod order_book {
    use arcis::*;

    const ORDER_BOOK_SIZE: usize = 8;

    #[derive(Copy, Clone)]
    pub struct Order {
        size: u64,
        bid: bool,
        owner: u128,
    }

    #[derive(Copy, Clone)]
    pub struct OrderBook {
        orders: [Order; ORDER_BOOK_SIZE],
    }

    #[instruction]
    pub fn add_order(
        order_ctxt: Enc<Shared, Order>,
        ob_ctxt: Enc<Mxe, OrderBook>,
    ) -> Enc<Mxe, OrderBook> {
        let order = order_ctxt.to_arcis();
        let mut ob = ob_ctxt.to_arcis();
        let mut found = false;
        for i in 0..ORDER_BOOK_SIZE {
            let overwrite = ob.orders[i].size == 0 && !found;
            if overwrite {
                ob.orders[i] = order;
            }
            found = overwrite || found;
        }
        ob_ctxt.owner.from_arcis(ob)
    }
}
```

This example demonstrates how to pass inputs into confidential instructions, compute on them, and return outputs. The goal is to add an order to an existing order book.

In this example, `order_ctxt: Enc<Shared, Order>` contains data encrypted with a shared secret between the client and MXE—both can decrypt it. In contrast, `ob_ctxt: Enc<Mxe, OrderBook>` is encrypted exclusively for the MXE, so only the MXE nodes (acting together) can decrypt it. This pattern is useful for storing protocol state that users shouldn't access directly.

<Note>
  **Why use Mxe?** If `ob_ctxt` were `Enc<Shared, OrderBook>`, any user could decrypt the entire order book and see everyone else's orders. By using `Enc<Mxe, OrderBook>`, only the MXE cluster can access the aggregate state—individual users can only see their own inputs and the revealed outputs.
</Note>

To use the parameters `order_ctxt` and `ob_ctxt` for computation, we need to convert them to corresponding secret shares for the nodes to compute in MPC. This is done by calling the `to_arcis` function on any `Enc` generic parameter. This does not reveal the plaintext data underneath to the nodes during the process.

The order parameter is consumed after the confidential instruction has been processed. To output the new order book, convert it back using `from_arcis` on the `ob_ctxt.owner` field (the party that encrypted the data) to get the new `Enc<Owner, T>` type, and return it.

For more details on how to invoke these encrypted instructions from your Solana program, see [Invoking a Computation](/developers/program).

## What's Next?

<Card title="Operations" icon="grid-2" href="/developers/arcis/operations">
  Complete operation support matrix for expressions, iterators, and generics.
</Card>

<CardGroup cols={2}>
  <Card title="Types" icon="brackets-curly" href="/developers/arcis/types">
    Full reference for `Enc<Owner, T>` and other encryption types.
  </Card>

  <Card title="Sealing" icon="lock" href="/developers/encryption/sealing">
    Re-encrypting data for different recipients.
  </Card>
</CardGroup>
> ## Documentation Index
> Fetch the complete documentation index at: https://docs.arcium.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Operations

> Complete reference for supported operations, expressions, and patterns in Arcis MPC circuits

Arcis supports many of Rust's native operations and extends them for encrypted data, allowing you to write private computations using familiar Rust syntax. See the tables below for a detailed list of supported and unsupported operations.

<Tip>
  **Use this page when** you need to check if a specific operation is supported in Arcis circuits.
</Tip>

## Quick Summary

**Works:** `if/else`, `for` loops, arithmetic, comparisons, iterators (except filter)

**Doesn't work:** `while`, `loop`, `break`, `match`, `return`, `.filter()`

See tables below for full details.

### Table of contents

* [Expression support](#expression-support)
  * [Binary expressions](#binary-expressions)
  * [Casts](#cast-expressions)
  * [Literals](#literal-expressions)
  * [Methods](#method-calls)
  * [Paths](#paths)
* [Item support](#item-support)
* [Pattern support](#pattern-support)

## Expression support

| Expression Name   | Example                        | Support         | Comments                                                                                                                                    |
| ----------------- | ------------------------------ | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Array literal     | `[a, b]`                       | Supported       |                                                                                                                                             |
| Assignment        | `a = b;`                       | Supported       |                                                                                                                                             |
| Async block       | `async { ... }`                | Unsupported     |                                                                                                                                             |
| Await             | `foo().await`                  | Unsupported     |                                                                                                                                             |
| Binary expression | `a + b`                        | Partial Support | [See table below](#binary-expressions) for supported binary expressions.                                                                    |
| Block expression  | `{ ... }`                      | Supported       |                                                                                                                                             |
| Break             | `break;`                       | Unsupported     |                                                                                                                                             |
| Function call     | `f(a, b)`                      | Partial Support | [See table below](#function-calls) for supported functions.                                                                                 |
| Casts             | `a as u16`                     | Partial Support | [See table below](#cast-expressions) for supported conversions.                                                                             |
| Closures          | `\|a, b \| a + b`              | Supported       |                                                                                                                                             |
| Const block       | `const { ... }`                | Supported       |                                                                                                                                             |
| Continue          | `continue;`                    | Unsupported     |                                                                                                                                             |
| Field access/set  | `obj.field`                    | Supported       |                                                                                                                                             |
| For loop          | `for i in expr { ... }`        | Supported       | Note that `expr` will have its length known at compile-time.                                                                                |
| If                | `if cond { ... } else { ... }` | Supported       | Complexity is O(then\_block + else\_block).                                                                                                 |
| Indexing          | `a[idx]`                       | Supported       | Complexity is O(`a.len()`) if `idx` isn't compile-time known (all positions are checked to hide which index was accessed).                  |
| If let            | `if let Some(x) = ...`         | Unsupported     |                                                                                                                                             |
| Literals          | `1u128`                        | Partial Support | [See table below](#literal-expressions) for supported literals.                                                                             |
| Loops             | `loop { ... }`                 | Unsupported     | MPC circuits have fixed structure—variable iteration counts would require dynamic circuit size. Use `for` with compile-time bounds instead. |
| Macros            | `println!("{}", q)`            | Partial Support | [See table below](#macros) for supported macros.                                                                                            |
| Match             | `match n { ... }`              | Unsupported     |                                                                                                                                             |
| Method calls      | `x.foo(a, b)`                  | Partial Support | [See table below](#method-calls) for supported methods.                                                                                     |
| Parentheses       | `(a + b)`                      | Supported       |                                                                                                                                             |
| Paths             | `Foo::bar`                     | Partial Support | [See table below](#paths) for supported paths.                                                                                              |
| Ranges            | `4..5`                         | Partial Support | Not supported in `arr[4..16]`.                                                                                                              |
| Raw addresses     | `&raw const foo`               | Unsupported     |                                                                                                                                             |
| References        | `&mut foo`                     | Supported       |                                                                                                                                             |
| Repeat arrays     | `[4u8; 128]`                   | Supported       |                                                                                                                                             |
| Return            | `return false;`                | Unsupported     |                                                                                                                                             |
| Struct literals   | `MyStruct { a: 12, b }`        | Supported       |                                                                                                                                             |
| Try expression    | `this_call_can_err()?;`        | Unsupported     |                                                                                                                                             |
| Tuple literal     | `(a, 4, c)`                    | Supported       |                                                                                                                                             |
| Unary expressions | `!x`                           | Partial Support | User-defined unary operations are not supported.                                                                                            |
| Unsafe            | `unsafe { ... }`               | Unsupported     |                                                                                                                                             |
| While loops       | `while x < 64 { ... }`         | Unsupported     | Cannot be supported as the number of iterations is not known.                                                                               |

<Note>
  **Why both branches count:** In MPC, both `if` and `else` branches are always evaluated—the condition only selects which result to use. This ensures the execution pattern does not leak information about the condition value. See [Thinking in MPC](/developers/arcis/mental-model) for details.
</Note>

### Binary expressions

User-defined binary operations are currently unsupported.

| Example    | Supported types                            |
| ---------- | ------------------------------------------ |
| `a + b`    | Integers, floats                           |
| `a - b`    | Integers, floats                           |
| `a * b`    | Integers, floats                           |
| `a / b`    | Integers, floats                           |
| `a % b`    | Integers                                   |
| `a && b`   | Booleans                                   |
| `a \|\| b` | Booleans                                   |
| `a ^ b`    | Booleans                                   |
| `a & b`    | Booleans                                   |
| `a \| b`   | Booleans                                   |
| `a << b`   | None                                       |
| `a >> b`   | Integers, if `b` is known at compile time. |
| `a == b`   | All. Use `derive(PartialEq)` for structs.  |
| `a != b`   | All. Use `derive(PartialEq)` for structs.  |
| `a < b`    | Booleans, integers, floats                 |
| `a <= b`   | Booleans, integers, floats                 |
| `a >= b`   | Booleans, integers, floats                 |
| `a > b`    | Booleans, integers, floats                 |
| `a += b`   | Integers, floats                           |
| `a -= b`   | Integers, floats                           |
| `a *= b`   | Integers, floats                           |
| `a /= b`   | Integers, floats                           |
| `a %= b`   | Integers                                   |
| `a ^= b`   | Booleans                                   |
| `a &= b`   | Booleans                                   |
| `a \|= b`  | Booleans                                   |
| `a <<= b`  | None                                       |
| `a >>= b`  | Integers, if `b` is known at compile time  |

### Cast expressions

`a as MyType` is only supported:

| From Type    | To Type      |
| ------------ | ------------ |
| integer type | integer type |
| `bool`       | integer type |
| integer type | `bool`       |
| `&...&T`     | `&T`         |

### Function calls

The following function calls are supported:

* user-defined function calls (without recursion)
* `ArcisRNG::bool()` to generate a boolean.
* `ArcisRNG::gen_uniform::<T>()` to generate a uniform value of type T (bool, integer, or combination). Requires explicit type parameter.
* `ArcisRNG::gen_integer_from_width(width: usize) -> u128`. Generates a secret integer between 0 and 2^width - 1 included.
* `ArcisRNG::gen_public_integer_from_width(width: usize) -> u128`. Generates a public integer between 0 and 2^width - 1 included.
* `ArcisRNG::gen_integer_in_range(min: u128, max: u128, n_attempts: usize) -> (u128, bool)`. Generates a random integer in `[min, max]` using rejection sampling. **`n_attempts` must be compile-time known**. Returns `(result, success)` where `success=false` indicates all attempts were rejected. With `n_attempts=24`, failure probability is `<2^-24`.
* `ArcisRNG::shuffle(slice)` on slices. Complexity is in `O(n*log³(n) + n*log²(n)*sizeof(T))`.
* `Mxe::get()` to be able to create MXE-owned secret data.
* `Shared::new(arcis_public_key)` to share private data with `arcis_public_key`.
* `ArcisX25519Pubkey::from_base58(base58_byte_string)` to create a public key from a base58-encoded address.
* `ArcisX25519Pubkey::from_uint8(u8_byte_slice)` to create a public key from a Uint8 array.
* `SolanaPublicKey::from_serialized(value)` to create a Solana public key from serialized form.
* `SolanaPublicKey::from_base58(byte_string)` to create a Solana public key from base58.
* `ArcisMath::sigmoid(x)` for the sigmoid activation function.
* `LogisticRegression::new(coef, intercept)` for logistic regression models.
* `LinearRegression::new(coef, intercept)` for linear regression models.
* `Pack::new(value)` to bit-pack data for onchain storage (multiple small values fit into fewer field elements).
* `ArcisX25519Pubkey::new_from_x(x: BaseField)` to create a public key from its Curve25519 Montgomery X-coordinate.
* `ArcisX25519Pubkey::to_x()` to extract the Montgomery X-coordinate from a public key.

### Literal expressions

| Example     | Support     |
| ----------- | ----------- |
| `"foo"`     | Unsupported |
| `b"foo"`    | Supported   |
| `c"foo"`    | Unsupported |
| `b'f'`      | Supported   |
| `'a'`       | Unsupported |
| `1`         | Supported   |
| `1u16`      | Supported   |
| `1f64`      | Supported   |
| `1.0e10f64` | Supported   |
| `true`      | Supported   |

### Macros

The following macros are supported to help debug your Rust code:

* `debug_assert!`, `debug_assert_ne!`, `debug_assert_eq!`. They do not change instruction behavior and are only useful for debugging your Rust code.
* `eprint!`, `eprintln!`, `print!`, `println!`. They do not change instruction behavior and are only useful for debugging your Rust code.
* `arcis_static_panic!(message)` to fail compilation when the branch is reached. Useful for enforcing constraints that must be known before circuit generation.

Example usage:

```rust  theme={null}
const ARRAY_LEN: usize = 3; // Change to 1 and the example will not compile.

fn second_element(arr: &[u8]) -> u8 {
    if arr.len() < 2 {
        arcis_static_panic!("Array must have at least 2 elements");
    }
    arr[1]
}

#[instruction]
fn reveal_second_element(input: Enc<Shared, Pack<[u8; ARRAY_LEN]>>) -> u8 {
    let array = input.to_arcis().unpack();
    second_element(&array).reveal()
}
```

<Note>
  `arcis_static_panic!` triggers at compile time when the Arcis compiler evaluates the branch. Try changing `ARRAY_LEN` to `1` above—the compile error demonstrates how this macro enforces constraints that must be validated before circuit generation.
</Note>

### Method calls

The following method calls are supported:

* user-defined method calls (with generics but without recursion)
* `.clone()` on all `Clone` objects.
* `.len()`, `.is_empty()`, `.swap(a, b)`, `.fill(value)`, `.reverse()`, `.iter()`, `.iter_mut()`, `.into_iter()`, `.windows(width)`, `.copy_from_slice(src)`, `.clone_from_slice(src)`, `.split_at(mid)`, `.split_at_mut(mid)`, `.rotate_left(mid)`, `.rotate_right(mid)`, `.contains(item)`, `.starts_with(needle)`, `.ends_with(needle)` on arrays and slices.
* `.sort()` on arrays of integers. Complexity is in `O(n*log²(n)*bit_size)`.
* `.enumerate()`, `.chain(other)`, `.cloned()`, `.copied()`, `.count()`, `.rev()`, `.zip(other)`, `.map(func)`, `.for_each(func)`, `.fold(init, func)`, `.sum()`, `.product()` on iterators.
* `.take(n)`, `.skip(n)`, `.step_by(n)` on iterators when `n` is compile-time known.
* `.reveal()` if not inside an `if` or `else` block where the condition is not a compile-time constant
* `.to_arcis()` on `Enc`s
* `.from_arcis(x)` on `Owner`s (objects of types `Mxe` or `Shared`) if not inside an `if` or `else` block where the condition is not a compile-time constant
* `.abs()`, `.min(x)`, `.max(x)` on integers and floats
* `.abs_diff(other)`, `.is_positive()`, `.is_negative()`, `.div_ceil(other)` on integers
* `.to_le_bytes()`, `.to_be_bytes()` on typed integers (does not work on integers whose type the interpreter does not know)
* `.exp()`, `.exp2()`, `.ln()`, `.log2()`, `.sqrt()` on floats.
* `.unpack()` on `Pack<T>` to extract the original value from packed storage.
* `.to_arcis_with_pubkey_and_nonce(pubkey, nonce)` on `EncData<T>` to decrypt when the key is shared across inputs (avoids duplicate decryption gates).

### Paths

The following paths are supported:

* `IntType::BITS`, `IntType::MIN` and `IntType::MAX` where `IntType` is an integer type.
* Paths to user-defined constants, functions and structs, as long as they don't use the unsupported `crate` or `super`.
* `std::mem::replace` and `std::mem::swap`

## Item support

| Item Name         | Example                     | Support         | Comments                                                                               |
| ----------------- | --------------------------- | --------------- | -------------------------------------------------------------------------------------- |
| Constant          | `const MAX: u16 = 65535`    | Supported       |                                                                                        |
| Enum              | `enum MyEnum { ... }`       | Unsupported     |                                                                                        |
| Extern            | `extern ...`                | Unsupported     |                                                                                        |
| Functions         | `fn foo() -> u8 { 0 }`      | Partial Support | Recursive functions are not supported.                                                 |
| Impls             | `impl MyType { ... }`       | Supported       | Generics and custom traits are supported. `MyType` must not be a reference.            |
| Macro Definitions | `macro_rules! ...`          | Unsupported     |                                                                                        |
| Macro Invocations | `println!(...)`             | Partial Support | [See table above](#macros) for supported macros.                                       |
| Modules           | `mod my_module { ... }`     | Supported       |                                                                                        |
| Statics           | `static ...`                | Unsupported     |                                                                                        |
| Structs           | `struct MyStruct { ... }`   | Supported       |                                                                                        |
| Traits            | `trait MyTrait { ... }`     | Partial Support | Custom traits with associated types and constants. Standard library traits forbidden.¹ |
| Type Aliases      | `type MyId = usize;`        | Supported       |                                                                                        |
| Union             | `union MyUnion { ... }`     | Unsupported     |                                                                                        |
| Use               | `use arcis::*`              | Partial Support | Only `use arcis::*` is supported.                                                      |
| Arcis Circuit     | `#[arcis_circuit = "name"]` | Supported       | Use a pre-built optimized circuit by name. For internal/advanced use.                  |

<Note>
  ¹ **Forbidden trait implementations**: You cannot manually implement `Drop`, `Deref`, `AsRef`, `AsMut`, `From`, `Into`, `TryFrom`, `TryInto`, `PartialEq`, `Eq`, `PartialOrd`, `Ord`, `Clone`, `ToOwned`, `ToString`, `Default`, `Iterator`, `IntoIterator`, `DoubleEndedIterator`, `ExactSizeIterator`, `Extend`, `FromIterator`, `Fn`, `FnMut`, `FnOnce`, `Future`, `IntoFuture`, `AsyncFn`, `AsyncFnMut`, or `AsyncFnOnce`.

  **Why?** These traits have special runtime semantics (drop ordering, lazy evaluation, dynamic dispatch) that cannot be correctly translated to fixed MPC circuits. The Arcis compiler provides built-in implementations that work within MPC constraints.

  Use `#[derive(...)]` for `Clone`, `PartialEq`, etc., which generates MPC-compatible implementations.
</Note>

## Pattern support

The following patterns are supported in function arguments and `let` statements:

* simple idents: `let ident = ...;`
* mutable idents: `let mut ident = ...;`
* ref idents: `let ref ident = ...;`
* mutable ref idents: `let ref mut ident = ...;`
* parentheses around a supported pattern: `let (...) = ...;`
* reference of a supported pattern: `let &... = ...;`
* array of supported patterns: `let [...] = ...;`
* struct of supported patterns: `let MyStruct { ... } = ...;`
* tuple of supported patterns: `let (...) = ...;`
* tuple struct of supported patterns: `let MyStruct(...) = ...;`
* type pattern of a supported pattern: `let ...: ty = ...;`
* wild pattern: `let _ = ...;`

In particular, the `..` pattern is currently unsupported.

## Generics

Arcis supports Rust generics with some constraints. Generic types must be known at compile time. Runtime polymorphism is not supported.

### Generic Functions

```rust  theme={null}
#[encrypted]
mod generics_example {
    use arcis::*;

    // Use a pre-built optimized circuit by name
    // The empty function body is intentional - the circuit implementation is built-in
    #[arcis_circuit = "zero"]
    fn make_zero<T: ArcisType>(a: T) -> T {}

    fn set_zero<T: ArcisType + Copy>(a: &mut T) {
        *a = make_zero(*a);
    }

    #[instruction]
    fn zero_any_type(mut arr: [u8; 10], mut val: u64) -> ([u8; 10], u64) {
        set_zero(&mut arr);
        set_zero::<u64>(&mut val);  // Turbofish syntax works
        (arr, val)
    }
}
```

### Generic Structs

```rust  theme={null}
struct Wrapper<T>(T);

impl<T> Wrapper<T> {
    fn new(value: T) -> Self {
        Wrapper(value)
    }

    fn into_inner(self) -> T {
        self.0
    }
}

#[instruction]
fn use_generic_struct(a: u8) -> u8 {
    Wrapper::new(a).into_inner()
}
```

### Custom Traits

```rust  theme={null}
trait Processable {
    type Output;
    fn process(&self) -> Self::Output;
}

impl Processable for u8 {
    type Output = u16;
    fn process(&self) -> u16 {
        *self as u16 * 2
    }
}

fn apply_process<T: Processable>(val: &T) -> T::Output {
    val.process()
}

#[instruction]
fn trait_example(x: u8) -> u16 {
    apply_process(&x)
}
```

### Generic Constraints

| Feature                 | Supported | Notes                           |
| ----------------------- | --------- | ------------------------------- |
| Type parameters `<T>`   | Yes       | Must be known at compile time   |
| Trait bounds `T: Trait` | Yes       | Including `ArcisType`           |
| Associated types        | Yes       | `type Output;`                  |
| Associated constants    | Yes       | `const SIZE: usize;`            |
| Where clauses           | Yes       | `where T: Clone`                |
| Turbofish `::<T>`       | Yes       | For explicit type specification |
| Runtime polymorphism    | No        | No `dyn Trait` or trait objects |

## Iterators

Most iterator methods work in Arcis, with the notable exception of `.filter()`.

### Supported Iterator Methods

```rust  theme={null}
#[instruction]
fn iterator_examples(arr: [u8; 10]) -> u16 {
    // Basic iteration
    let mut sum = 0u16;
    for val in arr.iter() {
        sum += *val as u16;
    }

    // Method chaining
    arr.iter()
       .map(|x| *x as u16)
       .map(|x| x * 2)
       .sum()
}
```

### Complete Iterator Support

| Method           | Supported | Notes                                |
| ---------------- | --------- | ------------------------------------ |
| `.iter()`        | Yes       | Creates iterator of references       |
| `.iter_mut()`    | Yes       | Mutable references                   |
| `.into_iter()`   | Yes       | Consumes collection                  |
| `.map(f)`        | Yes       | Transform elements                   |
| `.enumerate()`   | Yes       | Add indices                          |
| `.zip(other)`    | Yes       | Pair with another iterator           |
| `.chain(other)`  | Yes       | Concatenate iterators                |
| `.rev()`         | Yes       | Reverse order                        |
| `.cloned()`      | Yes       | Clone elements                       |
| `.copied()`      | Yes       | Copy elements                        |
| `.fold(init, f)` | Yes       | Reduce with accumulator              |
| `.sum()`         | Yes       | Sum all elements                     |
| `.product()`     | Yes       | Multiply all elements                |
| `.count()`       | Yes       | Count elements                       |
| `.take(n)`       | Yes       | n must be compile-time known         |
| `.skip(n)`       | Yes       | n must be compile-time known         |
| `.step_by(n)`    | Yes       | n must be compile-time known         |
| `.for_each(f)`   | Yes       | Apply function to each               |
| `.filter(f)`     | **No**    | Would produce variable-length output |
| `.find(f)`       | **No**    | Would require early exit             |
| `.any(f)`        | **No**    | Would require early exit             |
| `.all(f)`        | **No**    | Would require early exit             |

### Filter Alternative

Since `.filter()` is not supported (it produces variable-length output), use a manual loop with conditionals:

```rust  theme={null}
// ✗ Not supported
arr.iter().filter(|x| **x > threshold).sum()

// ✓ Manual filter pattern
#[instruction]
fn filter_sum(arr: [u8; 10], threshold: u8) -> u16 {
    let mut sum = 0u16;
    for val in arr.iter() {
        if *val > threshold {
            sum += *val as u16;
        }
    }
    sum
}
```

This pattern checks all elements but only accumulates those meeting the condition—same result, fixed execution structure.

## What's Next?

<Card title="Primitives" icon="cube" href="/developers/arcis/primitives">
  RNG, cryptography, and data packing operations.
</Card>

<CardGroup cols={2}>
  <Card title="Best Practices" icon="wand-magic-sparkles" href="/developers/arcis/best-practices">
    Performance optimization tips based on operation costs.
  </Card>

  <Card title="Cost Model" icon="brain" href="/developers/arcis/mental-model#cost-model">
    Understanding the cost model behind operations.
  </Card>
</CardGroup>
> ## Documentation Index
> Fetch the complete documentation index at: https://docs.arcium.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Primitives

> Random number generation, cryptographic operations, and data packing in Arcis

Arcis provides built-in primitives for randomness, cryptography, and efficient data storage. These operations are implemented as optimized MPC circuits.

## Random Number Generation

The `ArcisRNG` struct provides access to randomness within MPC circuits. All random values are generated within the MPC context.

### Basic Usage

```rust  theme={null}
use arcis::*;

#[encrypted]
mod randomness_example {
    use arcis::*;

    #[instruction]
    pub fn random_operations() -> (bool, u128, [u8; 32]) {
        // Generate a random boolean (50/50 probability)
        let coin_flip = ArcisRNG::bool();
        
        // Generate a random integer with specific bit width
        // Returns u128 in range [0, 2^width - 1]
        let random_byte = ArcisRNG::gen_integer_from_width(8);  // 0-255
        let random_u64 = ArcisRNG::gen_integer_from_width(64);  // 0 to 2^64-1
        
        // Generate a uniformly random value of any supported type
        let random_array = ArcisRNG::gen_uniform::<[u8; 32]>();
        
        (coin_flip.reveal(), random_byte.reveal(), random_array.reveal())
    }
}
```

<Note>
  The `width` parameter in `gen_integer_from_width` must be known at compile time.
</Note>

### Public vs Secret Random Integers

```rust  theme={null}
// Secret random integer (default) - only revealed when you call .reveal()
let secret_num = ArcisRNG::gen_integer_from_width(64);

// Public random integer - visible to all ARX nodes during circuit execution
let public_num = ArcisRNG::gen_public_integer_from_width(64);
```

Use `gen_public_integer_from_width` when you need randomness that does not need to stay secret within the MPC computation—for example, nonce generation. The value is visible to ARX nodes during execution but is not automatically included in the circuit output; you still control what gets returned.

### Range-Based Generation

To generate integers within a specific range, use `gen_integer_in_range`:

```rust  theme={null}
#[instruction]
pub fn dice_roll() -> (u128, bool) {
    // Generate integer between min and max (both inclusive)
    // n_attempts controls the success probability
    let (roll, success) = ArcisRNG::gen_integer_in_range(1, 6, 24);
    
    // With 24 attempts, failure probability is below 2^-24
    (roll.reveal(), success.reveal())
}
```

The function uses rejection sampling. Each attempt has >50% success probability, so `n_attempts=24` gives a failure probability below 2^-24.

<Note>
  The `n_attempts` parameter must be known at compile time.
</Note>

### Shuffling

Shuffle arrays in-place with cryptographic uniformity:

```rust  theme={null}
#[instruction]
pub fn shuffle_deck(mut cards: [u8; 52]) -> [u8; 52] {
    ArcisRNG::shuffle(&mut cards);
    cards.reveal()
}
```

**Complexity:** O(n·log³(n) + n·log²(n)·sizeof(T))

### What Works and What Doesn't

```rust  theme={null}
// ✓ Works
let b: bool = ArcisRNG::bool();
let n: u128 = ArcisRNG::gen_integer_from_width(64);
let arr: [u8; 32] = ArcisRNG::gen_uniform::<[u8; 32]>();

// ✗ Doesn't work - type must be explicit
let b = ArcisRNG::gen_uniform();  // Error: type inference not supported

// ✗ Doesn't work - floats cannot be generated uniformly
let f: f64 = ArcisRNG::gen_uniform::<f64>();  // Error
```

## Cryptographic Operations

### SHA3 Hashing

Arcis provides SHA3-256 and SHA3-512 hash functions:

```rust  theme={null}
#[instruction]
pub fn hash_message(message: [u8; 64]) -> [u8; 32] {
    let hasher = SHA3_256::new();
    hasher.digest(&message).reveal()
}

#[instruction]
pub fn hash_512(message: [u8; 128]) -> [u8; 64] {
    let hasher = SHA3_512::new();
    hasher.digest(&message).reveal()
}
```

<Note>
  Arcis uses SHA3 (Keccak) rather than SHA-2/SHA-512 because SHA3 has a more efficient circuit structure for MPC evaluation.
</Note>

### Ed25519 Signatures

Arcis provides Ed25519 signature operations using SHA3-512 internally (ArcisEd25519).

#### Signature Verification

```rust  theme={null}
#[instruction]
pub fn verify_signature(
    verifying_key: Pack<VerifyingKey>,  // Public key from client
    message: [u8; 32],
    signature: [u8; 64],
) -> bool {
    let vk = verifying_key.unpack();
    let sig = ArcisEd25519Signature::from_bytes(signature);
    vk.verify(&message, &sig).reveal()
}
```

#### Key Generation

```rust  theme={null}
#[instruction]
pub fn generate_keypair() -> VerifyingKey {
    // Generate a random secret key (stays secret within MPC)
    let secret_key = SecretKey::new_rand();

    // Derive and return only the verifying (public) key
    let verifying_key = VerifyingKey::from_secret_key(&secret_key);
    verifying_key.reveal()
}
```

<Note>
  Only the public verifying key is revealed. The secret key is never revealed in plaintext; it exists only as secret shares distributed across ARX nodes. Arcium uses **full-threshold security**—all ARX nodes in the cluster would need to collude to reconstruct the secret. As long as even one node remains honest, the secret stays protected.
</Note>

#### MXE Cluster Signing

Sign messages using the MXE cluster's collective key:

```rust  theme={null}
#[instruction]
pub fn cluster_sign(message: [u8; 32]) -> ArcisEd25519Signature {
    MXESigningKey::sign(&message).reveal()
}
```

### Public Key Operations

Work with X25519 public keys:

```rust  theme={null}
#[instruction]
pub fn compare_keys(key1: [u8; 32], key2: [u8; 32]) -> bool {
    let pk1 = ArcisX25519Pubkey::from_uint8(&key1);
    let pk2 = ArcisX25519Pubkey::from_uint8(&key2);
    (pk1 == pk2).reveal()
}

#[instruction]
pub fn key_from_base58() -> ArcisX25519Pubkey {
    // Create public key from base58-encoded string
    // Note: b"..." creates a byte string literal
    ArcisX25519Pubkey::from_base58(b"2uKu51kQaLseu7FySMAGWU6hpnjNvgGr3PkvUCBVTTPD")
}
```

<Accordion title="Advanced: Coordinate Extraction">
  For advanced use, work with the Montgomery X coordinate directly:

  ```rust  theme={null}
  #[instruction]
  pub fn extract_coordinate(pubkey: ArcisX25519Pubkey) -> BaseField {
      pubkey.to_x()  // Extract Montgomery X-coordinate
  }

  #[instruction]
  pub fn rebuild_from_coordinate(x: BaseField) -> ArcisX25519Pubkey {
      ArcisX25519Pubkey::new_from_x(x)  // Rebuild from X-coordinate
  }
  ```

  Coordinate extraction is for advanced cryptographic operations such as:

  * **Custom ECDH key exchange** implementations
  * **Key derivation** from shared secrets
  * **Interoperability** with external systems that work with raw Curve25519 coordinates
  * **Zero-knowledge proof** inputs that require field elements

  Most applications should use `from_base58()` or `from_uint8()` for standard public key handling.
</Accordion>

<Warning>
  **About `.reveal()`:** Revealing cryptographic keys or signatures makes them public to all ARX nodes. Only reveal data that is intended to be public output. For internal computations, keep values in secret-shared form.
</Warning>

<Card title="Reveal Constraints" icon="wand-magic-sparkles" href="/developers/arcis/mental-model#reveal-and-encryption-placement">
  Learn where `.reveal()` and `.from_arcis()` can be called.
</Card>

## Data Packing

The `Pack<T>` type provides bit-level compression for onchain storage efficiency.

### Why Packing Matters

In Arcis, all values are stored as field elements (\~255 bits / 32 bytes each). Without packing:

* A single `u8` (8 bits) uses one full field element
* `[u8; 256]` uses 256 field elements

With packing, multiple small values are combined into fewer field elements:

**The math:**

* `[u8; 256]` = 256 bytes total
* Each field element packs \~26 bytes (208 usable bits)
* Packed: ⌈256 / 26⌉ = **10 field elements**
* Compression: 256 → 10 = **\~26x fewer field elements**

Without packing, each `u8` would use a full field element (256 elements total). This significantly reduces onchain storage costs and transaction sizes.

### When to Use Pack

* Large arrays of small integers (`[u8; N]`, `[u16; N]`)
* Data that needs to be stored onchain
* Input/output parameters approaching transaction size limits

### Basic Usage

```rust  theme={null}
// Pack data for efficient storage
let packed: Pack<[u8; 64]> = Pack::new(data);

// Unpack to use the data
let data: [u8; 64] = packed.unpack();
```

<Tip>
  **Trade-off:** Packing/unpacking has compute cost. Use `Pack<T>` when storage savings outweigh the computation overhead—typically for arrays of 32+ small integers.
</Tip>

### Simple Example

```rust  theme={null}
#[instruction]
pub fn pack_data(data: [u8; 64]) -> Pack<[u8; 64]> {
    Pack::new(data)  // Compress 64 bytes into ~3 field elements
}

#[instruction]
pub fn unpack_data(packed: Pack<[u8; 64]>) -> [u8; 64] {
    packed.unpack()  // Restore original array
}

#[instruction]
pub fn process_packed(packed: Pack<[u8; 64]>) -> u8 {
    let data = packed.unpack();
    let mut max = data[0];
    for i in 1..64 {
        if data[i] > max {
            max = data[i];
        }
    }
    max.reveal()
}
```

These basic patterns cover most `Pack<T>` use cases. The "Practical Example" below shows advanced usage with encrypted types.

### Practical Example

```rust  theme={null}
const ARRAY_SIZE: usize = 64;

#[instruction]
pub fn merge_and_sort(
    player_min: Enc<Shared, Pack<[u8; ARRAY_SIZE]>>,
    player_max: Enc<Shared, Pack<[u8; ARRAY_SIZE]>>,
) -> (Enc<Shared, Pack<[u8; ARRAY_SIZE]>>, Enc<Shared, Pack<[u8; ARRAY_SIZE]>>) {
    // Unpack the encrypted data
    let mut min_array = player_min.to_arcis().unpack();
    let mut max_array = player_max.to_arcis().unpack();
    
    // Combine, sort, and split
    let mut full = [0u8; 2 * ARRAY_SIZE];
    full[..ARRAY_SIZE].copy_from_slice(&min_array);
    full[ARRAY_SIZE..].copy_from_slice(&max_array);
    full.sort();
    
    min_array.copy_from_slice(&full[..ARRAY_SIZE]);
    max_array.copy_from_slice(&full[ARRAY_SIZE..]);
    
    // Re-pack for output
    (
        player_min.owner.from_arcis(Pack::new(min_array)),
        player_max.owner.from_arcis(Pack::new(max_array))
    )
}
```

### Pack with Crypto Types

Cryptographic types like `VerifyingKey` are often passed as `Pack<VerifyingKey>`:

```rust  theme={null}
#[instruction]
pub fn verify_with_packed_key(
    key: Pack<VerifyingKey>,  // Efficiently packed public key
    message: [u8; 32],
    signature: [u8; 64],
) -> bool {
    let vk = key.unpack();
    let sig = ArcisEd25519Signature::from_bytes(signature);
    vk.verify(&message, &sig).reveal()
}
```

## Machine Learning

Arcis includes basic ML primitives for privacy-preserving inference.

### Logistic Regression

```rust  theme={null}
#[instruction]
pub fn predict_class(
    features: Enc<Shared, [f64; 8]>,
    coefficients: Enc<Shared, [f64; 8]>,
    intercept: Enc<Shared, f64>,
) -> Enc<Shared, bool> {
    let x = features.to_arcis();
    let coef = coefficients.to_arcis();
    let bias = intercept.to_arcis();

    let model = LogisticRegression::new(&coef, bias);
    let prediction = model.predict(&x, 0.5);  // threshold = 0.5

    features.owner.from_arcis(prediction)
}
```

### Linear Regression

```rust  theme={null}
#[instruction]
pub fn predict_value(
    features: Enc<Shared, [f64; 4]>,
    coefficients: [f64; 4],  // Plaintext model weights
    intercept: f64,
) -> Enc<Shared, f64> {
    let x = features.to_arcis();
    let model = LinearRegression::new(&coefficients, intercept);
    let prediction = model.predict(&x);
    features.owner.from_arcis(prediction)
}
```

### Available ML Functions

| Function                                    | Description                      |
| ------------------------------------------- | -------------------------------- |
| `LogisticRegression::new(coef, intercept)`  | Create logistic regression model |
| `LogisticRegression::predict(x, threshold)` | Binary classification            |
| `LogisticRegression::predict_proba(x)`      | Probability output               |
| `LinearRegression::new(coef, intercept)`    | Create linear regression model   |
| `LinearRegression::predict(x)`              | Continuous prediction            |
| `ArcisMath::sigmoid(x)`                     | Sigmoid activation function      |
| `logit(p)`                                  | Inverse of sigmoid               |
| `expit(x)`                                  | Alias for sigmoid                |

<Note>
  ML models support up to 100 features (`MAX_FEATURES = 100`). For larger models, consider feature selection or dimensionality reduction.
</Note>

## Summary

| Primitive            | Use Case               | Key Methods                                                                                                                     |
| -------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `ArcisRNG`           | Random values          | `bool()`, `gen_integer_from_width()`, `gen_public_integer_from_width()`, `gen_integer_in_range()`, `gen_uniform()`, `shuffle()` |
| `SHA3_256/512`       | Hashing                | `new()`, `digest()`                                                                                                             |
| `SecretKey`          | Ed25519 keys           | `new_rand()`, `from_bytes()`                                                                                                    |
| `VerifyingKey`       | Signature verification | `from_secret_key()`, `verify()`                                                                                                 |
| `MXESigningKey`      | Cluster signing        | `sign()`                                                                                                                        |
| `ArcisX25519Pubkey`  | Public keys            | `from_base58()`, `from_uint8()`, `to_x()`, `new_from_x()`                                                                       |
| `Pack<T>`            | Efficient storage      | `new()`, `unpack()`                                                                                                             |
| `LogisticRegression` | Binary classification  | `new()`, `predict()`, `predict_proba()`                                                                                         |
| `LinearRegression`   | Regression             | `new()`, `predict()`                                                                                                            |
| `ArcisMath`          | Math functions         | `sigmoid()`                                                                                                                     |

## What's Next?

<CardGroup cols={2}>
  <Card title="Best Practices" icon="wand-magic-sparkles" href="/developers/arcis/best-practices">
    Performance optimization, debugging, and testing strategies.
  </Card>

  <Card title="Quick Reference" icon="graduation-cap" href="/developers/arcis/quick-reference">
    Concise syntax lookup for all Arcis patterns.
  </Card>
</CardGroup>

<Card title="Operations" icon="grid-2" href="/developers/arcis/operations">
  Full function and method reference.
</Card>
> ## Documentation Index
> Fetch the complete documentation index at: https://docs.arcium.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Best practices

> Performance tips, debugging techniques, and testing strategies for Arcis circuits

This guide covers practical tips for writing efficient, debuggable, and testable Arcis circuits.

<Tip>
  **Use this page when** you are optimizing circuit performance, debugging an issue, or setting up tests.
</Tip>

## Understanding Execution Flow

For conceptual background on why MPC circuits work differently (e.g., why both if/else branches execute), see [Thinking in MPC](/developers/arcis/mental-model).

## Performance Optimization

### Operation Costs

See [Thinking in MPC - Cost Model](/developers/arcis/mental-model#cost-model) for the full cost breakdown.

| Operation                             | Cost      | Notes                                       |
| ------------------------------------- | --------- | ------------------------------------------- |
| Addition, subtraction, multiplication | Cheap     | Multiplications optimized via preprocessing |
| Comparisons                           | Expensive | Bit decomposition required                  |
| Division, modulo                      | Expensive | Multiple internal operations                |
| Dynamic indexing                      | O(n)      | Checks all positions                        |

### Optimization Tips

**Batch encrypted outputs when possible**:

```rust  theme={null}
// Multiple separate encryptions have overhead
let enc_a = owner.from_arcis(x);
let enc_b = owner.from_arcis(y);

// If you need both values encrypted together, use a tuple type
let enc_tuple: Enc<Shared, (u64, u64)> = owner.from_arcis((x, y));

// ✗ Won't compile - Enc<T> wraps the entire value,
//   so destructuring patterns don't work on Enc types
// let (enc_a, enc_b) = owner.from_arcis((x, y));
```

**Reuse comparison results**:

```rust  theme={null}
// ✗ Redundant - same comparison computed twice
if x > 1000 {
    do_something();
}
if x > 1000 {  // Expensive comparison done AGAIN
    do_another_thing();
}

// ✓ Compute once, reuse the result
let is_large = x > 1000;
if is_large {
    do_something();
}
if is_large {  // Reuses the boolean, no recomputation
    do_another_thing();
}
```

**Prefer public constants over secret-dependent values**:

```rust  theme={null}
// ✓ Constant multiplier - compiler can optimize
fn double(x: u64) -> u64 {
    x * 2  // Multiplication by constant is efficient
}

// ✓ Pass known values as public inputs
fn apply_rate(amount: u64, rate_percent: u64) -> u64 {
    // If rate is known ahead of time, pass it as a public input
    // rather than computing it inside the secure computation
    amount * rate_percent / 100
}
```

In MPC, values known before the computation (public inputs and constants) can be handled more efficiently than values computed during secure execution.

## Debugging

Arcis provides familiar debugging macros that work during circuit development.

### Print Debugging

```rust  theme={null}
#[instruction]
fn debug_example(a: u32, b: u32) -> u32 {
    println!("Inputs: a = {}, b = {}", a, b);
    
    let result = a + b;
    println!("Result: {}", result);
    
    // Also available: print!, eprint!, eprintln!
    eprintln!("Debug: computation complete");
    
    result
}
```

<Note>
  Print macros do not change circuit behavior. They are for development only. Output appears during circuit execution on ARX nodes.
</Note>

### Debug Assertions

Use assertions to verify invariants during development:

```rust  theme={null}
#[instruction]
fn with_assertions(x: u32, y: u32) -> u32 {
    debug_assert!(x > 0, "x must be positive");
    debug_assert_eq!(x, x, "sanity check");
    debug_assert_ne!(x, y, "x and y should differ");
    
    x + y
}
```

<Warning>
  `debug_assert` macros are for development verification only. They do not enforce constraints in production—use explicit conditionals for actual validation logic.
</Warning>

### Common Debugging Patterns

**Trace loop iterations**:

```rust  theme={null}
for i in 0..10 {
    println!("Iteration {}: value = {}", i, arr[i]);
    // ... processing
}
```

**Check intermediate values**:

```rust  theme={null}
let step1 = compute_step1(input);
println!("After step1: {}", step1);

let step2 = compute_step2(step1);
println!("After step2: {}", step2);
```

## Testing

### What Can Be Unit Tested

You can test:

* **Helper functions** (non-`#[instruction]` functions)
* **`#[arcis_circuit]` functions** (builtin circuits)
* **Pure logic** extracted into testable units

You **cannot** directly unit test:

* **`#[instruction]` functions** (require MPC runtime)

### Testing Strategy

Extract testable logic into helper functions:

```rust  theme={null}
#[encrypted]
mod circuits {
    use arcis::*;

    // Testable: regular function
    pub fn calculate_fee(amount: u64, rate: u64) -> u64 {
        amount * rate / 10000  // basis points
    }

    // Testable: builtin circuit
    #[arcis_circuit = "min"]
    pub fn min(a: u128, b: u128) -> u128 {}

    // NOT directly testable: requires MPC
    #[instruction]
    fn transfer_with_fee(amount: u64, rate: u64) -> u64 {
        let fee = calculate_fee(amount, rate);
        amount - fee
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_fee_calculation() {
        // 2.5% fee on 10000
        assert_eq!(circuits::calculate_fee(10000, 250), 250);
        // 1% fee on 5000
        assert_eq!(circuits::calculate_fee(5000, 100), 50);
    }

    #[test]
    fn test_builtin_circuit() {
        assert_eq!(circuits::min(10, 20), 10);
        assert_eq!(circuits::min(1, 0), 0);
        assert_eq!(circuits::min(4, 4), 4);
    }
}
```

### Integration Testing

`#[instruction]` functions cannot be unit-tested in isolation—they require the full MPC runtime. For end-to-end testing, use the TypeScript SDK to invoke deployed circuits on a test cluster.

See the [JavaScript Client documentation](/developers/js-client-library) and the [Hello World tutorial](/developers/hello-world) for integration testing setup.

## Common Pitfalls

### Conditionals Don't Guard Execution

When a condition is not a compile-time constant, both branches execute. The condition selects which result to keep, but ARX nodes perform work for both paths.

See [Thinking in MPC](/developers/arcis/mental-model#both-branches-always-execute) for the full explanation.

```rust  theme={null}
// Problematic: assumes the indexing won't happen when found_match is false
if found_match {
    data[secret_idx] = new_value;  // Executes regardless of found_match
}

// Safe: constant-index loop with conditional assignment
for i in 0..DATA_SIZE {
    let should_update = found_match && (i == secret_idx);
    if should_update {
        data[i] = new_value;
    }
}
```

### Reveal and Encryption Placement

`.reveal()` and `.from_arcis()` cannot appear inside conditional blocks. See [Thinking in MPC](/developers/arcis/mental-model#reveal-and-encryption-placement) for the correct pattern.

## Error Handling

### Compile-Time vs Runtime

| Condition                 | Compile-Time                 | Runtime                 |
| ------------------------- | ---------------------------- | ----------------------- |
| Division by zero          | Error if divisor is constant | Undefined behavior      |
| Array index out of bounds | Error if index is constant   | Error during evaluation |
| Float out of range        | Error for literals           | Silently clamped        |

<Warning>
  **Division by secret values:** If your divisor could be zero based on secret inputs, add explicit validation:

  ```rust  theme={null}
  let is_valid = divisor != 0;
  let safe_divisor = if is_valid { divisor } else { 1 };
  let result = if is_valid { numerator / safe_divisor } else { 0 };
  ```
</Warning>

**Best practices:**

1. Use constant array sizes where possible
2. Validate divisors before division when they depend on secret inputs
3. Keep floats within the supported range `[-2^75, 2^75)`

## What's Next?

<Card title="Quick Reference" icon="graduation-cap" href="/developers/arcis/quick-reference">
  Keep this open while coding for fast syntax lookup.
</Card>

Ready to build?

<CardGroup cols={3}>
  <Card title="Hello World" icon="rocket" href="/developers/hello-world">
    Build your first Arcis circuit end-to-end.
  </Card>

  <Card title="Solana Integration" icon="link" href="/developers/program">
    Invoke circuits from your Solana program.
  </Card>

  <Card title="JavaScript Client" icon="js" href="/developers/js-client-library">
    Call circuits from TypeScript.
  </Card>
</CardGroup>
> ## Documentation Index
> Fetch the complete documentation index at: https://docs.arcium.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Quick Reference

> A quick reference cheatsheet for Arcis syntax and patterns

Arcis is a Rust framework for writing MPC circuits on Solana. This page is a **quick reference**—for conceptual understanding, see [Thinking in MPC](/developers/arcis/mental-model).

<Tip>
  **Use this page when** you need quick syntax lookup while coding.
</Tip>

## Quick Reference: Limitations

| Category         | Supported                                    | Not Supported                                                           |
| ---------------- | -------------------------------------------- | ----------------------------------------------------------------------- |
| **Control Flow** | `if`, `if/else`, `else if`, `for` loops      | `while`, `loop`, `break`, `continue`, `match`, `if let`, early `return` |
| **Types**        | Integers, floats, arrays, tuples, structs    | `Vec`, `String`, `HashMap`, enums                                       |
| **Functions**    | Helpers, closures, generics, traits          | Recursion, async/await                                                  |
| **Operations**   | Arithmetic, comparisons, right shift (const) | Left shift, right shift (variable)                                      |

<Tip>
  **Why?** MPC circuits must have fixed structure. See [Thinking in MPC](/developers/arcis/mental-model) for the full explanation.
</Tip>

## Basic Structure

```rust  theme={null}
use arcis::*;

#[encrypted]
mod my_circuit {
    use arcis::*;

    #[instruction]
    pub fn add(a: u8, b: u8) -> u16 {
        a as u16 + b as u16
    }
}
```

* `#[encrypted]` marks modules containing MPC circuits
* `#[instruction]` marks entry points callable from Solana

## Working with Encrypted Data

```rust  theme={null}
#[instruction]
pub fn process(input: Enc<Shared, u64>) -> Enc<Shared, u64> {
    let value = input.to_arcis();      // Encrypted → secret shares
    let result = value * 2 + 10;       // Compute on shares
    input.owner.from_arcis(result)     // Secret shares → encrypted
}
```

| Owner            | Who Can Decrypt |
| ---------------- | --------------- |
| `Enc<Shared, T>` | Client AND MXE  |
| `Enc<Mxe, T>`    | MXE only        |

## Types

```rust  theme={null}
// Integers
let x: u8 = 255;
let y: i64 = -1000;
let z: u128 = 10000;

// Floats (emulated fixed-point)
let pi: f64 = 3.14159;

// Arrays (fixed-size only)
let arr: [u8; 10] = [0; 10];

// Tuples and structs
let pair: (u8, u16) = (1, 2);

#[derive(Copy, Clone)]
struct Point { x: u16, y: u16 }
```

See [Types](/developers/arcis/types) for complete reference.

## Control Flow

```rust  theme={null}
// if/else: when condition is not a compile-time constant, both branches execute
let result = if condition { a } else { b };

// if without else (for side effects)
if should_update {
    counter += 1;
}

// else if chains work normally
let category = if value < 10 {
    0
} else if value < 100 {
    1
} else {
    2
};

// for loops: fixed iteration count required
for i in 0..10 {
    process(arr[i]);
}
```

## Functions

```rust  theme={null}
// Helper function
fn helper(a: u8, b: u8) -> u16 {
    a as u16 + b as u16
}

// Closures
let double = |x: u8| x * 2;

// Generics
fn set_zero<T: ArcisType + Copy>(a: &mut T) {
    *a = make_zero(*a);
}
```

See [Operations](/developers/arcis/operations#generics) for generics and traits.

## Arrays

```rust  theme={null}
let arr: [u8; 10] = [0; 10];

// Constant index: O(1)
let x = arr[5];

// Secret index: O(n)
let y = arr[secret_idx];

// Methods
arr.swap(0, 1);
arr.reverse();
arr.fill(42);
arr.sort();  // O(n·log²(n)·bit_size)
```

## Iterators

```rust  theme={null}
// Basic iteration
for val in arr.iter() {
    sum += *val;
}

// Chaining
arr.iter().map(|x| *x * 2).sum()
```

See [Operations](/developers/arcis/operations#iterators) for complete iterator support. Note: `.filter()` is not supported.

## Encryption Patterns

```rust  theme={null}
// Shared: client + MXE can decrypt
fn process(input: Enc<Shared, u64>) -> Enc<Shared, u64>

// MXE-owned: only MXE can decrypt
fn process_state(state: Enc<Mxe, GameState>) -> Enc<Mxe, GameState>

// Reveal (use carefully)
let plain = secret.reveal();

// Create MXE-owned data
let mxe_data = Mxe::get().from_arcis(value);
```

See [Input/Output](/developers/arcis/input-output) for details.

## Randomness

```rust  theme={null}
let coin = ArcisRNG::bool();
let num = ArcisRNG::gen_integer_from_width(64);
let uniform = ArcisRNG::gen_uniform::<[u8; 32]>();
ArcisRNG::shuffle(&mut arr);
let (val, ok) = ArcisRNG::gen_integer_in_range(1, 100, 24);
```

See [Primitives](/developers/arcis/primitives#random-number-generation) for complete RNG reference.

## Cryptography

```rust  theme={null}
// Hashing
let hash = SHA3_256::new().digest(&data).reveal();

// Signature verification
let valid = vk.verify(&message, &signature).reveal();

// Key generation
let sk = SecretKey::new_rand();
let vk = VerifyingKey::from_secret_key(&sk);

// MXE signing
let sig = MXESigningKey::sign(&message).reveal();
```

See [Primitives](/developers/arcis/primitives#cryptographic-operations) for complete crypto reference.

## Data Packing

```rust  theme={null}
// Pack for efficient storage
let packed = Pack::new(data);

// Unpack to use
let data: [u8; 64] = packed.unpack();
```

See [Primitives](/developers/arcis/primitives#data-packing) for details.

## Debugging

```rust  theme={null}
println!("value = {}", x);
debug_assert!(x > 0, "x must be positive");
```

See [Best Practices](/developers/arcis/best-practices#debugging) for debugging strategies.

## Testing

```rust  theme={null}
#[cfg(test)]
mod tests {
    #[test]
    fn test_helper() {
        // Only non-#[instruction] functions can be unit tested
        assert_eq!(helper(1, 2), 3);
    }
}
```

See [Best Practices](/developers/arcis/best-practices#testing) for testing strategies.

## What's Next?

Ready to build? Start here:

<CardGroup cols={2}>
  <Card title="Hello World" icon="rocket" href="/developers/hello-world">
    Build your first Arcis circuit step-by-step.
  </Card>

  <Card title="Solana Integration" icon="link" href="/developers/program">
    Invoke circuits from your Solana program.
  </Card>

  <Card title="JavaScript Client" icon="js" href="/developers/js-client-library">
    Call circuits from TypeScript.
  </Card>
</CardGroup>
> ## Documentation Index
> Fetch the complete documentation index at: https://docs.arcium.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Overview

Before reading this, we recommend having read the [Computation Lifecycle](/developers/computation-lifecycle) section, the [Arcis inputs/outputs](/developers/arcis/input-output) section, and the [Callback Type Generation](/developers/program/callback-type-generation) guide to understand how output types like `AddTogetherOutput` are automatically generated from encrypted instructions.

## The Basics

Let's say we have the following encrypted instruction and want to invoke it from our MXE.

```rust  theme={null}
#[encrypted]
mod circuits {
    use arcis::*;

    pub struct InputValues {
        v1: u8,
        v2: u8,
    }

    #[instruction]
    pub fn add_together(input_ctxt: Enc<Shared, InputValues>) -> Enc<Shared, u16> {
        let input = input_ctxt.to_arcis();
        let sum = input.v1 as u16 + input.v2 as u16;
        input_ctxt.owner.from_arcis(sum)
    }
}
```

To do this, we first need to receive the encrypted parameter of type `InputValues` which contains two encrypted `u8`s, then build the computation arguments using `ArgBuilder`, and finally queue the computation for execution. Additionally, we need to define a callback instruction that will be invoked when the computation is complete. Callback instructions have a few requirements:

1. They must be defined with the `#[arcium_callback(encrypted_ix = "encrypted_ix_name")]` macro.
2. They must have exactly two arguments: `ctx: Context<...>` and `output: SignedComputationOutputs<T>` where `T` is named as `{encrypted_ix_name}Output`.

For passing encrypted arguments, we use the `ArgBuilder` API. If the corresponding argument is `Enc<Shared, T>`, then we need to pass the `x25519_pubkey(pub_key)` and `plaintext_u128(nonce)`, before the ciphertext. If the corresponding argument is `Enc<Mxe, T>`, then we only need to pass the nonce as `plaintext_u128(nonce)` and the ciphertext. Ciphertexts are passed using methods like `encrypted_u8`, `encrypted_u16`, `encrypted_u32`, `encrypted_u64`, `encrypted_u128`, or `encrypted_bool`.

```rust  theme={null}
pub fn add_together(
    ctx: Context<AddTogether>,
    computation_offset: u64,
    ciphertext_0: [u8; 32],
    ciphertext_1: [u8; 32],
    pub_key: [u8; 32],
    nonce: u128,
) -> Result<()> {
    // Build the args the confidential instruction expects using ArgBuilder
    let args = ArgBuilder::new()
        .x25519_pubkey(pub_key)
        .plaintext_u128(nonce)
        .encrypted_u8(ciphertext_0)
        .encrypted_u8(ciphertext_1)
        .build();

    // Set the bump for the sign_pda_account
    ctx.accounts.sign_pda_account.bump = ctx.bumps.sign_pda_account;

    // Build & queue our computation (via CPI to the Arcium program)
    queue_computation(
        ctx.accounts,
        // Random offset for the computation
        computation_offset,
        // The one-time inputs our confidential instruction expects
        args,
        // Callback server address
        // None here because the output of the confidential instruction can fit into a solana transaction
        // as its just 1 ciphertext which is 32 bytes
        None,
        // Use callback_ix() helper to generate the callback instruction
        vec![AddTogetherCallback::callback_ix(
            computation_offset,
            &ctx.accounts.mxe_account,
            &[]  // Empty array = no custom accounts
        )?],
        1, // Number of transactions needed for callback (1 for simple computations)
        0, // cu_price_micro: priority fee in microlamports (0 = no priority fee)
    )?;
    Ok(())
}

// Macro provided by the Arcium SDK to define a callback instruction.
#[arcium_callback(encrypted_ix = "add_together")]
pub fn add_together_callback(
    ctx: Context<AddTogetherCallback>,
    output: SignedComputationOutputs<AddTogetherOutput>,
) -> Result<()> {
    let o = match output.verify_output(
        &ctx.accounts.cluster_account,
        &ctx.accounts.computation_account
    ) {
        Ok(AddTogetherOutput { field_0 }) => field_0,
        Err(e) => {
            msg!("Error: {}", e);
            return Err(ErrorCode::AbortedComputation.into())
        },
    };

    emit!(SumEvent {
        sum: o.ciphertexts[0],
        nonce: o.nonce.to_le_bytes(),
    });

    Ok(())
}

```

Let's also have a look at the `Accounts` structs for each of these instructions:

```rust  theme={null}
/// Accounts required to invoke the `add_together` encrypted instruction.
/// `add_together` must be the name of the encrypted instruction we're invoking.

#[queue_computation_accounts("add_together", payer)]
#[derive(Accounts)]
#[instruction(computation_offset: u64)]
pub struct AddTogether<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        init_if_needed,
        space = 9,
        payer = payer,
        seeds = [&SIGN_PDA_SEED],
        bump,
        address = derive_sign_pda!(),
    )]
    pub sign_pda_account: Account<'info, ArciumSignerAccount>,
    #[account(
        address = derive_mxe_pda!()
    )]
    pub mxe_account: Account<'info, MXEAccount>,
    #[account(
        mut,
        address = derive_mempool_pda!(mxe_account, ErrorCode::ClusterNotSet)
    )]
    /// CHECK: mempool_account, checked by the arcium program.
    pub mempool_account: UncheckedAccount<'info>,
    #[account(
        mut,
        address = derive_execpool_pda!(mxe_account, ErrorCode::ClusterNotSet)
    )]
    /// CHECK: executing_pool, checked by the arcium program.
    pub executing_pool: UncheckedAccount<'info>,
    #[account(
        mut,
        address = derive_comp_pda!(computation_offset, mxe_account, ErrorCode::ClusterNotSet)
    )]
    /// CHECK: computation_account, checked by the arcium program.
    pub computation_account: UncheckedAccount<'info>,
    #[account(
        address = derive_comp_def_pda!(COMP_DEF_OFFSET_ADD_TOGETHER)
    )]
    pub comp_def_account: Account<'info, ComputationDefinitionAccount>,
    #[account(
        mut,
        address = derive_cluster_pda!(mxe_account, ErrorCode::ClusterNotSet)
    )]
    pub cluster_account: Account<'info, Cluster>,
    #[account(
        mut,
        address = ARCIUM_FEE_POOL_ACCOUNT_ADDRESS,
    )]
    pub pool_account: Account<'info, FeePool>,
    #[account(
        mut,
        address = ARCIUM_CLOCK_ACCOUNT_ADDRESS
    )]
    pub clock_account: Account<'info, ClockAccount>,
    pub system_program: Program<'info, System>,
    pub arcium_program: Program<'info, Arcium>,
}
```

That's a lot of accounts to remember! Here's what each one does:

**Core MXE Accounts:**

* `mxe_account`: Your MXE's metadata and configuration
* `mempool_account`: Queue where computations wait to be processed
* `executing_pool`: Tracks computations currently being executed
* `computation_account`: Stores individual computation data and results
* `comp_def_account`: Definition of your encrypted instruction (circuit)

**Arcium Network Accounts:**

* `cluster_account`: The MPC cluster that will process your computation
* `pool_account`: Arcium's fee collection account
* `clock_account`: Network timing information

**System Accounts:**

* `payer`: Pays transaction fees and rent
* `sign_pda_account`: PDA signer for the computation
* `system_program`: Solana's system program for account creation
* `arcium_program`: Arcium's core program that orchestrates MPC

The good news is these can be copy-pasted for any confidential instruction. You only need to change:

1. `COMP_DEF_OFFSET_ADD_TOGETHER` to match your instruction name
2. The instruction name in the `queue_computation_accounts` macro

How about the accounts for the callback instruction?

```rust  theme={null}
#[callback_accounts("add_together")]
#[derive(Accounts)]
pub struct AddTogetherCallback<'info> {
    pub arcium_program: Program<'info, Arcium>,
    /// COMP_DEF_OFFSET_ADD_TOGETHER is an encrypted instruction specific u32
    /// offset which can be calculated with `comp_def_offset("add_together")`, where
    /// comp_def_offset is a function provided by the Arcium SDK and `add_together`
    /// is the name of the encrypted instruction we're invoking.
    #[account(
        address = derive_comp_def_pda!(COMP_DEF_OFFSET_ADD_TOGETHER)
    )]
    pub comp_def_account: Account<'info, ComputationDefinitionAccount>,
    #[account(
        address = derive_mxe_pda!()
    )]
    pub mxe_account: Account<'info, MXEAccount>,
    /// CHECK: computation_account, checked by arcium program via constraints in the callback context.
    pub computation_account: UncheckedAccount<'info>,
    #[account(
        address = derive_cluster_pda!(mxe_account, ErrorCode::ClusterNotSet)
    )]
    pub cluster_account: Account<'info, Cluster>,
    #[account(address = ::anchor_lang::solana_program::sysvar::instructions::ID)]
    /// CHECK: instructions_sysvar, checked by the account constraint
    pub instructions_sysvar: AccountInfo<'info>,
}
```

Here it's a lot fewer accounts fortunately! Like with the `AddTogether` struct, we need to change the parameter for the `derive_comp_def_pda` macro and in the `callback_accounts` macro depending on the encrypted instruction we're invoking.

The `callback_ix()` method is a convenient helper generated by the `#[callback_accounts]` macro that automatically creates the proper callback instruction with all required accounts.

But what if we don't just want to return a raw value and need some additional accounts? Check out [input/outputs](/developers/arcis/input-output) for how to handle encrypted data and [callback accounts](/developers/program/callback-accs) for returning additional accounts in the callback.
> ## Documentation Index
> Fetch the complete documentation index at: https://docs.arcium.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Computation Definition Accounts

## Why Computation Definitions Exist

When you write an encrypted instruction using Arcis, it gets compiled into an MPC circuit - essentially a program that the MPC nodes can execute securely on encrypted data. But here's the challenge: how do the MPC nodes know what circuit to run when your Solana program calls for a computation?

That's where Computation Definition Accounts come in. They serve as the bridge between your Solana program and the MPC network, storing both the circuit itself and metadata about how to execute it. Think of it as uploading your encrypted instruction to the blockchain so the MPC nodes can access it when needed.

## Computation Definition Accounts

When we define an encrypted instruction using [Arcis](/developers/arcis), we need the MPC cluster that will execute this confidential instruction to have access to the confidential instruction itself, its interface, and some more metadata. This is done by defining a `ComputationDefinitionAccount` struct, which consists of two parts:

1. The confidential instruction metadata and interface.
2. The raw MPC bytecode.

The interface provides data around what input and output types are expected, what accounts are required, and a few other pieces of metadata. It's data is stored in an account with the seeds`b"ComputationDefinitionAccount", mxe_program_id, comp_def_offset`. The first is exported as a constant by the Arcium Anchor SDK, the second is just the program id of our MXE program, and the third is a confidential-instruction-specific offset. It is computed with `comp_def_offset = sha256(<confidential_instruction_name>).slice(0,4)` and then interpreted as a little-endian u32. Theoretically, you shouldn't need to know this, but it's good to know what's going on under the hood. We abstract this with `derive_comp_def_pda` macro which takes in the `comp_def_offset` as a parameter, and computes the `ComputationDefinitionAccount` address for you.

The MPC bytecode is stored inside account(s) with the seeds `b"ComputationDefinitionRaw", comp_def_acc, i`. Like above, the first is exported as a constant by the Arcium Anchor SDK, the second is the computation definition account we defined above, and the third is an index starting from 0 up to however many accounts we need to store the full MPC bytecode.

## Usage

When working locally, you theoretically don't need to care about the MPC bytecode accounts, as the Arcium CLI will handle the creation and management of these accounts for you. You do however need to create the interface ComputationDefinitionAccount, which can easily be done with the Arcium Anchor tooling. Let's say we want to deploy a confidential instruction called `add_together`:

```rust  theme={null}
pub fn init_add_together_comp_def(ctx: Context<InitAddTogetherCompDef>) -> Result<()> {
    init_comp_def(ctx.accounts, None, None)?;
    Ok(())
}

#[init_computation_definition_accounts("add_together", payer)]
#[derive(Accounts)]
pub struct InitAddTogetherCompDef<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        mut,
        address = derive_mxe_pda!()
    )]
    pub mxe_account: Box<Account<'info, MXEAccount>>,
    #[account(mut)]
    // The computation definition account that will be created. We can't
    // specify the seeds and account type directly here, as it gets
    // initialized via CPI so these constraints would fail in our non-CPI
    // instruction. This is ok, as the Arcium program will create the
    // account with the correct seeds and account type for us.
    pub comp_def_account: UncheckedAccount<'info>,
    pub arcium_program: Program<'info, Arcium>,
    pub system_program: Program<'info, System>,
}
```

And that's all, we just have to make sure to call this instruction once at the beginning before we can use the confidential instruction.
> ## Documentation Index
> Fetch the complete documentation index at: https://docs.arcium.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Callback Accounts

Callback accounts provide a way to define additional accounts to be used in the callback instruction for a computation. This is helpful when you want to use the output of a computation to modify an onchain account.

**Prerequisites**: Before diving into callback accounts, make sure you've read:

* [Basic program invocation guide](/developers/program) - fundamentals of queuing computations and defining callback instructions
* [Callback Type Generation](/developers/program/callback-type-generation) - how output types like `AddTogetherOutput` are automatically generated from encrypted instructions
* [Arcis inputs/outputs](/developers/arcis/input-output) - handling encrypted data types

**When to use callback accounts:**

* Storing computation results in persistent accounts
* Updating game state, user balances, or protocol data
* Writing results that exceed transaction size limits

## Complete Example

Expanding on our [basic example](/developers/program), let's say we want to save the result of our addition in an account for later use. We'll walk through the complete implementation step by step.

### Step 1: Define the Account Structure

First, define an account to store our computation result:

```rust  theme={null}
#[account]
#[derive(InitSpace)]
pub struct SecretAdditionResult {
    pub sum: [u8; 32], // Store the encrypted result as ciphertext
}

pub fn init(ctx: Context<Initialize>) -> Result<()> {
    Ok(())
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(
        init,
        payer = signer,
        seeds = [b"AdditionResult"],
        space = 8 + SecretAdditionResult::INIT_SPACE,
        // Note: In a real implementation you should usually save the bump too,
        // but for the sake of simplicity in this example we skip that
        bump
    )]
    pub add_result_account: Account<'info, SecretAdditionResult>,
    pub system_program: Program<'info, System>,
}
```

### Step 2: Modify the Queue Function

There are two ways to specify callback instructions in your `queue_computation` call:

#### Recommended: Using callback\_ix() Helper

The `callback_ix()` helper method is the **preferred approach** because it automatically handles all required standard accounts and is less error-prone.

**What callback\_ix() does automatically:**

* Creates a CallbackInstruction with the proper instruction data
* Automatically includes standard accounts: `arcium_program`, `comp_def_account`, `mxe_account`, `computation_account`, `cluster_account`, `instructions_sysvar`
* Accepts custom accounts through the `&[CallbackAccount]` parameter
* Eliminates boilerplate and prevents errors

```rust  theme={null}
pub fn add_together(
    ctx: Context<AddTogether>,
    computation_offset: u64,
    ciphertext_0: [u8; 32],
    ciphertext_1: [u8; 32],
    pub_key: [u8; 32],
    nonce: u128,
) -> Result<()> {
    // Note: Using `create_program_address` with the bump would be more efficient than `find_program_address`.
    // Since this PDA is constant, you could also derive it at compile time and save it as a constant.
    // We use find_program_address here for simplicity.
    let addition_result_pda = Pubkey::find_program_address(&[b"AdditionResult"], ctx.program_id).0;

    // Build the args the confidential instruction expects using ArgBuilder
    let args = ArgBuilder::new()
        .x25519_pubkey(pub_key)
        .plaintext_u128(nonce)
        .encrypted_u8(ciphertext_0)
        .encrypted_u8(ciphertext_1)
        .build();

    // Set the bump for the sign_pda_account
    ctx.accounts.sign_pda_account.bump = ctx.bumps.sign_pda_account;

    // Build & queue our computation (via CPI to the Arcium program)
    queue_computation(
        ctx.accounts,
        // Random offset for the computation
        computation_offset,
        // The one-time inputs our confidential instruction expects
        args,
        // Callback server address
        // None here because the output of the confidential instruction can fit into a solana transaction
        // as its just 1 Ciphertext which is 32 bytes
        None,
        // Using callback_ix() helper - automatically includes the 6 standard accounts
        // (arcium_program, comp_def_account, mxe_account, computation_account, cluster_account, instructions_sysvar) plus our custom account
        vec![AddTogetherCallback::callback_ix(
            computation_offset,
            &ctx.accounts.mxe_account,
            &[
                CallbackAccount {
                    pubkey: addition_result_pda,
                    is_writable: true, // Tells nodes to mark this account as writable in the transaction
                }
            ]
        )?],
        1, // Number of transactions needed for callback (1 for simple computations)
        0, // cu_price_micro: priority fee in microlamports (0 = no priority fee)
    )?;
    Ok(())
}

/* The AddTogether accounts struct stays exactly the same as shown in the basic guide */
```

#### Understanding What Happens: Manual CallbackInstruction

For educational purposes, here's what `callback_ix()` generates under the hood. This manual approach is functionally equivalent but more verbose and error-prone:

```rust  theme={null}
pub fn add_together(
    ctx: Context<AddTogether>,
    computation_offset: u64,
    ciphertext_0: [u8; 32],
    ciphertext_1: [u8; 32],
    pub_key: [u8; 32],
    nonce: u128,
) -> Result<()> {
    // Note: Using `create_program_address` with the bump would be more efficient than `find_program_address`.
    // Since this PDA is constant, you could also derive it at compile time and save it as a constant.
    // We use find_program_address here for simplicity.
    let addition_result_pda = Pubkey::find_program_address(&[b"AdditionResult"], ctx.program_id).0;

    // Build the args the confidential instruction expects using ArgBuilder
    let args = ArgBuilder::new()
        .x25519_pubkey(pub_key)
        .plaintext_u128(nonce)
        .encrypted_u8(ciphertext_0)
        .encrypted_u8(ciphertext_1)
        .build();

    // Set the bump for the sign_pda_account
    ctx.accounts.sign_pda_account.bump = ctx.bumps.sign_pda_account;

    // Build & queue our computation (via CPI to the Arcium program)
    queue_computation(
        ctx.accounts,
        // Random offset for the computation
        computation_offset,
        // The one-time inputs our confidential instruction expects
        args,
        // Callback server address
        // None here because the output of the confidential instruction can fit into a solana transaction
        // as its just 1 ciphertext which is 32 bytes
        None,
        // Manual approach: Define which callback instruction to call when the computation is complete.
        // We specify the program ID, instruction discriminator, and all accounts needed
        // for the callback, including our result account which we want to be writable.
        vec![CallbackInstruction {
            program_id: ID_CONST,
            discriminator: instruction::AddTogetherCallback::DISCRIMINATOR.to_vec(),
            accounts: vec![
                // Standard accounts (always required, in this order)
                CallbackAccount {
                    pubkey: ARCIUM_PROGRAM_ID,
                    is_writable: false,
                },
                CallbackAccount {
                    pubkey: derive_comp_def_pda!(COMP_DEF_OFFSET_ADD_TOGETHER),
                    is_writable: false,
                },
                CallbackAccount {
                    pubkey: ctx.accounts.mxe_account.key(),
                    is_writable: false,
                },
                CallbackAccount {
                    pubkey: ctx.accounts.computation_account.key(),
                    is_writable: false,
                },
                CallbackAccount {
                    pubkey: derive_cluster_pda!(ctx.accounts.mxe_account, ErrorCode::ClusterNotSet),
                    is_writable: false,
                },
                CallbackAccount {
                    pubkey: INSTRUCTIONS_SYSVAR_ID,
                    is_writable: false,
                },
                // Custom accounts (your callback-specific accounts)
                CallbackAccount {
                    pubkey: addition_result_pda,
                    is_writable: true, // Tells nodes to mark this account as writable in the transaction
                }
            ]
        }],
        1, // Number of transactions needed for callback (1 for simple computations)
        0, // cu_price_micro: priority fee in microlamports (0 = no priority fee)
    )?;
    Ok(())
}

/* The AddTogether accounts struct stays exactly the same as shown in the basic guide */
```

**Key Point**: Both approaches are functionally equivalent. The `callback_ix()` method automatically generates the exact same `CallbackInstruction` structure as the manual approach, but with less code and reduced chance for errors.

**Important**: We added the account to the callback (either via `callback_ix()` parameter or `CallbackInstruction.accounts`) but didn't include it in the AddTogether accounts struct because we don't read or write to it during the queue function - only during the callback.

### Step 3: Implement the Callback Function

The callback instruction receives the accounts in the exact order specified in the queue function:

```rust  theme={null}
// Macro provided by the Arcium SDK to define a callback instruction.
#[arcium_callback(encrypted_ix = "add_together")]
pub fn add_together_callback(
    ctx: Context<AddTogetherCallback>,
    output: SignedComputationOutputs<AddTogetherOutput>,
) -> Result<()> {
    let o = match output.verify_output(
        &ctx.accounts.cluster_account,
        &ctx.accounts.computation_account
    ) {
        Ok(AddTogetherOutput { field_0 }) => field_0,
        Err(e) => {
            msg!("Error: {}", e);
            return Err(ErrorCode::AbortedComputation.into())
        },
    };

    emit!(SumEvent {
        sum: o.ciphertexts[0],
        nonce: o.nonce.to_le_bytes(),
    });

    // Save the result in our callback account too
    ctx.accounts.add_result_account.sum = o.ciphertexts[0];

    Ok(())
}


#[callback_accounts("add_together")]
#[derive(Accounts)]
pub struct AddTogetherCallback<'info> {
    // Standard accounts required for all callbacks
    pub arcium_program: Program<'info, Arcium>,
    #[account(
        address = derive_comp_def_pda!(COMP_DEF_OFFSET_ADD_TOGETHER)
    )]
    pub comp_def_account: Account<'info, ComputationDefinitionAccount>,
    #[account(
        address = derive_mxe_pda!()
    )]
    pub mxe_account: Account<'info, MXEAccount>,
    /// CHECK: computation_account, checked by arcium program via constraints in the callback context.
    pub computation_account: UncheckedAccount<'info>,
    #[account(
        address = derive_cluster_pda!(mxe_account, ErrorCode::ClusterNotSet)
    )]
    pub cluster_account: Account<'info, Cluster>,
    /// CHECK: instructions_sysvar, checked by the account constraint
    #[account(address = ::anchor_lang::solana_program::sysvar::instructions::ID)]
    pub instructions_sysvar: AccountInfo<'info>,

    // Custom accounts (match remaining accounts in CallbackInstruction.accounts)
    #[account(
        mut,
        seeds = [b"AdditionResult"],
        // Note: In a real implementation you should usually save the bump too,
        // but for the sake of simplicity in this example we skip that
        bump
    )]
    pub add_result_account: Account<'info, SecretAdditionResult>,
}
```

## Key Requirements & Constraints

### Account Ordering

The accounts in your callback struct **must match exactly** the order in `CallbackInstruction.accounts`:

1. Standard accounts are always required first: `arcium_program`, `comp_def_account`, `mxe_account`, `computation_account`, `cluster_account`, `instructions_sysvar`
2. Custom accounts follow in the exact sequence you specified

### Account Creation Rules

* **Can create** accounts in the queue computation function (user pays rent)
* **Cannot create** accounts during callback execution (would require nodes to pay)
* Accounts must exist before the callback executes
* Account size cannot change during callback

### Writability Requirements

* Set `is_writable: true` in CallbackAccount to tell nodes to mark the account as writable
* The account must have `#[account(mut)]` in the callback struct
* Without proper writability flags, mutations will fail

## Troubleshooting

**Account not found**: Ensure the account exists before callback execution. Initialize it in the queue function or a separate instruction.

**Order mismatch errors**: Double-check that your callback struct accounts are in the exact same order as the CallbackInstruction.accounts vector.

**Cannot modify account**: Verify both `is_writable: true` in CallbackAccount and `#[account(mut)]` in the callback struct are set.

**Size errors**: Callback accounts cannot be resized. Allocate sufficient space when creating the account.

## Understanding callback\_ix() in Detail

The `callback_ix()` method you see throughout these examples is a convenient helper that's automatically generated by the `#[callback_accounts]` macro.

### How callback\_ix() Works

When you define a callback struct with `#[callback_accounts("instruction_name")]`, the macro automatically generates a `callback_ix()` method that:

1. **Takes required parameters**: `computation_offset` and `&mxe_account` for proper context
2. **Creates a CallbackInstruction** with the proper instruction data
3. **Automatically includes standard accounts** that every callback needs:
   * `arcium_program`: The Arcium program that will invoke your callback
   * `comp_def_account`: The computation definition account for your encrypted instruction
   * `mxe_account`: Your MXE's metadata and configuration
   * `computation_account`: The computation being processed
   * `cluster_account`: The MPC cluster processing the computation
   * `instructions_sysvar`: Solana's instructions sysvar for transaction validation
4. **Accepts custom accounts** through the `&[CallbackAccount]` parameter

### Usage Patterns

**Basic usage (no custom accounts):**

```rust  theme={null}
vec![AddTogetherCallback::callback_ix(
    computation_offset,
    &ctx.accounts.mxe_account,
    &[]
)?]
```

The empty array indicates no custom accounts needed beyond the standard ones.

**Advanced usage (with custom accounts):**

```rust  theme={null}
vec![AddTogetherCallback::callback_ix(
    computation_offset,
    &ctx.accounts.mxe_account,
    &[
        CallbackAccount {
            pubkey: my_account.key(),
            is_writable: true,
        },
        // ... more custom accounts
    ]
)?]
```

### Why Use callback\_ix()?

The `callback_ix()` helper is the **recommended approach** because it:

* **Eliminates boilerplate**: No need to manually construct CallbackInstruction
* **Prevents errors**: Automatically includes all required standard accounts
* **Maintains consistency**: Ensures your callback instructions follow the correct format
* **Simplifies maintenance**: Changes to callback requirements are handled by the macro

## Going Further

This guide covered the advanced patterns for working with callback accounts. To understand the fundamentals of callback instructions, see our [basic program invocation guide](/developers/program).

For handling different types of encrypted data inputs and outputs, see [Arcis inputs/outputs](/developers/arcis/input-output).
> ## Documentation Index
> Fetch the complete documentation index at: https://docs.arcium.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Callback Type Generation

## What This Solves

When you write encrypted instructions in Arcium, the results come back as structured data. Previously, developers had to manually parse raw bytes - tracking offsets, sizes, and converting back to the right types. This was error-prone and tedious.

Arcium's type generation system analyzes your circuit's return type and automatically creates typed Rust structs. This means you can work directly with structured data instead of byte arrays.

## Mental Model: From Functions to Structs

Here's the transformation that happens automatically:

```rust  theme={null}
// You write this encrypted instruction:
#[instruction]
pub fn add_numbers() -> Enc<Shared, u64> { /* ... */ }

// Arcium generates this for your callback:
pub struct AddNumbersOutput {
    pub field_0: SharedEncryptedStruct<1>, // 1 = single u64 value
}
```

The generated struct gives you typed access to encrypted results, with predictable naming and field patterns you can rely on.

## What You'll Learn

After reading this guide, you'll know how to:

* Work with automatically generated Rust structs for encrypted computation outputs
* Predict what struct names and fields Arcium will create
* Handle different encryption types (Shared vs MXE) in callbacks
* Debug type generation issues when they arise

## 30-Second Quick Start

1. Write your circuit:

   ```rust  theme={null}
   #[instruction]
   pub fn my_calc() -> Enc<Shared, u64> { /* ... */ }
   ```
2. Generate types: `arcium build`
3. Use in callback:

   ```rust  theme={null}
   #[arcium_callback(encrypted_ix = "my_calc")]
   pub fn my_calc_callback(
       ctx: Context<MyCalcCallback>,
       output: SignedComputationOutputs<MyCalcOutput>,
   ) -> Result<()> {
       let o = match output.verify_output(
           &ctx.accounts.cluster_account,
           &ctx.accounts.computation_account
       ) {
           Ok(MyCalcOutput { field_0 }) => field_0,
           Err(_) => return Err(ErrorCode::AbortedComputation.into()),
       };
       let encrypted_value = o.ciphertexts[0];
       // Your logic here
       Ok(())
   }
   ```

## Your First Generated Type: Simple Addition

Here's a concrete example. Consider this encrypted instruction that adds two numbers:

```rust  theme={null}
#[encrypted]
mod circuits {
    use arcis::*;

    #[instruction]
    pub fn add_together(input: Enc<Shared, (u8, u8)>) -> Enc<Shared, u16> {
        let (a, b) = input.to_arcis();
        let sum = a as u16 + b as u16;
        input.owner.from_arcis(sum)
    }
}
```

When Arcium sees that your function returns `Enc<Shared, u16>`, it automatically generates this output struct:

```rust  theme={null}
#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct AddTogetherOutput {
    pub field_0: SharedEncryptedStruct<1>,
}
```

Notice the pattern:

* **Name**: `add_together` becomes `AddTogetherOutput`
* **Field**: Always `field_0` for single return values
* **Type**: `SharedEncryptedStruct<1>` because it's shared-encrypted with 1 value (the u16)

Now you can use this in your callback with full type safety:

```rust  theme={null}
#[arcium_callback(encrypted_ix = "add_together")]
pub fn add_together_callback(
    ctx: Context<AddTogetherCallback>,
    output: SignedComputationOutputs<AddTogetherOutput>,
) -> Result<()> {
    let o = match output.verify_output(
        &ctx.accounts.cluster_account,
        &ctx.accounts.computation_account
    ) {
        Ok(AddTogetherOutput { field_0 }) => field_0,
        Err(_) => return Err(ErrorCode::AbortedComputation.into()),
    };

    // Access the encrypted result and metadata
    emit!(SumEvent {
        sum: o.ciphertexts[0],      // The encrypted u16 sum
        nonce: o.nonce.to_le_bytes(), // Nonce for decryption
    });
    Ok(())
}
```

## How Type Generation Works

Working with encrypted computation results used to require manual byte parsing - tracking offsets, sizes, and types yourself. Arcium generates typed structs automatically, so you can focus on application logic instead of low-level data handling.

### The Macro Magic

Here's the key insight: when you write an encrypted instruction with the `#[instruction]` macro, something important happens behind the scenes. The macro doesn't just process your function - it also generates corresponding Rust structs based on your return type.

```rust  theme={null}
#[instruction]
pub fn add_together(input: Enc<Shared, (u8, u8)>) -> Enc<Shared, u16> {
    // Your function code here
}
```

During macro expansion, Arcium analyzes that `Enc<Shared, u16>` return type and automatically generates:

```rust  theme={null}
// This struct is generated for you - you never write it yourself!
pub struct AddTogetherOutput {
    pub field_0: SharedEncryptedStruct<1>,
}
```

This is why you can reference `AddTogetherOutput` in your callback even though you never explicitly defined it. The macro created it for you during compilation, and it's automatically available in your program's scope.

### Immediate Availability

These generated types become available as soon as the macro runs - which happens during normal Rust compilation. You don't need to wait for a separate build step to start using them in your callback functions.

```rust  theme={null}
// This works immediately after defining your #[instruction] above
#[arcium_callback(encrypted_ix = "add_together")]
pub fn callback(
    ctx: Context<AddTogetherCallback>,
    output: SignedComputationOutputs<AddTogetherOutput>,
) -> Result<()> {
    // AddTogetherOutput is available here automatically
}
```

## Behind the Scenes: What the Macro Actually Does

Understanding how the `#[instruction]` macro generates types helps explain why the system works the way it does.

### Macro Expansion Process

When Rust processes your `#[instruction]` macro, here's what happens:

1. **Parse the return type**: The macro examines your function signature and extracts the return type
2. **Analyze the structure**: It breaks down complex types (tuples, structs, encryption wrappers) into components
3. **Generate struct definitions**: It creates typed structs that match your return type's structure
4. **Inject into scope**: The generated types become available in your program module automatically

### What Gets Generated

For different return types, the macro generates different struct patterns:

```rust  theme={null}
// Your function:
#[instruction]
pub fn simple() -> Enc<Shared, u32>

// Macro generates:
pub struct SimpleOutput {
    pub field_0: SharedEncryptedStruct<1>,
}
```

```rust  theme={null}
// Your function:
#[instruction]
pub fn complex() -> (Enc<Shared, u32>, Enc<Mxe, bool>)

// Macro generates:
pub struct ComplexOutput {
    pub field_0: ComplexOutputStruct0,
}
pub struct ComplexOutputStruct0 {
    pub field_0: SharedEncryptedStruct<1>,
    pub field_1: MXEEncryptedStruct<1>,
}
```

### Why This Approach Works

This macro-driven approach provides several benefits:

* **Type safety**: You get compile-time type checking for encrypted results
* **No manual definition**: You don't need to define output structs yourself
* **Consistency**: All generated types follow the same predictable patterns
* **Automatic updates**: If you change your function's return type, the structs update automatically

The key insight is that these structs exist in your compiled program but not in your source code - they're created during the build process and become available for you to use.

## Understanding LEN Parameters

In our `add_together` example, you saw `SharedEncryptedStruct<1>`. The `<LEN>` number tells you how many encrypted scalar values are stored inside.

The `<LEN>` number represents the count of individual encrypted scalar values:

| Return Type                | LEN Value   | Why                               |
| -------------------------- | ----------- | --------------------------------- |
| `Enc<Shared, u32>`         | 1           | Single scalar                     |
| `Enc<Shared, (u32, bool)>` | 2           | Two scalars                       |
| `Enc<Shared, [u32; 5]>`    | 5           | Five array elements               |
| `Enc<Shared, MyStruct>`    | field count | Count all scalar fields in struct |

**For custom structs**, LEN equals total scalar fields:

```rust  theme={null}
struct UserProfile {
    id: u32,        // 1 scalar
    balance: u64,   // 1 scalar
    active: bool,   // 1 scalar
}
// Result: SharedEncryptedStruct<3>
```

## Type Availability and Scope

### Where Generated Types Live

Generated types are automatically scoped to your program module and become available immediately after the `#[instruction]` macro runs. This means:

```rust  theme={null}
// In your lib.rs or program module
#[instruction]
pub fn calculate() -> Enc<Shared, u64> { /* ... */ }

// CalculateOutput is now available in this same module scope
#[arcium_callback(encrypted_ix = "calculate")]
pub fn callback(
    ctx: Context<CalculateCallback>,
    output: SignedComputationOutputs<CalculateOutput>,
) -> Result<()> {
    // You can reference CalculateOutput here
}
```

### No Import Required

Unlike external types, you don't need to import generated types. They're injected directly into your module's namespace during macro expansion:

```rust  theme={null}
// No need for: use some_crate::CalculateOutput;
// The type just exists automatically
```

### Generated Struct Properties

All generated structs automatically receive standard derives that make them work with Anchor:

```rust  theme={null}
// Every generated struct gets these automatically:
#[derive(AnchorSerialize, AnchorDeserialize, Debug, Clone)]
pub struct YourFunctionOutput {
    // fields...
}
```

This is why you can use generated types in Anchor contexts without additional setup.

### Multiple Instructions, Multiple Types

Each `#[instruction]` creates its own set of output types:

```rust  theme={null}
#[instruction] pub fn add() -> Enc<Shared, u32>      // → AddOutput
#[instruction] pub fn multiply() -> Enc<Shared, u32> // → MultiplyOutput
#[instruction] pub fn divide() -> Enc<Shared, u32>   // → DivideOutput
```

All generated types coexist in the same module scope without conflicts.

## Generation Process

When you define an encrypted instruction:

1. Arcium reads your circuit's output types
2. It generates corresponding Rust structs with predictable names
3. It automatically detects encryption patterns and creates specialized types
4. Everything gets integrated into your `#[arcium_callback]` functions

## How the Naming Works

The naming follows predictable patterns:

### Your Circuit Gets an Output Struct

If your encrypted instruction is called `add_together`, you get a struct called `AddTogetherOutput`. Arcium converts your circuit name to PascalCase and adds "Output" at the end.

### Fields Are Numbered

Since Anchor doesn't support tuple structs (yet), Arcium uses numbered fields instead. So if your function returns multiple values, you'll get `field_0`, `field_1`, `field_2`, and so on. Not the prettiest names, but they're consistent and predictable.

### Complex Types Get Their Own Structs

When your function returns complex nested data (like tuples or custom structs), Arcium generates additional helper structs with a unified naming convention:

* All output structs use `{CircuitName}OutputStruct{index}` pattern
* Nested structs within outputs use `{ParentName}OutputStruct{parent_index}{field_index}` pattern
* The naming ensures uniqueness while maintaining consistency

## Encryption Types: Shared vs MXE

Arcium automatically detects different encryption patterns and generates the right struct type. Understanding when each type is used helps you predict the generated structs.

### SharedEncryptedStruct\<N>

When your circuit returns `Enc<Shared, T>`, Arcium knows this is data that both the client and the MXE can decrypt. It generates a struct that includes everything needed for decryption:

```rust  theme={null}
pub struct SharedEncryptedStruct<const LEN: usize> {
    pub encryption_key: [u8; 32],    // The shared public key
    pub nonce: u128,                 // Random nonce for security
    pub ciphertexts: [[u8; 32]; LEN], // Your actual encrypted data
}
```

The `<N>` part tells you how many encrypted values are packed inside. So `SharedEncryptedStruct<1>` has one encrypted value, `SharedEncryptedStruct<3>` has three, and so on.

In your callback, you can access everything you need:

```rust  theme={null}
let shared_key = result.encryption_key;  // For key exchange
let nonce = result.nonce;               // For decryption
let encrypted_value = result.ciphertexts[0]; // Your data
```

### MXEEncryptedStruct\<N>

For `Enc<Mxe, T>` data, only the MXE cluster can decrypt it - clients can't. Since there's no shared secret needed, the struct is simpler:

```rust  theme={null}
pub struct MXEEncryptedStruct<const LEN: usize> {
    pub nonce: u128,                 // Still need the nonce
    pub ciphertexts: [[u8; 32]; LEN], // Your encrypted data
}
```

Notice there's no `encryption_key` field here - that's because clients don't get to decrypt MXE data.

```rust  theme={null}
// Working with MXE-encrypted data
let nonce = result.nonce;
let encrypted_value = result.ciphertexts[0];
// Note: You can't decrypt this on the client side!
```

### EncDataStruct\<N>

For simple encrypted data without key exchange metadata (less commonly used):

```rust  theme={null}
// Pattern: Only N Ciphertexts
pub struct EncDataStruct<const LEN: usize> {
    pub ciphertexts: [[u8; 32]; LEN], // Raw encrypted values
}
```

**Note**: `EncDataStruct<N>` is used in special cases where only ciphertext data is needed without additional metadata. Most applications use `SharedEncryptedStruct<N>` or `MXEEncryptedStruct<N>` instead.

## Moving to Real-World Applications

Now that you understand the basics with our simple addition example, here's how this works in real applications. The key difference is that real apps often:

* **Return multiple values**: Functions return tuples or complex structs instead of single values
* **Mix encryption types**: Some data for users (`Shared`), some for MXE only (`Mxe`)
* **Handle complex data**: Custom structs with multiple fields instead of simple numbers

The type generation system handles all of this automatically - you just need to understand the patterns.

## Real-World Examples

Here's how this type generation works in actual Arcium applications:

### Simple Tuple Example

Let's start with something in between - a function that returns two related values:

```rust  theme={null}
#[instruction]
pub fn calculate_stats(value: u32) -> (Enc<Shared, u32>, Enc<Shared, u32>) {
    // Calculate both the square and double of a number
    (value.square(), value * 2)
}
```

Since this returns a tuple `(Enc<Shared, u32>, Enc<Shared, u32>)`, Arcium generates:

```rust  theme={null}
pub struct CalculateStatsOutput {
    pub field_0: CalculateStatsOutputStruct0,  // The whole tuple becomes one field
}

pub struct CalculateStatsOutputStruct0 {
    pub field_0: SharedEncryptedStruct<1>,     // First u32 (the square)
    pub field_1: SharedEncryptedStruct<1>,     // Second u32 (the double)
}
```

Notice how tuples get wrapped: the tuple itself becomes `field_0`, and its elements become `field_0`, `field_1`, etc.

### Voting Application

Now let's look at a more realistic example. The [confidential voting example](https://github.com/arcium-hq/examples/tree/main/voting) shows a perfect use case. You have poll data that only the MXE should see, and a user's vote that should be shared between the user and the MXE:

```rust  theme={null}
// Example poll data structure (would be defined in your program)
#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct PollData {
    pub vote_count_yes: u32,
    pub vote_count_no: u32,
    pub is_active: bool,
}

#[instruction]
pub fn vote(
    poll_data: Enc<Mxe, PollData>,      // Poll results stay private
    vote_choice: Enc<Shared, u8>        // User can verify their vote
) -> (Enc<Mxe, PollData>, Enc<Shared, bool>) {
    // ... voting logic that maintains privacy
}
```

Since this function returns a tuple `(Enc<Mxe, PollData>, Enc<Shared, bool>)`, Arcium generates:

```rust  theme={null}
pub struct VoteOutput {
    pub field_0: VoteOutputStruct0,  // The whole tuple wraps into one field
}

pub struct VoteOutputStruct0 {
    pub field_0: MXEEncryptedStruct<3>,    // The updated poll data (vote_count_yes + vote_count_no + is_active = 3)
    pub field_1: SharedEncryptedStruct<1>, // The vote confirmation (boolean)
}
```

Now in your callback, you can work with properly typed data instead of raw bytes:

```rust  theme={null}
#[arcium_callback(encrypted_ix = "vote")]
pub fn vote_callback(
    ctx: Context<VoteCallback>,
    output: SignedComputationOutputs<VoteOutput>,
) -> Result<()> {
    let o = match output.verify_output(
        &ctx.accounts.cluster_account,
        &ctx.accounts.computation_account
    ) {
        Ok(VoteOutput { field_0 }) => field_0,
        Err(_) => return Err(ErrorCode::AbortedComputation.into()),
    };

    let poll_data = o.field_0;         // The updated poll (MXE only)
    let vote_confirmation = o.field_1; // User's confirmation (shared)

    // Emit an event with the user's confirmation
    emit!(VoteEvent {
        confirmation: vote_confirmation.ciphertexts[0],
        nonce: vote_confirmation.nonce.to_le_bytes(),
    });
    Ok(())
}
```

### Coinflip Application: Back to Basics

After seeing complex tuples and mixed encryption types, let's look at the simplest possible case. The [coinflip example](https://github.com/arcium-hq/examples/tree/main/coinflip) returns just a single encrypted boolean:

```rust  theme={null}
#[instruction]
pub fn flip() -> Enc<Shared, bool> {
    // Generate secure randomness in MPC
    // Return encrypted result that client can decrypt
}
```

Arcium sees this returns `Enc<Shared, bool>` and creates:

```rust  theme={null}
pub struct FlipOutput {
    pub field_0: SharedEncryptedStruct<1>, // Just one boolean
}
```

Your callback:

```rust  theme={null}
#[arcium_callback(encrypted_ix = "flip")]
pub fn flip_callback(
    ctx: Context<FlipCallback>,
    output: SignedComputationOutputs<FlipOutput>,
) -> Result<()> {
    let o = match output.verify_output(
        &ctx.accounts.cluster_account,
        &ctx.accounts.computation_account
    ) {
        Ok(FlipOutput { field_0 }) => field_0,
        Err(_) => return Err(ErrorCode::AbortedComputation.into()),
    };

    // Emit the encrypted result - client will decrypt to see heads/tails
    emit!(FlipEvent {
        result: o.ciphertexts[0],
        nonce: o.nonce.to_le_bytes(),
    });
    Ok(())
}
```

### Blackjack Application

From the [blackjack example](https://github.com/arcium-hq/examples/tree/main/blackjack) with complex game state:

```rust  theme={null}
// Example structures (would be defined in your blackjack program)
#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct GameState {
    pub deck_cards: [u8; 52],
    pub dealer_cards: [u8; 10],
    pub round_number: u32,
    pub game_active: bool,
    pub house_balance: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct PlayerHand {
    pub cards: [u8; 10],
    pub card_count: u8,
    pub bet_amount: u64,
}

#[instruction]
pub fn player_hit(
    game_state: Enc<Mxe, GameState>,
    player_hand: Enc<Shared, PlayerHand>
) -> (Enc<Mxe, GameState>, Enc<Shared, PlayerHand>, Enc<Shared, bool>) {
    // ... game logic
}
```

**Generated types**:

```rust  theme={null}
pub struct PlayerHitOutput {
    pub field_0: PlayerHitOutputStruct0,
}

pub struct PlayerHitOutputStruct0 {
    pub field_0: MXEEncryptedStruct<65>,   // Updated game state (deck_cards[52] + dealer_cards[10] + round_number[1] + game_active[1] + house_balance[1] = 65)
    pub field_1: SharedEncryptedStruct<12>, // Player's new hand (cards[10] + card_count[1] + bet_amount[1] = 12)
    pub field_2: SharedEncryptedStruct<1>, // Is game over? (boolean)
}
```

## Complex Nested Structures

For more complex outputs with nested data structures:

```rust  theme={null}
// Define the custom struct used in the circuit
#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct UserData {
    pub id: u32,
    pub active: bool,
}

#[instruction]
pub fn complex_example() -> (
    UserData,
    Enc<Shared, u32>,
    (u64, f32),
    Enc<Mxe, bool>
) {
    // ... complex logic
}
```

**Generated types**:

```rust  theme={null}
pub struct ComplexExampleOutput {
    pub field_0: ComplexExampleOutputStruct0, // Entire tuple as single field
}

pub struct ComplexExampleOutputStruct0 {
    pub field_0: ComplexExampleOutputStruct00,  // UserData
    pub field_1: SharedEncryptedStruct<1>,      // Enc<Shared, u32>
    pub field_2: ComplexExampleOutputStruct02,  // (u64, f32) tuple
    pub field_3: MXEEncryptedStruct<1>,         // Enc<Mxe, bool>
}

pub struct ComplexExampleOutputStruct00 {
    pub field_0: u32,   // UserData.id
    pub field_1: bool,  // UserData.active
}

pub struct ComplexExampleOutputStruct02 {
    pub field_0: u64,   // First tuple element
    pub field_1: f32,   // Second tuple element
}
```

**Notice the naming pattern**: We have `ComplexExampleOutputStruct00` and `ComplexExampleOutputStruct02`, but no `ComplexExampleOutputStruct01`. This is because:

* `field_0` (UserData) needs a custom struct → `ComplexExampleOutputStruct00`
* `field_1` (SharedEncryptedStruct) uses a predefined type → no custom struct needed
* `field_2` ((u64, f32) tuple) needs a custom struct → `ComplexExampleOutputStruct02`
* `field_3` (MXEEncryptedStruct) uses a predefined type → no custom struct needed

Only fields that contain custom structs or tuples get their own generated struct definitions.

## Working with Generated Types

### Pattern Matching

Use destructuring to access nested data:

```rust  theme={null}
let ComplexExampleOutput {
    field_0: ComplexExampleOutputStruct0 {
        field_0: user_data,
        field_1: shared_encrypted,
        field_2: tuple_data,
        field_3: mxe_encrypted,
    }
} = match output {
    ComputationOutputs::Success(result) => result,
    _ => return Err(ErrorCode::AbortedComputation.into()),
};

// Access specific fields
let user_id = user_data.field_0;
let is_active = user_data.field_1;
let shared_value = shared_encrypted.ciphertexts[0];
let timestamp = tuple_data.field_0;
```

### Error Handling

Always handle computation failures:

```rust  theme={null}
let result = match output {
    ComputationOutputs::Success(data) => data,
    _ => return Err(ErrorCode::AbortedComputation.into()),
};
```

## Best Practices

### 1. Use Descriptive Variable Names

```rust  theme={null}
// Good
let FlipOutput { field_0: coin_result } = result;
let is_heads = coin_result.ciphertexts[0];

// Less clear
let FlipOutput { field_0 } = result;
let result = field_0.ciphertexts[0];
```

### 2. Document Your Circuit Interfaces

```rust  theme={null}
/// Returns (updated_game_state, player_hand, is_game_over)
#[instruction]
pub fn player_hit(/* ... */) -> (Enc<Mxe, GameState>, Enc<Shared, PlayerHand>, Enc<Shared, bool>) {
    // ...
}
```

### 3. Handle All Computation States

```rust  theme={null}
let result = match output {
    ComputationOutputs::Success(data) => data,
    _ => return Err(ErrorCode::AbortedComputation.into()),
};
```

### 4. Emit Events for Client Tracking

```rust  theme={null}
emit!(ComputationCompleteEvent {
    computation_id: ctx.accounts.computation_account.key(),
    success: true,
    result_hash: result.ciphertexts[0], // or use a hash function if needed
});
```

## When Things Go Wrong

Here are the most common issues and how to fix them:

### "Type not found" Errors

```rust  theme={null}
// Error: cannot find type `MyCircuitOutput` in this scope
output: SignedComputationOutputs<MyCircuitOutput>
```

This usually means one of two things:

1. **Typo in the circuit name** - Check that `MyCircuit` exactly matches your `#[instruction]` function name (case matters!)
2. **You forgot to rebuild** - Run `arcium build` again after making changes to your encrypted instructions

### "No field found" Errors

```rust  theme={null}
// Error: no field `result` on type `AddTogetherOutput`
let value = output.result;
```

Remember, the generated structs use numbered fields like `field_0`, `field_1`, etc. There's no field called `result` unless you specifically named your function that way.

Try this instead:

```rust  theme={null}
let value = output.field_0;  // First (and often only) field
```

### Encryption Type Mismatches

```rust  theme={null}
// Error: expected `SharedEncryptedStruct<1>`, found `MXEEncryptedStruct<1>`
```

This happens when your circuit returns `Enc<Mxe, T>` but your callback expects `Enc<Shared, T>` (or vice versa). Double-check your encrypted instruction's return type - it needs to match what you're expecting in the callback.

## Callback Not Working? Check These:

* [ ] Circuit name matches exactly (case sensitive)
* [ ] Ran `arcium build` after changing circuit
* [ ] Handling all ComputationOutputs variants
* [ ] Using correct field numbers (field\_0, field\_1, etc.)
* [ ] Array access within bounds (ciphertexts.len())

## Finding Generated Types

The best way to see generated types:

```bash  theme={null}
# First install cargo-expand if you haven't already
cargo install cargo-expand

# In your program directory
cargo expand | grep "YourCircuitOutput" -A 20
```

This shows exactly what structs were generated for your circuit.

You can also search the full output:

```bash  theme={null}
cargo expand > expanded.rs
# Then search expanded.rs for your circuit name
```

## Array and Complex Type Handling

### Fixed-Size Arrays

When your circuit returns arrays, each element becomes a separate scalar in the LEN count:

```rust  theme={null}
#[instruction]
pub fn process_batch() -> Enc<Shared, [u32; 3]> {
    // Process multiple values at once
    [result1, result2, result3]
}
```

This generates `SharedEncryptedStruct<3>` because the array has 3 elements:

```rust  theme={null}
pub struct ProcessBatchOutput {
    pub field_0: SharedEncryptedStruct<3>, // Array of 3 u32s
}
```

In your callback, access individual elements:

```rust  theme={null}
let encrypted_array = result.field_0;
let first_element = encrypted_array.ciphertexts[0];   // result1
let second_element = encrypted_array.ciphertexts[1];  // result2
let third_element = encrypted_array.ciphertexts[2];   // result3
```

### Nested Structures

For deeply nested data, LEN counts **all scalar values** at any depth:

```rust  theme={null}
pub struct Position {
    pub x: u32,
    pub y: u32,
}

pub struct Entity {
    pub position: Position,  // 2 scalars (x, y)
    pub health: u32,         // 1 scalar
    pub alive: bool,         // 1 scalar
}
// Total: 2 + 1 + 1 = 4 scalars

#[instruction]
pub fn update_entity() -> Enc<Shared, Entity> { /* ... */ }
```

Result: `SharedEncryptedStruct<4>` because Entity contains 4 total scalar values.

## Migration from v0.1.x

If you're upgrading from an older version, the new type generation system replaces manual byte parsing:

**Old way (v0.1.x)**:

```rust  theme={null}
pub fn encrypted_ix_callback(output: ComputationOutputs) -> Result<()> {
    let bytes = if let ComputationOutputs::Bytes(bytes) = output {
        bytes
    } else {
        return Err(ErrorCode::AbortedComputation.into());
    };

    let sum = bytes[48..80].try_into().unwrap();
    let nonce = bytes[32..48].try_into().unwrap();
    // ...
}
```

**New way (current)**:

```rust  theme={null}
pub fn encrypted_ix_callback(
    ctx: Context<AddTogetherCallback>,
    output: SignedComputationOutputs<AddTogetherOutput>,
) -> Result<()> {
    let o = match output.verify_output(
        &ctx.accounts.cluster_account,
        &ctx.accounts.computation_account
    ) {
        Ok(AddTogetherOutput { field_0 }) => field_0,
        Err(_) => return Err(ErrorCode::AbortedComputation.into()),
    };

    let sum = o.ciphertexts[0];
    let nonce = o.nonce;
    // ...
}
```

For detailed migration steps, see the [Migration Guide](/developers/migration).

## Type Generation Limitations

### Supported Return Types

The type generation system works with most common Rust types, but has some constraints:

**✅ Supported:**

* Primitive types: `u8`, `u16`, `u32`, `u64`, `u128`, `i8`, `i16`, `i32`, `i64`, `i128`, `bool`
* Fixed-size arrays: `[T; N]` where N is a compile-time constant
* Tuples: `(T, U, V)` with any number of elements
* Custom structs with supported field types
* Nested combinations of the above

**❌ Not Supported:**

* Dynamic types: `Vec<T>`, `String`, `HashMap<K, V>`
* Reference types: `&T`, `&mut T` (except for input parameters)
* Generic types with lifetime parameters
* Recursive or self-referencing structs
* `Option<T>` or `Result<T, E>` as return types

### Practical Constraints

**Size Limitations:**

* Very large structs (1000+ fields) may impact compilation time
* Arrays with thousands of elements create correspondingly large LEN values
* Deep nesting (10+ levels) may cause macro expansion issues

**Naming Conflicts:**

```rust  theme={null}
// This would create a conflict:
#[instruction] pub fn test() -> u32        // → TestOutput
#[instruction] pub fn TEST() -> u32        // → TestOutput (same name!)
```

Function names must be unique when converted to PascalCase + "Output".

### Working Within Constraints

If you need unsupported types, consider these patterns:

```rust  theme={null}
// Instead of Vec<u32>, use fixed arrays:
#[instruction]
pub fn process() -> Enc<Shared, [u32; 10]> { /* ... */ }

// Instead of Option<T>, use a flag + value:
#[instruction]
pub fn maybe_compute() -> (Enc<Shared, bool>, Enc<Shared, u32>) {
    // (has_value, value)
}

// Instead of String, use fixed-size byte arrays:
#[instruction]
pub fn get_name() -> Enc<Shared, [u8; 32]> { /* ... */ }
```

## Common Patterns and Performance Tips

### Choosing the Right Encryption Type

* **Use `Enc<Shared, T>`** when users need to decrypt and verify results (votes, game outcomes, personal data)
* **Use `Enc<Mxe, T>`** for internal state that users shouldn't access (system secrets, aggregate statistics, protocol data)

### Performance Considerations

* **Large arrays**: `[u8; 1000]` becomes `SharedEncryptedStruct<1000>` - consider if you really need all elements encrypted
* **Complex nesting**: Deep struct hierarchies increase LEN values - flatten when possible
* **Mixed returns**: `(Enc<Shared, T>, Enc<Mxe, U>)` creates separate encrypted structs for optimal access patterns

### Testing Your Callbacks

Mock the computation outputs for testing:

```rust  theme={null}
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_callback_success() {
        let mock_output = ComputationOutputs::Success(YourCircuitOutput {
            field_0: SharedEncryptedStruct {
                encryption_key: [0u8; 32],
                nonce: 12345u128,
                ciphertexts: [[1u8; 32]],
            },
        });

        // Test your callback logic
        assert!(your_callback(mock_output).is_ok());
    }
}
```

## Quick Reference

| Return Type      | Generated Struct           | Access Pattern                          |
| ---------------- | -------------------------- | --------------------------------------- |
| `Enc<Shared, T>` | `SharedEncryptedStruct<1>` | `result.ciphertexts[0]`, `result.nonce` |
| `Enc<Mxe, T>`    | `MXEEncryptedStruct<1>`    | `result.ciphertexts[0]`, `result.nonce` |
| `(T, U, V)`      | `{Circuit}OutputStruct0`   | `result.field_0`, `result.field_1`      |
| Custom struct    | `{Circuit}OutputStruct0`   | `result.field_0`, `result.field_1`      |

**Callback pattern:**

```rust  theme={null}
#[arcium_callback(encrypted_ix = "your_function")]
pub fn callback(
    ctx: Context<YourFunctionCallback>,
    output: SignedComputationOutputs<YourFunctionOutput>,
) -> Result<()> {
    let o = match output.verify_output(
        &ctx.accounts.cluster_account,
        &ctx.accounts.computation_account
    ) {
        Ok(YourFunctionOutput { field_0 }) => field_0,
        Err(_) => return Err(ErrorCode::AbortedComputation.into()),
    };
    // Access o.ciphertexts[0], o.nonce.to_le_bytes(), etc.
}
```

***

The callback type generation system automatically handles encrypted computation results, eliminating manual byte parsing and offset tracking. With properly typed structs, you can work directly with structured data and focus on building your applications rather than handling low-level data conversion.

These generated types provide type safety and predictable patterns that make working with encrypted computation outputs straightforward and reliable.
> ## Documentation Index
> Fetch the complete documentation index at: https://docs.arcium.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Overview

## Overview

Arcium offers two TS libraries, which provide tools and utilities for interacting with Arcium and the MXEs (MPC eXecution Environments) deployed on it.

Client library `@arcium-hq/client`:

* Handle secret sharing and encryption of inputs
* Submit confidential transactions
* Manage callbacks for computation results

Reader library `@arcium-hq/reader`:

* Read MXE data
* View computations for a given MXE

Generally speaking, the client library is used to build & invoke computations on MXEs and then track their outputs, while the reader library is more so to track the overall network. To get a better idea of its place in the general architecture, we highly recommend taking a look at the [computation lifecycle](/developers/computation-lifecycle).

## Installation

Client library:

<CodeGroup>
  ```bash npm theme={null}
  npm install @arcium-hq/client
  ```

  ```bash yarn theme={null}
  yarn add @arcium-hq/client
  ```

  ```bash pnpm theme={null}
  pnpm add @arcium-hq/client
  ```
</CodeGroup>

Reader library:

<CodeGroup>
  ```bash npm theme={null}
  npm install @arcium-hq/reader
  ```

  ```bash yarn theme={null}
  yarn add @arcium-hq/reader
  ```

  ```bash pnpm theme={null}
  pnpm add @arcium-hq/reader
  ```
</CodeGroup>

## API Reference

For complete TypeScript SDK documentation and API reference for the client and reader libraries, visit: [ts.arcium.com/api](https://ts.arcium.com/api)

## Using the client

Prefer a more step-by-step approach? Get started with learning [how to encrypt inputs for confidential transactions](/developers/js-client-library/encryption).
> ## Documentation Index
> Fetch the complete documentation index at: https://docs.arcium.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Overview

## Overview

Arcium offers two TS libraries, which provide tools and utilities for interacting with Arcium and the MXEs (MPC eXecution Environments) deployed on it.

Client library `@arcium-hq/client`:

* Handle secret sharing and encryption of inputs
* Submit confidential transactions
* Manage callbacks for computation results

Reader library `@arcium-hq/reader`:

* Read MXE data
* View computations for a given MXE

Generally speaking, the client library is used to build & invoke computations on MXEs and then track their outputs, while the reader library is more so to track the overall network. To get a better idea of its place in the general architecture, we highly recommend taking a look at the [computation lifecycle](/developers/computation-lifecycle).

## Installation

Client library:

<CodeGroup>
  ```bash npm theme={null}
  npm install @arcium-hq/client
  ```

  ```bash yarn theme={null}
  yarn add @arcium-hq/client
  ```

  ```bash pnpm theme={null}
  pnpm add @arcium-hq/client
  ```
</CodeGroup>

Reader library:

<CodeGroup>
  ```bash npm theme={null}
  npm install @arcium-hq/reader
  ```

  ```bash yarn theme={null}
  yarn add @arcium-hq/reader
  ```

  ```bash pnpm theme={null}
  pnpm add @arcium-hq/reader
  ```
</CodeGroup>

## API Reference

For complete TypeScript SDK documentation and API reference for the client and reader libraries, visit: [ts.arcium.com/api](https://ts.arcium.com/api)

## Using the client

Prefer a more step-by-step approach? Get started with learning [how to encrypt inputs for confidential transactions](/developers/js-client-library/encryption).
> ## Documentation Index
> Fetch the complete documentation index at: https://docs.arcium.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Tracking callbacks

Unlike regular transactions, confidential computations involve additional steps after your Solana transaction completes:

1. **Your transaction completes** - Encrypted data is submitted and queued in the cluster's mempool
2. **Computation waits in queue** - MPC nodes process computations from the mempool in order
3. **MPC execution** - When your computation's turn comes, MPC nodes execute it offchain
4. **Callback invocation** - Results are returned via your callback instruction

This means you can't simply await a transaction completion like normal Solana programs. Instead, you need to wait for the entire computation lifecycle to finish. The Arcium client library provides utilities to handle this:

## Await computation completion with `awaitComputationFinalization`

```typescript  theme={null}
// Generate a random 8-byte computation offset
const computationOffset = new anchor.BN(randomBytes(8), "hex");

// `program` is the anchor program client of the MXE we're invoking
// the instruction `ourIx` on (which then invokes a computation under the hood by CPIing into the Arcium program).
// `queueSig` is the signature of said transaction.
const queueSig = await program.methods
  .ourIx(
    // Computation offset that you provide when invoking the instruction
    computationOffset
    /* other inputs */
  )
  .accounts(/* some accounts */)
  .rpc();

// Since this is a Arcium computation, we need to wait for it to be finalized
// a little bit differently
const finalizeSig = await awaitComputationFinalization(
  // Anchor provider
  provider as anchor.AnchorProvider,
  // Computation offset that you provide when invoking the instruction
  computationOffset,
  // Program ID of the MXE
  program.programId,
  // Solana commitment level, "confirmed" by default
  "confirmed"
);

console.log("Computation was finalized with sig: ", finalizeSig);
```
> ## Documentation Index
> Fetch the complete documentation index at: https://docs.arcium.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Deployment

## Getting Started with Deployment

So you've built and tested your MXE locally, and now you're ready to deploy it to Solana devnet. This guide will walk you through the deployment process and share some tips to make it go smoothly.

## What You'll Need

Before we dive into deployment, let's make sure you have everything ready:

* Your MXE built successfully with `arcium build`
* Tests passing locally with `arcium test`
* A Solana keypair with around 2-5 SOL for deployment costs (program deployment and account initialization)
* Access to a reliable RPC endpoint

<Warning>
  **RPC reliability is critical for deployment.** Default Solana devnet endpoints frequently drop transactions, causing deployment failures. Get a free API key from [Helius](https://helius.dev) or [QuickNode](https://quicknode.com) before attempting deployment.
</Warning>

## Preparing Your Program

Before you deploy, there are a couple of important things to consider about how your program handles computation definitions.

### Handling Large Circuits with Offchain Storage

Here's something important to know: right now, Arcis compiled circuits are not optimally efficient with their encoding, which means your circuit files can easily be several MBs in size. That makes initializing computation definitions onchain pretty expensive - and will require a lot of transactions to fully upload.

The good news is you can store your circuits offchain instead. Just upload them to IPFS, a public S3 bucket, or even Supabase object storage - wherever works for you. Here's how to update your program to use offchain storage:

**Standard approach (works for small circuits):**

```rust  theme={null}
pub fn init_add_together_comp_def(ctx: Context<InitAddTogetherCompDef>) -> Result<()> {
    // This initializes the computation definition account
    init_comp_def(ctx.accounts, None, None)?;
    Ok(())
}
```

**Offchain approach (recommended for larger circuits):**

```rust  theme={null}
// First, import the types you'll need
use arcium_client::idl::arcium::types::{CircuitSource, OffChainCircuitSource};
use arcium_macros::circuit_hash;

pub fn init_add_together_comp_def(ctx: Context<InitAddTogetherCompDef>) -> Result<()> {
    // Point to your uploaded circuit file
    init_comp_def(
        ctx.accounts,
        Some(CircuitSource::OffChain(OffChainCircuitSource {
            source: "https://your-storage.com/path/to/add_together.arcis".to_string(),
            hash: circuit_hash!("add_together"),
        })),
        None,
    )?;
    Ok(())
}
```

<Note>
  The `circuit_hash!` macro embeds the SHA-256 hash of your compiled circuit at compile time. The hash is read from `build/{circuit_name}.hash`, which is generated automatically during `arcium build`. Arx nodes verify this hash when fetching your circuit to ensure the circuit hasn't been tampered with.

  **Important:** Always use `circuit_hash!` for offchain circuits. Don't use a placeholder like `[0u8; 32]` - this will cause verification to fail on Arx nodes.
</Note>

With the offchain approach, you'll:

1. Build your project with `arcium build` to generate the circuit files and hashes
2. Upload the `.arcis` files from `build/` folder to your preferred storage service
3. Update your init functions with the public URLs and `circuit_hash!` macro calls

Note: Your circuit files must be publicly accessible without authentication. Make sure your storage service allows public read access.

This saves a ton on transaction costs and lets you work with much larger circuits!

### Note on Cluster Configuration

When testing locally, you've been using `arciumEnv.arciumClusterOffset` with `getClusterAccAddress()` in your test code. For devnet deployment, you'll use the same pattern with your chosen cluster offset - we'll show you exactly how in the post-deployment section.

## Basic Deployment

The `arcium deploy` command handles both deploying your program and initializing the MXE account. Here's the basic command structure:

```bash  theme={null}
arcium deploy --cluster-offset <cluster-offset> --recovery-set-size <size> --keypair-path <path-to-your-keypair> --rpc-url <your-rpc-url>
```

Let's break down what each parameter does:

### Understanding Cluster Offsets

The `--cluster-offset` tells your MXE which Arcium cluster it should connect to. Think of clusters as groups of nodes that will perform your encrypted computations. For devnet, you can choose from these offsets:

* `123` - v0.5.4
* `456` - v0.6.3 (recommended)

### Recovery Set Size

The `--recovery-set-size` parameter specifies the number of nodes required for threshold cryptography recovery operations. This is a required parameter. For devnet, use `4`.

### Choosing Your RPC Provider

The `--rpc-url` parameter is particularly important. While you could use Solana's default RPC endpoints with the shorthand notation (`-u d` for devnet), the default RPC can be unreliable and cause deployment failures due to dropped transactions.

**Recommended approach with a reliable RPC:**

```bash  theme={null}
arcium deploy --cluster-offset 456 \
  --recovery-set-size 4 \
  --keypair-path ~/.config/solana/id.json \
  --rpc-url https://devnet.helius-rpc.com/?api-key=<your-api-key>
```

**If you must use the default RPC:**

```bash  theme={null}
arcium deploy --cluster-offset 456 \
  --recovery-set-size 4 \
  --keypair-path ~/.config/solana/id.json \
  -u d  # 'd' for devnet, 't' for testnet, 'l' for localnet
```

Just be prepared for potential transaction failures with the default RPC.

## Advanced Deployment Options

Once you're comfortable with basic deployment, you might want to customize things further.

### Adjusting Mempool Size

The mempool determines how many computations your MXE can queue up. The default "Tiny" size works fine for testing, but you might want more capacity for production:

```bash  theme={null}
arcium deploy --cluster-offset 456 \
  --recovery-set-size 4 \
  --keypair-path ~/.config/solana/id.json \
  --rpc-url <your-rpc-url> \
  --mempool-size Medium
```

Available sizes are: `Tiny`, `Small`, `Medium`, `Large`. Start small and increase if you need more capacity.

### Using a Custom Program Address

If you need your program at a specific address (maybe for consistency across deployments), you can provide a program keypair:

```bash  theme={null}
arcium deploy --cluster-offset 456 \
  --recovery-set-size 4 \
  --keypair-path ~/.config/solana/id.json \
  --rpc-url <your-rpc-url> \
  --program-keypair ./program-keypair.json
```

### Partial Deployments

Sometimes you might need to run just part of the deployment process. For instance, if you've already deployed the program but need to reinitialize the MXE account:

```bash  theme={null}
# Skip program deployment, only initialize MXE account
arcium deploy --cluster-offset 456 \
  --recovery-set-size 4 \
  --keypair-path ~/.config/solana/id.json \
  --rpc-url <your-rpc-url> \
  --skip-deploy
```

Or if you only want to deploy the program without initialization:

```bash  theme={null}
# Deploy program only, skip MXE initialization
arcium deploy --cluster-offset 456 \
  --recovery-set-size 4 \
  --keypair-path ~/.config/solana/id.json \
  --rpc-url <your-rpc-url> \
  --skip-init
```

## After Deployment

### Initialize Your Computation Definitions

Your MXE is deployed, but you still need to initialize the computation definitions. This tells the Arcium network what encrypted operations your MXE can perform. Computation definitions only need to be initialized once - they persist onchain and don't need to be re-initialized unless you're deploying to a new program address. You can initialize them anytime after deployment completes successfully.

Remember how we mentioned you'd need to update your cluster configuration? Now's the time! You'll need to update your test or client code to derive the cluster account (and the related PDAs) from the cluster offset you selected during deployment.

**Local testing pattern:**

```typescript  theme={null}
const arciumEnv = getArciumEnv();

// In your transaction...
.accountsPartial({
    computationAccount: getComputationAccAddress(
        arciumEnv.arciumClusterOffset,
        computationOffset
    ),
    clusterAccount: getClusterAccAddress(arciumEnv.arciumClusterOffset),
    mxeAccount: getMXEAccAddress(program.programId),
    mempoolAccount: getMempoolAccAddress(arciumEnv.arciumClusterOffset),
    executingPool: getExecutingPoolAccAddress(arciumEnv.arciumClusterOffset),
    // ... other accounts
})
```

**For devnet deployment:**

```typescript  theme={null}
// Use the cluster offset from your deployment (e.g., 456)
const clusterOffset = 456;

// In your transaction...
.accountsPartial({
    computationAccount: getComputationAccAddress(clusterOffset, computationOffset),
    clusterAccount: getClusterAccAddress(clusterOffset),
    mxeAccount: getMXEAccAddress(program.programId),
    mempoolAccount: getMempoolAccAddress(clusterOffset),
    executingPool: getExecutingPoolAccAddress(clusterOffset),
    // ... other accounts
})
```

Make sure to use the same `cluster_offset` value that you used during deployment! This ensures your program talks to the right cluster.

Once you've updated the cluster configuration, you can run the initialization:

```typescript  theme={null}
// Now with the correct cluster configured
await initAddTogetherCompDef(program, owner, false);
```

### Verify Everything's Working

Let's make sure your deployment succeeded:

```bash  theme={null}
solana program show <your-program-id> --url <your-rpc-url>
```

To run your tests against the deployed program on devnet, you'll need to update your test setup code to use devnet configuration instead of the local testing environment:

```typescript  theme={null}
// Update your test setup to use devnet when needed
const useDevnet = true; // Set to false for local testing

if (useDevnet) {
  // Devnet configuration
  const connection = new anchor.web3.Connection(
    "https://api.devnet.solana.com", // or your preferred RPC
    "confirmed"
  );
  const wallet = new anchor.Wallet(owner);
  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  const program = new anchor.Program<YourProgram>(IDL as anchor.Idl, provider);
  const clusterOffset = 456; // Use your cluster offset
  const clusterAccount = getClusterAccAddress(clusterOffset);
} else {
  // Local configuration
  anchor.setProvider(anchor.AnchorProvider.env());
  const provider = anchor.getProvider() as anchor.AnchorProvider;
  const program = anchor.workspace.YourProgram as Program<YourProgram>;
  const arciumEnv = getArciumEnv();
  const clusterAccount = getClusterAccAddress(arciumEnv.arciumClusterOffset);
}
```

Then run your tests with:

```bash  theme={null}
arcium test
```

## Common Issues and Solutions

### Dealing with Dropped Transactions

If your deployment fails with transaction errors, it's almost always the RPC. Switch to a dedicated provider:

```bash  theme={null}
# Instead of this (unreliable):
arcium deploy ... -u d

# Use this (reliable):
arcium deploy ... --rpc-url https://devnet.helius-rpc.com/?api-key=<your-key>
```

### Running Out of SOL

Check your balance before deploying:

```bash  theme={null}
solana balance <your-keypair-pubkey> -u devnet
```

Need more devnet SOL? Request an airdrop:

```bash  theme={null}
solana airdrop 2 <your-keypair-pubkey> -u devnet
```

### Deployment Partially Failed?

No worries, you can complete the missing steps. If the program deployed but initialization failed, just run with `--skip-deploy`. If initialization succeeded but deployment failed, use `--skip-init`.

## What's Next?

With your MXE deployed, you're ready to:

1. Update your client code to connect to the deployed program
2. Initialize all your computation definitions
3. Run end-to-end tests with real encrypted computations
4. Monitor performance and adjust mempool size if needed

If you run into any issues or have questions, don't hesitate to reach out on [Discord](https://discord.gg/arcium)!
> ## Documentation Index
> Fetch the complete documentation index at: https://docs.arcium.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Callback Server

When an encrypted instruction produces output that's too large to fit in a single Solana transaction (which has a size limit), you'll need to implement a callback server. This is a simple HTTP server that you develop and host yourself, which acts as an intermediary to receive large computation results from the MPC nodes and process them according to your application's needs.

For example, if your encrypted instruction produces a large output (say 10KB), the MPC nodes will first pack as much data as possible into the normal callback transaction (\~1KB), and send the remaining data (in this case \~9KB) to your callback server. This allows you to handle arbitrarily large outputs while still maintaining the efficiency of direct onchain callbacks when possible.

The callback server provides a simple HTTP endpoint that receives the computation output, verifies its authenticity using signatures from the MPC nodes, and processes the data according to your needs. This allows you to handle arbitrarily large computation results while maintaining the security guarantees of the Arcium protocol. Onchain, the callback server must also call the `finalize` transaction for the computation, where the Arcium program verifies that the data submitted by the callback server matches the data computed by the MPC nodes by comparing their hashes.

## API Interface

### POST /callback

Receives a raw byte object with the following structure:

`mempool_id|comp_def_offset|tx_sig|data_sig|pub_key|data`

* `mempool_id`: u16 - Mempool identifier
* `comp_def_offset`: u32 - Identifier for the given computation definition in the MXE program
* `tx_sig`: \[u8; 64] - The transaction signature of the callback transaction
* `data_sig`: \[u8; 64] - The signature of the data, signed by one of the node's private keys
* `pub_key`: \[u8; 32] - The public key of the node that signed the data
* `data`: Vec - The actual computation output to be processed

The server will then verify the signatures, and if they are valid, it will process the data.

The most common use case is to perform any necessary processing and submit the data back to the chain.

The server will then return a 200 OK response.
> ## Documentation Index
> Fetch the complete documentation index at: https://docs.arcium.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Current Limitations

## Output sizes

Outputs of encrypted instructions must fit in a single Solana transaction (the callback transaction), otherwise you need to set up additional infrastructure to handle transaction data handling via [callback server](/developers/callback-server).
> ## Documentation Index
> Fetch the complete documentation index at: https://docs.arcium.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Overview

Choose your migration path based on your current Arcium version:

| Current Version | Target | Migration Guide                                                    |
| --------------- | ------ | ------------------------------------------------------------------ |
| **v0.5.x**      | v0.6.3 | [→ v0.5.x to v0.6.3](/developers/migration/migration-v0.5-to-v0.6) |
| **v0.4.x**      | v0.5.1 | [→ v0.4.x to v0.5.1](/developers/migration/migration-v0.4-to-v0.5) |
| **v0.3.x**      | v0.4.0 | [→ v0.3.x to v0.4.0](/developers/migration/migration-v0.3-to-v0.4) |
| **v0.2.x**      | v0.3.0 | [→ v0.2.x to v0.3.0](/developers/migration/migration-v0.2-to-v0.3) |
| **v0.1.x**      | v0.2.0 | [→ v0.1.x to v0.2.0](/developers/migration/migration-v0.1-to-v0.2) |

## Multi-Step Migration

**v0.1.x → v0.6.3**: Migrate through v0.2.0, then v0.3.0, then v0.4.0, then v0.5.1, then to v0.6.3.

## Need Help?

* Backup your project before migrating
* Test on a copy first
* Each migration guide includes troubleshooting sections
> ## Documentation Index
> Fetch the complete documentation index at: https://docs.arcium.com/llms.txt
> Use this file to discover all available pages before exploring further.

# v0.5.x to v0.6.3

This release requires a **program redeploy** due to a change in the Arcium program ID. Follow this guide to migrate your MXE from v0.5.x to v0.6.3.

## 1. Redeploy Required

The Arcium program ID has changed. You must redeploy your MXE program to use v0.6.3.

| Version | Program ID                                     |
| ------- | ---------------------------------------------- |
| v0.5.x  | `BpaW2ZmCJnDwizWY8eM34JtVqp2kRgnmQcedSVc9USdP` |
| v0.6.3  | `Arcj82pX7HxYKLR92qvgZUAd7vGS1k4hQvAFcPATFdEQ` |

After updating dependencies and code (steps below), run:

```bash  theme={null}
arcium deploy --cluster-offset <your-offset> --recovery-set-size <size> --keypair-path <path> --rpc-url <url>
```

## 2. Update Rust Dependencies

Update your program dependencies to v0.6.3:

```bash  theme={null}
cd programs/your-program-name
cargo update --package arcium-client --precise 0.6.3
cargo update --package arcium-macros --precise 0.6.3
cargo update --package arcium-anchor --precise 0.6.3
```

Update your encrypted-ixs dependencies:

```bash  theme={null}
cd ../../encrypted-ixs
cargo update --package arcis --precise 0.6.3
```

<Warning>
  `arcis-imports` no longer exists in v0.6.3. You must migrate to the `arcis` crate (see section 7).
</Warning>

## 3. Update TypeScript Dependencies

<CodeGroup>
  ```bash npm theme={null}
  npm install @arcium-hq/client@0.6.3
  ```

  ```bash yarn theme={null}
  yarn add @arcium-hq/client@0.6.3
  ```

  ```bash pnpm theme={null}
  pnpm add @arcium-hq/client@0.6.3
  ```
</CodeGroup>

## 4. Rename SignerAccount to ArciumSignerAccount (Rust)

The `SignerAccount` type has been renamed to `ArciumSignerAccount`. Update all references in your program:

```rust  theme={null}
// Before v0.6
#[account(
    init_if_needed,
    payer = payer,
    space = 8 + 1,
    seeds = [b"SignerAccount"],
    bump,
    address = derive_sign_pda!(),
)]
pub sign_pda_account: Account<'info, SignerAccount>,
```

```rust  theme={null}
// v0.6.3
#[account(
    init_if_needed,
    payer = payer,
    space = 8 + 1,
    seeds = [b"ArciumSignerAccount"],
    bump,
    address = derive_sign_pda!(),
)]
pub sign_pda_account: Account<'info, ArciumSignerAccount>,
```

<Note>
  The seed in the `seeds` attribute must also be updated from `b"SignerAccount"` to `b"ArciumSignerAccount"`.
</Note>

## 5. Update PDA Seed in TypeScript

If you derive the signer PDA manually in your TypeScript code, update the seed:

```typescript  theme={null}
// Before v0.6
const signPda = PublicKey.findProgramAddressSync(
  [Buffer.from("SignerAccount")],
  program.programId
)[0];
```

```typescript  theme={null}
// v0.6.3
const signPda = PublicKey.findProgramAddressSync(
  [Buffer.from("ArciumSignerAccount")],
  program.programId
)[0];
```

## 6. (Optional) Configure Arcium.toml for Non-Localnet Testing

v0.6.3 adds the `--cluster` flag to run tests against devnet, mainnet, or custom clusters directly.

### Prerequisites

| Mode               | Requirements                                              |
| ------------------ | --------------------------------------------------------- |
| Localnet (default) | Docker running, ports available                           |
| Remote clusters    | Cluster offset in `Arcium.toml`, RPC URL in `Anchor.toml` |

### Configure Cluster Offsets

Add cluster configurations to your `Arcium.toml`:

```toml  theme={null}
[localnet]
nodes = 2
localnet_timeout_secs = 60
backends = ["Cerberus"]

# Cluster config for devnet testing
# Note: Cluster 123 is v0.5.4, cluster 456 is v0.6.3
[clusters.devnet]
offset = 456
```

### Run Tests

```bash  theme={null}
# Localnet (default) - starts Docker, validator, ARX nodes
arcium test

# Devnet - uses cluster config from Arcium.toml
arcium test --cluster devnet
```

### RPC Configuration

For non-localnet testing, configure your RPC endpoint in `Anchor.toml`:

```toml  theme={null}
[provider]
cluster = "devnet"
wallet = "~/.config/solana/id.json"
```

<Note>
  Non-localnet tests skip Docker, local validator, and ARX nodes entirely. The CLI reads the cluster offset from `Arcium.toml` and sets the `ARCIUM_CLUSTER_OFFSET` environment variable for your tests.
</Note>

<Warning>
  If you run `arcium test --cluster devnet` without configuring `[clusters.devnet]` in `Arcium.toml`, you'll see an error with instructions to add the configuration.
</Warning>

## 7. Migrate from arcis-imports to arcis

The `arcis-imports` crate no longer exists in v0.6.3. You must migrate to the `arcis` crate:

```toml  theme={null}
# Before v0.6 (Cargo.toml)
[dependencies]
arcis-imports = "0.5.1"
```

```toml  theme={null}
# v0.6.3 (Cargo.toml)
[dependencies]
arcis = "0.6.3"
blake3 = "=1.8.2"
```

<Note>
  Blake3 must be pinned to exactly 1.8.2. Newer versions use Rust edition 2024, which is incompatible with Anchor programs.
</Note>

In your circuit code, update the import:

```rust  theme={null}
// Before v0.6
use arcis_imports::*;
```

```rust  theme={null}
// v0.6.3
use arcis::*;
```

## 8. Add `mut` to clock\_account

The `clock_account` now requires the `mut` attribute in your account constraints:

```rust  theme={null}
// Before v0.6
#[account(
    address = ARCIUM_CLOCK_ACCOUNT_ADDRESS
)]
pub clock_account: Account<'info, ClockAccount>,
```

```rust  theme={null}
// v0.6.3
#[account(
    mut,
    address = ARCIUM_CLOCK_ACCOUNT_ADDRESS
)]
pub clock_account: Account<'info, ClockAccount>,
```

## 9. Verify Migration

After completing all steps, verify your migration:

```bash  theme={null}
# Build
arcium build

# Type check
cargo check --all

# Run tests
arcium test
```

## 10. Summary of Breaking Changes

| Change                 | Before v0.6                                    | v0.6.3                                         |
| ---------------------- | ---------------------------------------------- | ---------------------------------------------- |
| Program ID             | `BpaW2ZmCJnDwizWY8eM34JtVqp2kRgnmQcedSVc9USdP` | `Arcj82pX7HxYKLR92qvgZUAd7vGS1k4hQvAFcPATFdEQ` |
| Signer Account Type    | `SignerAccount`                                | `ArciumSignerAccount`                          |
| Signer PDA Seed        | `"SignerAccount"`                              | `"ArciumSignerAccount"`                        |
| Rust Dependencies      | `0.5.x`                                        | `0.6.3`                                        |
| TypeScript Client      | `@arcium-hq/client@0.5.x`                      | `@arcium-hq/client@0.6.3`                      |
| Arcis Crate            | `arcis-imports`                                | `arcis`                                        |
| blake3 (encrypted-ixs) | Not required                                   | `blake3 = "=1.8.2"`                            |
| clock\_account         | No `mut`                                       | Requires `mut`                                 |
> ## Documentation Index
> Fetch the complete documentation index at: https://docs.arcium.com/llms.txt
> Use this file to discover all available pages before exploring further.

# v0.5.x to v0.6.3

This release requires a **program redeploy** due to a change in the Arcium program ID. Follow this guide to migrate your MXE from v0.5.x to v0.6.3.

## 1. Redeploy Required

The Arcium program ID has changed. You must redeploy your MXE program to use v0.6.3.

| Version | Program ID                                     |
| ------- | ---------------------------------------------- |
| v0.5.x  | `BpaW2ZmCJnDwizWY8eM34JtVqp2kRgnmQcedSVc9USdP` |
| v0.6.3  | `Arcj82pX7HxYKLR92qvgZUAd7vGS1k4hQvAFcPATFdEQ` |

After updating dependencies and code (steps below), run:

```bash  theme={null}
arcium deploy --cluster-offset <your-offset> --recovery-set-size <size> --keypair-path <path> --rpc-url <url>
```

## 2. Update Rust Dependencies

Update your program dependencies to v0.6.3:

```bash  theme={null}
cd programs/your-program-name
cargo update --package arcium-client --precise 0.6.3
cargo update --package arcium-macros --precise 0.6.3
cargo update --package arcium-anchor --precise 0.6.3
```

Update your encrypted-ixs dependencies:

```bash  theme={null}
cd ../../encrypted-ixs
cargo update --package arcis --precise 0.6.3
```

<Warning>
  `arcis-imports` no longer exists in v0.6.3. You must migrate to the `arcis` crate (see section 7).
</Warning>

## 3. Update TypeScript Dependencies

<CodeGroup>
  ```bash npm theme={null}
  npm install @arcium-hq/client@0.6.3
  ```

  ```bash yarn theme={null}
  yarn add @arcium-hq/client@0.6.3
  ```

  ```bash pnpm theme={null}
  pnpm add @arcium-hq/client@0.6.3
  ```
</CodeGroup>

## 4. Rename SignerAccount to ArciumSignerAccount (Rust)

The `SignerAccount` type has been renamed to `ArciumSignerAccount`. Update all references in your program:

```rust  theme={null}
// Before v0.6
#[account(
    init_if_needed,
    payer = payer,
    space = 8 + 1,
    seeds = [b"SignerAccount"],
    bump,
    address = derive_sign_pda!(),
)]
pub sign_pda_account: Account<'info, SignerAccount>,
```

```rust  theme={null}
// v0.6.3
#[account(
    init_if_needed,
    payer = payer,
    space = 8 + 1,
    seeds = [b"ArciumSignerAccount"],
    bump,
    address = derive_sign_pda!(),
)]
pub sign_pda_account: Account<'info, ArciumSignerAccount>,
```

<Note>
  The seed in the `seeds` attribute must also be updated from `b"SignerAccount"` to `b"ArciumSignerAccount"`.
</Note>

## 5. Update PDA Seed in TypeScript

If you derive the signer PDA manually in your TypeScript code, update the seed:

```typescript  theme={null}
// Before v0.6
const signPda = PublicKey.findProgramAddressSync(
  [Buffer.from("SignerAccount")],
  program.programId
)[0];
```

```typescript  theme={null}
// v0.6.3
const signPda = PublicKey.findProgramAddressSync(
  [Buffer.from("ArciumSignerAccount")],
  program.programId
)[0];
```

## 6. (Optional) Configure Arcium.toml for Non-Localnet Testing

v0.6.3 adds the `--cluster` flag to run tests against devnet, mainnet, or custom clusters directly.

### Prerequisites

| Mode               | Requirements                                              |
| ------------------ | --------------------------------------------------------- |
| Localnet (default) | Docker running, ports available                           |
| Remote clusters    | Cluster offset in `Arcium.toml`, RPC URL in `Anchor.toml` |

### Configure Cluster Offsets

Add cluster configurations to your `Arcium.toml`:

```toml  theme={null}
[localnet]
nodes = 2
localnet_timeout_secs = 60
backends = ["Cerberus"]

# Cluster config for devnet testing
# Note: Cluster 123 is v0.5.4, cluster 456 is v0.6.3
[clusters.devnet]
offset = 456
```

### Run Tests

```bash  theme={null}
# Localnet (default) - starts Docker, validator, ARX nodes
arcium test

# Devnet - uses cluster config from Arcium.toml
arcium test --cluster devnet
```

### RPC Configuration

For non-localnet testing, configure your RPC endpoint in `Anchor.toml`:

```toml  theme={null}
[provider]
cluster = "devnet"
wallet = "~/.config/solana/id.json"
```

<Note>
  Non-localnet tests skip Docker, local validator, and ARX nodes entirely. The CLI reads the cluster offset from `Arcium.toml` and sets the `ARCIUM_CLUSTER_OFFSET` environment variable for your tests.
</Note>

<Warning>
  If you run `arcium test --cluster devnet` without configuring `[clusters.devnet]` in `Arcium.toml`, you'll see an error with instructions to add the configuration.
</Warning>

## 7. Migrate from arcis-imports to arcis

The `arcis-imports` crate no longer exists in v0.6.3. You must migrate to the `arcis` crate:

```toml  theme={null}
# Before v0.6 (Cargo.toml)
[dependencies]
arcis-imports = "0.5.1"
```

```toml  theme={null}
# v0.6.3 (Cargo.toml)
[dependencies]
arcis = "0.6.3"
blake3 = "=1.8.2"
```

<Note>
  Blake3 must be pinned to exactly 1.8.2. Newer versions use Rust edition 2024, which is incompatible with Anchor programs.
</Note>

In your circuit code, update the import:

```rust  theme={null}
// Before v0.6
use arcis_imports::*;
```

```rust  theme={null}
// v0.6.3
use arcis::*;
```

## 8. Add `mut` to clock\_account

The `clock_account` now requires the `mut` attribute in your account constraints:

```rust  theme={null}
// Before v0.6
#[account(
    address = ARCIUM_CLOCK_ACCOUNT_ADDRESS
)]
pub clock_account: Account<'info, ClockAccount>,
```

```rust  theme={null}
// v0.6.3
#[account(
    mut,
    address = ARCIUM_CLOCK_ACCOUNT_ADDRESS
)]
pub clock_account: Account<'info, ClockAccount>,
```

## 9. Verify Migration

After completing all steps, verify your migration:

```bash  theme={null}
# Build
arcium build

# Type check
cargo check --all

# Run tests
arcium test
```

## 10. Summary of Breaking Changes

| Change                 | Before v0.6                                    | v0.6.3                                         |
| ---------------------- | ---------------------------------------------- | ---------------------------------------------- |
| Program ID             | `BpaW2ZmCJnDwizWY8eM34JtVqp2kRgnmQcedSVc9USdP` | `Arcj82pX7HxYKLR92qvgZUAd7vGS1k4hQvAFcPATFdEQ` |
| Signer Account Type    | `SignerAccount`                                | `ArciumSignerAccount`                          |
| Signer PDA Seed        | `"SignerAccount"`                              | `"ArciumSignerAccount"`                        |
| Rust Dependencies      | `0.5.x`                                        | `0.6.3`                                        |
| TypeScript Client      | `@arcium-hq/client@0.5.x`                      | `@arcium-hq/client@0.6.3`                      |
| Arcis Crate            | `arcis-imports`                                | `arcis`                                        |
| blake3 (encrypted-ixs) | Not required                                   | `blake3 = "=1.8.2"`                            |
| clock\_account         | No `mut`                                       | Requires `mut`                                 |
> ## Documentation Index
> Fetch the complete documentation index at: https://docs.arcium.com/llms.txt
> Use this file to discover all available pages before exploring further.

# v0.3.x to v0.4.0

## 1. Update Rust toolchain and Solana CLI

Arcium v0.4.0 requires Rust 1.89.0 and Solana CLI 2.3.0. It also uses a new `rust-toolchain.toml` format and no longer requires Xargo.

### Update Rust Toolchain

Replace your existing `rust-toolchain` file with the new TOML format:

```bash  theme={null}
# Remove old rust-toolchain file if it exists
rm rust-toolchain 2>/dev/null || true

# Create new rust-toolchain.toml
cat > rust-toolchain.toml << 'EOF'
[toolchain]
channel = "1.89.0"
components = ["rustfmt","clippy"]
profile = "minimal"
EOF
```

### Remove Xargo Configuration

Xargo is no longer needed in v0.4.0. Remove the `Xargo.toml` file from each program directory:

```bash  theme={null}
# Remove Xargo.toml from all program directories
rm programs/*/Xargo.toml 2>/dev/null || true
```

### Update Solana CLI

Ensure you have Solana CLI 2.3.0 or later:

```bash  theme={null}
# Check current version
solana --version

# Update to 2.3.0 if needed
sh -c "$(curl -sSfL https://release.solana.com/v2.3.0/install)"
```

## 2. Remove Cargo patch

The `proc-macro2` patch is no longer required in v0.4.0. Remove it from your workspace `Cargo.toml`:

```toml  theme={null}
# Before v0.4.0
[workspace]
members = ["programs/*", "encrypted-ixs"]
resolver = "2"

[profile.release]
overflow-checks = true
lto = "fat"
codegen-units = 1
[profile.release.build-override]
opt-level = 3
incremental = false
codegen-units = 1

[patch.crates-io]
proc-macro2 = { git = 'https://github.com/arcium-hq/proc-macro2.git' }
```

```toml  theme={null}
# v0.4.0
[workspace]
members = ["programs/*", "encrypted-ixs"]
resolver = "2"

[profile.release]
overflow-checks = true
lto = "fat"
codegen-units = 1
[profile.release.build-override]
opt-level = 3
incremental = false
codegen-units = 1

# No [patch.crates-io] section needed
```

## 3. Update Arcium Rust dependencies

Update your dependencies to v0.4.0 and Anchor to 0.32.1:

```bash  theme={null}
# Update program dependencies
cd programs/your-program-name
cargo update --package arcium-client --precise 0.4.0
cargo update --package arcium-macros --precise 0.4.0
cargo update --package arcium-anchor --precise 0.4.0
cargo update --package anchor-lang --precise 0.32.1

# Update encrypted-ixs dependencies
cd ../../encrypted-ixs
cargo update --package arcis-imports --precise 0.4.0
```

## 4. Update Arcium TS dependencies

Update TypeScript dependencies to v0.4.0 and Anchor to 0.32.1:

<CodeGroup>
  ```bash npm theme={null}
  npm install @arcium-hq/client@0.4.0 @coral-xyz/anchor@0.32.1
  ```

  ```bash yarn theme={null}
  yarn add @arcium-hq/client@0.4.0 @coral-xyz/anchor@0.32.1
  ```

  ```bash pnpm theme={null}
  pnpm add @arcium-hq/client@0.4.0 @coral-xyz/anchor@0.32.1
  ```
</CodeGroup>

## 5. Update idl-build feature in program Cargo.toml

Add `arcium-anchor/idl-build` to the `idl-build` feature in your program's `Cargo.toml`:

```toml  theme={null}
# Before v0.4.0
[features]
default = []
cpi = ["no-entrypoint"]
no-entrypoint = []
no-idl = []
no-log-ix-name = []
idl-build = ["anchor-lang/idl-build"]
```

```toml  theme={null}
# v0.4.0
[features]
default = []
cpi = ["no-entrypoint"]
no-entrypoint = []
no-idl = []
no-log-ix-name = []
idl-build = ["anchor-lang/idl-build", "arcium-anchor/idl-build"]
```

## 6. (Optional) Add new Cargo.toml features and lints

Arcium v0.4.0 introduces new optional features and lints for improved developer experience. While not required, these are recommended additions to your program's `Cargo.toml`:

### New Optional Features

```toml  theme={null}
[features]
default = []
cpi = ["no-entrypoint"]
no-entrypoint = []
no-idl = []
no-log-ix-name = []
idl-build = ["anchor-lang/idl-build", "arcium-anchor/idl-build"]
# New optional features below
anchor-debug = []
custom-heap = []
custom-panic = []
```

### New Lints Section

Add the following lints section to help catch configuration issues:

```toml  theme={null}
[lints.rust]
unexpected_cfgs = { level = "warn", check-cfg = ['cfg(target_os, values("solana"))'] }
```

These additions help with debugging and ensure proper configuration for Solana programs.

## 7. Update init\_comp\_def call signature

The `init_comp_def` function signature has changed - the first boolean parameter has been removed:

```rust  theme={null}
// Before v0.4.0
pub fn init_flip_comp_def(ctx: Context<InitFlipCompDef>) -> Result<()> {
    init_comp_def(ctx.accounts, true, 0, None, None)?;
    Ok(())
}
```

```rust  theme={null}
// v0.4.0
pub fn init_flip_comp_def(ctx: Context<InitFlipCompDef>) -> Result<()> {
    init_comp_def(ctx.accounts, 0, None, None)?;
    Ok(())
}
```

## 8. Update queue\_computation call signature

The `queue_computation` function now requires a 6th parameter `num_callback_txs` to support multi-transaction callbacks:

```rust  theme={null}
// Before v0.4.0
queue_computation(
    ctx.accounts,
    computation_offset,
    args,
    None,
    vec![FlipCallback::callback_ix(&[])],
)?;
```

```rust  theme={null}
// v0.4.0
queue_computation(
    ctx.accounts,
    computation_offset,
    args,
    None,
    vec![FlipCallback::callback_ix(&[])],
    1, // num_callback_txs: number of transactions needed for callback
)?;
```

The `num_callback_txs` parameter specifies how many transactions are needed to process the callback. For most simple computations, this will be `1`. Larger computations with extensive callback data may require multiple transactions.

## 9. Update derive\_cluster\_pda! macro

The `derive_cluster_pda!` macro now requires an error code as the second parameter:

```rust  theme={null}
// Before v0.4.0
#[account(
    mut,
    address = derive_cluster_pda!(mxe_account)
)]
pub cluster_account: Account<'info, Cluster>,
```

```rust  theme={null}
// v0.4.0
#[account(
    mut,
    address = derive_cluster_pda!(mxe_account, ErrorCode::ClusterNotSet)
)]
pub cluster_account: Account<'info, Cluster>,
```

Make sure you have the corresponding error code defined in your program:

```rust  theme={null}
#[error_code]
pub enum ErrorCode {
    #[msg("The computation was aborted")]
    AbortedComputation,
    #[msg("Cluster not set")]
    ClusterNotSet,
}
```

## 10. Verify Migration

After completing all migration steps, verify that everything works correctly:

### Build Test

```bash  theme={null}
# From your workspace root
arcium build
```

### Type Checking

```bash  theme={null}
# Ensure all new types compile correctly
cargo check --all
```

### Test Your Changes

```bash  theme={null}
# Run your existing tests to ensure functionality is preserved
arcium test
```

## Complete Example

Here's a complete before/after example of a typical computation function:

### Before v0.4.0:

```rust  theme={null}
// rust-toolchain file (plain text)
1.88.0

// Cargo.toml (workspace)
[workspace]
members = ["programs/*", "encrypted-ixs"]
resolver = "2"

[patch.crates-io]
proc-macro2 = { git = 'https://github.com/arcium-hq/proc-macro2.git' }

// programs/coinflip/Cargo.toml
[dependencies]
anchor-lang = { version = "0.31.1", features = ["init-if-needed"] }
arcium-client = { version = "0.3.0", default-features = false }
arcium-macros = { version = "0.3.0" }
arcium-anchor = { version = "0.3.0" }

[features]
idl-build = ["anchor-lang/idl-build"]

// programs/coinflip/src/lib.rs
pub fn init_flip_comp_def(ctx: Context<InitFlipCompDef>) -> Result<()> {
    init_comp_def(ctx.accounts, true, 0, None, None)?;
    Ok(())
}

pub fn flip(
    ctx: Context<Flip>,
    computation_offset: u64,
    user_choice: [u8; 32],
    pub_key: [u8; 32],
    nonce: u128,
) -> Result<()> {
    let args = vec![
        Argument::ArcisPubkey(pub_key),
        Argument::PlaintextU128(nonce),
        Argument::EncryptedU8(user_choice),
    ];

    ctx.accounts.sign_pda_account.bump = ctx.bumps.sign_pda_account;

    queue_computation(
        ctx.accounts,
        computation_offset,
        args,
        None,
        vec![FlipCallback::callback_ix(&[])],
    )?;

    Ok(())
}

#[queue_computation_accounts("flip", payer)]
#[derive(Accounts)]
#[instruction(computation_offset: u64)]
pub struct Flip<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        init_if_needed,
        space = 9,
        payer = payer,
        seeds = [&SIGN_PDA_SEED],
        bump,
        address = derive_sign_pda!(),
    )]
    pub sign_pda_account: Account<'info, SignerAccount>,
    #[account(
        address = derive_mxe_pda!()
    )]
    pub mxe_account: Account<'info, MXEAccount>,
    #[account(
        mut,
        address = derive_cluster_pda!(mxe_account)
    )]
    pub cluster_account: Account<'info, Cluster>,
    // ... other accounts
}
```

### v0.4.0:

```rust  theme={null}
// rust-toolchain.toml (TOML format)
[toolchain]
channel = "1.89.0"
components = ["rustfmt","clippy"]
profile = "minimal"

// Cargo.toml (workspace)
[workspace]
members = ["programs/*", "encrypted-ixs"]
resolver = "2"

// No [patch.crates-io] section

// programs/coinflip/Cargo.toml
[dependencies]
anchor-lang = { version = "0.32.1", features = ["init-if-needed"] }
arcium-client = { version = "0.4.0", default-features = false }
arcium-macros = { version = "0.4.0" }
arcium-anchor = { version = "0.4.0" }

[features]
idl-build = ["anchor-lang/idl-build", "arcium-anchor/idl-build"]
# Optional features
anchor-debug = []
custom-heap = []
custom-panic = []

[lints.rust]
unexpected_cfgs = { level = "warn", check-cfg = ['cfg(target_os, values("solana"))'] }

// programs/coinflip/src/lib.rs
pub fn init_flip_comp_def(ctx: Context<InitFlipCompDef>) -> Result<()> {
    init_comp_def(ctx.accounts, 0, None, None)?;  // Removed first boolean parameter
    Ok(())
}

pub fn flip(
    ctx: Context<Flip>,
    computation_offset: u64,
    user_choice: [u8; 32],
    pub_key: [u8; 32],
    nonce: u128,
) -> Result<()> {
    let args = vec![
        Argument::ArcisPubkey(pub_key),
        Argument::PlaintextU128(nonce),
        Argument::EncryptedU8(user_choice),
    ];

    ctx.accounts.sign_pda_account.bump = ctx.bumps.sign_pda_account;

    queue_computation(
        ctx.accounts,
        computation_offset,
        args,
        None,
        vec![FlipCallback::callback_ix(&[])],
        1,  // Added num_callback_txs parameter
    )?;

    Ok(())
}

#[queue_computation_accounts("flip", payer)]
#[derive(Accounts)]
#[instruction(computation_offset: u64)]
pub struct Flip<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        init_if_needed,
        space = 9,
        payer = payer,
        seeds = [&SIGN_PDA_SEED],
        bump,
        address = derive_sign_pda!(),
    )]
    pub sign_pda_account: Account<'info, SignerAccount>,
    #[account(
        address = derive_mxe_pda!()
    )]
    pub mxe_account: Account<'info, MXEAccount>,
    #[account(
        mut,
        address = derive_cluster_pda!(mxe_account, ErrorCode::ClusterNotSet)  // Added error code parameter
    )]
    pub cluster_account: Account<'info, Cluster>,
    // ... other accounts
}

#[error_code]
pub enum ErrorCode {
    #[msg("The computation was aborted")]
    AbortedComputation,
    #[msg("Cluster not set")]
    ClusterNotSet,  // Required for derive_cluster_pda! macro
}
```

That's it! Your program should now be compatible with Arcium tooling v0.4.0.
> ## Documentation Index
> Fetch the complete documentation index at: https://docs.arcium.com/llms.txt
> Use this file to discover all available pages before exploring further.

# v0.3.x to v0.4.0

## 1. Update Rust toolchain and Solana CLI

Arcium v0.4.0 requires Rust 1.89.0 and Solana CLI 2.3.0. It also uses a new `rust-toolchain.toml` format and no longer requires Xargo.

### Update Rust Toolchain

Replace your existing `rust-toolchain` file with the new TOML format:

```bash  theme={null}
# Remove old rust-toolchain file if it exists
rm rust-toolchain 2>/dev/null || true

# Create new rust-toolchain.toml
cat > rust-toolchain.toml << 'EOF'
[toolchain]
channel = "1.89.0"
components = ["rustfmt","clippy"]
profile = "minimal"
EOF
```

### Remove Xargo Configuration

Xargo is no longer needed in v0.4.0. Remove the `Xargo.toml` file from each program directory:

```bash  theme={null}
# Remove Xargo.toml from all program directories
rm programs/*/Xargo.toml 2>/dev/null || true
```

### Update Solana CLI

Ensure you have Solana CLI 2.3.0 or later:

```bash  theme={null}
# Check current version
solana --version

# Update to 2.3.0 if needed
sh -c "$(curl -sSfL https://release.solana.com/v2.3.0/install)"
```

## 2. Remove Cargo patch

The `proc-macro2` patch is no longer required in v0.4.0. Remove it from your workspace `Cargo.toml`:

```toml  theme={null}
# Before v0.4.0
[workspace]
members = ["programs/*", "encrypted-ixs"]
resolver = "2"

[profile.release]
overflow-checks = true
lto = "fat"
codegen-units = 1
[profile.release.build-override]
opt-level = 3
incremental = false
codegen-units = 1

[patch.crates-io]
proc-macro2 = { git = 'https://github.com/arcium-hq/proc-macro2.git' }
```

```toml  theme={null}
# v0.4.0
[workspace]
members = ["programs/*", "encrypted-ixs"]
resolver = "2"

[profile.release]
overflow-checks = true
lto = "fat"
codegen-units = 1
[profile.release.build-override]
opt-level = 3
incremental = false
codegen-units = 1

# No [patch.crates-io] section needed
```

## 3. Update Arcium Rust dependencies

Update your dependencies to v0.4.0 and Anchor to 0.32.1:

```bash  theme={null}
# Update program dependencies
cd programs/your-program-name
cargo update --package arcium-client --precise 0.4.0
cargo update --package arcium-macros --precise 0.4.0
cargo update --package arcium-anchor --precise 0.4.0
cargo update --package anchor-lang --precise 0.32.1

# Update encrypted-ixs dependencies
cd ../../encrypted-ixs
cargo update --package arcis-imports --precise 0.4.0
```

## 4. Update Arcium TS dependencies

Update TypeScript dependencies to v0.4.0 and Anchor to 0.32.1:

<CodeGroup>
  ```bash npm theme={null}
  npm install @arcium-hq/client@0.4.0 @coral-xyz/anchor@0.32.1
  ```

  ```bash yarn theme={null}
  yarn add @arcium-hq/client@0.4.0 @coral-xyz/anchor@0.32.1
  ```

  ```bash pnpm theme={null}
  pnpm add @arcium-hq/client@0.4.0 @coral-xyz/anchor@0.32.1
  ```
</CodeGroup>

## 5. Update idl-build feature in program Cargo.toml

Add `arcium-anchor/idl-build` to the `idl-build` feature in your program's `Cargo.toml`:

```toml  theme={null}
# Before v0.4.0
[features]
default = []
cpi = ["no-entrypoint"]
no-entrypoint = []
no-idl = []
no-log-ix-name = []
idl-build = ["anchor-lang/idl-build"]
```

```toml  theme={null}
# v0.4.0
[features]
default = []
cpi = ["no-entrypoint"]
no-entrypoint = []
no-idl = []
no-log-ix-name = []
idl-build = ["anchor-lang/idl-build", "arcium-anchor/idl-build"]
```

## 6. (Optional) Add new Cargo.toml features and lints

Arcium v0.4.0 introduces new optional features and lints for improved developer experience. While not required, these are recommended additions to your program's `Cargo.toml`:

### New Optional Features

```toml  theme={null}
[features]
default = []
cpi = ["no-entrypoint"]
no-entrypoint = []
no-idl = []
no-log-ix-name = []
idl-build = ["anchor-lang/idl-build", "arcium-anchor/idl-build"]
# New optional features below
anchor-debug = []
custom-heap = []
custom-panic = []
```

### New Lints Section

Add the following lints section to help catch configuration issues:

```toml  theme={null}
[lints.rust]
unexpected_cfgs = { level = "warn", check-cfg = ['cfg(target_os, values("solana"))'] }
```

These additions help with debugging and ensure proper configuration for Solana programs.

## 7. Update init\_comp\_def call signature

The `init_comp_def` function signature has changed - the first boolean parameter has been removed:

```rust  theme={null}
// Before v0.4.0
pub fn init_flip_comp_def(ctx: Context<InitFlipCompDef>) -> Result<()> {
    init_comp_def(ctx.accounts, true, 0, None, None)?;
    Ok(())
}
```

```rust  theme={null}
// v0.4.0
pub fn init_flip_comp_def(ctx: Context<InitFlipCompDef>) -> Result<()> {
    init_comp_def(ctx.accounts, 0, None, None)?;
    Ok(())
}
```

## 8. Update queue\_computation call signature

The `queue_computation` function now requires a 6th parameter `num_callback_txs` to support multi-transaction callbacks:

```rust  theme={null}
// Before v0.4.0
queue_computation(
    ctx.accounts,
    computation_offset,
    args,
    None,
    vec![FlipCallback::callback_ix(&[])],
)?;
```

```rust  theme={null}
// v0.4.0
queue_computation(
    ctx.accounts,
    computation_offset,
    args,
    None,
    vec![FlipCallback::callback_ix(&[])],
    1, // num_callback_txs: number of transactions needed for callback
)?;
```

The `num_callback_txs` parameter specifies how many transactions are needed to process the callback. For most simple computations, this will be `1`. Larger computations with extensive callback data may require multiple transactions.

## 9. Update derive\_cluster\_pda! macro

The `derive_cluster_pda!` macro now requires an error code as the second parameter:

```rust  theme={null}
// Before v0.4.0
#[account(
    mut,
    address = derive_cluster_pda!(mxe_account)
)]
pub cluster_account: Account<'info, Cluster>,
```

```rust  theme={null}
// v0.4.0
#[account(
    mut,
    address = derive_cluster_pda!(mxe_account, ErrorCode::ClusterNotSet)
)]
pub cluster_account: Account<'info, Cluster>,
```

Make sure you have the corresponding error code defined in your program:

```rust  theme={null}
#[error_code]
pub enum ErrorCode {
    #[msg("The computation was aborted")]
    AbortedComputation,
    #[msg("Cluster not set")]
    ClusterNotSet,
}
```

## 10. Verify Migration

After completing all migration steps, verify that everything works correctly:

### Build Test

```bash  theme={null}
# From your workspace root
arcium build
```

### Type Checking

```bash  theme={null}
# Ensure all new types compile correctly
cargo check --all
```

### Test Your Changes

```bash  theme={null}
# Run your existing tests to ensure functionality is preserved
arcium test
```

## Complete Example

Here's a complete before/after example of a typical computation function:

### Before v0.4.0:

```rust  theme={null}
// rust-toolchain file (plain text)
1.88.0

// Cargo.toml (workspace)
[workspace]
members = ["programs/*", "encrypted-ixs"]
resolver = "2"

[patch.crates-io]
proc-macro2 = { git = 'https://github.com/arcium-hq/proc-macro2.git' }

// programs/coinflip/Cargo.toml
[dependencies]
anchor-lang = { version = "0.31.1", features = ["init-if-needed"] }
arcium-client = { version = "0.3.0", default-features = false }
arcium-macros = { version = "0.3.0" }
arcium-anchor = { version = "0.3.0" }

[features]
idl-build = ["anchor-lang/idl-build"]

// programs/coinflip/src/lib.rs
pub fn init_flip_comp_def(ctx: Context<InitFlipCompDef>) -> Result<()> {
    init_comp_def(ctx.accounts, true, 0, None, None)?;
    Ok(())
}

pub fn flip(
    ctx: Context<Flip>,
    computation_offset: u64,
    user_choice: [u8; 32],
    pub_key: [u8; 32],
    nonce: u128,
) -> Result<()> {
    let args = vec![
        Argument::ArcisPubkey(pub_key),
        Argument::PlaintextU128(nonce),
        Argument::EncryptedU8(user_choice),
    ];

    ctx.accounts.sign_pda_account.bump = ctx.bumps.sign_pda_account;

    queue_computation(
        ctx.accounts,
        computation_offset,
        args,
        None,
        vec![FlipCallback::callback_ix(&[])],
    )?;

    Ok(())
}

#[queue_computation_accounts("flip", payer)]
#[derive(Accounts)]
#[instruction(computation_offset: u64)]
pub struct Flip<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        init_if_needed,
        space = 9,
        payer = payer,
        seeds = [&SIGN_PDA_SEED],
        bump,
        address = derive_sign_pda!(),
    )]
    pub sign_pda_account: Account<'info, SignerAccount>,
    #[account(
        address = derive_mxe_pda!()
    )]
    pub mxe_account: Account<'info, MXEAccount>,
    #[account(
        mut,
        address = derive_cluster_pda!(mxe_account)
    )]
    pub cluster_account: Account<'info, Cluster>,
    // ... other accounts
}
```

### v0.4.0:

```rust  theme={null}
// rust-toolchain.toml (TOML format)
[toolchain]
channel = "1.89.0"
components = ["rustfmt","clippy"]
profile = "minimal"

// Cargo.toml (workspace)
[workspace]
members = ["programs/*", "encrypted-ixs"]
resolver = "2"

// No [patch.crates-io] section

// programs/coinflip/Cargo.toml
[dependencies]
anchor-lang = { version = "0.32.1", features = ["init-if-needed"] }
arcium-client = { version = "0.4.0", default-features = false }
arcium-macros = { version = "0.4.0" }
arcium-anchor = { version = "0.4.0" }

[features]
idl-build = ["anchor-lang/idl-build", "arcium-anchor/idl-build"]
# Optional features
anchor-debug = []
custom-heap = []
custom-panic = []

[lints.rust]
unexpected_cfgs = { level = "warn", check-cfg = ['cfg(target_os, values("solana"))'] }

// programs/coinflip/src/lib.rs
pub fn init_flip_comp_def(ctx: Context<InitFlipCompDef>) -> Result<()> {
    init_comp_def(ctx.accounts, 0, None, None)?;  // Removed first boolean parameter
    Ok(())
}

pub fn flip(
    ctx: Context<Flip>,
    computation_offset: u64,
    user_choice: [u8; 32],
    pub_key: [u8; 32],
    nonce: u128,
) -> Result<()> {
    let args = vec![
        Argument::ArcisPubkey(pub_key),
        Argument::PlaintextU128(nonce),
        Argument::EncryptedU8(user_choice),
    ];

    ctx.accounts.sign_pda_account.bump = ctx.bumps.sign_pda_account;

    queue_computation(
        ctx.accounts,
        computation_offset,
        args,
        None,
        vec![FlipCallback::callback_ix(&[])],
        1,  // Added num_callback_txs parameter
    )?;

    Ok(())
}

#[queue_computation_accounts("flip", payer)]
#[derive(Accounts)]
#[instruction(computation_offset: u64)]
pub struct Flip<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        init_if_needed,
        space = 9,
        payer = payer,
        seeds = [&SIGN_PDA_SEED],
        bump,
        address = derive_sign_pda!(),
    )]
    pub sign_pda_account: Account<'info, SignerAccount>,
    #[account(
        address = derive_mxe_pda!()
    )]
    pub mxe_account: Account<'info, MXEAccount>,
    #[account(
        mut,
        address = derive_cluster_pda!(mxe_account, ErrorCode::ClusterNotSet)  // Added error code parameter
    )]
    pub cluster_account: Account<'info, Cluster>,
    // ... other accounts
}

#[error_code]
pub enum ErrorCode {
    #[msg("The computation was aborted")]
    AbortedComputation,
    #[msg("Cluster not set")]
    ClusterNotSet,  // Required for derive_cluster_pda! macro
}
```

That's it! Your program should now be compatible with Arcium tooling v0.4.0.
> ## Documentation Index
> Fetch the complete documentation index at: https://docs.arcium.com/llms.txt
> Use this file to discover all available pages before exploring further.

# v0.3.x to v0.4.0

## 1. Update Rust toolchain and Solana CLI

Arcium v0.4.0 requires Rust 1.89.0 and Solana CLI 2.3.0. It also uses a new `rust-toolchain.toml` format and no longer requires Xargo.

### Update Rust Toolchain

Replace your existing `rust-toolchain` file with the new TOML format:

```bash  theme={null}
# Remove old rust-toolchain file if it exists
rm rust-toolchain 2>/dev/null || true

# Create new rust-toolchain.toml
cat > rust-toolchain.toml << 'EOF'
[toolchain]
channel = "1.89.0"
components = ["rustfmt","clippy"]
profile = "minimal"
EOF
```

### Remove Xargo Configuration

Xargo is no longer needed in v0.4.0. Remove the `Xargo.toml` file from each program directory:

```bash  theme={null}
# Remove Xargo.toml from all program directories
rm programs/*/Xargo.toml 2>/dev/null || true
```

### Update Solana CLI

Ensure you have Solana CLI 2.3.0 or later:

```bash  theme={null}
# Check current version
solana --version

# Update to 2.3.0 if needed
sh -c "$(curl -sSfL https://release.solana.com/v2.3.0/install)"
```

## 2. Remove Cargo patch

The `proc-macro2` patch is no longer required in v0.4.0. Remove it from your workspace `Cargo.toml`:

```toml  theme={null}
# Before v0.4.0
[workspace]
members = ["programs/*", "encrypted-ixs"]
resolver = "2"

[profile.release]
overflow-checks = true
lto = "fat"
codegen-units = 1
[profile.release.build-override]
opt-level = 3
incremental = false
codegen-units = 1

[patch.crates-io]
proc-macro2 = { git = 'https://github.com/arcium-hq/proc-macro2.git' }
```

```toml  theme={null}
# v0.4.0
[workspace]
members = ["programs/*", "encrypted-ixs"]
resolver = "2"

[profile.release]
overflow-checks = true
lto = "fat"
codegen-units = 1
[profile.release.build-override]
opt-level = 3
incremental = false
codegen-units = 1

# No [patch.crates-io] section needed
```

## 3. Update Arcium Rust dependencies

Update your dependencies to v0.4.0 and Anchor to 0.32.1:

```bash  theme={null}
# Update program dependencies
cd programs/your-program-name
cargo update --package arcium-client --precise 0.4.0
cargo update --package arcium-macros --precise 0.4.0
cargo update --package arcium-anchor --precise 0.4.0
cargo update --package anchor-lang --precise 0.32.1

# Update encrypted-ixs dependencies
cd ../../encrypted-ixs
cargo update --package arcis-imports --precise 0.4.0
```

## 4. Update Arcium TS dependencies

Update TypeScript dependencies to v0.4.0 and Anchor to 0.32.1:

<CodeGroup>
  ```bash npm theme={null}
  npm install @arcium-hq/client@0.4.0 @coral-xyz/anchor@0.32.1
  ```

  ```bash yarn theme={null}
  yarn add @arcium-hq/client@0.4.0 @coral-xyz/anchor@0.32.1
  ```

  ```bash pnpm theme={null}
  pnpm add @arcium-hq/client@0.4.0 @coral-xyz/anchor@0.32.1
  ```
</CodeGroup>

## 5. Update idl-build feature in program Cargo.toml

Add `arcium-anchor/idl-build` to the `idl-build` feature in your program's `Cargo.toml`:

```toml  theme={null}
# Before v0.4.0
[features]
default = []
cpi = ["no-entrypoint"]
no-entrypoint = []
no-idl = []
no-log-ix-name = []
idl-build = ["anchor-lang/idl-build"]
```

```toml  theme={null}
# v0.4.0
[features]
default = []
cpi = ["no-entrypoint"]
no-entrypoint = []
no-idl = []
no-log-ix-name = []
idl-build = ["anchor-lang/idl-build", "arcium-anchor/idl-build"]
```

## 6. (Optional) Add new Cargo.toml features and lints

Arcium v0.4.0 introduces new optional features and lints for improved developer experience. While not required, these are recommended additions to your program's `Cargo.toml`:

### New Optional Features

```toml  theme={null}
[features]
default = []
cpi = ["no-entrypoint"]
no-entrypoint = []
no-idl = []
no-log-ix-name = []
idl-build = ["anchor-lang/idl-build", "arcium-anchor/idl-build"]
# New optional features below
anchor-debug = []
custom-heap = []
custom-panic = []
```

### New Lints Section

Add the following lints section to help catch configuration issues:

```toml  theme={null}
[lints.rust]
unexpected_cfgs = { level = "warn", check-cfg = ['cfg(target_os, values("solana"))'] }
```

These additions help with debugging and ensure proper configuration for Solana programs.

## 7. Update init\_comp\_def call signature

The `init_comp_def` function signature has changed - the first boolean parameter has been removed:

```rust  theme={null}
// Before v0.4.0
pub fn init_flip_comp_def(ctx: Context<InitFlipCompDef>) -> Result<()> {
    init_comp_def(ctx.accounts, true, 0, None, None)?;
    Ok(())
}
```

```rust  theme={null}
// v0.4.0
pub fn init_flip_comp_def(ctx: Context<InitFlipCompDef>) -> Result<()> {
    init_comp_def(ctx.accounts, 0, None, None)?;
    Ok(())
}
```

## 8. Update queue\_computation call signature

The `queue_computation` function now requires a 6th parameter `num_callback_txs` to support multi-transaction callbacks:

```rust  theme={null}
// Before v0.4.0
queue_computation(
    ctx.accounts,
    computation_offset,
    args,
    None,
    vec![FlipCallback::callback_ix(&[])],
)?;
```

```rust  theme={null}
// v0.4.0
queue_computation(
    ctx.accounts,
    computation_offset,
    args,
    None,
    vec![FlipCallback::callback_ix(&[])],
    1, // num_callback_txs: number of transactions needed for callback
)?;
```

The `num_callback_txs` parameter specifies how many transactions are needed to process the callback. For most simple computations, this will be `1`. Larger computations with extensive callback data may require multiple transactions.

## 9. Update derive\_cluster\_pda! macro

The `derive_cluster_pda!` macro now requires an error code as the second parameter:

```rust  theme={null}
// Before v0.4.0
#[account(
    mut,
    address = derive_cluster_pda!(mxe_account)
)]
pub cluster_account: Account<'info, Cluster>,
```

```rust  theme={null}
// v0.4.0
#[account(
    mut,
    address = derive_cluster_pda!(mxe_account, ErrorCode::ClusterNotSet)
)]
pub cluster_account: Account<'info, Cluster>,
```

Make sure you have the corresponding error code defined in your program:

```rust  theme={null}
#[error_code]
pub enum ErrorCode {
    #[msg("The computation was aborted")]
    AbortedComputation,
    #[msg("Cluster not set")]
    ClusterNotSet,
}
```

## 10. Verify Migration

After completing all migration steps, verify that everything works correctly:

### Build Test

```bash  theme={null}
# From your workspace root
arcium build
```

### Type Checking

```bash  theme={null}
# Ensure all new types compile correctly
cargo check --all
```

### Test Your Changes

```bash  theme={null}
# Run your existing tests to ensure functionality is preserved
arcium test
```

## Complete Example

Here's a complete before/after example of a typical computation function:

### Before v0.4.0:

```rust  theme={null}
// rust-toolchain file (plain text)
1.88.0

// Cargo.toml (workspace)
[workspace]
members = ["programs/*", "encrypted-ixs"]
resolver = "2"

[patch.crates-io]
proc-macro2 = { git = 'https://github.com/arcium-hq/proc-macro2.git' }

// programs/coinflip/Cargo.toml
[dependencies]
anchor-lang = { version = "0.31.1", features = ["init-if-needed"] }
arcium-client = { version = "0.3.0", default-features = false }
arcium-macros = { version = "0.3.0" }
arcium-anchor = { version = "0.3.0" }

[features]
idl-build = ["anchor-lang/idl-build"]

// programs/coinflip/src/lib.rs
pub fn init_flip_comp_def(ctx: Context<InitFlipCompDef>) -> Result<()> {
    init_comp_def(ctx.accounts, true, 0, None, None)?;
    Ok(())
}

pub fn flip(
    ctx: Context<Flip>,
    computation_offset: u64,
    user_choice: [u8; 32],
    pub_key: [u8; 32],
    nonce: u128,
) -> Result<()> {
    let args = vec![
        Argument::ArcisPubkey(pub_key),
        Argument::PlaintextU128(nonce),
        Argument::EncryptedU8(user_choice),
    ];

    ctx.accounts.sign_pda_account.bump = ctx.bumps.sign_pda_account;

    queue_computation(
        ctx.accounts,
        computation_offset,
        args,
        None,
        vec![FlipCallback::callback_ix(&[])],
    )?;

    Ok(())
}

#[queue_computation_accounts("flip", payer)]
#[derive(Accounts)]
#[instruction(computation_offset: u64)]
pub struct Flip<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        init_if_needed,
        space = 9,
        payer = payer,
        seeds = [&SIGN_PDA_SEED],
        bump,
        address = derive_sign_pda!(),
    )]
    pub sign_pda_account: Account<'info, SignerAccount>,
    #[account(
        address = derive_mxe_pda!()
    )]
    pub mxe_account: Account<'info, MXEAccount>,
    #[account(
        mut,
        address = derive_cluster_pda!(mxe_account)
    )]
    pub cluster_account: Account<'info, Cluster>,
    // ... other accounts
}
```

### v0.4.0:

```rust  theme={null}
// rust-toolchain.toml (TOML format)
[toolchain]
channel = "1.89.0"
components = ["rustfmt","clippy"]
profile = "minimal"

// Cargo.toml (workspace)
[workspace]
members = ["programs/*", "encrypted-ixs"]
resolver = "2"

// No [patch.crates-io] section

// programs/coinflip/Cargo.toml
[dependencies]
anchor-lang = { version = "0.32.1", features = ["init-if-needed"] }
arcium-client = { version = "0.4.0", default-features = false }
arcium-macros = { version = "0.4.0" }
arcium-anchor = { version = "0.4.0" }

[features]
idl-build = ["anchor-lang/idl-build", "arcium-anchor/idl-build"]
# Optional features
anchor-debug = []
custom-heap = []
custom-panic = []

[lints.rust]
unexpected_cfgs = { level = "warn", check-cfg = ['cfg(target_os, values("solana"))'] }

// programs/coinflip/src/lib.rs
pub fn init_flip_comp_def(ctx: Context<InitFlipCompDef>) -> Result<()> {
    init_comp_def(ctx.accounts, 0, None, None)?;  // Removed first boolean parameter
    Ok(())
}

pub fn flip(
    ctx: Context<Flip>,
    computation_offset: u64,
    user_choice: [u8; 32],
    pub_key: [u8; 32],
    nonce: u128,
) -> Result<()> {
    let args = vec![
        Argument::ArcisPubkey(pub_key),
        Argument::PlaintextU128(nonce),
        Argument::EncryptedU8(user_choice),
    ];

    ctx.accounts.sign_pda_account.bump = ctx.bumps.sign_pda_account;

    queue_computation(
        ctx.accounts,
        computation_offset,
        args,
        None,
        vec![FlipCallback::callback_ix(&[])],
        1,  // Added num_callback_txs parameter
    )?;

    Ok(())
}

#[queue_computation_accounts("flip", payer)]
#[derive(Accounts)]
#[instruction(computation_offset: u64)]
pub struct Flip<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        init_if_needed,
        space = 9,
        payer = payer,
        seeds = [&SIGN_PDA_SEED],
        bump,
        address = derive_sign_pda!(),
    )]
    pub sign_pda_account: Account<'info, SignerAccount>,
    #[account(
        address = derive_mxe_pda!()
    )]
    pub mxe_account: Account<'info, MXEAccount>,
    #[account(
        mut,
        address = derive_cluster_pda!(mxe_account, ErrorCode::ClusterNotSet)  // Added error code parameter
    )]
    pub cluster_account: Account<'info, Cluster>,
    // ... other accounts
}

#[error_code]
pub enum ErrorCode {
    #[msg("The computation was aborted")]
    AbortedComputation,
    #[msg("Cluster not set")]
    ClusterNotSet,  // Required for derive_cluster_pda! macro
}
```

That's it! Your program should now be compatible with Arcium tooling v0.4.0.
> ## Documentation Index
> Fetch the complete documentation index at: https://docs.arcium.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Setup a Testnet Node

## Overview

> Public Testnet on Solana Devnet for stress testing. Real computations; no economic value.

As a testnet operator, you'll set up your own Arx node to participate in the Arcium network. This guide walks you through each step of the process.

First, you'll prepare your environment by installing the necessary tools and generating security keys. Then, you'll get your node registered onchain and configure it to run. Finally, you'll connect to other nodes in a cluster and start doing computations.

By the end, you will:

* Install the Arcium tooling
* Generate required keypairs
* Fund accounts with Devnet SOL
* Initialize onchain node accounts
* Configure for Devnet
* Join or create a testnet cluster
* Deploy your node with Docker

## Prerequisites

Before starting, ensure you have the following installed:

* **Rust**: Install from [rustup.rs](https://rustup.rs/)
* **Solana CLI 2.3.0**: Install from [Solana's documentation](https://docs.solana.com/cli/install-solana-cli-tools)
* **Docker & Docker Compose**: Install from [Docker's documentation](https://docs.docker.com/get-docker/)
* **OpenSSL**: Install from [OpenSSL's documentation](https://www.openssl.org/source/) (usually pre-installed on macOS/Linux)
* **Git**: For cloning repositories and version control

You'll also need:

* A reliable internet connection
* Basic familiarity with command-line tools

**Recommended System Requirements:**

| Resource  | Recommendation                       |
| --------- | ------------------------------------ |
| RAM       | 32GB+                                |
| CPU       | 12+ cores, 2.8GHz+ base              |
| Bandwidth | 1 Gbit/s minimum                     |
| Disk      | Minimal (node is not disk-intensive) |
| GPU       | Not required                         |

**Network Requirements - Open these ports:**

| Port | Protocol  | Purpose                    |
| ---- | --------- | -------------------------- |
| 8001 | TCP & UDP | MPC protocol communication |
| 8002 | TCP & UDP | BLS signature generation   |
| 8012 | TCP & UDP | TD preprocessing           |
| 8013 | TCP       | TD registration            |
| 9091 | TCP       | Prometheus                 |

<Warning>**Windows Users:** Arcium doesn't run natively on Windows yet. Use Windows Subsystem for Linux (WSL2) with Ubuntu to follow this guide.</Warning>

## Step 1: Set Up Your Workspace

Create a dedicated folder for your node setup to keep everything organized:

```bash  theme={null}
mkdir arcium-node-setup
cd arcium-node-setup
```

<Warning>Stay in this directory for all remaining steps. All file paths and Docker commands assume you're working from `arcium-node-setup/`.</Warning>

You'll also need to know your public IP address for the next steps. Here's a quick way to find it:

```bash  theme={null}
curl https://ipecho.net/plain ; echo
```

## Step 2: Install Arcium Tooling

The Arcium tooling suite includes the CLI and Arx node software. Install it using the automated installer:

```bash  theme={null}
curl --proto '=https' --tlsv1.2 -sSfL https://install.arcium.com/ | bash
```

This script will:

* Check for all required dependencies
* Install `arcup` (Arcium's version manager)
* Install the latest Arcium CLI
* Install the Arx node software

Verify the installation:

```bash  theme={null}
arcium --version && arcup --version
```

If you prefer manual installation, see the [installation guide](/developers/installation) for detailed instructions.

## Step 3: Generate Required Keypairs

Your Arx node needs five different keypairs for secure operation. Create these in your `arcium-node-setup` directory:

### 3.1 Node Authority Keypair

This Solana keypair identifies your node and handles onchain operations:

```bash  theme={null}
solana-keygen new --outfile node-keypair.json --no-bip39-passphrase
```

<Note>The `--no-bip39-passphrase` flag creates a keypair without a passphrase for easier automation.</Note>

### 3.2 Callback Authority Keypair

This Solana keypair signs callback computations and must be different from your node keypair for security separation:

```bash  theme={null}
solana-keygen new --outfile callback-kp.json --no-bip39-passphrase
```

### 3.3 Identity Keypair

This keypair handles node-to-node communication and must be in PKCS#8 format:

```bash  theme={null}
openssl genpkey -algorithm Ed25519 -out identity.pem
```

### 3.4 BLS Keypair

This keypair is used for BLS (Boneh-Lynn-Shacham) threshold signatures on MPC computation callbacks. Generate it using the Arcium CLI:

```bash  theme={null}
arcium gen-bls-key bls-keypair.json
```

This creates a 32-byte private key stored as a JSON array format.

### 3.5 X25519 Keypair

This keypair is used for encrypted communication between nodes:

```bash  theme={null}
arcium generate-x25519 -o x25519-keypair.json
```

This creates a 32-byte X25519 private key stored in JSON array format.

<Warning>Keep these keypairs safe and private. Back them up to a secure location outside your VPS - you'll need them to restore your node if something goes wrong. Never share them with anyone.</Warning>

## Step 4: Fund Your Accounts

Your node and callback accounts need Devnet SOL for transaction fees.

<Note>The Devnet faucet has rate limits. Request only 1-2 SOL at a time and wait between requests if needed.</Note>

Fund each account and verify the balance:

```bash  theme={null}
# Fund and verify node account
solana airdrop 2 "$(solana address --keypair node-keypair.json)" -u devnet && \
  solana balance "$(solana address --keypair node-keypair.json)" -u devnet

# Fund and verify callback account (needs more SOL for computation fees)
solana airdrop 2 "$(solana address --keypair callback-kp.json)" -u devnet && \
  solana balance "$(solana address --keypair callback-kp.json)" -u devnet
```

<Tip>If the airdrop doesn't work, use the web faucet at [faucet.solana.com](https://faucet.solana.com/) instead - it's often more reliable than the CLI.</Tip>

## Step 5: Initialize Node Accounts

Now we'll register your node with the Arcium network by creating its onchain accounts. This step tells the blockchain about your node and its capabilities.

<Note> Set your Solana CLI to Devnet once so you can avoid passing `--rpc-url <rpc-url>` repeatedly:
`solana config set --url https://api.devnet.solana.com` </Note>

For guidance on choosing a reliable endpoint, see the [Devnet RPC Provider Recommendations](#devnet-rpc-provider-recommendations).

Use the `init-arx-accs` command to initialize all required onchain accounts for your node:

```bash  theme={null}
arcium init-arx-accs \
  --keypair-path node-keypair.json \
  --callback-keypair-path callback-kp.json \
  --peer-keypair-path identity.pem \
  --bls-keypair-path bls-keypair.json \
  --x25519-keypair-path x25519-keypair.json \
  --node-offset <your-node-offset> \
  --ip-address <your-public-ip> \
  --rpc-url https://api.devnet.solana.com
```

### Required Parameters:

* `--keypair-path`: Path to your node authority keypair
* `--callback-keypair-path`: Path to your callback authority keypair
* `--peer-keypair-path`: Path to your identity keypair (PEM format)
* `--bls-keypair-path`: Path to your BLS keypair (JSON array format)
* `--x25519-keypair-path`: Path to your X25519 keypair (JSON array format)
* `--node-offset`: Your node's unique ID number on the network. Choose any unique number. If you get an error during setup saying your number is already taken, just pick a different one and try again.
* `--ip-address`: Your node's public IP address
* `--rpc-url`: Solana Devnet RPC endpoint

If successful, you'll see confirmation that your node accounts have been initialized onchain.

## Step 6: Configure Your Node

The configuration file specifies which network to connect to, how to communicate with other nodes, and various operational settings.

Create a `node-config.toml` file in your `arcium-node-setup` directory:

```toml  theme={null}
[node]
offset = <your-node-offset>  # Your node offset from step 5
hardware_claim = 0  # Currently not required to specify, just use 0
starting_epoch = 0
ending_epoch = 9223372036854775807

[network]
address = "0.0.0.0" # Bind to all interfaces for reliability behind NAT/firewalls

[solana]
endpoint_rpc = "<your-rpc-provider-url-here>"  # Replace with your RPC provider URL or use default https://api.devnet.solana.com
endpoint_wss = "<your-rpc-websocket-url-here>"   # Replace with your RPC provider WebSocket URL or use default wss://api.devnet.solana.com
cluster = "Devnet"
commitment.commitment = "confirmed"  # or "processed" or "finalized"
```

<Warning>All fields are required. Missing fields will crash the node at startup.</Warning>

<Note>If your node is behind NAT or a cloud firewall, ensure ports 8001, 8002, 8012, 8013, and 9091 are forwarded and allowed inbound on your public IP. Use your public IP for `--ip-address` during initialization; `network.address` controls the local bind address. Using `"0.0.0.0"` ensures the process binds to all local interfaces while peers connect to the public IP you registered during `init-arx-accs`.</Note>

## Step 7: Cluster Operations

Clusters are groups of nodes that collaborate on MPC computations. For background on cluster concepts, see [Clusters Overview](/clusters/overview).

Most testnet operators should **join an existing cluster**. Only create your own cluster if you're coordinating a group of nodes.

<Tabs>
  <Tab title="Join Existing Cluster">
    To join an existing cluster, you must first be **proposed by the cluster authority**. Once proposed, accept the invitation:

    ```bash  theme={null}
    arcium join-cluster true \
      --keypair-path node-keypair.json \
      --node-offset <your-node-offset> \
      --cluster-offset <cluster-offset> \
      --rpc-url https://api.devnet.solana.com
    ```

    **Parameters:**

    * `true`: Accept the join request (use `false` to reject)
    * `--node-offset`: Your node's unique identifier (chosen during node initialization)
    * `--cluster-offset`: The cluster's unique identifier (different from node offset - clusters and nodes have separate ID spaces)

    <Note>You cannot join a cluster unless the cluster owner has first proposed you using `propose-join-cluster`.</Note>
  </Tab>

  <Tab title="Create New Cluster">
    If you want to create a new cluster and invite other nodes:

    **1. Create the Cluster**

    ```bash  theme={null}
    arcium init-cluster \
      --keypair-path node-keypair.json \
      --offset <cluster-offset> \
      --max-nodes <max-nodes> \
      --rpc-url https://api.devnet.solana.com
    ```

    **Parameters:**

    * `--offset`: Unique identifier for your cluster (different from your node offset)
    * `--max-nodes`: Maximum number of nodes in the cluster

    **Optional Parameters:**

    * `--mempool-size`: Size of the mempool (`Tiny`, `Small`, `Medium`, `Large`). Defaults to `Tiny`
    * `--price-per-cu`: Initial price per compute unit in lamports. Defaults to 1
    * `--propose-node`: Automatically propose a node to join after creation

    **2. Propose Nodes to Join**

    After creating the cluster, you must propose each node that should join. Nodes cannot join without being proposed first:

    ```bash  theme={null}
    arcium propose-join-cluster \
      --keypair-path node-keypair.json \
      --cluster-offset <cluster-offset> \
      --node-offset <node-to-propose-offset> \
      --rpc-url https://api.devnet.solana.com
    ```

    **Parameters:**

    * `--cluster-offset`: Your cluster's offset
    * `--node-offset`: The offset of the node you're inviting

    <Note>You can also propose a node inline when creating the cluster using `--propose-node <node-offset>`</Note>

    **3. Wait for Nodes to Accept**

    Once proposed, each node must accept the invitation using `join-cluster true` (see Join tab).
  </Tab>
</Tabs>

### Submit Aggregated BLS Key (Required After Cluster is Full)

<Note>The command will verify that all cluster slots are filled before submitting. If nodes are still pending, it will fail with an error.</Note>

Once all nodes have joined the cluster, **all nodes** must aggregate and submit the combined BLS public key. This enables threshold BLS signatures for computation callbacks:

```bash  theme={null}
arcium submit-aggregated-bls-key \
  --keypair-path node-keypair.json \
  --cluster-offset <cluster-offset> \
  --node-offset <your-node-offset> \
  --rpc-url https://api.devnet.solana.com
```

**Parameters:**

* `--keypair-path`: Your node authority keypair (must be a node in the cluster)
* `--cluster-offset`: The cluster's offset
* `--node-offset`: Your node's offset within the cluster

<Note>All nodes need to run this command. The CLI will automatically fetch all node BLS public keys from the cluster and aggregate them.</Note>

### Test Cluster (After Full Setup)

Once all nodes have joined and the aggregated BLS key is submitted, verify the cluster can perform computations:

```bash  theme={null}
arcium test-cluster \
  --cluster-offset <cluster-offset> \
  --keypair-path node-keypair.json \
  --rpc-url https://api.devnet.solana.com
```

## Step 8: Deploy Your Node

Before running Docker, prepare your environment and verify you have all required files:

```bash  theme={null}
mkdir -p arx-node-logs
ls node-keypair.json callback-kp.json identity.pem bls-keypair.json x25519-keypair.json node-config.toml
```

Now start the container:

```bash  theme={null}
docker run -d \
  --name arx-node \
  -e NODE_IDENTITY_FILE=/usr/arx-node/node-keys/node_identity.pem \
  -e NODE_KEYPAIR_FILE=/usr/arx-node/node-keys/node_keypair.json \
  -e CALLBACK_AUTHORITY_KEYPAIR_FILE=/usr/arx-node/node-keys/callback_authority_keypair.json \
  -e BLS_PRIVATE_KEY_FILE=/usr/arx-node/node-keys/bls_keypair.json \
  -e X25519_PRIVATE_KEY_FILE=/usr/arx-node/node-keys/x25519_keypair.json \
  -e ARX_METRICS_HOST=0.0.0.0 \
  -e ARX_METRICS_PORT=9091 \
  -v "$(pwd)/node-config.toml:/usr/arx-node/arx/node_config.toml" \
  -v "$(pwd)/node-keypair.json:/usr/arx-node/node-keys/node_keypair.json:ro" \
  -v "$(pwd)/callback-kp.json:/usr/arx-node/node-keys/callback_authority_keypair.json:ro" \
  -v "$(pwd)/identity.pem:/usr/arx-node/node-keys/node_identity.pem:ro" \
  -v "$(pwd)/bls-keypair.json:/usr/arx-node/node-keys/bls_keypair.json:ro" \
  -v "$(pwd)/x25519-keypair.json:/usr/arx-node/node-keys/x25519_keypair.json:ro" \
  -v "$(pwd)/arx-node-logs:/usr/arx-node/logs" \
  -v "$(pwd)/private-shares:/usr/arx-node/private-shares" \
  -v "$(pwd)/public-inputs:/usr/arx-node/public-inputs" \
  -p 8001:8001 \
  -p 8002:8002 \
  -p 8012:8012 \
  -p 8013:8013 \
  -p 9091:9091 \
  arcium/arx-node
```

<Warning>Ensure ports 8001, 8002, 8012, 8013, and 9091 are open in your OS and cloud provider firewalls. The metrics endpoint (9091) has no authentication - restrict access to trusted networks only.</Warning>

## Step 9: Verify Node Operation

Check that your node is running correctly:

### Check Node Status

```bash  theme={null}
arcium arx-info <your-node-offset> --rpc-url https://api.devnet.solana.com
```

### Check if Node is Active

```bash  theme={null}
arcium arx-active <your-node-offset> --rpc-url https://api.devnet.solana.com
```

### Metrics & Health

The node exposes Prometheus-compatible metrics on port 9091:

| Endpoint       | Description                 |
| -------------- | --------------------------- |
| `GET /metrics` | Prometheus-format metrics   |
| `GET /health`  | Health check (returns "OK") |

Verify:

```bash  theme={null}
curl -s http://localhost:9091/metrics | grep arx_
curl -s http://localhost:9091/health
```

Scrape with [Prometheus](https://prometheus.io/) and visualize with [Grafana](https://grafana.com/):

```yaml  theme={null}
# prometheus.yml snippet
scrape_configs:
  - job_name: 'arx-node'
    static_configs:
      - targets: ['localhost:9091']
```

### Monitor Logs

If using Docker:

```bash  theme={null}
docker logs -f arx-node
```

### Extract Internal Logs

If you need detailed logs for debugging:

```bash  theme={null}
docker cp arx-node:/usr/arx-node/logs ./node-logs
ls ./node-logs/  # Shows arx_log_<datetime>_<offset>.log
```

## Devnet RPC Provider Recommendations

For better reliability, consider using dedicated RPC providers instead of the default public endpoints. **Free tiers are sufficient for testnet - paid plans are NOT required.**

**Recommended providers:**

* [Helius](https://helius.xyz) - free tier works perfectly for testnet
* [QuickNode](https://quicknode.com) - free tier works perfectly for testnet

## Troubleshooting

<AccordionGroup>
  <Accordion title="Node fails with 'missing environment variable'">
    All 5 environment variables are required. Verify your Docker command includes:

    * `NODE_KEYPAIR_FILE`
    * `CALLBACK_AUTHORITY_KEYPAIR_FILE`
    * `NODE_IDENTITY_FILE`
    * `BLS_PRIVATE_KEY_FILE`
    * `X25519_PRIVATE_KEY_FILE`
  </Accordion>

  <Accordion title="Node fails with 'X25519 key invalid'">
    Regenerate the X25519 keypair:

    ```bash  theme={null}
    arcium generate-x25519 -o x25519-keypair.json
    ```
  </Accordion>

  <Accordion title="Node Not Starting">
    * Verify all 5 keypair files exist and are readable
    * Check that `node-config.toml` is valid TOML with all required fields
    * Ensure your IP address is accessible from the internet
  </Accordion>

  <Accordion title="Node can't reach peers">
    1. Verify firewall allows inbound on ports: 8001, 8002, 8012, 8013, and 9091 (all TCP)
    2. Check RPC endpoint is responsive
    3. Verify node is active: `arcium arx-active <offset>`
  </Accordion>

  <Accordion title="Account Initialization Failed">
    * Verify you have sufficient SOL for transaction fees
    * Check that your RPC endpoint is working
    * Ensure node offset is unique (try a different number)
  </Accordion>

  <Accordion title="Cannot Join Cluster">
    * Verify you've been invited by the cluster authority
    * Check that cluster has available slots
    * Ensure your node is properly initialized
  </Accordion>

  <Accordion title="BLS aggregation failing">
    All cluster nodes need valid BLS keys. After all nodes join:

    ```bash  theme={null}
    arcium submit-aggregated-bls-key \
      --keypair-path node-keypair.json \
      --cluster-offset <cluster-offset> \
      --node-offset <your-node-offset> \
      --rpc-url https://api.devnet.solana.com
    ```
  </Accordion>

  <Accordion title="Callback authority out of funds">
    ```bash  theme={null}
    solana airdrop 2 "$(solana address -k callback-kp.json)" -u devnet
    ```
  </Accordion>

  <Accordion title="Docker Issues">
    * Verify Docker is running
    * Check file permissions on mounted volumes
    * Ensure ports 8001, 8002, 8012, 8013, and 9091 are not already in use
  </Accordion>
</AccordionGroup>

<Tip>**Need more help?** Join the [Arcium Discord](https://discord.gg/arcium) for community support, or review the [installation troubleshooting guide](/developers/installation#issues).</Tip>

## What's Next

Once your Testnet node is running successfully:

* **Join the Community**: Connect with other node operators on [Discord](https://discord.gg/arcium)
* **Stay Updated**: Keep your Arcium tooling updated with `arcup install`
* **Learn More**: Read the [Arcium Network Overview](/getting-started/architecture-overview) or [Installation Guide](/developers/installation)
> ## Documentation Index
> Fetch the complete documentation index at: https://docs.arcium.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Setup a Testnet Node

## Overview

> Public Testnet on Solana Devnet for stress testing. Real computations; no economic value.

As a testnet operator, you'll set up your own Arx node to participate in the Arcium network. This guide walks you through each step of the process.

First, you'll prepare your environment by installing the necessary tools and generating security keys. Then, you'll get your node registered onchain and configure it to run. Finally, you'll connect to other nodes in a cluster and start doing computations.

By the end, you will:

* Install the Arcium tooling
* Generate required keypairs
* Fund accounts with Devnet SOL
* Initialize onchain node accounts
* Configure for Devnet
* Join or create a testnet cluster
* Deploy your node with Docker

## Prerequisites

Before starting, ensure you have the following installed:

* **Rust**: Install from [rustup.rs](https://rustup.rs/)
* **Solana CLI 2.3.0**: Install from [Solana's documentation](https://docs.solana.com/cli/install-solana-cli-tools)
* **Docker & Docker Compose**: Install from [Docker's documentation](https://docs.docker.com/get-docker/)
* **OpenSSL**: Install from [OpenSSL's documentation](https://www.openssl.org/source/) (usually pre-installed on macOS/Linux)
* **Git**: For cloning repositories and version control

You'll also need:

* A reliable internet connection
* Basic familiarity with command-line tools

**Recommended System Requirements:**

| Resource  | Recommendation                       |
| --------- | ------------------------------------ |
| RAM       | 32GB+                                |
| CPU       | 12+ cores, 2.8GHz+ base              |
| Bandwidth | 1 Gbit/s minimum                     |
| Disk      | Minimal (node is not disk-intensive) |
| GPU       | Not required                         |

**Network Requirements - Open these ports:**

| Port | Protocol  | Purpose                    |
| ---- | --------- | -------------------------- |
| 8001 | TCP & UDP | MPC protocol communication |
| 8002 | TCP & UDP | BLS signature generation   |
| 8012 | TCP & UDP | TD preprocessing           |
| 8013 | TCP       | TD registration            |
| 9091 | TCP       | Prometheus                 |

<Warning>**Windows Users:** Arcium doesn't run natively on Windows yet. Use Windows Subsystem for Linux (WSL2) with Ubuntu to follow this guide.</Warning>

## Step 1: Set Up Your Workspace

Create a dedicated folder for your node setup to keep everything organized:

```bash  theme={null}
mkdir arcium-node-setup
cd arcium-node-setup
```

<Warning>Stay in this directory for all remaining steps. All file paths and Docker commands assume you're working from `arcium-node-setup/`.</Warning>

You'll also need to know your public IP address for the next steps. Here's a quick way to find it:

```bash  theme={null}
curl https://ipecho.net/plain ; echo
```

## Step 2: Install Arcium Tooling

The Arcium tooling suite includes the CLI and Arx node software. Install it using the automated installer:

```bash  theme={null}
curl --proto '=https' --tlsv1.2 -sSfL https://install.arcium.com/ | bash
```

This script will:

* Check for all required dependencies
* Install `arcup` (Arcium's version manager)
* Install the latest Arcium CLI
* Install the Arx node software

Verify the installation:

```bash  theme={null}
arcium --version && arcup --version
```

If you prefer manual installation, see the [installation guide](/developers/installation) for detailed instructions.

## Step 3: Generate Required Keypairs

Your Arx node needs five different keypairs for secure operation. Create these in your `arcium-node-setup` directory:

### 3.1 Node Authority Keypair

This Solana keypair identifies your node and handles onchain operations:

```bash  theme={null}
solana-keygen new --outfile node-keypair.json --no-bip39-passphrase
```

<Note>The `--no-bip39-passphrase` flag creates a keypair without a passphrase for easier automation.</Note>

### 3.2 Callback Authority Keypair

This Solana keypair signs callback computations and must be different from your node keypair for security separation:

```bash  theme={null}
solana-keygen new --outfile callback-kp.json --no-bip39-passphrase
```

### 3.3 Identity Keypair

This keypair handles node-to-node communication and must be in PKCS#8 format:

```bash  theme={null}
openssl genpkey -algorithm Ed25519 -out identity.pem
```

### 3.4 BLS Keypair

This keypair is used for BLS (Boneh-Lynn-Shacham) threshold signatures on MPC computation callbacks. Generate it using the Arcium CLI:

```bash  theme={null}
arcium gen-bls-key bls-keypair.json
```

This creates a 32-byte private key stored as a JSON array format.

### 3.5 X25519 Keypair

This keypair is used for encrypted communication between nodes:

```bash  theme={null}
arcium generate-x25519 -o x25519-keypair.json
```

This creates a 32-byte X25519 private key stored in JSON array format.

<Warning>Keep these keypairs safe and private. Back them up to a secure location outside your VPS - you'll need them to restore your node if something goes wrong. Never share them with anyone.</Warning>

## Step 4: Fund Your Accounts

Your node and callback accounts need Devnet SOL for transaction fees.

<Note>The Devnet faucet has rate limits. Request only 1-2 SOL at a time and wait between requests if needed.</Note>

Fund each account and verify the balance:

```bash  theme={null}
# Fund and verify node account
solana airdrop 2 "$(solana address --keypair node-keypair.json)" -u devnet && \
  solana balance "$(solana address --keypair node-keypair.json)" -u devnet

# Fund and verify callback account (needs more SOL for computation fees)
solana airdrop 2 "$(solana address --keypair callback-kp.json)" -u devnet && \
  solana balance "$(solana address --keypair callback-kp.json)" -u devnet
```

<Tip>If the airdrop doesn't work, use the web faucet at [faucet.solana.com](https://faucet.solana.com/) instead - it's often more reliable than the CLI.</Tip>

## Step 5: Initialize Node Accounts

Now we'll register your node with the Arcium network by creating its onchain accounts. This step tells the blockchain about your node and its capabilities.

<Note> Set your Solana CLI to Devnet once so you can avoid passing `--rpc-url <rpc-url>` repeatedly:
`solana config set --url https://api.devnet.solana.com` </Note>

For guidance on choosing a reliable endpoint, see the [Devnet RPC Provider Recommendations](#devnet-rpc-provider-recommendations).

Use the `init-arx-accs` command to initialize all required onchain accounts for your node:

```bash  theme={null}
arcium init-arx-accs \
  --keypair-path node-keypair.json \
  --callback-keypair-path callback-kp.json \
  --peer-keypair-path identity.pem \
  --bls-keypair-path bls-keypair.json \
  --x25519-keypair-path x25519-keypair.json \
  --node-offset <your-node-offset> \
  --ip-address <your-public-ip> \
  --rpc-url https://api.devnet.solana.com
```

### Required Parameters:

* `--keypair-path`: Path to your node authority keypair
* `--callback-keypair-path`: Path to your callback authority keypair
* `--peer-keypair-path`: Path to your identity keypair (PEM format)
* `--bls-keypair-path`: Path to your BLS keypair (JSON array format)
* `--x25519-keypair-path`: Path to your X25519 keypair (JSON array format)
* `--node-offset`: Your node's unique ID number on the network. Choose any unique number. If you get an error during setup saying your number is already taken, just pick a different one and try again.
* `--ip-address`: Your node's public IP address
* `--rpc-url`: Solana Devnet RPC endpoint

If successful, you'll see confirmation that your node accounts have been initialized onchain.

## Step 6: Configure Your Node

The configuration file specifies which network to connect to, how to communicate with other nodes, and various operational settings.

Create a `node-config.toml` file in your `arcium-node-setup` directory:

```toml  theme={null}
[node]
offset = <your-node-offset>  # Your node offset from step 5
hardware_claim = 0  # Currently not required to specify, just use 0
starting_epoch = 0
ending_epoch = 9223372036854775807

[network]
address = "0.0.0.0" # Bind to all interfaces for reliability behind NAT/firewalls

[solana]
endpoint_rpc = "<your-rpc-provider-url-here>"  # Replace with your RPC provider URL or use default https://api.devnet.solana.com
endpoint_wss = "<your-rpc-websocket-url-here>"   # Replace with your RPC provider WebSocket URL or use default wss://api.devnet.solana.com
cluster = "Devnet"
commitment.commitment = "confirmed"  # or "processed" or "finalized"
```

<Warning>All fields are required. Missing fields will crash the node at startup.</Warning>

<Note>If your node is behind NAT or a cloud firewall, ensure ports 8001, 8002, 8012, 8013, and 9091 are forwarded and allowed inbound on your public IP. Use your public IP for `--ip-address` during initialization; `network.address` controls the local bind address. Using `"0.0.0.0"` ensures the process binds to all local interfaces while peers connect to the public IP you registered during `init-arx-accs`.</Note>

## Step 7: Cluster Operations

Clusters are groups of nodes that collaborate on MPC computations. For background on cluster concepts, see [Clusters Overview](/clusters/overview).

Most testnet operators should **join an existing cluster**. Only create your own cluster if you're coordinating a group of nodes.

<Tabs>
  <Tab title="Join Existing Cluster">
    To join an existing cluster, you must first be **proposed by the cluster authority**. Once proposed, accept the invitation:

    ```bash  theme={null}
    arcium join-cluster true \
      --keypair-path node-keypair.json \
      --node-offset <your-node-offset> \
      --cluster-offset <cluster-offset> \
      --rpc-url https://api.devnet.solana.com
    ```

    **Parameters:**

    * `true`: Accept the join request (use `false` to reject)
    * `--node-offset`: Your node's unique identifier (chosen during node initialization)
    * `--cluster-offset`: The cluster's unique identifier (different from node offset - clusters and nodes have separate ID spaces)

    <Note>You cannot join a cluster unless the cluster owner has first proposed you using `propose-join-cluster`.</Note>
  </Tab>

  <Tab title="Create New Cluster">
    If you want to create a new cluster and invite other nodes:

    **1. Create the Cluster**

    ```bash  theme={null}
    arcium init-cluster \
      --keypair-path node-keypair.json \
      --offset <cluster-offset> \
      --max-nodes <max-nodes> \
      --rpc-url https://api.devnet.solana.com
    ```

    **Parameters:**

    * `--offset`: Unique identifier for your cluster (different from your node offset)
    * `--max-nodes`: Maximum number of nodes in the cluster

    **Optional Parameters:**

    * `--mempool-size`: Size of the mempool (`Tiny`, `Small`, `Medium`, `Large`). Defaults to `Tiny`
    * `--price-per-cu`: Initial price per compute unit in lamports. Defaults to 1
    * `--propose-node`: Automatically propose a node to join after creation

    **2. Propose Nodes to Join**

    After creating the cluster, you must propose each node that should join. Nodes cannot join without being proposed first:

    ```bash  theme={null}
    arcium propose-join-cluster \
      --keypair-path node-keypair.json \
      --cluster-offset <cluster-offset> \
      --node-offset <node-to-propose-offset> \
      --rpc-url https://api.devnet.solana.com
    ```

    **Parameters:**

    * `--cluster-offset`: Your cluster's offset
    * `--node-offset`: The offset of the node you're inviting

    <Note>You can also propose a node inline when creating the cluster using `--propose-node <node-offset>`</Note>

    **3. Wait for Nodes to Accept**

    Once proposed, each node must accept the invitation using `join-cluster true` (see Join tab).
  </Tab>
</Tabs>

### Submit Aggregated BLS Key (Required After Cluster is Full)

<Note>The command will verify that all cluster slots are filled before submitting. If nodes are still pending, it will fail with an error.</Note>

Once all nodes have joined the cluster, **all nodes** must aggregate and submit the combined BLS public key. This enables threshold BLS signatures for computation callbacks:

```bash  theme={null}
arcium submit-aggregated-bls-key \
  --keypair-path node-keypair.json \
  --cluster-offset <cluster-offset> \
  --node-offset <your-node-offset> \
  --rpc-url https://api.devnet.solana.com
```

**Parameters:**

* `--keypair-path`: Your node authority keypair (must be a node in the cluster)
* `--cluster-offset`: The cluster's offset
* `--node-offset`: Your node's offset within the cluster

<Note>All nodes need to run this command. The CLI will automatically fetch all node BLS public keys from the cluster and aggregate them.</Note>

### Test Cluster (After Full Setup)

Once all nodes have joined and the aggregated BLS key is submitted, verify the cluster can perform computations:

```bash  theme={null}
arcium test-cluster \
  --cluster-offset <cluster-offset> \
  --keypair-path node-keypair.json \
  --rpc-url https://api.devnet.solana.com
```

## Step 8: Deploy Your Node

Before running Docker, prepare your environment and verify you have all required files:

```bash  theme={null}
mkdir -p arx-node-logs
ls node-keypair.json callback-kp.json identity.pem bls-keypair.json x25519-keypair.json node-config.toml
```

Now start the container:

```bash  theme={null}
docker run -d \
  --name arx-node \
  -e NODE_IDENTITY_FILE=/usr/arx-node/node-keys/node_identity.pem \
  -e NODE_KEYPAIR_FILE=/usr/arx-node/node-keys/node_keypair.json \
  -e CALLBACK_AUTHORITY_KEYPAIR_FILE=/usr/arx-node/node-keys/callback_authority_keypair.json \
  -e BLS_PRIVATE_KEY_FILE=/usr/arx-node/node-keys/bls_keypair.json \
  -e X25519_PRIVATE_KEY_FILE=/usr/arx-node/node-keys/x25519_keypair.json \
  -e ARX_METRICS_HOST=0.0.0.0 \
  -e ARX_METRICS_PORT=9091 \
  -v "$(pwd)/node-config.toml:/usr/arx-node/arx/node_config.toml" \
  -v "$(pwd)/node-keypair.json:/usr/arx-node/node-keys/node_keypair.json:ro" \
  -v "$(pwd)/callback-kp.json:/usr/arx-node/node-keys/callback_authority_keypair.json:ro" \
  -v "$(pwd)/identity.pem:/usr/arx-node/node-keys/node_identity.pem:ro" \
  -v "$(pwd)/bls-keypair.json:/usr/arx-node/node-keys/bls_keypair.json:ro" \
  -v "$(pwd)/x25519-keypair.json:/usr/arx-node/node-keys/x25519_keypair.json:ro" \
  -v "$(pwd)/arx-node-logs:/usr/arx-node/logs" \
  -v "$(pwd)/private-shares:/usr/arx-node/private-shares" \
  -v "$(pwd)/public-inputs:/usr/arx-node/public-inputs" \
  -p 8001:8001 \
  -p 8002:8002 \
  -p 8012:8012 \
  -p 8013:8013 \
  -p 9091:9091 \
  arcium/arx-node
```

<Warning>Ensure ports 8001, 8002, 8012, 8013, and 9091 are open in your OS and cloud provider firewalls. The metrics endpoint (9091) has no authentication - restrict access to trusted networks only.</Warning>

## Step 9: Verify Node Operation

Check that your node is running correctly:

### Check Node Status

```bash  theme={null}
arcium arx-info <your-node-offset> --rpc-url https://api.devnet.solana.com
```

### Check if Node is Active

```bash  theme={null}
arcium arx-active <your-node-offset> --rpc-url https://api.devnet.solana.com
```

### Metrics & Health

The node exposes Prometheus-compatible metrics on port 9091:

| Endpoint       | Description                 |
| -------------- | --------------------------- |
| `GET /metrics` | Prometheus-format metrics   |
| `GET /health`  | Health check (returns "OK") |

Verify:

```bash  theme={null}
curl -s http://localhost:9091/metrics | grep arx_
curl -s http://localhost:9091/health
```

Scrape with [Prometheus](https://prometheus.io/) and visualize with [Grafana](https://grafana.com/):

```yaml  theme={null}
# prometheus.yml snippet
scrape_configs:
  - job_name: 'arx-node'
    static_configs:
      - targets: ['localhost:9091']
```

### Monitor Logs

If using Docker:

```bash  theme={null}
docker logs -f arx-node
```

### Extract Internal Logs

If you need detailed logs for debugging:

```bash  theme={null}
docker cp arx-node:/usr/arx-node/logs ./node-logs
ls ./node-logs/  # Shows arx_log_<datetime>_<offset>.log
```

## Devnet RPC Provider Recommendations

For better reliability, consider using dedicated RPC providers instead of the default public endpoints. **Free tiers are sufficient for testnet - paid plans are NOT required.**

**Recommended providers:**

* [Helius](https://helius.xyz) - free tier works perfectly for testnet
* [QuickNode](https://quicknode.com) - free tier works perfectly for testnet

## Troubleshooting

<AccordionGroup>
  <Accordion title="Node fails with 'missing environment variable'">
    All 5 environment variables are required. Verify your Docker command includes:

    * `NODE_KEYPAIR_FILE`
    * `CALLBACK_AUTHORITY_KEYPAIR_FILE`
    * `NODE_IDENTITY_FILE`
    * `BLS_PRIVATE_KEY_FILE`
    * `X25519_PRIVATE_KEY_FILE`
  </Accordion>

  <Accordion title="Node fails with 'X25519 key invalid'">
    Regenerate the X25519 keypair:

    ```bash  theme={null}
    arcium generate-x25519 -o x25519-keypair.json
    ```
  </Accordion>

  <Accordion title="Node Not Starting">
    * Verify all 5 keypair files exist and are readable
    * Check that `node-config.toml` is valid TOML with all required fields
    * Ensure your IP address is accessible from the internet
  </Accordion>

  <Accordion title="Node can't reach peers">
    1. Verify firewall allows inbound on ports: 8001, 8002, 8012, 8013, and 9091 (all TCP)
    2. Check RPC endpoint is responsive
    3. Verify node is active: `arcium arx-active <offset>`
  </Accordion>

  <Accordion title="Account Initialization Failed">
    * Verify you have sufficient SOL for transaction fees
    * Check that your RPC endpoint is working
    * Ensure node offset is unique (try a different number)
  </Accordion>

  <Accordion title="Cannot Join Cluster">
    * Verify you've been invited by the cluster authority
    * Check that cluster has available slots
    * Ensure your node is properly initialized
  </Accordion>

  <Accordion title="BLS aggregation failing">
    All cluster nodes need valid BLS keys. After all nodes join:

    ```bash  theme={null}
    arcium submit-aggregated-bls-key \
      --keypair-path node-keypair.json \
      --cluster-offset <cluster-offset> \
      --node-offset <your-node-offset> \
      --rpc-url https://api.devnet.solana.com
    ```
  </Accordion>

  <Accordion title="Callback authority out of funds">
    ```bash  theme={null}
    solana airdrop 2 "$(solana address -k callback-kp.json)" -u devnet
    ```
  </Accordion>

  <Accordion title="Docker Issues">
    * Verify Docker is running
    * Check file permissions on mounted volumes
    * Ensure ports 8001, 8002, 8012, 8013, and 9091 are not already in use
  </Accordion>
</AccordionGroup>

<Tip>**Need more help?** Join the [Arcium Discord](https://discord.gg/arcium) for community support, or review the [installation troubleshooting guide](/developers/installation#issues).</Tip>

## What's Next

Once your Testnet node is running successfully:

* **Join the Community**: Connect with other node operators on [Discord](https://discord.gg/arcium)
* **Stay Updated**: Keep your Arcium tooling updated with `arcup install`
* **Learn More**: Read the [Arcium Network Overview](/getting-started/architecture-overview) or [Installation Guide](/developers/installation)
> ## Documentation Index
> Fetch the complete documentation index at: https://docs.arcium.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Setup a Testnet Node

## Overview

> Public Testnet on Solana Devnet for stress testing. Real computations; no economic value.

As a testnet operator, you'll set up your own Arx node to participate in the Arcium network. This guide walks you through each step of the process.

First, you'll prepare your environment by installing the necessary tools and generating security keys. Then, you'll get your node registered onchain and configure it to run. Finally, you'll connect to other nodes in a cluster and start doing computations.

By the end, you will:

* Install the Arcium tooling
* Generate required keypairs
* Fund accounts with Devnet SOL
* Initialize onchain node accounts
* Configure for Devnet
* Join or create a testnet cluster
* Deploy your node with Docker

## Prerequisites

Before starting, ensure you have the following installed:

* **Rust**: Install from [rustup.rs](https://rustup.rs/)
* **Solana CLI 2.3.0**: Install from [Solana's documentation](https://docs.solana.com/cli/install-solana-cli-tools)
* **Docker & Docker Compose**: Install from [Docker's documentation](https://docs.docker.com/get-docker/)
* **OpenSSL**: Install from [OpenSSL's documentation](https://www.openssl.org/source/) (usually pre-installed on macOS/Linux)
* **Git**: For cloning repositories and version control

You'll also need:

* A reliable internet connection
* Basic familiarity with command-line tools

**Recommended System Requirements:**

| Resource  | Recommendation                       |
| --------- | ------------------------------------ |
| RAM       | 32GB+                                |
| CPU       | 12+ cores, 2.8GHz+ base              |
| Bandwidth | 1 Gbit/s minimum                     |
| Disk      | Minimal (node is not disk-intensive) |
| GPU       | Not required                         |

**Network Requirements - Open these ports:**

| Port | Protocol  | Purpose                    |
| ---- | --------- | -------------------------- |
| 8001 | TCP & UDP | MPC protocol communication |
| 8002 | TCP & UDP | BLS signature generation   |
| 8012 | TCP & UDP | TD preprocessing           |
| 8013 | TCP       | TD registration            |
| 9091 | TCP       | Prometheus                 |

<Warning>**Windows Users:** Arcium doesn't run natively on Windows yet. Use Windows Subsystem for Linux (WSL2) with Ubuntu to follow this guide.</Warning>

## Step 1: Set Up Your Workspace

Create a dedicated folder for your node setup to keep everything organized:

```bash  theme={null}
mkdir arcium-node-setup
cd arcium-node-setup
```

<Warning>Stay in this directory for all remaining steps. All file paths and Docker commands assume you're working from `arcium-node-setup/`.</Warning>

You'll also need to know your public IP address for the next steps. Here's a quick way to find it:

```bash  theme={null}
curl https://ipecho.net/plain ; echo
```

## Step 2: Install Arcium Tooling

The Arcium tooling suite includes the CLI and Arx node software. Install it using the automated installer:

```bash  theme={null}
curl --proto '=https' --tlsv1.2 -sSfL https://install.arcium.com/ | bash
```

This script will:

* Check for all required dependencies
* Install `arcup` (Arcium's version manager)
* Install the latest Arcium CLI
* Install the Arx node software

Verify the installation:

```bash  theme={null}
arcium --version && arcup --version
```

If you prefer manual installation, see the [installation guide](/developers/installation) for detailed instructions.

## Step 3: Generate Required Keypairs

Your Arx node needs five different keypairs for secure operation. Create these in your `arcium-node-setup` directory:

### 3.1 Node Authority Keypair

This Solana keypair identifies your node and handles onchain operations:

```bash  theme={null}
solana-keygen new --outfile node-keypair.json --no-bip39-passphrase
```

<Note>The `--no-bip39-passphrase` flag creates a keypair without a passphrase for easier automation.</Note>

### 3.2 Callback Authority Keypair

This Solana keypair signs callback computations and must be different from your node keypair for security separation:

```bash  theme={null}
solana-keygen new --outfile callback-kp.json --no-bip39-passphrase
```

### 3.3 Identity Keypair

This keypair handles node-to-node communication and must be in PKCS#8 format:

```bash  theme={null}
openssl genpkey -algorithm Ed25519 -out identity.pem
```

### 3.4 BLS Keypair

This keypair is used for BLS (Boneh-Lynn-Shacham) threshold signatures on MPC computation callbacks. Generate it using the Arcium CLI:

```bash  theme={null}
arcium gen-bls-key bls-keypair.json
```

This creates a 32-byte private key stored as a JSON array format.

### 3.5 X25519 Keypair

This keypair is used for encrypted communication between nodes:

```bash  theme={null}
arcium generate-x25519 -o x25519-keypair.json
```

This creates a 32-byte X25519 private key stored in JSON array format.

<Warning>Keep these keypairs safe and private. Back them up to a secure location outside your VPS - you'll need them to restore your node if something goes wrong. Never share them with anyone.</Warning>

## Step 4: Fund Your Accounts

Your node and callback accounts need Devnet SOL for transaction fees.

<Note>The Devnet faucet has rate limits. Request only 1-2 SOL at a time and wait between requests if needed.</Note>

Fund each account and verify the balance:

```bash  theme={null}
# Fund and verify node account
solana airdrop 2 "$(solana address --keypair node-keypair.json)" -u devnet && \
  solana balance "$(solana address --keypair node-keypair.json)" -u devnet

# Fund and verify callback account (needs more SOL for computation fees)
solana airdrop 2 "$(solana address --keypair callback-kp.json)" -u devnet && \
  solana balance "$(solana address --keypair callback-kp.json)" -u devnet
```

<Tip>If the airdrop doesn't work, use the web faucet at [faucet.solana.com](https://faucet.solana.com/) instead - it's often more reliable than the CLI.</Tip>

## Step 5: Initialize Node Accounts

Now we'll register your node with the Arcium network by creating its onchain accounts. This step tells the blockchain about your node and its capabilities.

<Note> Set your Solana CLI to Devnet once so you can avoid passing `--rpc-url <rpc-url>` repeatedly:
`solana config set --url https://api.devnet.solana.com` </Note>

For guidance on choosing a reliable endpoint, see the [Devnet RPC Provider Recommendations](#devnet-rpc-provider-recommendations).

Use the `init-arx-accs` command to initialize all required onchain accounts for your node:

```bash  theme={null}
arcium init-arx-accs \
  --keypair-path node-keypair.json \
  --callback-keypair-path callback-kp.json \
  --peer-keypair-path identity.pem \
  --bls-keypair-path bls-keypair.json \
  --x25519-keypair-path x25519-keypair.json \
  --node-offset <your-node-offset> \
  --ip-address <your-public-ip> \
  --rpc-url https://api.devnet.solana.com
```

### Required Parameters:

* `--keypair-path`: Path to your node authority keypair
* `--callback-keypair-path`: Path to your callback authority keypair
* `--peer-keypair-path`: Path to your identity keypair (PEM format)
* `--bls-keypair-path`: Path to your BLS keypair (JSON array format)
* `--x25519-keypair-path`: Path to your X25519 keypair (JSON array format)
* `--node-offset`: Your node's unique ID number on the network. Choose any unique number. If you get an error during setup saying your number is already taken, just pick a different one and try again.
* `--ip-address`: Your node's public IP address
* `--rpc-url`: Solana Devnet RPC endpoint

If successful, you'll see confirmation that your node accounts have been initialized onchain.

## Step 6: Configure Your Node

The configuration file specifies which network to connect to, how to communicate with other nodes, and various operational settings.

Create a `node-config.toml` file in your `arcium-node-setup` directory:

```toml  theme={null}
[node]
offset = <your-node-offset>  # Your node offset from step 5
hardware_claim = 0  # Currently not required to specify, just use 0
starting_epoch = 0
ending_epoch = 9223372036854775807

[network]
address = "0.0.0.0" # Bind to all interfaces for reliability behind NAT/firewalls

[solana]
endpoint_rpc = "<your-rpc-provider-url-here>"  # Replace with your RPC provider URL or use default https://api.devnet.solana.com
endpoint_wss = "<your-rpc-websocket-url-here>"   # Replace with your RPC provider WebSocket URL or use default wss://api.devnet.solana.com
cluster = "Devnet"
commitment.commitment = "confirmed"  # or "processed" or "finalized"
```

<Warning>All fields are required. Missing fields will crash the node at startup.</Warning>

<Note>If your node is behind NAT or a cloud firewall, ensure ports 8001, 8002, 8012, 8013, and 9091 are forwarded and allowed inbound on your public IP. Use your public IP for `--ip-address` during initialization; `network.address` controls the local bind address. Using `"0.0.0.0"` ensures the process binds to all local interfaces while peers connect to the public IP you registered during `init-arx-accs`.</Note>

## Step 7: Cluster Operations

Clusters are groups of nodes that collaborate on MPC computations. For background on cluster concepts, see [Clusters Overview](/clusters/overview).

Most testnet operators should **join an existing cluster**. Only create your own cluster if you're coordinating a group of nodes.

<Tabs>
  <Tab title="Join Existing Cluster">
    To join an existing cluster, you must first be **proposed by the cluster authority**. Once proposed, accept the invitation:

    ```bash  theme={null}
    arcium join-cluster true \
      --keypair-path node-keypair.json \
      --node-offset <your-node-offset> \
      --cluster-offset <cluster-offset> \
      --rpc-url https://api.devnet.solana.com
    ```

    **Parameters:**

    * `true`: Accept the join request (use `false` to reject)
    * `--node-offset`: Your node's unique identifier (chosen during node initialization)
    * `--cluster-offset`: The cluster's unique identifier (different from node offset - clusters and nodes have separate ID spaces)

    <Note>You cannot join a cluster unless the cluster owner has first proposed you using `propose-join-cluster`.</Note>
  </Tab>

  <Tab title="Create New Cluster">
    If you want to create a new cluster and invite other nodes:

    **1. Create the Cluster**

    ```bash  theme={null}
    arcium init-cluster \
      --keypair-path node-keypair.json \
      --offset <cluster-offset> \
      --max-nodes <max-nodes> \
      --rpc-url https://api.devnet.solana.com
    ```

    **Parameters:**

    * `--offset`: Unique identifier for your cluster (different from your node offset)
    * `--max-nodes`: Maximum number of nodes in the cluster

    **Optional Parameters:**

    * `--mempool-size`: Size of the mempool (`Tiny`, `Small`, `Medium`, `Large`). Defaults to `Tiny`
    * `--price-per-cu`: Initial price per compute unit in lamports. Defaults to 1
    * `--propose-node`: Automatically propose a node to join after creation

    **2. Propose Nodes to Join**

    After creating the cluster, you must propose each node that should join. Nodes cannot join without being proposed first:

    ```bash  theme={null}
    arcium propose-join-cluster \
      --keypair-path node-keypair.json \
      --cluster-offset <cluster-offset> \
      --node-offset <node-to-propose-offset> \
      --rpc-url https://api.devnet.solana.com
    ```

    **Parameters:**

    * `--cluster-offset`: Your cluster's offset
    * `--node-offset`: The offset of the node you're inviting

    <Note>You can also propose a node inline when creating the cluster using `--propose-node <node-offset>`</Note>

    **3. Wait for Nodes to Accept**

    Once proposed, each node must accept the invitation using `join-cluster true` (see Join tab).
  </Tab>
</Tabs>

### Submit Aggregated BLS Key (Required After Cluster is Full)

<Note>The command will verify that all cluster slots are filled before submitting. If nodes are still pending, it will fail with an error.</Note>

Once all nodes have joined the cluster, **all nodes** must aggregate and submit the combined BLS public key. This enables threshold BLS signatures for computation callbacks:

```bash  theme={null}
arcium submit-aggregated-bls-key \
  --keypair-path node-keypair.json \
  --cluster-offset <cluster-offset> \
  --node-offset <your-node-offset> \
  --rpc-url https://api.devnet.solana.com
```

**Parameters:**

* `--keypair-path`: Your node authority keypair (must be a node in the cluster)
* `--cluster-offset`: The cluster's offset
* `--node-offset`: Your node's offset within the cluster

<Note>All nodes need to run this command. The CLI will automatically fetch all node BLS public keys from the cluster and aggregate them.</Note>

### Test Cluster (After Full Setup)

Once all nodes have joined and the aggregated BLS key is submitted, verify the cluster can perform computations:

```bash  theme={null}
arcium test-cluster \
  --cluster-offset <cluster-offset> \
  --keypair-path node-keypair.json \
  --rpc-url https://api.devnet.solana.com
```

## Step 8: Deploy Your Node

Before running Docker, prepare your environment and verify you have all required files:

```bash  theme={null}
mkdir -p arx-node-logs
ls node-keypair.json callback-kp.json identity.pem bls-keypair.json x25519-keypair.json node-config.toml
```

Now start the container:

```bash  theme={null}
docker run -d \
  --name arx-node \
  -e NODE_IDENTITY_FILE=/usr/arx-node/node-keys/node_identity.pem \
  -e NODE_KEYPAIR_FILE=/usr/arx-node/node-keys/node_keypair.json \
  -e CALLBACK_AUTHORITY_KEYPAIR_FILE=/usr/arx-node/node-keys/callback_authority_keypair.json \
  -e BLS_PRIVATE_KEY_FILE=/usr/arx-node/node-keys/bls_keypair.json \
  -e X25519_PRIVATE_KEY_FILE=/usr/arx-node/node-keys/x25519_keypair.json \
  -e ARX_METRICS_HOST=0.0.0.0 \
  -e ARX_METRICS_PORT=9091 \
  -v "$(pwd)/node-config.toml:/usr/arx-node/arx/node_config.toml" \
  -v "$(pwd)/node-keypair.json:/usr/arx-node/node-keys/node_keypair.json:ro" \
  -v "$(pwd)/callback-kp.json:/usr/arx-node/node-keys/callback_authority_keypair.json:ro" \
  -v "$(pwd)/identity.pem:/usr/arx-node/node-keys/node_identity.pem:ro" \
  -v "$(pwd)/bls-keypair.json:/usr/arx-node/node-keys/bls_keypair.json:ro" \
  -v "$(pwd)/x25519-keypair.json:/usr/arx-node/node-keys/x25519_keypair.json:ro" \
  -v "$(pwd)/arx-node-logs:/usr/arx-node/logs" \
  -v "$(pwd)/private-shares:/usr/arx-node/private-shares" \
  -v "$(pwd)/public-inputs:/usr/arx-node/public-inputs" \
  -p 8001:8001 \
  -p 8002:8002 \
  -p 8012:8012 \
  -p 8013:8013 \
  -p 9091:9091 \
  arcium/arx-node
```

<Warning>Ensure ports 8001, 8002, 8012, 8013, and 9091 are open in your OS and cloud provider firewalls. The metrics endpoint (9091) has no authentication - restrict access to trusted networks only.</Warning>

## Step 9: Verify Node Operation

Check that your node is running correctly:

### Check Node Status

```bash  theme={null}
arcium arx-info <your-node-offset> --rpc-url https://api.devnet.solana.com
```

### Check if Node is Active

```bash  theme={null}
arcium arx-active <your-node-offset> --rpc-url https://api.devnet.solana.com
```

### Metrics & Health

The node exposes Prometheus-compatible metrics on port 9091:

| Endpoint       | Description                 |
| -------------- | --------------------------- |
| `GET /metrics` | Prometheus-format metrics   |
| `GET /health`  | Health check (returns "OK") |

Verify:

```bash  theme={null}
curl -s http://localhost:9091/metrics | grep arx_
curl -s http://localhost:9091/health
```

Scrape with [Prometheus](https://prometheus.io/) and visualize with [Grafana](https://grafana.com/):

```yaml  theme={null}
# prometheus.yml snippet
scrape_configs:
  - job_name: 'arx-node'
    static_configs:
      - targets: ['localhost:9091']
```

### Monitor Logs

If using Docker:

```bash  theme={null}
docker logs -f arx-node
```

### Extract Internal Logs

If you need detailed logs for debugging:

```bash  theme={null}
docker cp arx-node:/usr/arx-node/logs ./node-logs
ls ./node-logs/  # Shows arx_log_<datetime>_<offset>.log
```

## Devnet RPC Provider Recommendations

For better reliability, consider using dedicated RPC providers instead of the default public endpoints. **Free tiers are sufficient for testnet - paid plans are NOT required.**

**Recommended providers:**

* [Helius](https://helius.xyz) - free tier works perfectly for testnet
* [QuickNode](https://quicknode.com) - free tier works perfectly for testnet

## Troubleshooting

<AccordionGroup>
  <Accordion title="Node fails with 'missing environment variable'">
    All 5 environment variables are required. Verify your Docker command includes:

    * `NODE_KEYPAIR_FILE`
    * `CALLBACK_AUTHORITY_KEYPAIR_FILE`
    * `NODE_IDENTITY_FILE`
    * `BLS_PRIVATE_KEY_FILE`
    * `X25519_PRIVATE_KEY_FILE`
  </Accordion>

  <Accordion title="Node fails with 'X25519 key invalid'">
    Regenerate the X25519 keypair:

    ```bash  theme={null}
    arcium generate-x25519 -o x25519-keypair.json
    ```
  </Accordion>

  <Accordion title="Node Not Starting">
    * Verify all 5 keypair files exist and are readable
    * Check that `node-config.toml` is valid TOML with all required fields
    * Ensure your IP address is accessible from the internet
  </Accordion>

  <Accordion title="Node can't reach peers">
    1. Verify firewall allows inbound on ports: 8001, 8002, 8012, 8013, and 9091 (all TCP)
    2. Check RPC endpoint is responsive
    3. Verify node is active: `arcium arx-active <offset>`
  </Accordion>

  <Accordion title="Account Initialization Failed">
    * Verify you have sufficient SOL for transaction fees
    * Check that your RPC endpoint is working
    * Ensure node offset is unique (try a different number)
  </Accordion>

  <Accordion title="Cannot Join Cluster">
    * Verify you've been invited by the cluster authority
    * Check that cluster has available slots
    * Ensure your node is properly initialized
  </Accordion>

  <Accordion title="BLS aggregation failing">
    All cluster nodes need valid BLS keys. After all nodes join:

    ```bash  theme={null}
    arcium submit-aggregated-bls-key \
      --keypair-path node-keypair.json \
      --cluster-offset <cluster-offset> \
      --node-offset <your-node-offset> \
      --rpc-url https://api.devnet.solana.com
    ```
  </Accordion>

  <Accordion title="Callback authority out of funds">
    ```bash  theme={null}
    solana airdrop 2 "$(solana address -k callback-kp.json)" -u devnet
    ```
  </Accordion>

  <Accordion title="Docker Issues">
    * Verify Docker is running
    * Check file permissions on mounted volumes
    * Ensure ports 8001, 8002, 8012, 8013, and 9091 are not already in use
  </Accordion>
</AccordionGroup>

<Tip>**Need more help?** Join the [Arcium Discord](https://discord.gg/arcium) for community support, or review the [installation troubleshooting guide](/developers/installation#issues).</Tip>

## What's Next

Once your Testnet node is running successfully:

* **Join the Community**: Connect with other node operators on [Discord](https://discord.gg/arcium)
* **Stay Updated**: Keep your Arcium tooling updated with `arcup install`
* **Learn More**: Read the [Arcium Network Overview](/getting-started/architecture-overview) or [Installation Guide](/developers/installation)
