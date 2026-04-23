#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env, String};

fn tags(env: &Env, items: &[&str]) -> soroban_sdk::Vec<String> {
    let mut out = soroban_sdk::Vec::new(env);
    for item in items {
        out.push_back(String::from_str(env, item));
    }
    out
}

fn repeated_tag_list(env: &Env, count: u32) -> soroban_sdk::Vec<String> {
    let mut out = soroban_sdk::Vec::new(env);
    let mut idx = 0;

    while idx < count {
        out.push_back(String::from_str(env, "x"));
        idx += 1;
    }

    out
}

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
        &String::from_str(&env, "bafybeib2e6z3testfirstcid"),
        &tags(&env, &["personal", "shopping"]),
        &String::from_str(&env, "Home"),
        &true,
        &10u32,
    );
    let created_second = client.create_note(
        &user,
        &2u32,
        &String::from_str(&env, "ideas"),
        &String::from_str(&env, "bafybeib2e6z3testsecondcid"),
        &tags(&env, &["work"]),
        &String::from_str(&env, "Product"),
        &false,
        &4u32,
    );
    assert!(created_first);
    assert!(created_second);

    // Duplicate note id should be rejected
    let duplicate = client.create_note(
        &user,
        &2u32,
        &String::from_str(&env, "duplicate"),
        &String::from_str(&env, "bafybeib2e6z3testduplicatecid"),
        &tags(&env, &["dup"]),
        &String::from_str(&env, "General"),
        &false,
        &0u32,
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
        &String::from_str(&env, "bafybeib2e6z3testupdatedcid"),
        &tags(&env, &["personal", "urgent"]),
        &String::from_str(&env, "Errands"),
        &true,
        &9u32,
    );
    assert!(updated);

    let notes_after_update = client.get_notes(&user);
    let updated_note = notes_after_update.get(0).unwrap();
    assert_eq!(updated_note.title, String::from_str(&env, "todo-updated"));
    assert_eq!(updated_note.content_cid, String::from_str(&env, "bafybeib2e6z3testupdatedcid"));
    assert_eq!(updated_note.is_pinned, true);
    assert_eq!(updated_note.priority, 9u32);
    assert_eq!(updated_note.category, String::from_str(&env, "Errands"));
    assert_eq!(updated_note.tags.len(), 2);

    let history_after_update = client.get_note_history(&user, &1u32);
    assert_eq!(history_after_update.len(), 2);
    assert_eq!(history_after_update.get(0).unwrap().action, String::from_str(&env, "created"));
    assert_eq!(history_after_update.get(1).unwrap().action, String::from_str(&env, "updated"));

    // Delete note
    let deleted = client.delete_note(&user, &2u32);
    assert!(deleted);

    let notes_after_delete = client.get_notes(&user);
    assert_eq!(notes_after_delete.len(), 1);
    assert_eq!(notes_after_delete.get(0).unwrap().id, 1);

    let deleted_history = client.get_note_history(&user, &2u32);
    assert_eq!(deleted_history.len(), 2);
    assert_eq!(deleted_history.get(0).unwrap().action, String::from_str(&env, "created"));
    assert_eq!(deleted_history.get(1).unwrap().action, String::from_str(&env, "deleted"));
}

#[test]
fn test_logger_event_payload_matches_note_actions() {
    let env = Env::default();
    env.mock_all_auths();

    let logger_id = env.register(super::logger::WASM, ());
    let logger_client = super::logger::Client::new(&env, &logger_id);

    let contract_id = env.register(TakeNotesContract, ());
    let client = TakeNotesContractClient::new(&env, &contract_id);

    client.set_logger(&logger_id);

    let user = Address::generate(&env);
    let note_id = 9u32;

    assert!(client.create_note(
        &user,
        &note_id,
        &String::from_str(&env, "event-test"),
        &String::from_str(&env, "bafybeib2e6z3eventcreatecid"),
        &tags(&env, &["test"]),
        &String::from_str(&env, "General"),
        &false,
        &1u32,
    ));

    assert!(client.update_note(
        &user,
        &note_id,
        &String::from_str(&env, "event-test-updated"),
        &String::from_str(&env, "bafybeib2e6z3eventupdatecid"),
        &tags(&env, &["test", "updated"]),
        &String::from_str(&env, "Work"),
        &true,
        &7u32,
    ));

    assert!(client.delete_note(&user, &note_id));

    let events = logger_client.get_events(&user);
    assert_eq!(events.len(), 3);

    let created = events.get(0).unwrap();
    assert_eq!(created.note_id, note_id);
    assert_eq!(created.action, String::from_str(&env, "Note Created"));

    let updated = events.get(1).unwrap();
    assert_eq!(updated.note_id, note_id);
    assert_eq!(updated.action, String::from_str(&env, "Note Updated"));

    let deleted = events.get(2).unwrap();
    assert_eq!(deleted.note_id, note_id);
    assert_eq!(deleted.action, String::from_str(&env, "Note Deleted"));

    assert!(created.timestamp <= updated.timestamp);
    assert!(updated.timestamp <= deleted.timestamp);
}

#[test]
fn test_rejects_invalid_note_inputs() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(TakeNotesContract, ());
    let client = TakeNotesContractClient::new(&env, &contract_id);

    let user = Address::generate(&env);

    let empty_content = client.create_note(
        &user,
        &11u32,
        &String::from_str(&env, "valid"),
        &String::from_str(&env, ""),
        &tags(&env, &["ok"]),
        &String::from_str(&env, "General"),
        &false,
        &1u32,
    );
    assert!(!empty_content);

    let too_many_tags = client.create_note(
        &user,
        &12u32,
        &String::from_str(&env, "valid"),
        &String::from_str(&env, "bafybeib2e6z3validcid"),
        &repeated_tag_list(&env, 11),
        &String::from_str(&env, "General"),
        &false,
        &1u32,
    );
    assert!(!too_many_tags);

    let invalid_priority = client.create_note(
        &user,
        &13u32,
        &String::from_str(&env, "valid"),
        &String::from_str(&env, "bafybeib2e6z3validcid"),
        &tags(&env, &["ok"]),
        &String::from_str(&env, "General"),
        &false,
        &512u32,
    );
    assert!(!invalid_priority);

    let valid = client.create_note(
        &user,
        &14u32,
        &String::from_str(&env, "valid"),
        &String::from_str(&env, "bafybeib2e6z3validcid"),
        &tags(&env, &["ok"]),
        &String::from_str(&env, "General"),
        &false,
        &5u32,
    );
    assert!(valid);

    let invalid_update = client.update_note(
        &user,
        &14u32,
        &String::from_str(&env, "updated"),
        &String::from_str(&env, ""),
        &tags(&env, &["ok"]),
        &String::from_str(&env, "General"),
        &false,
        &5u32,
    );
    assert!(!invalid_update);

    let notes = client.get_notes(&user);
    assert_eq!(notes.len(), 1);
    assert_eq!(notes.get(0).unwrap().id, 14);
}
