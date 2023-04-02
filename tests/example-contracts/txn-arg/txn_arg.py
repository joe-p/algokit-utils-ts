import beaker as bkr
import pyteal as pt

app = bkr.Application("TxnArg")

@app.external
def foo(pay: pt.abi.PaymentTransaction):
    return pt.Assert(pay.get().amount() == pt.Int(1337))

app.build().export()
