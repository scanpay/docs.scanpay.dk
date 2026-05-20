The sum totals of all actions performed on this transaction.

- **attempted**: The sum total of all items.
- **authorized**: How much was originally authorized. This can differ
  from how much you attempted to authorize.
- **captured**: How much has been captured so far.
- **refunded**: How much has been refunded so far.
- **voided**: How much has been voided. Voiding is an all-or-nothing
  operation, so this must either be zero or the same as `authorized`.
- **left**: How much is still left to capture.
