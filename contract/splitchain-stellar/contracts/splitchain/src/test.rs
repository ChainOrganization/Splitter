#![cfg(test)]

use super::*;
use soroban_sdk::{symbol_short, testutils::Address as _, Address, Env};

#[test]
fn test_create_group_and_add_expense() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(SplitChain, ());
    let client = SplitChainClient::new(&env, &contract_id);

    let alice = Address::generate(&env);
    let bob = Address::generate(&env);
    let carol = Address::generate(&env);

    let group_id = symbol_short!("trip");
    let members = vec![&env, alice.clone(), bob.clone(), carol.clone()];

    client.create_group(&group_id, &members);

    // Alice pays 30 (each owes 10)
    client.add_expense(&group_id, &alice, &30_i128, &symbol_short!("dinner"));

    let balances = client.get_balances(&group_id);

    // alice: +30 - 10 = +20
    assert_eq!(balances.get(alice.clone()).unwrap(), 20);
    // bob:  -10
    assert_eq!(balances.get(bob.clone()).unwrap(), -10);
    // carol: -10
    assert_eq!(balances.get(carol.clone()).unwrap(), -10);
}

#[test]
fn test_settle() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(SplitChain, ());
    let client = SplitChainClient::new(&env, &contract_id);

    let alice = Address::generate(&env);
    let bob = Address::generate(&env);

    let group_id = symbol_short!("duo");
    client.create_group(&group_id, &vec![&env, alice.clone(), bob.clone()]);
    client.add_expense(&group_id, &alice, &20_i128, &symbol_short!("lunch"));

    // bob owes alice 10 → settle
    client.settle(&group_id, &bob, &alice, &10_i128);

    let balances = client.get_balances(&group_id);
    assert_eq!(balances.get(alice.clone()).unwrap(), 0);
    assert_eq!(balances.get(bob.clone()).unwrap(), 0);
}
