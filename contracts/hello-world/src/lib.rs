#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, String, Vec};

#[contract]
pub struct TakeNotesContract;

#[contracttype]
#[derive(Clone)]
pub struct Note {
    pub id: u32,
    pub text: String,
}

#[contracttype]
pub enum DataKey {
    Notes(Address),
}

#[contractimpl]
impl TakeNotesContract {

    pub fn add_note(env: Env, user: Address, id: u32, text: String) {
        user.require_auth();

        let key = DataKey::Notes(user.clone());

        let mut notes: Vec<Note> =
            env.storage().instance().get(&key).unwrap_or(Vec::new(&env));

        let note = Note { id, text };

        notes.push_back(note);

        env.storage().instance().set(&key, &notes);
    }

    pub fn get_notes(env: Env, user: Address) -> Vec<Note> {
        let key = DataKey::Notes(user);

        env.storage().instance().get(&key).unwrap_or(Vec::new(&env))
    }
}