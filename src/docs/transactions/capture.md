<!--
title: Capture Transaction
description: ...
url: /transactions/capture
link: Capture
order: 10
-->

[seq]: /synchronization/sequence-request/

# Capture Transaction

Perform a full or partial capture on a transaction. You can perform
multiple partial captures on a transaction but cannot capture more than
the authorized amount.

## Request

<span class="endpoint">
  `POST` https://api.scanpay.dk/v2/[{shopid}](/overview/#uris):trn:[{trnid}](/synchronization/changes/#transaction)/capture
</span>

- <span class="hljs-attr">trnid</span> is the ID you received from
  calling [seq][seq].

### Headers

{% include "idempotency-key.md" %}

### Fields

JSON fields | Description
------------|------------
`{% include "code/capture-total.json" %}` | The amount to capture.
`{% include "code/capture-index.json" %}` | {% include "code/capture-index.md" %}
`{% include "code/capture-history.json" %}` | {% include "code/capture-history.md" %}

## Response

{% include "empty-response.md" %}

### Headers

{% include "idempotency-status.md" %}
