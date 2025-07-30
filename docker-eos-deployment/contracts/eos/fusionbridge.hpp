#pragma once

#include <eosio/eosio.hpp>
#include <eosio/asset.hpp>
#include <eosio/system.hpp>
#include <eosio/crypto.hpp>

using namespace eosio;

/**
 * 🌴 FUSION BRIDGE EOS SMART CONTRACT HEADER
 */
class [[eosio::contract("fusionbridge")]] fusionbridge : public contract {
public:
    using contract::contract;

    // HTLC structure
    struct [[eosio::table]] htlc {
        uint64_t id;
        name sender;
        name recipient;
        asset amount;
        checksum256 hashlock;
        uint32_t timelock;
        bool claimed;
        bool refunded;
        std::string memo;
        std::string eth_tx_hash;
        checksum256 secret_hash;
        uint32_t created_at;

        uint64_t primary_key() const { return id; }
        uint64_t by_sender() const { return sender.value; }
        uint64_t by_recipient() const { return recipient.value; }
        uint64_t by_timelock() const { return timelock; }
    };

    // Multi-index table definition
    typedef eosio::multi_index<"htlcs"_n, htlc,
        indexed_by<"bysender"_n, const_mem_fun<htlc, uint64_t, &htlc::by_sender>>,
        indexed_by<"byrecipient"_n, const_mem_fun<htlc, uint64_t, &htlc::by_recipient>>,
        indexed_by<"bytimelock"_n, const_mem_fun<htlc, uint64_t, &htlc::by_timelock>>
    > htlc_table;

    // Actions
    [[eosio::action]]
    void createhtlc(
        name sender,
        name recipient,
        asset amount,
        checksum256 hashlock,
        uint32_t timelock,
        std::string memo,
        std::string eth_tx_hash
    );

    [[eosio::action]]
    void claimhtlc(
        uint64_t htlc_id,
        checksum256 secret,
        name claimer
    );

    [[eosio::action]]
    void refundhtlc(
        uint64_t htlc_id,
        name refunder
    );

    [[eosio::action]]
    htlc gethtlc(uint64_t htlc_id);

    [[eosio::action]]
    void cleanup(uint64_t limit);

    [[eosio::action]]
    void getstats();

private:
    checksum256 compute_hash(const std::string& data);
};