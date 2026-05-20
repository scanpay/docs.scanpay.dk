<!--
title: Create Subscriber
description: ...
url: /subscriptions/create-subscriber
link: Create Subscriber
order: 10
-->

[types]: https://knowledge.scanpay.dev/transaction-types
[new]: /payment-links/create/#fields

# Create Subscriber

Creating a subscriber entails presenting a payment window to a payer and
having him successfully enter his payment credentials. You cannot
directly create a subscriber; it must be [customer-initiated][types].

## Request

This is the same request as the [request to create a payment link][new]
with 2 key differences:

JSON fields | Description
------------|------------
`{% include "code/sub-ref.json" %}` | {% include "code/sub-ref.md" %}
`{% include "code/sub-items.json" %}` | {% include "code/sub-items.md" %}
