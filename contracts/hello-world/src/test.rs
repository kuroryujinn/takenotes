#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env, String};

#[test]
fn test_crud_notes() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(TakeNotesContract, ());
    let client = TakeNotesContractClient::new(&env, &contract_id);

    let user = Address::generate(&env);

    // Create two notes
    let created_first = client.create_note(
        &user,
        &1u32,
        &String::from_str(&env, "todo"),
        &String::from_str(&env, "buy milk"),
    );
    let created_second = client.create_note(
        &user,
        &2u32,
        &String::from_str(&env, "ideas"),
        &String::from_str(&env, "build stellar app"),
    );
    assert!(created_first);
    assert!(created_second);

    // Duplicate note id should be rejected
    let duplicate = client.create_note(
        &user,
        &2u32,
        &String::from_str(&env, "duplicate"),
        &String::from_str(&env, "duplicate"),
    );
    assert!(!duplicate);

    // Get notes and verify
    let notes = client.get_notes(&user);
    assert_eq!(notes.len(), 2);
    assert_eq!(notes.get(0).unwrap().id, 1);
    assert_eq!(notes.get(1).unwrap().id, 2);

    // Update note
    let updated = client.update_note(
        &user,
        &1u32,
        &String::from_str(&env, "todo-updated"),
        &String::from_str(&env, "buy milk and eggs"),
    );
    assert!(updated);

    let notes_after_update = client.get_notes(&user);
    let updated_note = notes_after_update.get(0).unwrap();
    assert_eq!(updated_note.title, String::from_str(&env, "todo-updated"));
    assert_eq!(updated_note.content, String::from_str(&env, "buy milk and eggs"));

    // Delete note
    let deleted = client.delete_note(&user, &2u32);
    assert!(deleted);

    let notes_after_delete = client.get_notes(&user);
    assert_eq!(notes_after_delete.len(), 1);
    assert_eq!(notes_after_delete.get(0).unwrap().id, 1);
}
