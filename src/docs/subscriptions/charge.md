<!--
title: Charge Subscriber
description: ...
url: /subscriptions/charge-subscriber
link: Charge Subscriber
order: 20
-->

[seq]: /synchronization/sequence-request/
[new]: /payment-links/create/#fields
[states]: https://knowledge.scanpay.dev/transaction-states
[renew]: ../renew-subscriber/
[err]: /overview/#responses

# Charge Subscriber

Charge money from a specific subscriber.

## Request

<span class="endpoint">
  `POST` https://api.scanpay.dk/v2/[{shopid}](/overview/#uris):sub:[{subid}](/synchronization/changes/#subscriber)/charge
</span>

- <span class="hljs-attr">subid</span> is the ID you received from
  calling [seq][seq].

### Headers

{% include "idempotency-key.md" %}

### Fields

The only required field is `"items"`. All other fields are optional.

JSON field | Description
-----------|------------
`{% include "code/charge-orderid.json" %}` | Like a [regular transaction][new], this is the order ID assigned to this specific purchase.
`{% include "code/charge-address.json" %}` | Overrides for the stored address of the subscriber. Each address is overridden in its totality if any of its fields is present in your request.
`{% include "code/charge-items.json" %}` | An array of one or more items exactly as in [regular transactions][new]. Each item requires a `"total"` but all other fields are optional. The total amount that will be authorized is the sum of all `"total"` elements added together.
`{% include "code/charge-autocapture.json" %}` | Automatically [capture][states] the authorization. Unlike [regular transactions][new] this defaults to `true`.

## Response

{% include "empty-response.md" %}

### Headers

{% include "idempotency-status.md" %}

## Errors

[Errors][err] returned from this call fall into two categories:

- **transient**, meaning the charge failed due to a temporary problem
  and shound be retried; and
- **permanent**, meaning you should contact the subscriber and have him
  [renew][renew] his payment details.

To distinguish between the two, simply look at the first word of the
error message:

```
permanent clearhaus error: card lost or stolen
```

```
transient nets error: kir (nets host) timeout
```

**Transient** errors should lead to retrying the charge, but you should
not be too eager to retry. Acquirers recommend waiting 24 hours between
retries and making a maximum of 5 attempts in total.

Conversely, **permanent** errors should never lead to retries. Acquirers
might outright fine you for doing so.
