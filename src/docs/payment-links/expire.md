<!--
title: Expire Payment Link
description: ...
url: /payment-links/expire
link: Expire
order: 20
-->

# Expire Payment Link

Manually expire a payment link. The link will no longer be valid, and the customer will not be able to pay.

## Request

<span class="endpoint">
  `POST` https://api.scanpay.dk/v2/[{shopid}](/overview/#uris):pay:[{payid}](../create/#response)/expire
</span>

- <span class="hljs-attr">payid</span> is the ID you received when
  [creating](../create/#response) the payment link.

The request has no body.

## Response

{% include "empty-response.md" %}
