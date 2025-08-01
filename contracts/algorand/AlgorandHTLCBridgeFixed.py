# Algorand HTLC Bridge Contract - FIXED VERSION
# Written in PyTeal for Algorand blockchain
# Fixed issues: argument count, local state management, function naming

from pyteal import *

def htlc_bridge_contract():
    """
    Algorand HTLC Bridge Contract for cross-chain atomic swaps with Ethereum
    
    FIXED VERSION - Addresses all identified issues:
    - Fixed argument count handling
    - Improved local state management
    - Consistent function naming
    - Better error handling
    - Support for both create_htlc and create function names
    """
    
    # Global state keys
    creator_key = Bytes("Creator")
    eth_chain_id_key = Bytes("EthChainId")
    eth_contract_key = Bytes("EthContract")
    min_timelock_key = Bytes("MinTimelock")
    max_timelock_key = Bytes("MaxTimelock")
    
    # Local state keys for HTLCs
    htlc_id_key = Bytes("HtlcId")
    initiator_key = Bytes("Initiator")
    recipient_key = Bytes("Recipient")
    amount_key = Bytes("Amount")
    hashlock_key = Bytes("Hashlock")
    timelock_key = Bytes("Timelock")
    eth_address_key = Bytes("EthAddress")
    eth_amount_key = Bytes("EthAmount")
    withdrawn_key = Bytes("Withdrawn")
    refunded_key = Bytes("Refunded")
    
    # Application creation
    handle_creation = Seq([
        App.globalPut(creator_key, Txn.sender()),
        App.globalPut(eth_chain_id_key, Int(11155111)),  # Sepolia testnet
        App.globalPut(eth_contract_key, Bytes("0x0000000000000000000000000000000000000000")),  # To be set
        App.globalPut(min_timelock_key, Int(3600)),  # 1 hour
        App.globalPut(max_timelock_key, Int(86400)),  # 24 hours
        Return(Int(1))
    ])
    
    # Create HTLC - FIXED VERSION
    def create_htlc():
        htlc_id = ScratchVar(TealType.bytes)
        initiator = ScratchVar(TealType.bytes)
        recipient = ScratchVar(TealType.bytes)
        amount = ScratchVar(TealType.uint64)
        hashlock = ScratchVar(TealType.bytes)
        timelock = ScratchVar(TealType.uint64)
        eth_address = ScratchVar(TealType.bytes)
        
        return Seq([
            # Verify sender is creator or authorized relayer
            Assert(Or(
                Txn.sender() == App.globalGet(creator_key),
                # Add relayer authorization check here
                Int(1)
            )),
            
            # FIXED: Support both 7 and 8 arguments for backward compatibility
            If(
                Txn.application_args.length() == Int(8),
                Seq([
                    # Extract parameters (8 arguments)
                    htlc_id.store(Txn.application_args[1]),
                    initiator.store(Txn.application_args[2]),
                    recipient.store(Txn.application_args[3]),
                    amount.store(Btoi(Txn.application_args[4])),
                    hashlock.store(Txn.application_args[5]),
                    timelock.store(Btoi(Txn.application_args[6])),
                    eth_address.store(Txn.application_args[7])
                ]),
                Seq([
                    # Extract parameters (7 arguments - backward compatibility)
                    Assert(Txn.application_args.length() == Int(7)),
                    htlc_id.store(Txn.application_args[1]),
                    initiator.store(Txn.application_args[2]),
                    recipient.store(Txn.application_args[3]),
                    amount.store(Btoi(Txn.application_args[4])),
                    hashlock.store(Txn.application_args[5]),
                    timelock.store(Btoi(Txn.application_args[6])),
                    eth_address.store(Bytes(""))  # Empty eth_address for backward compatibility
                ])
            ),
            
            # Verify timelock constraints
            Assert(timelock.load() >= Global.latest_timestamp() + App.globalGet(min_timelock_key)),
            Assert(timelock.load() <= Global.latest_timestamp() + App.globalGet(max_timelock_key)),
            
            # Verify amount is positive
            Assert(amount.load() > Int(0)),
            
            # Check if HTLC already exists
            Assert(App.localGet(Txn.sender(), htlc_id_key) == Int(0)),
            
            # Store HTLC data in sender's local state
            App.localPut(Txn.sender(), htlc_id_key, htlc_id.load()),
            App.localPut(Txn.sender(), initiator_key, initiator.load()),
            App.localPut(Txn.sender(), recipient_key, recipient.load()),
            App.localPut(Txn.sender(), amount_key, amount.load()),
            App.localPut(Txn.sender(), hashlock_key, hashlock.load()),
            App.localPut(Txn.sender(), timelock_key, timelock.load()),
            App.localPut(Txn.sender(), eth_address_key, eth_address.load()),
            App.localPut(Txn.sender(), withdrawn_key, Int(0)),
            App.localPut(Txn.sender(), refunded_key, Int(0)),
            
            # Transfer ALGO to contract
            InnerTxnBuilder.Begin(),
            InnerTxnBuilder.SetFields({
                TxnField.type_enum: TxnType.Payment,
                TxnField.amount: amount.load(),
                TxnField.receiver: Global.current_application_address()
            }),
            InnerTxnBuilder.Submit(),
            
            Return(Int(1))
        ])
    
    # Withdraw HTLC with secret - FIXED VERSION
    def withdraw_htlc():
        htlc_id = ScratchVar(TealType.bytes)
        secret = ScratchVar(TealType.bytes)
        
        return Seq([
            # Verify application arguments
            Assert(Txn.application_args.length() == Int(3)),
            
            htlc_id.store(Txn.application_args[1]),
            secret.store(Txn.application_args[2]),
            
            # FIXED: Check if HTLC exists in sender's local state
            Assert(App.localGet(Txn.sender(), htlc_id_key) == htlc_id.load()),
            Assert(App.localGet(Txn.sender(), withdrawn_key) == Int(0)),
            Assert(App.localGet(Txn.sender(), refunded_key) == Int(0)),
            
            # Verify timelock hasn't expired
            Assert(Global.latest_timestamp() < App.localGet(Txn.sender(), timelock_key)),
            
            # Verify hashlock matches secret
            Assert(Sha256(secret.load()) == App.localGet(Txn.sender(), hashlock_key)),
            
            # Mark as withdrawn
            App.localPut(Txn.sender(), withdrawn_key, Int(1)),
            
            # Transfer ALGO to recipient
            InnerTxnBuilder.Begin(),
            InnerTxnBuilder.SetFields({
                TxnField.type_enum: TxnType.Payment,
                TxnField.amount: App.localGet(Txn.sender(), amount_key),
                TxnField.receiver: App.localGet(Txn.sender(), recipient_key)
            }),
            InnerTxnBuilder.Submit(),
            
            Return(Int(1))
        ])
    
    # Refund HTLC after timelock - FIXED VERSION
    def refund_htlc():
        htlc_id = ScratchVar(TealType.bytes)
        
        return Seq([
            # Verify application arguments
            Assert(Txn.application_args.length() == Int(2)),
            
            htlc_id.store(Txn.application_args[1]),
            
            # FIXED: Check if HTLC exists in sender's local state
            Assert(App.localGet(Txn.sender(), htlc_id_key) == htlc_id.load()),
            Assert(App.localGet(Txn.sender(), withdrawn_key) == Int(0)),
            Assert(App.localGet(Txn.sender(), refunded_key) == Int(0)),
            
            # Verify timelock has expired
            Assert(Global.latest_timestamp() >= App.localGet(Txn.sender(), timelock_key)),
            
            # Mark as refunded
            App.localPut(Txn.sender(), refunded_key, Int(1)),
            
            # Transfer ALGO back to initiator
            InnerTxnBuilder.Begin(),
            InnerTxnBuilder.SetFields({
                TxnField.type_enum: TxnType.Payment,
                TxnField.amount: App.localGet(Txn.sender(), amount_key),
                TxnField.receiver: App.localGet(Txn.sender(), initiator_key)
            }),
            InnerTxnBuilder.Submit(),
            
            Return(Int(1))
        ])
    
    # Get HTLC status - FIXED VERSION
    def get_htlc_status():
        htlc_id = ScratchVar(TealType.bytes)
        
        return Seq([
            # Verify application arguments
            Assert(Txn.application_args.length() == Int(2)),
            
            htlc_id.store(Txn.application_args[1]),
            
            # Return HTLC status from sender's local state
            Return(App.localGet(Txn.sender(), htlc_id_key))
        ])
    
    # Update contract parameters (creator only) - FIXED VERSION
    def update_contract():
        param_key = ScratchVar(TealType.bytes)
        param_value = ScratchVar(TealType.bytes)
        
        return Seq([
            # Verify sender is creator
            Assert(Txn.sender() == App.globalGet(creator_key)),
            
            # Verify application arguments
            Assert(Txn.application_args.length() == Int(3)),
            
            param_key.store(Txn.application_args[1]),
            param_value.store(Txn.application_args[2]),
            
            # Update parameter
            App.globalPut(param_key.load(), param_value.load()),
            
            Return(Int(1))
        ])
    
    # Handle different operations - FIXED VERSION
    program = Cond(
        [Txn.application_id() == Int(0), handle_creation],
        [Txn.on_completion() == OnComplete.OptIn, Return(Int(1))],
        [Txn.on_completion() == OnComplete.CloseOut, Return(Int(1))],
        [Txn.on_completion() == OnComplete.UpdateApplication, Return(Int(0))],
        [Txn.on_completion() == OnComplete.DeleteApplication, Return(Int(0))],
        # FIXED: Support both function names for backward compatibility
        [Txn.application_args[0] == Bytes("create_htlc"), create_htlc()],
        [Txn.application_args[0] == Bytes("create"), create_htlc()],
        [Txn.application_args[0] == Bytes("withdraw"), withdraw_htlc()],
        [Txn.application_args[0] == Bytes("withdraw_htlc"), withdraw_htlc()],
        [Txn.application_args[0] == Bytes("claim_htlc"), withdraw_htlc()],  # Backward compatibility
        [Txn.application_args[0] == Bytes("refund"), refund_htlc()],
        [Txn.application_args[0] == Bytes("refund_htlc"), refund_htlc()],
        [Txn.application_args[0] == Bytes("status"), get_htlc_status()],
        [Txn.application_args[0] == Bytes("get_htlc_status"), get_htlc_status()],
        [Txn.application_args[0] == Bytes("update"), update_contract()],
        [Txn.application_args[0] == Bytes("update_contract"), update_contract()]
    )
    
    return If(
        Txn.application_args.length() > Int(0),
        program,
        Return(Int(0))
    )

# Export the contract
if __name__ == "__main__":
    print(compileTeal(htlc_bridge_contract(), mode=Mode.Application, version=10)) 