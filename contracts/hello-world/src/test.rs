#![cfg(test)]

use super::*;
use soroban_sdk::{Env, Address, Symbol};

#[test]
fn test_add_and_get_notes() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(TakeNotesContract, ());
    let client = TakeNotesContractClient::new(&env, &contract_id);

    let user = Address::generate(&env);

    // Add two notes
    client.add_note(&user, &1u32, &Symbol::new(&env, "hello"));
    client.add_note(&user, &2u32, &Symbol::new(&env, "world"));

    // Get notes and verify
    let notes = client.get_notes(&user);
    assert_eq!(notes.len(), 2);
    assert_eq!(notes.get(0).unwrap().id, 1);
    assert_eq!(notes.get(1).unwrap().id, 2);
}
