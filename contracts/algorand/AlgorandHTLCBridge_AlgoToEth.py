# Minimal Algorand HTLC Bridge Contract: ALGO→ETH
# Only supports ALGO locking and secret revelation for swaps initiated from Algorand

from pyteal import *

def htlc_algo_to_eth():
    # Local state keys
    htlc_id_key = Bytes("HtlcId")
    eth_recipient_key = Bytes("EthRecipient")
    amount_key = Bytes("Amount")
    hashlock_key = Bytes("Hashlock")
    timelock_key = Bytes("Timelock")
    secret_key = Bytes("Secret")
    withdrawn_key = Bytes("Withdrawn")
    refunded_key = Bytes("Refunded")

    # Create HTLC (called by user)
    def create_htlc():
        htlc_id = ScratchVar(TealType.bytes)
        eth_recipient = ScratchVar(TealType.bytes)
        amount = ScratchVar(TealType.uint64)
        hashlock = ScratchVar(TealType.bytes)
        timelock = ScratchVar(TealType.uint64)
        return Seq([
            Assert(Txn.application_args.length() == Int(6)),
            htlc_id.store(Txn.application_args[1]),
            eth_recipient.store(Txn.application_args[2]),
            amount.store(Btoi(Txn.application_args[3])),
            hashlock.store(Txn.application_args[4]),
            timelock.store(Btoi(Txn.application_args[5])),
            Assert(amount.load() > Int(0)),
            Assert(App.localGet(Txn.sender(), htlc_id_key) == Int(0)),
            App.localPut(Txn.sender(), htlc_id_key, htlc_id.load()),
            App.localPut(Txn.sender(), eth_recipient_key, eth_recipient.load()),
            App.localPut(Txn.sender(), amount_key, amount.load()),
            App.localPut(Txn.sender(), hashlock_key, hashlock.load()),
            App.localPut(Txn.sender(), timelock_key, timelock.load()),
            App.localPut(Txn.sender(), withdrawn_key, Int(0)),
            App.localPut(Txn.sender(), refunded_key, Int(0)),
            App.localPut(Txn.sender(), secret_key, Bytes("") ),
            InnerTxnBuilder.Begin(),
            InnerTxnBuilder.SetFields({
                TxnField.type_enum: TxnType.Payment,
                TxnField.amount: amount.load(),
                TxnField.receiver: Global.current_application_address()
            }),
            InnerTxnBuilder.Submit(),
            Return(Int(1))
        ])

    # Reveal secret (called by relayer after ETH claim)
    def reveal_secret():
        htlc_id = ScratchVar(TealType.bytes)
        secret = ScratchVar(TealType.bytes)
        return Seq([
            Assert(Txn.application_args.length() == Int(3)),
            htlc_id.store(Txn.application_args[1]),
            secret.store(Txn.application_args[2]),
            Assert(App.localGet(Txn.sender(), htlc_id_key) == htlc_id.load()),
            Assert(App.localGet(Txn.sender(), secret_key) == Bytes("") ),
            Assert(Sha256(secret.load()) == App.localGet(Txn.sender(), hashlock_key)),
            App.localPut(Txn.sender(), secret_key, secret.load()),
            Return(Int(1))
        ])

    program = Cond(
        [Txn.application_id() == Int(0), Return(Int(1))],
        [Txn.on_completion() == OnComplete.OptIn, Return(Int(1))],
        [Txn.on_completion() == OnComplete.CloseOut, Return(Int(1))],
        [Txn.on_completion() == OnComplete.UpdateApplication, Return(Int(0))],
        [Txn.on_completion() == OnComplete.DeleteApplication, Return(Int(0))],
        [Txn.application_args[0] == Bytes("create_htlc"), create_htlc()],
        [Txn.application_args[0] == Bytes("reveal_secret"), reveal_secret()]
    )
    return program

if __name__ == "__main__":
    print(compileTeal(htlc_algo_to_eth(), mode=Mode.Application, version=10)) 
# Only supports ALGO locking and secret revelation for swaps initiated from Algorand

from pyteal import *

def htlc_algo_to_eth():
    # Local state keys
    htlc_id_key = Bytes("HtlcId")
    eth_recipient_key = Bytes("EthRecipient")
    amount_key = Bytes("Amount")
    hashlock_key = Bytes("Hashlock")
    timelock_key = Bytes("Timelock")
    secret_key = Bytes("Secret")
    withdrawn_key = Bytes("Withdrawn")
    refunded_key = Bytes("Refunded")

    # Create HTLC (called by user)
    def create_htlc():
        htlc_id = ScratchVar(TealType.bytes)
        eth_recipient = ScratchVar(TealType.bytes)
        amount = ScratchVar(TealType.uint64)
        hashlock = ScratchVar(TealType.bytes)
        timelock = ScratchVar(TealType.uint64)
        return Seq([
            Assert(Txn.application_args.length() == Int(6)),
            htlc_id.store(Txn.application_args[1]),
            eth_recipient.store(Txn.application_args[2]),
            amount.store(Btoi(Txn.application_args[3])),
            hashlock.store(Txn.application_args[4]),
            timelock.store(Btoi(Txn.application_args[5])),
            Assert(amount.load() > Int(0)),
            Assert(App.localGet(Txn.sender(), htlc_id_key) == Int(0)),
            App.localPut(Txn.sender(), htlc_id_key, htlc_id.load()),
            App.localPut(Txn.sender(), eth_recipient_key, eth_recipient.load()),
            App.localPut(Txn.sender(), amount_key, amount.load()),
            App.localPut(Txn.sender(), hashlock_key, hashlock.load()),
            App.localPut(Txn.sender(), timelock_key, timelock.load()),
            App.localPut(Txn.sender(), withdrawn_key, Int(0)),
            App.localPut(Txn.sender(), refunded_key, Int(0)),
            App.localPut(Txn.sender(), secret_key, Bytes("") ),
            InnerTxnBuilder.Begin(),
            InnerTxnBuilder.SetFields({
                TxnField.type_enum: TxnType.Payment,
                TxnField.amount: amount.load(),
                TxnField.receiver: Global.current_application_address()
            }),
            InnerTxnBuilder.Submit(),
            Return(Int(1))
        ])

    # Reveal secret (called by relayer after ETH claim)
    def reveal_secret():
        htlc_id = ScratchVar(TealType.bytes)
        secret = ScratchVar(TealType.bytes)
        return Seq([
            Assert(Txn.application_args.length() == Int(3)),
            htlc_id.store(Txn.application_args[1]),
            secret.store(Txn.application_args[2]),
            Assert(App.localGet(Txn.sender(), htlc_id_key) == htlc_id.load()),
            Assert(App.localGet(Txn.sender(), secret_key) == Bytes("") ),
            Assert(Sha256(secret.load()) == App.localGet(Txn.sender(), hashlock_key)),
            App.localPut(Txn.sender(), secret_key, secret.load()),
            Return(Int(1))
        ])

    program = Cond(
        [Txn.application_id() == Int(0), Return(Int(1))],
        [Txn.on_completion() == OnComplete.OptIn, Return(Int(1))],
        [Txn.on_completion() == OnComplete.CloseOut, Return(Int(1))],
        [Txn.on_completion() == OnComplete.UpdateApplication, Return(Int(0))],
        [Txn.on_completion() == OnComplete.DeleteApplication, Return(Int(0))],
        [Txn.application_args[0] == Bytes("create_htlc"), create_htlc()],
        [Txn.application_args[0] == Bytes("reveal_secret"), reveal_secret()]
    )
    return program

if __name__ == "__main__":
    print(compileTeal(htlc_algo_to_eth(), mode=Mode.Application, version=10)) 
 