#include <eosio/eosio.hpp>
#include <eosio/asset.hpp>
#include <eosio/system.hpp>
#include <eosio/crypto.hpp>

using namespace eosio;

/**
 * 🌴 FUSION BRIDGE EOS SMART CONTRACT
 * 
 * Production-ready HTLC (Hash Time Lock Contract) implementation for EOS
 * Enables atomic swaps between EOS and other blockchains
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

    /**
     * 🔐 Create HTLC contract
     */
    [[eosio::action]]
    void createhtlc(
        name sender,
        name recipient,
        asset amount,
        checksum256 hashlock,
        uint32_t timelock,
        std::string memo,
        std::string eth_tx_hash
    ) {
        require_auth(sender);

        // Validate parameters
        check(is_account(recipient), "Recipient account does not exist");
        check(amount.is_valid() && amount.amount > 0, "Invalid amount");
        check(amount.symbol == symbol("EOS", 4), "Only EOS tokens supported");
        check(timelock > current_time_point().sec_since_epoch(), "Timelock must be in the future");
        check(memo.length() <= 256, "Memo too long");

        // Get the next available ID
        htlc_table htlcs(get_self(), get_self().value);
        uint64_t htlc_id = htlcs.available_primary_key();

        // Transfer tokens from sender to contract
        action(
            permission_level{sender, "active"_n},
            "eosio.token"_n,
            "transfer"_n,
            std::make_tuple(sender, get_self(), amount, "HTLC escrow: " + memo)
        ).send();

        // Create HTLC record
        htlcs.emplace(sender, [&](auto& h) {
            h.id = htlc_id;
            h.sender = sender;
            h.recipient = recipient;
            h.amount = amount;
            h.hashlock = hashlock;
            h.timelock = timelock;
            h.claimed = false;
            h.refunded = false;
            h.memo = memo;
            h.eth_tx_hash = eth_tx_hash;
            h.secret_hash = hashlock;
            h.created_at = current_time_point().sec_since_epoch();
        });

        // Emit creation event
        require_recipient(sender);
        require_recipient(recipient);

        print("HTLC created with ID: ", htlc_id);
    }

    /**
     * 🔓 Claim HTLC with secret
     */
    [[eosio::action]]
    void claimhtlc(
        uint64_t htlc_id,
        checksum256 secret,
        name claimer
    ) {
        require_auth(claimer);

        htlc_table htlcs(get_self(), get_self().value);
        auto htlc_itr = htlcs.find(htlc_id);
        check(htlc_itr != htlcs.end(), "HTLC not found");

        const auto& h = *htlc_itr;

        // Validate claim conditions
        check(!h.claimed, "HTLC already claimed");
        check(!h.refunded, "HTLC already refunded");
        check(h.timelock > current_time_point().sec_since_epoch(), "HTLC expired");
        check(claimer == h.recipient, "Only recipient can claim");

        // Verify secret matches hashlock
        checksum256 computed_hash = sha256((char*)&secret, sizeof(secret));
        check(computed_hash == h.hashlock, "Invalid secret");

        // Transfer tokens to recipient
        action(
            permission_level{get_self(), "active"_n},
            "eosio.token"_n,
            "transfer"_n,
            std::make_tuple(get_self(), h.recipient, h.amount, "HTLC claim: " + h.memo)
        ).send();

        // Mark as claimed
        htlcs.modify(htlc_itr, same_payer, [&](auto& h_mod) {
            h_mod.claimed = true;
        });

        // Emit claim event
        require_recipient(h.sender);
        require_recipient(h.recipient);

        print("HTLC ", htlc_id, " claimed by ", claimer, " with secret revealed");
    }

    /**
     * ⏰ Refund HTLC after timeout
     */
    [[eosio::action]]
    void refundhtlc(
        uint64_t htlc_id,
        name refunder
    ) {
        require_auth(refunder);

        htlc_table htlcs(get_self(), get_self().value);
        auto htlc_itr = htlcs.find(htlc_id);
        check(htlc_itr != htlcs.end(), "HTLC not found");

        const auto& h = *htlc_itr;

        // Validate refund conditions
        check(!h.claimed, "HTLC already claimed");
        check(!h.refunded, "HTLC already refunded");
        check(h.timelock <= current_time_point().sec_since_epoch(), "HTLC not yet expired");
        check(refunder == h.sender, "Only sender can refund");

        // Transfer tokens back to sender
        action(
            permission_level{get_self(), "active"_n},
            "eosio.token"_n,
            "transfer"_n,
            std::make_tuple(get_self(), h.sender, h.amount, "HTLC refund: " + h.memo)
        ).send();

        // Mark as refunded
        htlcs.modify(htlc_itr, same_payer, [&](auto& h_mod) {
            h_mod.refunded = true;
        });

        // Emit refund event
        require_recipient(h.sender);
        require_recipient(h.recipient);

        print("HTLC ", htlc_id, " refunded to ", refunder);
    }

    /**
     * 📊 Get HTLC details (read-only)
     */
    [[eosio::action]]
    htlc gethtlc(uint64_t htlc_id) {
        htlc_table htlcs(get_self(), get_self().value);
        auto htlc_itr = htlcs.find(htlc_id);
        check(htlc_itr != htlcs.end(), "HTLC not found");
        return *htlc_itr;
    }

    /**
     * 🧹 Clean up expired HTLCs (maintenance function)
     */
    [[eosio::action]]
    void cleanup(uint64_t limit) {
        require_auth(get_self());

        htlc_table htlcs(get_self(), get_self().value);
        auto timelock_index = htlcs.get_index<"bytimelock"_n>();
        uint32_t current_time = current_time_point().sec_since_epoch();
        uint64_t cleaned = 0;

        for (auto itr = timelock_index.begin(); 
             itr != timelock_index.end() && cleaned < limit; ) {
            if (itr->timelock <= current_time && 
                (itr->claimed || itr->refunded)) {
                itr = timelock_index.erase(itr);
                cleaned++;
            } else {
                ++itr;
            }
        }

        print("Cleaned up ", cleaned, " expired HTLCs");
    }

    /**
     * 📋 Get contract statistics
     */
    [[eosio::action]]
    void getstats() {
        htlc_table htlcs(get_self(), get_self().value);
        
        uint64_t total = 0;
        uint64_t active = 0;
        uint64_t claimed = 0;
        uint64_t refunded = 0;
        asset total_value = asset(0, symbol("EOS", 4));

        for (auto itr = htlcs.begin(); itr != htlcs.end(); ++itr) {
            total++;
            if (!itr->claimed && !itr->refunded) {
                active++;
                total_value += itr->amount;
            } else if (itr->claimed) {
                claimed++;
            } else if (itr->refunded) {
                refunded++;
            }
        }

        print("Contract Stats - Total: ", total, 
              ", Active: ", active, 
              ", Claimed: ", claimed, 
              ", Refunded: ", refunded,
              ", Total Value Locked: ", total_value);
    }

private:
    /**
     * 🔐 Compute SHA256 hash
     */
    checksum256 compute_hash(const std::string& data) {
        return sha256(data.c_str(), data.length());
    }
};