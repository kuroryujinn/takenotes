#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::Address as _,
    Address, Env, String,
};

#[test]
fn test_log_note_event_persists_payload_and_emits_expected_topics() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(LoggerContract, ());
    let client = LoggerContractClient::new(&env, &contract_id);
    let sender = Address::generate(&env);

    client.log_note_event(&sender, &42u32, &String::from_str(&env, "Note Updated"));

    let events = client.get_events(&sender);
    assert_eq!(events.len(), 1);

    let stored = events.get(0).unwrap();
    assert_eq!(stored.note_id, 42);
    assert_eq!(stored.action, String::from_str(&env, "Note Updated"));
    assert_eq!(stored.timestamp, env.ledger().timestamp());

    let second_action = String::from_str(&env, "Note Deleted");
    client.log_note_event(&sender, &42u32, &second_action);

    let events_after_second_write = client.get_events(&sender);
    assert_eq!(events_after_second_write.len(), 2);
    assert_eq!(events_after_second_write.get(1).unwrap().action, second_action);
}

#[test]
fn test_log_event_appends_legacy_message_with_default_note_id() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(LoggerContract, ());
    let client = LoggerContractClient::new(&env, &contract_id);
    let sender = Address::generate(&env);

    client.log_event(&sender, &String::from_str(&env, "legacy"));

    let stored = client.get_events(&sender);
    assert_eq!(stored.len(), 1);
    let entry = stored.get(0).unwrap();
    assert_eq!(entry.note_id, 0);
    assert_eq!(entry.action, String::from_str(&env, "legacy"));

    let all_for_unknown_sender = client.get_events(&Address::generate(&env));
    assert_eq!(all_for_unknown_sender.len(), 0);
}
