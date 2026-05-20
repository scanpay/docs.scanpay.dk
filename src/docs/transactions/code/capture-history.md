[changes]: /synchronization/changes/#transaction

**Optional** meta-data for the transaction. This data is purely for UX
purposes and invalid data will simply be discarded.

The scheme used by the dashboard is `"item"` being used as a 0-based
index into the [`"items"`][changes] array, `"quantity"` being how many
of this item was captured or refunded, and `"total"` being the total
amount (ie. covering the entire quantity) that was captured or refunded.

*We strongly recommend that you follow this scheme when submitting your
own data.*
