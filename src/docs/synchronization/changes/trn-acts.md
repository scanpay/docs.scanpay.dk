A chronologically ordered array of actions performed on this
transaction. There are 3 types of actions:

- **capture**: Some or all of the authorized funds were captured.
- **refund**: Some or all of the capturd funds were refunded.
- **void**: The entire authorization was invalidated. This action can
  only be present if it is the first and only action in the array.

The other fields are:

- **time**: The [Unix time](https://en.wikipedia.org/wiki/Unix_time) at
  which the action completed.
- **who**: The [API key](/overview/#api-keys) that initiated the action.
- **total**: The total amount that was captured, refunded, or voided.
- **history**: Freeform structured data about the items related to this
  action.

The `"history"` array contains metadata about the action which is used
in the dashboard to show, for example, which items have been captured.
The data is not checked for correctness and may be invalid or missing. 
