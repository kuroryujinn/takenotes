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
    pub content_cid: String,
    pub tags: Vec<String>,
    pub category: String,
    pub is_pinned: bool,
    pub priority: u32,
    pub timestamp: u64,
}

#[contracttype]
#[derive(Clone)]
pub struct NoteVersion {
    pub note_id: u32,
    pub version: u32,
    pub action: String,
    pub title: String,
    pub content_cid: String,
    pub tags: Vec<String>,
    pub category: String,
    pub is_pinned: bool,
    pub priority: u32,
    pub timestamp: u64,
}

#[contracttype]
pub enum DataKey {
    Notes(Address),
    NoteHistory(Address, u32),
    Logger,
}

const MAX_TITLE_LEN: u32 = 120;
const MAX_CONTENT_CID_LEN: u32 = 256;
const MAX_CATEGORY_LEN: u32 = 40;
const MAX_TAG_LEN: u32 = 24;
const MAX_TAG_COUNT: u32 = 10;
const MAX_PRIORITY: u32 = 255;

fn is_valid_note_input(
    title: &String,
    content_cid: &String,
    tags: &Vec<String>,
    category: &String,
    priority: u32,
) -> bool {
    if title.len() > MAX_TITLE_LEN {
        return false;
    }

    if content_cid.len() == 0 || content_cid.len() > MAX_CONTENT_CID_LEN {
        return false;
    }

    if category.len() == 0 || category.len() > MAX_CATEGORY_LEN {
        return false;
    }

    if tags.len() > MAX_TAG_COUNT {
        return false;
    }

    let mut idx: u32 = 0;
    while idx < tags.len() {
        if let Some(tag) = tags.get(idx) {
            if tag.len() == 0 || tag.len() > MAX_TAG_LEN {
                return false;
            }
        }
        idx += 1;
    }

    if priority > MAX_PRIORITY {
        return false;
    }

    true
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

fn push_history_entry(env: &Env, user: &Address, note: &Note, action: &str) {
    let history_key = DataKey::NoteHistory(user.clone(), note.id);
    let mut history: Vec<NoteVersion> = env
        .storage()
        .instance()
        .get(&history_key)
        .unwrap_or(Vec::new(env));

    history.push_back(NoteVersion {
        note_id: note.id,
        version: history.len() + 1,
        action: String::from_str(env, action),
        title: note.title.clone(),
        content_cid: note.content_cid.clone(),
        tags: note.tags.clone(),
        category: note.category.clone(),
        is_pinned: note.is_pinned,
        priority: note.priority,
        timestamp: note.timestamp,
    });

    env.storage().instance().set(&history_key, &history);
}

fn publish_note_event(env: &Env, user: &Address, note_id: u32, action: &str) {
    if let Some(logger_id) = env.storage().instance().get::<DataKey, Address>(&DataKey::Logger) {
        let client = logger::Client::new(env, &logger_id);
        client.log_note_event(user, &note_id, &String::from_str(env, action));
    }
}

#[contractimpl]
impl TakeNotesContract {
    pub fn set_logger(env: Env, logger_id: Address) {
        env.storage().instance().set(&DataKey::Logger, &logger_id);
    }

    pub fn create_note(
        env: Env,
        user: Address,
        id: u32,
        title: String,
        content_cid: String,
        tags: Vec<String>,
        category: String,
        is_pinned: bool,
        priority: u32,
    ) -> bool {
        user.require_auth();

        if !is_valid_note_input(&title, &content_cid, &tags, &category, priority) {
            return false;
        }

        let key = DataKey::Notes(user.clone());
        let mut notes: Vec<Note> = env.storage().instance().get(&key).unwrap_or(Vec::new(&env));

        if find_note_index(&notes, id).is_some() {
            return false;
        }

        let note = Note {
            id,
            title,
            content_cid,
            tags,
            category,
            is_pinned,
            priority,
            timestamp: env.ledger().timestamp(),
        };

        notes.push_back(note);
        env.storage().instance().set(&key, &notes);

        if let Some(created_note) = notes.get(notes.len() - 1) {
            push_history_entry(&env, &user, &created_note, "created");
        }

        publish_note_event(&env, &user, id, "Note Created");

        true
    }

    // Legacy entrypoint retained for compatibility with older clients.
    pub fn add_note(env: Env, user: Address, id: u32, text: String) {
        let empty_title = String::from_str(&env, "");
        let empty_tags = Vec::new(&env);
        let empty_category = String::from_str(&env, "General");
        let _ = Self::create_note(
            env,
            user,
            id,
            empty_title,
            text,
            empty_tags,
            empty_category,
            false,
            0,
        );
    }

    pub fn update_note(
        env: Env,
        user: Address,
        id: u32,
        title: String,
        content_cid: String,
        tags: Vec<String>,
        category: String,
        is_pinned: bool,
        priority: u32,
    ) -> bool {
        user.require_auth();

        if !is_valid_note_input(&title, &content_cid, &tags, &category, priority) {
            return false;
        }

        let key = DataKey::Notes(user.clone());
        let mut notes: Vec<Note> = env.storage().instance().get(&key).unwrap_or(Vec::new(&env));

        if let Some(idx) = find_note_index(&notes, id) {
            let updated = Note {
                id,
                title,
                content_cid,
                tags,
                category,
                is_pinned,
                priority,
                timestamp: env.ledger().timestamp(),
            };
            notes.set(idx, updated.clone());
            env.storage().instance().set(&key, &notes);

            push_history_entry(&env, &user, &updated, "updated");
            publish_note_event(&env, &user, id, "Note Updated");
            return true;
        }

        false
    }

    pub fn delete_note(env: Env, user: Address, id: u32) -> bool {
        user.require_auth();

        let key = DataKey::Notes(user.clone());
        let mut notes: Vec<Note> = env.storage().instance().get(&key).unwrap_or(Vec::new(&env));

        if let Some(idx) = find_note_index(&notes, id) {
            if let Some(existing_note) = notes.get(idx) {
                let deleted_snapshot = Note {
                    id: existing_note.id,
                    title: existing_note.title,
                    content_cid: existing_note.content_cid,
                    tags: existing_note.tags,
                    category: existing_note.category,
                    is_pinned: existing_note.is_pinned,
                    priority: existing_note.priority,
                    timestamp: env.ledger().timestamp(),
                };
                push_history_entry(&env, &user, &deleted_snapshot, "deleted");
            }

            notes.remove(idx);
            env.storage().instance().set(&key, &notes);

            publish_note_event(&env, &user, id, "Note Deleted");
            return true;
        }

        false
    }

    pub fn get_notes(env: Env, user: Address) -> Vec<Note> {
        let key = DataKey::Notes(user);

        env.storage().instance().get(&key).unwrap_or(Vec::new(&env))
    }

    pub fn get_note_history(env: Env, user: Address, id: u32) -> Vec<NoteVersion> {
        let key = DataKey::NoteHistory(user, id);

        env.storage().instance().get(&key).unwrap_or(Vec::new(&env))
    }
}