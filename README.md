# TakeNotes Soroban Smart Contract

## Project Description

TakeNotes is a decentralized note-taking smart contract built on the Stellar Soroban platform.  
It allows users to securely store and retrieve personal notes directly on the blockchain using their wallet address as an identifier.

Unlike traditional note applications that rely on centralized servers, this project ensures that notes are stored transparently and securely through smart contract storage.

---

## What It Does

The smart contract enables users to:

- Create and store notes on-chain
- Associate notes with their Stellar wallet address
- Retrieve previously stored notes

All interactions require authentication, ensuring that only the owner of a wallet can add notes linked to their account.

---

## Features

- Decentralized note storage
- Wallet-based user identity
- Secure authentication using Stellar addresses
- Simple on-chain data structure for notes
- Built using Rust and the Soroban smart contract framework

---

## Smart Contract Functions

### add_note
Adds a new note associated with a user's address.

Parameters:
- user: Stellar address
- id: unique note identifier
- text: note content

### get_notes
Retrieves all notes linked to a specific user address.

Parameters:
- user: Stellar address

---

## Tech Stack

- Stellar Blockchain
- Soroban Smart Contracts
- Rust
- Soroban SDK

---

## Deployed Smart Contract

Deployed Smart Contract Link:  
XXX

(Replace with your deployed contract link)
 https://stellar.expert/explorer/testnet/tx/1aa57771d0b2c3814ae4bcd823776f86b738213077191162aa51d0f76082855d!

 https://lab.stellar.org/r/testnet/contract/CBMLFQ25PGW3LELR24SWC3QFASDM4VTNS74TUAIJV7J3UC3LN2XEZMEQ
 
![Deployment Screenshot](images/deployment.png)

![Frontend-preview](images/frontend-preview.png)
