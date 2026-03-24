#![no_std]

#[cfg(test)]
mod test;

use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, String, Vec};

mod logger {
    soroban_sdk::contractimport!(
        file = "../../target/wasm32-unknown-unknown/release/logger.wasm"
    );
}

#[contract]
pub struct TakeNotesContract;

#[contracttype]
#[derive(Clone)]
pub struct Note {
    pub id: u32,
    pub title: String,
    pub content: String,
    pub timestamp: u64,
}

#[contracttype]
pub enum DataKey {
    Notes(Address),
    Logger,
}

fn find_note_index(notes: &Vec<Note>, id: u32) -> Option<u32> {
    let mut idx: u32 = 0;
    while idx < notes.len() {
        if let Some(note) = notes.get(idx) {
            if note.id == id {
                return Some(idx);
            }
        }
        idx += 1;
    }
    None
}

#[contractimpl]
impl TakeNotesContract {
    pub fn set_logger(env: Env, logger_id: Address) {
        env.storage().instance().set(&DataKey::Logger, &logger_id);
    }

    pub fn create_note(env: Env, user: Address, id: u32, title: String, content: String) -> bool {
        user.require_auth();

        let key = DataKey::Notes(user.clone());
        let mut notes: Vec<Note> = env.storage().instance().get(&key).unwrap_or(Vec::new(&env));

        if find_note_index(&notes, id).is_some() {
            return false;
        }

        let note = Note {
            id,
            title,
            content,
            timestamp: env.ledger().timestamp(),
        };

        notes.push_back(note);
        env.storage().instance().set(&key, &notes);

        if let Some(logger_id) = env.storage().instance().get::<DataKey, Address>(&DataKey::Logger) {
            let client = logger::Client::new(&env, &logger_id);
            client.log_event(&user, &String::from_str(&env, "Note Created"));
        }

        true
    }

    // Legacy entrypoint retained for compatibility with older clients.
    pub fn add_note(env: Env, user: Address, id: u32, text: String) {
        let empty_title = String::from_str(&env, "");
        let _ = Self::create_note(env, user, id, empty_title, text);
    }

    pub fn update_note(
        env: Env,
        user: Address,
        id: u32,
        title: String,
        content: String,
    ) -> bool {
        user.require_auth();

        let key = DataKey::Notes(user);
        let mut notes: Vec<Note> = env.storage().instance().get(&key).unwrap_or(Vec::new(&env));

        if let Some(idx) = find_note_index(&notes, id) {
            let updated = Note {
                id,
                title,
                content,
                timestamp: env.ledger().timestamp(),
            };
            notes.set(idx, updated);
            env.storage().instance().set(&key, &notes);
            return true;
        }

        false
    }

    pub fn delete_note(env: Env, user: Address, id: u32) -> bool {
        user.require_auth();

        let key = DataKey::Notes(user);
        let mut notes: Vec<Note> = env.storage().instance().get(&key).unwrap_or(Vec::new(&env));

        if let Some(idx) = find_note_index(&notes, id) {
            notes.remove(idx);
            env.storage().instance().set(&key, &notes);
            return true;
        }

        false
    }

    pub fn get_notes(env: Env, user: Address) -> Vec<Note> {
        let key = DataKey::Notes(user);

        env.storage().instance().get(&key).unwrap_or(Vec::new(&env))
    }
}