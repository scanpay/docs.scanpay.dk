<!--
title: Void Transaction
description: ...
url: /transactions/void
link: Void
order: 30
-->

[seq]: /synchronization/sequence-request/

# Void Transaction

Cancel an authorization so that the funds are released on the payer's
account and cannot be captured. Voids can only be performed on
transactions that have not yet been captured.

## Request

<span class="endpoint">
  `POST` https://api.scanpay.dk/v2/[{shopid}](/overview/#uris):trn:[{trnid}](/synchronization/changes/#transaction)/void
</span>

- <span class="hljs-attr">trnid</span> is the ID you received from
  calling [seq][seq].

The request has no body.

### Headers

{% include "idempotency-key.md" %}

## Response

{% include "empty-response.md" %}

### Headers

{% include "idempotency-status.md" %}
