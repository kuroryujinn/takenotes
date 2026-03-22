#![no_std]
use soroban_sdk::{contract, contractimpl, Address, Env, String, Symbol};

#[contract]
pub struct LoggerContract;

#[contractimpl]
impl LoggerContract {
    pub fn log_event(env: Env, sender: Address, message: String) {
        sender.require_auth();
        env.events().publish((Symbol::new(&env, "note_action"), sender), message);
    }
}
