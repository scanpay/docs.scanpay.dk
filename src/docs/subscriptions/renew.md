<!--
title: Renew Subscriber
description: ...
url: /subscriptions/renew-subscriber
link: Renew Subscriber
order: 30
-->

[create]: ../create-subscriber/
[seq]: /synchronization/sequence-request/
[new]: /payment-links/create/#fields

# Renew Subscriber

Renewing a subscriber is the same as [creating][create] a subscriber,
excepting that you are updating the details of an existing one rather
than creating a new one. This primarily allows your subscribers to
change their payment details when, for example, their cards expire, but
it also allows you to change their details (address, etc.) in the
process.

## Request

<span class="endpoint">
  `POST` https://api.scanpay.dk/v2/[{shopid}](/overview/#uris):sub:[{subid}](/synchronization/changes/#subscriber)/renew
</span>

- <span class="hljs-attr">subid</span> is the ID you received from
  calling [seq][seq].

### Fields

This is the same request as the [request to create a payment link][new],
except for the endpoint and different interpretations of these fields:

JSON fields | Description
------------|------------
`{% include "code/renew-address.json" %}` | New addresses for the subscriber. An address is overwritten as a whole if a single field is present.
`{% include "code/sub-items.json" %}` | {% include "code/sub-items.md" %}
`{% include "code/charge-autocapture.json" %}` | This defaults to `true`.
