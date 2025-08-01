# Ultra-minimal Algorand HTLC Bridge Contract: ETH→ALGO
# Only supports ALGO claim with secret (no refund, no create)

from pyteal import *

def htlc_eth_to_algo_minimal():
    # Only claim_htlc function - relayer pre-funds contract
    def claim_htlc():
        htlc_id = ScratchVar(TealType.bytes)
        secret = ScratchVar(TealType.bytes)
        return Seq([
            Assert(Txn.application_args.length() == Int(3)),
            htlc_id.store(Txn.application_args[1]),
            secret.store(Txn.application_args[2]),
            Assert(App.localGet(Txn.sender(), Bytes("HtlcId")) == htlc_id.load()),
            Assert(App.localGet(Txn.sender(), Bytes("Withdrawn")) == Int(0)),
            Assert(Sha256(secret.load()) == App.localGet(Txn.sender(), Bytes("Hashlock"))),
            App.localPut(Txn.sender(), Bytes("Withdrawn"), Int(1)),
            InnerTxnBuilder.Begin(),
            InnerTxnBuilder.SetFields({
                TxnField.type_enum: TxnType.Payment,
                TxnField.amount: App.localGet(Txn.sender(), Bytes("Amount")),
                TxnField.receiver: App.localGet(Txn.sender(), Bytes("Recipient"))
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
        [Txn.application_args[0] == Bytes("claim_htlc"), claim_htlc()]
    )
    return program

if __name__ == "__main__":
    print(compileTeal(htlc_eth_to_algo_minimal(), mode=Mode.Application, version=10)) 