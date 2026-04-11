#![no_std]

#[cfg(test)]
mod test;

use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, String, Symbol, Vec};

#[contracttype]
#[derive(Clone)]
pub struct ActivityEvent {
    pub note_id: u32,
    pub action: String,
    pub timestamp: u64,
}

#[contracttype]
pub enum DataKey {
    Activity(Address),
}

#[contract]
pub struct LoggerContract;

fn append_event(env: &Env, sender: &Address, note_id: u32, action: String) {
    let key = DataKey::Activity(sender.clone());
    let mut events: Vec<ActivityEvent> = env.storage().instance().get(&key).unwrap_or(Vec::new(env));

    events.push_back(ActivityEvent {
        note_id,
        action,
        timestamp: env.ledger().timestamp(),
    });

    env.storage().instance().set(&key, &events);
}

#[contractimpl]
impl LoggerContract {
    pub fn log_event(env: Env, sender: Address, message: String) {
        sender.require_auth();
        append_event(&env, &sender, 0, message.clone());
        env.events().publish((Symbol::new(&env, "note_action"), sender), message);
    }

    pub fn log_note_event(env: Env, sender: Address, note_id: u32, action: String) {
        sender.require_auth();

        append_event(&env, &sender, note_id, action.clone());
        env.events()
            .publish((Symbol::new(&env, "note_action"), sender, note_id), action);
    }

    pub fn get_events(env: Env, sender: Address) -> Vec<ActivityEvent> {
        let key = DataKey::Activity(sender);
        env.storage().instance().get(&key).unwrap_or(Vec::new(&env))
    }
}
