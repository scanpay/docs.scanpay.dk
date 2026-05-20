<!--
title: Refund Transaction
description: ...
url: /transactions/refund
link: Refund
order: 20
-->

[seq]: /synchronization/sequence-request/

# Refund Transaction

Perform a full or partial refund on a transaction. You can perform
multiple partial refunds on a transaction but cannot refund more than
the captured amount.

## Request

<span class="endpoint">
  `POST` https://api.scanpay.dk/v2/[{shopid}](/overview/#uris):trn:[{trnid}](/synchronization/changes/#transaction)/refund
</span>

- <span class="hljs-attr">trnid</span> is the ID you received from
  calling [seq][seq].

### Headers

{% include "idempotency-key.md" %}

### Fields

JSON fields | Description
------------|------------
`{% include "code/refund-total.json" %}` | The amount to capture.
`{% include "code/refund-index.json" %}` | {% include "code/capture-index.md" %}
`{% include "code/refund-history.json" %}` | {% include "code/capture-history.md" %}

## Response

{% include "empty-response.md" %}

### Headers

{% include "idempotency-status.md" %}
