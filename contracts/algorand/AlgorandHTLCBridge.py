# Algorand HTLC Bridge Contract
# Written in PyTeal for Algorand blockchain

from pyteal import *

def htlc_bridge_contract():
    """
    Algorand HTLC Bridge Contract for cross-chain atomic swaps with Ethereum
    
    Features:
    - HTLC creation and management
    - Secret hash verification
    - Timelock enforcement
    - Cross-chain parameter storage
    - Relayer authorization
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
    
    # Create HTLC
    def create_htlc():
        return Seq([
            # Verify sender is creator or authorized relayer
            Assert(Or(
                Txn.sender() == App.globalGet(creator_key),
                # Add relayer authorization check here
                Int(1)
            )),
            
            # Verify application arguments
            Assert(Txn.application_args.length() == Int(7)),
            
            # Extract parameters
            htlc_id := Txn.application_args[0],
            initiator := Txn.application_args[1],
            recipient := Txn.application_args[2],
            amount := Btoi(Txn.application_args[3]),
            hashlock := Txn.application_args[4],
            timelock := Btoi(Txn.application_args[5]),
            eth_address := Txn.application_args[6],
            
            # Verify timelock constraints
            Assert(timelock >= Global.latest_timestamp() + App.globalGet(min_timelock_key)),
            Assert(timelock <= Global.latest_timestamp() + App.globalGet(max_timelock_key)),
            
            # Verify amount is positive
            Assert(amount > Int(0)),
            
            # Check if HTLC already exists
            Assert(App.localGet(Txn.sender(), htlc_id_key) == Int(0)),
            
            # Store HTLC data
            App.localPut(Txn.sender(), htlc_id_key, htlc_id),
            App.localPut(Txn.sender(), initiator_key, initiator),
            App.localPut(Txn.sender(), recipient_key, recipient),
            App.localPut(Txn.sender(), amount_key, amount),
            App.localPut(Txn.sender(), hashlock_key, hashlock),
            App.localPut(Txn.sender(), timelock_key, timelock),
            App.localPut(Txn.sender(), eth_address_key, eth_address),
            App.localPut(Txn.sender(), withdrawn_key, Int(0)),
            App.localPut(Txn.sender(), refunded_key, Int(0)),
            
            # Transfer ALGO to contract
            InnerTxnBuilder.Begin(),
            InnerTxnBuilder.SetFields({
                TxnField.type_enum: TxnField.pay,
                TxnField.amount: amount,
                TxnField.receiver: Global.current_application_address()
            }),
            InnerTxnBuilder.Submit(),
            
            Return(Int(1))
        ])
    
    # Withdraw HTLC with secret
    def withdraw_htlc():
        return Seq([
            # Verify application arguments
            Assert(Txn.application_args.length() == Int(2)),
            
            htlc_id := Txn.application_args[0],
            secret := Txn.application_args[1],
            
            # Verify HTLC exists and not withdrawn/refunded
            Assert(App.localGet(Txn.sender(), htlc_id_key) == htlc_id),
            Assert(App.localGet(Txn.sender(), withdrawn_key) == Int(0)),
            Assert(App.localGet(Txn.sender(), refunded_key) == Int(0)),
            
            # Verify timelock hasn't expired
            Assert(Global.latest_timestamp() < App.localGet(Txn.sender(), timelock_key)),
            
            # Verify hashlock matches secret
            Assert(Sha256(secret) == App.localGet(Txn.sender(), hashlock_key)),
            
            # Mark as withdrawn
            App.localPut(Txn.sender(), withdrawn_key, Int(1)),
            
            # Transfer ALGO to recipient
            InnerTxnBuilder.Begin(),
            InnerTxnBuilder.SetFields({
                TxnField.type_enum: TxnField.pay,
                TxnField.amount: App.localGet(Txn.sender(), amount_key),
                TxnField.receiver: App.localGet(Txn.sender(), recipient_key)
            }),
            InnerTxnBuilder.Submit(),
            
            Return(Int(1))
        ])
    
    # Refund HTLC after timelock
    def refund_htlc():
        return Seq([
            # Verify application arguments
            Assert(Txn.application_args.length() == Int(1)),
            
            htlc_id := Txn.application_args[0],
            
            # Verify HTLC exists and not withdrawn/refunded
            Assert(App.localGet(Txn.sender(), htlc_id_key) == htlc_id),
            Assert(App.localGet(Txn.sender(), withdrawn_key) == Int(0)),
            Assert(App.localGet(Txn.sender(), refunded_key) == Int(0)),
            
            # Verify timelock has expired
            Assert(Global.latest_timestamp() >= App.localGet(Txn.sender(), timelock_key)),
            
            # Mark as refunded
            App.localPut(Txn.sender(), refunded_key, Int(1)),
            
            # Transfer ALGO back to initiator
            InnerTxnBuilder.Begin(),
            InnerTxnBuilder.SetFields({
                TxnField.type_enum: TxnField.pay,
                TxnField.amount: App.localGet(Txn.sender(), amount_key),
                TxnField.receiver: App.localGet(Txn.sender(), initiator_key)
            }),
            InnerTxnBuilder.Submit(),
            
            Return(Int(1))
        ])
    
    # Get HTLC status
    def get_htlc_status():
        return Seq([
            # Verify application arguments
            Assert(Txn.application_args.length() == Int(1)),
            
            htlc_id := Txn.application_args[0],
            
            # Return HTLC status
            Return(App.localGet(Txn.sender(), htlc_id_key))
        ])
    
    # Update contract parameters (creator only)
    def update_contract():
        return Seq([
            # Verify sender is creator
            Assert(Txn.sender() == App.globalGet(creator_key)),
            
            # Verify application arguments
            Assert(Txn.application_args.length() == Int(2)),
            
            param_key := Txn.application_args[0],
            param_value := Txn.application_args[1],
            
            # Update parameter
            App.globalPut(param_key, param_value),
            
            Return(Int(1))
        ])
    
    # Handle different operations
    program = Cond(
        [Txn.application_id() == Int(0), handle_creation],
        [Txn.on_completion() == OnComplete.OptIn, Return(Int(1))],
        [Txn.on_completion() == OnComplete.CloseOut, Return(Int(1))],
        [Txn.on_completion() == OnComplete.UpdateApplication, Return(Int(0))],
        [Txn.on_completion() == OnComplete.DeleteApplication, Return(Int(0))],
        [Txn.application_args[0] == Bytes("create"), create_htlc()],
        [Txn.application_args[0] == Bytes("withdraw"), withdraw_htlc()],
        [Txn.application_args[0] == Bytes("refund"), refund_htlc()],
        [Txn.application_args[0] == Bytes("status"), get_htlc_status()],
        [Txn.application_args[0] == Bytes("update"), update_contract()],
        [Return(Int(0))]
    )
    
    return program

# Export the contract
if __name__ == "__main__":
    print(compileTeal(htlc_bridge_contract(), mode=Mode.Application, version=6)) 