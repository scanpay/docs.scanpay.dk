<!--
title: Changes
description: ""
url: /synchronization/changes
link: Change Types
order: 30
-->

[apikey]: /overview/#api-keys
[new]: /payment-links/create/
[newsub]: /subscriptions/create-subscriber/
[charge]: /subscriptions/charge-subscriber/

# Changes

There are 3 types of changes: [transaction](#transaction),
[subscriber](#subscriber) and [charge](#charge). All fields are always
present except when explicitly stated and have valid default values.

## Transaction

Transactions are manual payments made directly through the [payment
window][new].

JSON fields | Description
------------|------------
`{% include "changes/trn-type.json" %}` | Type denoting that this is a transaction.
`{% include "changes/trn-id.json" %}` | The transaction ID.
`{% include "changes/trn-rev.json" %}` | A revision number. It starts at `1` and it increments every time the transaction data changes.
`{% include "changes/trn-locked.json" %}` | Whether or not this transaction has been made immutable and if so, which [API key][apikey] was responsible.
`{% include "changes/trn-method.json" %}` | {% include "changes/trn-method.md" %}
`{% include "changes/trn-services.json" %}` | {% include "changes/trn-services.md" %}
`{% include "changes/trn-info.json" %}` | {% include "changes/trn-info.md" %}
`{% include "changes/trn-time.json" %}` | {% include "changes/trn-time.md" %}
`{% include "changes/trn-orderid.json" %}` | The order ID that you assigned to the transaction when [creating][new] the payment link.
`{% include "changes/trn-address.json" %}` | The shipping and billing addresses that were given when [creating][new] the payment link.
`{% include "changes/trn-items.json" %}` | The array of items that were given when [creating][new] the payment link.<br/>*Note: the `"quantity"` field defaults to `1` if none was specified.*
`{% include "changes/trn-acts.json" %}` | {% include "changes/trn-acts.md" %}
`{% include "changes/trn-totals.json" %}` | {% include "changes/trn-totals.md" %}

## Charge

Charges are [transactions](#transaction) without payment window data and
with some extra information about the [subscriber](#subscriber) that was
charged.

JSON fields | Description
------------|------------
`{% include "changes/charge-type.json" %}` | Type denoting that this transaction is a subscriber charge.
~~`{% include "changes/charge-info.json" %}`~~ | Since the subscriber never interacted with the payment window to create this transaction, this element is not returned.
`{% include "changes/charge-subscriber.json" %}` | {% include "changes/charge-subscriber.md" %}

## Subscriber

Subscribers are stored payment credentials that can be [charged][charge]
by the shop.

JSON fields | Description
------------|------------
`{% include "changes/sub-type.json" %}` | Type denoting that this is a subscriber.
`{% include "changes/sub-id.json" %}` | The subscriber ID.
`{% include "changes/sub-rev.json" %}` | A revision number. It starts at `1` and it increments every time the subscriber data changes.
`{% include "changes/sub-ref.json" %}` | The reference that you assigned to the subscriber when you [created][newsub] it.
`{% include "changes/sub-method.json" %}` | {% include "changes/sub-method.md" %}
`{% include "changes/sub-services.json" %}` | {% include "changes/sub-services.md" %}
`{% include "changes/sub-time.json" %}` | {% include "changes/sub-time.md" %}
`{% include "changes/sub-info.json" %}` | {% include "changes/sub-info.md" %}
`{% include "changes/sub-address.json" %}` | The shipping and billing addresses that were supplied when [creating](/subscriptions/create-subscriber#request) or last [renewing](/subscriptions/renew-subscriber#fields) the subscriber.
`{% include "changes/sub-acts.json" %}` | {% include "changes/sub-acts.md" %}
