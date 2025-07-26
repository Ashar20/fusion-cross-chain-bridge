#pragma once

#include <eosio/eosio.hpp>
#include <eosio/asset.hpp>
#include <eosio/time.hpp>
#include <eosio/crypto.hpp>
#include <eosio/transaction.hpp>

using namespace eosio;
using namespace std;

class [[eosio::contract("fusionbridge")]] fusionbridge : public contract {
public:
    using contract::contract;

    struct [[eosio::table]] htlc_contract {
        uint64_t id;
        name sender;
        name receiver;
        asset amount;
        string token_contract;
        checksum256 hashlock;
        time_point_sec timelock;
        bool withdrawn;
        bool refunded;
        string eth_address;
        string eth_token;
        string eth_amount;
        time_point_sec created_at;

        uint64_t primary_key() const { return id; }
        checksum256 by_hashlock() const { return hashlock; }
        uint64_t by_sender() const { return sender.value; }
        uint64_t by_timelock() const { return timelock.sec_since_epoch(); }
    };

    struct [[eosio::table]] used_preimages {
        uint64_t id;
        checksum256 preimage_hash;
        
        uint64_t primary_key() const { return id; }
        checksum256 by_hash() const { return preimage_hash; }
    };

    typedef multi_index<"htlcs"_n, htlc_contract,
        indexed_by<"byhashlock"_n, const_mem_fun<htlc_contract, checksum256, &htlc_contract::by_hashlock>>,
        indexed_by<"bysender"_n, const_mem_fun<htlc_contract, uint64_t, &htlc_contract::by_sender>>,
        indexed_by<"bytimelock"_n, const_mem_fun<htlc_contract, uint64_t, &htlc_contract::by_timelock>>
    > htlcs_table;

    typedef multi_index<"preimages"_n, used_preimages,
        indexed_by<"byhash"_n, const_mem_fun<used_preimages, checksum256, &used_preimages::by_hash>>
    > preimages_table;

    [[eosio::action]]
    void newcontract(
        name sender,
        name receiver,
        asset amount,
        string token_contract,
        checksum256 hashlock,
        uint32_t timelock_seconds,
        string eth_address,
        string eth_token,
        string eth_amount
    );

    [[eosio::action]]
    void withdraw(uint64_t contract_id, checksum256 preimage);

    [[eosio::action]]
    void refund(uint64_t contract_id);

    [[eosio::action]]
    void cleanup(uint64_t max_rows);

    [[eosio::on_notify("eosio.token::transfer")]]
    void on_transfer(name from, name to, asset quantity, string memo);

private:
    static constexpr uint32_t MIN_TIMELOCK = 3600; // 1 hour
    static constexpr uint32_t MAX_TIMELOCK = 172800; // 48 hours
    
    void validate_timelock(uint32_t timelock_seconds);
    void validate_asset(const asset& quantity, const string& token_contract);
    bool is_preimage_used(checksum256 preimage);
    void mark_preimage_used(checksum256 preimage);
    checksum256 hash_preimage(checksum256 preimage);
};