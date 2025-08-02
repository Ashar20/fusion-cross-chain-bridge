# Minimal Algorand HTLC Bridge Contract: ETH→ALGO
# Only supports ALGO claim/refund for swaps initiated from Ethereum

from pyteal import *

def htlc_eth_to_algo():
    # Local state keys
    htlc_id_key = Bytes("HtlcId")
    recipient_key = Bytes("Recipient")
    amount_key = Bytes("Amount")
    hashlock_key = Bytes("Hashlock")
    timelock_key = Bytes("Timelock")
    withdrawn_key = Bytes("Withdrawn")
    refunded_key = Bytes("Refunded")

    # Create HTLC (called by relayer)
    def create_htlc():
        htlc_id = ScratchVar(TealType.bytes)
        recipient = ScratchVar(TealType.bytes)
        amount = ScratchVar(TealType.uint64)
        hashlock = ScratchVar(TealType.bytes)
        timelock = ScratchVar(TealType.uint64)
        return Seq([
            Assert(Txn.application_args.length() == Int(6)),
            htlc_id.store(Txn.application_args[1]),
            recipient.store(Txn.application_args[2]),
            amount.store(Btoi(Txn.application_args[3])),
            hashlock.store(Txn.application_args[4]),
            timelock.store(Btoi(Txn.application_args[5])),
            Assert(amount.load() > Int(0)),
            Assert(App.localGet(Txn.sender(), htlc_id_key) == Int(0)),
            App.localPut(Txn.sender(), htlc_id_key, htlc_id.load()),
            App.localPut(Txn.sender(), recipient_key, recipient.load()),
            App.localPut(Txn.sender(), amount_key, amount.load()),
            App.localPut(Txn.sender(), hashlock_key, hashlock.load()),
            App.localPut(Txn.sender(), timelock_key, timelock.load()),
            App.localPut(Txn.sender(), withdrawn_key, Int(0)),
            App.localPut(Txn.sender(), refunded_key, Int(0)),
            InnerTxnBuilder.Begin(),
            InnerTxnBuilder.SetFields({
                TxnField.type_enum: TxnType.Payment,
                TxnField.amount: amount.load(),
                TxnField.receiver: Global.current_application_address()
            }),
            InnerTxnBuilder.Submit(),
            Return(Int(1))
        ])

    # Claim ALGO with secret
    def claim_htlc():
        htlc_id = ScratchVar(TealType.bytes)
        secret = ScratchVar(TealType.bytes)
        return Seq([
            Assert(Txn.application_args.length() == Int(3)),
            htlc_id.store(Txn.application_args[1]),
            secret.store(Txn.application_args[2]),
            Assert(App.localGet(Txn.sender(), htlc_id_key) == htlc_id.load()),
            Assert(App.localGet(Txn.sender(), withdrawn_key) == Int(0)),
            Assert(App.localGet(Txn.sender(), refunded_key) == Int(0)),
            Assert(Global.latest_timestamp() < App.localGet(Txn.sender(), timelock_key)),
            Assert(Sha256(secret.load()) == App.localGet(Txn.sender(), hashlock_key)),
            App.localPut(Txn.sender(), withdrawn_key, Int(1)),
            InnerTxnBuilder.Begin(),
            InnerTxnBuilder.SetFields({
                TxnField.type_enum: TxnType.Payment,
                TxnField.amount: App.localGet(Txn.sender(), amount_key),
                TxnField.receiver: App.localGet(Txn.sender(), recipient_key)
            }),
            InnerTxnBuilder.Submit(),
            Return(Int(1))
        ])

    # Refund after timelock
    def refund_htlc():
        htlc_id = ScratchVar(TealType.bytes)
        return Seq([
            Assert(Txn.application_args.length() == Int(2)),
            htlc_id.store(Txn.application_args[1]),
            Assert(App.localGet(Txn.sender(), htlc_id_key) == htlc_id.load()),
            Assert(App.localGet(Txn.sender(), withdrawn_key) == Int(0)),
            Assert(App.localGet(Txn.sender(), refunded_key) == Int(0)),
            Assert(Global.latest_timestamp() >= App.localGet(Txn.sender(), timelock_key)),
            App.localPut(Txn.sender(), refunded_key, Int(1)),
            InnerTxnBuilder.Begin(),
            InnerTxnBuilder.SetFields({
                TxnField.type_enum: TxnType.Payment,
                TxnField.amount: App.localGet(Txn.sender(), amount_key),
                TxnField.receiver: Txn.sender()
            }),
            InnerTxnBuilder.Submit(),
            Return(Int(1))
        ])

    program = Cond(
        [Txn.application_id() == Int(0), Return(Int(1))],
        [Txn.on_completion() == OnComplete.OptIn, Return(Int(1))],
        [Txn.on_completion() == OnComplete.CloseOut, Return(Int(1))],
        [Txn.on_completion() == OnComplete.UpdateApplication, Return(Int(0))],
        [Txn.on_completion() == OnComplete.DeleteApplication, Return(Int(0))],
        [Txn.application_args[0] == Bytes("create_htlc"), create_htlc()],
        [Txn.application_args[0] == Bytes("claim_htlc"), claim_htlc()],
        [Txn.application_args[0] == Bytes("refund_htlc"), refund_htlc()]
    )
    return program

if __name__ == "__main__":
    print(compileTeal(htlc_eth_to_algo(), mode=Mode.Application, version=10)) 
# Only supports ALGO claim/refund for swaps initiated from Ethereum

from pyteal import *

def htlc_eth_to_algo():
    # Local state keys
    htlc_id_key = Bytes("HtlcId")
    recipient_key = Bytes("Recipient")
    amount_key = Bytes("Amount")
    hashlock_key = Bytes("Hashlock")
    timelock_key = Bytes("Timelock")
    withdrawn_key = Bytes("Withdrawn")
    refunded_key = Bytes("Refunded")

    # Create HTLC (called by relayer)
    def create_htlc():
        htlc_id = ScratchVar(TealType.bytes)
        recipient = ScratchVar(TealType.bytes)
        amount = ScratchVar(TealType.uint64)
        hashlock = ScratchVar(TealType.bytes)
        timelock = ScratchVar(TealType.uint64)
        return Seq([
            Assert(Txn.application_args.length() == Int(6)),
            htlc_id.store(Txn.application_args[1]),
            recipient.store(Txn.application_args[2]),
            amount.store(Btoi(Txn.application_args[3])),
            hashlock.store(Txn.application_args[4]),
            timelock.store(Btoi(Txn.application_args[5])),
            Assert(amount.load() > Int(0)),
            Assert(App.localGet(Txn.sender(), htlc_id_key) == Int(0)),
            App.localPut(Txn.sender(), htlc_id_key, htlc_id.load()),
            App.localPut(Txn.sender(), recipient_key, recipient.load()),
            App.localPut(Txn.sender(), amount_key, amount.load()),
            App.localPut(Txn.sender(), hashlock_key, hashlock.load()),
            App.localPut(Txn.sender(), timelock_key, timelock.load()),
            App.localPut(Txn.sender(), withdrawn_key, Int(0)),
            App.localPut(Txn.sender(), refunded_key, Int(0)),
            InnerTxnBuilder.Begin(),
            InnerTxnBuilder.SetFields({
                TxnField.type_enum: TxnType.Payment,
                TxnField.amount: amount.load(),
                TxnField.receiver: Global.current_application_address()
            }),
            InnerTxnBuilder.Submit(),
            Return(Int(1))
        ])

    # Claim ALGO with secret
    def claim_htlc():
        htlc_id = ScratchVar(TealType.bytes)
        secret = ScratchVar(TealType.bytes)
        return Seq([
            Assert(Txn.application_args.length() == Int(3)),
            htlc_id.store(Txn.application_args[1]),
            secret.store(Txn.application_args[2]),
            Assert(App.localGet(Txn.sender(), htlc_id_key) == htlc_id.load()),
            Assert(App.localGet(Txn.sender(), withdrawn_key) == Int(0)),
            Assert(App.localGet(Txn.sender(), refunded_key) == Int(0)),
            Assert(Global.latest_timestamp() < App.localGet(Txn.sender(), timelock_key)),
            Assert(Sha256(secret.load()) == App.localGet(Txn.sender(), hashlock_key)),
            App.localPut(Txn.sender(), withdrawn_key, Int(1)),
            InnerTxnBuilder.Begin(),
            InnerTxnBuilder.SetFields({
                TxnField.type_enum: TxnType.Payment,
                TxnField.amount: App.localGet(Txn.sender(), amount_key),
                TxnField.receiver: App.localGet(Txn.sender(), recipient_key)
            }),
            InnerTxnBuilder.Submit(),
            Return(Int(1))
        ])

    # Refund after timelock
    def refund_htlc():
        htlc_id = ScratchVar(TealType.bytes)
        return Seq([
            Assert(Txn.application_args.length() == Int(2)),
            htlc_id.store(Txn.application_args[1]),
            Assert(App.localGet(Txn.sender(), htlc_id_key) == htlc_id.load()),
            Assert(App.localGet(Txn.sender(), withdrawn_key) == Int(0)),
            Assert(App.localGet(Txn.sender(), refunded_key) == Int(0)),
            Assert(Global.latest_timestamp() >= App.localGet(Txn.sender(), timelock_key)),
            App.localPut(Txn.sender(), refunded_key, Int(1)),
            InnerTxnBuilder.Begin(),
            InnerTxnBuilder.SetFields({
                TxnField.type_enum: TxnType.Payment,
                TxnField.amount: App.localGet(Txn.sender(), amount_key),
                TxnField.receiver: Txn.sender()
            }),
            InnerTxnBuilder.Submit(),
            Return(Int(1))
        ])

    program = Cond(
        [Txn.application_id() == Int(0), Return(Int(1))],
        [Txn.on_completion() == OnComplete.OptIn, Return(Int(1))],
        [Txn.on_completion() == OnComplete.CloseOut, Return(Int(1))],
        [Txn.on_completion() == OnComplete.UpdateApplication, Return(Int(0))],
        [Txn.on_completion() == OnComplete.DeleteApplication, Return(Int(0))],
        [Txn.application_args[0] == Bytes("create_htlc"), create_htlc()],
        [Txn.application_args[0] == Bytes("claim_htlc"), claim_htlc()],
        [Txn.application_args[0] == Bytes("refund_htlc"), refund_htlc()]
    )
    return program

if __name__ == "__main__":
    print(compileTeal(htlc_eth_to_algo(), mode=Mode.Application, version=10)) 
 