[states]: https://knowledge.scanpay.dev/transaction-states
[charge]: /synchronization/changes/#charge

This array may be omitted. If it is present it will generate an an
*initial charge*. What this means is that along with verifying the
payment credentials of the payer it will also automatically
[authorize][states] the specified amount of money and create a
[charge][charge].
