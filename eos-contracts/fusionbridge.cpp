#include "fusionbridge.hpp"

void fusionbridge::newcontract(
    name sender,
    name receiver,
    asset amount,
    string token_contract,
    checksum256 hashlock,
    uint32_t timelock_seconds,
    string eth_address,
    string eth_token,
    string eth_amount
) {
    require_auth(sender);
    
    check(is_account(receiver), "Receiver account does not exist");
    check(amount.amount > 0, "Amount must be positive");
    check(token_contract.length() > 0, "Token contract required");
    check(eth_address.length() > 0, "Ethereum address required");
    
    validate_timelock(timelock_seconds);
    validate_asset(amount, token_contract);
    
    time_point_sec timelock = time_point_sec(current_time_point().sec_since_epoch() + timelock_seconds);
    
    htlcs_table htlcs(get_self(), get_self().value);
    
    uint64_t new_id = htlcs.available_primary_key();
    
    htlcs.emplace(sender, [&](auto& row) {
        row.id = new_id;
        row.sender = sender;
        row.receiver = receiver;
        row.amount = amount;
        row.token_contract = token_contract;
        row.hashlock = hashlock;
        row.timelock = timelock;
        row.withdrawn = false;
        row.refunded = false;
        row.eth_address = eth_address;
        row.eth_token = eth_token;
        row.eth_amount = eth_amount;
        row.created_at = time_point_sec(current_time_point());
    });
    
    // Transfer tokens to contract
    if (token_contract == "eosio.token") {
        action(
            permission_level{sender, "active"_n},
            "eosio.token"_n,
            "transfer"_n,
            make_tuple(sender, get_self(), amount, string("HTLC deposit for contract " + to_string(new_id)))
        ).send();
    } else {
        action(
            permission_level{sender, "active"_n},
            name(token_contract),
            "transfer"_n,
            make_tuple(sender, get_self(), amount, string("HTLC deposit for contract " + to_string(new_id)))
        ).send();
    }
}

void fusionbridge::withdraw(uint64_t contract_id, checksum256 preimage) {
    htlcs_table htlcs(get_self(), get_self().value);
    auto htlc_itr = htlcs.find(contract_id);
    
    check(htlc_itr != htlcs.end(), "Contract not found");
    check(!htlc_itr->withdrawn, "Already withdrawn");
    check(!htlc_itr->refunded, "Already refunded");
    check(current_time_point() < htlc_itr->timelock, "Contract expired");
    
    // Verify preimage matches hashlock
    checksum256 hash = hash_preimage(preimage);
    check(hash == htlc_itr->hashlock, "Invalid preimage");
    
    // Check if preimage has been used before
    check(!is_preimage_used(preimage), "Preimage already used");
    
    // Mark preimage as used
    mark_preimage_used(preimage);
    
    // Mark as withdrawn
    htlcs.modify(htlc_itr, htlc_itr->sender, [&](auto& row) {
        row.withdrawn = true;
    });
    
    // Transfer tokens to receiver
    if (htlc_itr->token_contract == "eosio.token") {
        action(
            permission_level{get_self(), "active"_n},
            "eosio.token"_n,
            "transfer"_n,
            make_tuple(get_self(), htlc_itr->receiver, htlc_itr->amount, 
                      string("HTLC withdrawal for contract " + to_string(contract_id)))
        ).send();
    } else {
        action(
            permission_level{get_self(), "active"_n},
            name(htlc_itr->token_contract),
            "transfer"_n,
            make_tuple(get_self(), htlc_itr->receiver, htlc_itr->amount,
                      string("HTLC withdrawal for contract " + to_string(contract_id)))
        ).send();
    }
}

void fusionbridge::refund(uint64_t contract_id) {
    htlcs_table htlcs(get_self(), get_self().value);
    auto htlc_itr = htlcs.find(contract_id);
    
    check(htlc_itr != htlcs.end(), "Contract not found");
    check(!htlc_itr->withdrawn, "Already withdrawn");
    check(!htlc_itr->refunded, "Already refunded");
    check(current_time_point() >= htlc_itr->timelock, "Contract not yet expired");
    
    require_auth(htlc_itr->sender);
    
    htlcs.modify(htlc_itr, htlc_itr->sender, [&](auto& row) {
        row.refunded = true;
    });
    
    // Transfer tokens back to sender
    if (htlc_itr->token_contract == "eosio.token") {
        action(
            permission_level{get_self(), "active"_n},
            "eosio.token"_n,
            "transfer"_n,
            make_tuple(get_self(), htlc_itr->sender, htlc_itr->amount,
                      string("HTLC refund for contract " + to_string(contract_id)))
        ).send();
    } else {
        action(
            permission_level{get_self(), "active"_n},
            name(htlc_itr->token_contract),
            "transfer"_n,
            make_tuple(get_self(), htlc_itr->sender, htlc_itr->amount,
                      string("HTLC refund for contract " + to_string(contract_id)))
        ).send();
    }
}

void fusionbridge::cleanup(uint64_t max_rows) {
    require_auth(get_self());
    
    htlcs_table htlcs(get_self(), get_self().value);
    auto time_index = htlcs.get_index<"bytimelock"_n>();
    
    uint64_t cleaned = 0;
    auto itr = time_index.begin();
    
    while (itr != time_index.end() && cleaned < max_rows) {
        if ((itr->withdrawn || itr->refunded) && 
            current_time_point().sec_since_epoch() > itr->timelock.sec_since_epoch() + 86400) {
            itr = time_index.erase(itr);
            cleaned++;
        } else {
            ++itr;
        }
    }
}

void fusionbridge::on_transfer(name from, name to, asset quantity, string memo) {
    if (from == get_self() || to != get_self()) {
        return;
    }
    
    // Handle direct token transfers for HTLC contracts
    // This is called automatically when tokens are sent to the contract
}

void fusionbridge::validate_timelock(uint32_t timelock_seconds) {
    check(timelock_seconds >= MIN_TIMELOCK, "Timelock too short (minimum 1 hour)");
    check(timelock_seconds <= MAX_TIMELOCK, "Timelock too long (maximum 48 hours)");
}

void fusionbridge::validate_asset(const asset& quantity, const string& token_contract) {
    check(quantity.is_valid(), "Invalid asset");
    check(quantity.amount > 0, "Asset amount must be positive");
    check(token_contract.length() > 0, "Token contract cannot be empty");
}

bool fusionbridge::is_preimage_used(checksum256 preimage) {
    preimages_table preimages(get_self(), get_self().value);
    checksum256 preimage_hash = hash_preimage(preimage);
    auto hash_index = preimages.get_index<"byhash"_n>();
    return hash_index.find(preimage_hash) != hash_index.end();
}

void fusionbridge::mark_preimage_used(checksum256 preimage) {
    preimages_table preimages(get_self(), get_self().value);
    checksum256 preimage_hash = hash_preimage(preimage);
    
    preimages.emplace(get_self(), [&](auto& row) {
        row.id = preimages.available_primary_key();
        row.preimage_hash = preimage_hash;
    });
}

checksum256 fusionbridge::hash_preimage(checksum256 preimage) {
    return sha256(reinterpret_cast<const char*>(&preimage), sizeof(preimage));
}