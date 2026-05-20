[changes]: /synchronization/changes/#transaction

Captures, refunds, and voids are all actions. To avoid duplicate actions
as well as other race conditions, every action request requires an
action index to be sent along with it. This index is simply the number
of actions currently associated with the transaction as returned by the
[seq request][changes].
