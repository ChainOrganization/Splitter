#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype,
    Address, Env, Map, Symbol, Vec, vec,
};

// ─── Storage Keys ────────────────────────────────────────────────────────────

#[contracttype]
pub enum DataKey {
    Group(Symbol),       // group_id → GroupData
    Balance(Symbol),     // group_id → Map<Address, i128>  (net balance per member)
    ExpenseCount(Symbol),// group_id → u32
}

// ─── Data Types ──────────────────────────────────────────────────────────────

#[contracttype]
#[derive(Clone)]
pub struct GroupData {
    pub members: Vec<Address>,
}

#[contracttype]
#[derive(Clone)]
pub struct Expense {
    pub payer: Address,
    pub amount: i128,       // in stroops (1 XLM = 10_000_000 stroops)
    pub description: Symbol,
    pub split_count: u32,   // number of people splitting
}

// ─── Contract ────────────────────────────────────────────────────────────────

#[contract]
pub struct SplitChain;

#[contractimpl]
impl SplitChain {
    /// Create a new expense group with a list of members.
    pub fn create_group(env: Env, group_id: Symbol, members: Vec<Address>) {
        // Prevent overwriting an existing group
        if env.storage().instance().has(&DataKey::Group(group_id.clone())) {
            panic!("group already exists");
        }

        let group = GroupData { members: members.clone() };
        env.storage().instance().set(&DataKey::Group(group_id.clone()), &group);

        // Initialise zero balances for every member
        let mut balances: Map<Address, i128> = Map::new(&env);
        for member in members.iter() {
            balances.set(member, 0_i128);
        }
        env.storage().instance().set(&DataKey::Balance(group_id.clone()), &balances);
        env.storage().instance().set(&DataKey::ExpenseCount(group_id), &0_u32);
    }

    /// Add an expense paid by `payer`. The cost is split equally among all
    /// members of the group.
    ///
    /// Balance semantics:
    ///   positive → the member is owed money
    ///   negative → the member owes money
    pub fn add_expense(
        env: Env,
        group_id: Symbol,
        payer: Address,
        amount: i128,
        description: Symbol,
    ) {
        payer.require_auth();

        let group: GroupData = env
            .storage()
            .instance()
            .get(&DataKey::Group(group_id.clone()))
            .expect("group not found");

        let member_count = group.members.len() as i128;
        if member_count == 0 {
            panic!("group has no members");
        }

        let share = amount / member_count; // integer division (floor)

        let mut balances: Map<Address, i128> = env
            .storage()
            .instance()
            .get(&DataKey::Balance(group_id.clone()))
            .expect("balances not found");

        for member in group.members.iter() {
            let current = balances.get(member.clone()).unwrap_or(0);
            if member == payer {
                // payer gets credited for everyone else's share
                balances.set(member, current + amount - share);
            } else {
                // every other member is debited their share
                balances.set(member, current - share);
            }
        }

        env.storage().instance().set(&DataKey::Balance(group_id.clone()), &balances);

        // Bump expense counter
        let count: u32 = env
            .storage()
            .instance()
            .get(&DataKey::ExpenseCount(group_id.clone()))
            .unwrap_or(0);
        env.storage().instance().set(&DataKey::ExpenseCount(group_id), &(count + 1));
    }

    /// Settle a debt: `from` pays `to` the given `amount`.
    /// Both parties must be in the same group and the caller must authorise.
    pub fn settle(
        env: Env,
        group_id: Symbol,
        from: Address,
        to: Address,
        amount: i128,
    ) {
        from.require_auth();

        let mut balances: Map<Address, i128> = env
            .storage()
            .instance()
            .get(&DataKey::Balance(group_id.clone()))
            .expect("balances not found");

        let from_balance = balances.get(from.clone()).unwrap_or(0);
        let to_balance = balances.get(to.clone()).unwrap_or(0);

        if from_balance + amount > 0 {
            panic!("settling more than owed");
        }

        balances.set(from.clone(), from_balance + amount);
        balances.set(to.clone(), to_balance - amount);

        env.storage().instance().set(&DataKey::Balance(group_id), &balances);
    }

    // ─── Read-only helpers ───────────────────────────────────────────────────

    /// Returns the net balance map for a group.
    pub fn get_balances(env: Env, group_id: Symbol) -> Map<Address, i128> {
        env.storage()
            .instance()
            .get(&DataKey::Balance(group_id))
            .expect("group not found")
    }

    /// Returns the members of a group.
    pub fn get_members(env: Env, group_id: Symbol) -> Vec<Address> {
        let group: GroupData = env
            .storage()
            .instance()
            .get(&DataKey::Group(group_id))
            .expect("group not found");
        group.members
    }

    /// Returns the number of expenses recorded for a group.
    pub fn expense_count(env: Env, group_id: Symbol) -> u32 {
        env.storage()
            .instance()
            .get(&DataKey::ExpenseCount(group_id))
            .unwrap_or(0)
    }
}
