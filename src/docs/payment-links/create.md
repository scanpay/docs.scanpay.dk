<!--
title: Create Payment Link
description: ...
url: /payment-links/create
link: Create
order: 10
-->

[states]: https://knowledge.scanpay.dev/transaction-states/
[partial]: https://knowledge.scanpay.dev/transaction-states/#partial-authorization

# Create Payment Link

## Request

<span class="endpoint">
  `POST` https://api.scanpay.dk/v2/[{shopid}](/overview/#uris):pay/new
</span>

### Headers

HTTP header | Description
------------|------------
`{% include "code/x-cardholder-ip.html" %}` | The IPv4 or IPv6 address of the customer making the payment. It's optional but highly recommended.

### Fields

The only required field is `"items"`. All other fields are optional.

JSON field | Description
-----------|------------
`{% include "code/orderid.json" %}` | An order identifier that identifies the order in your system. This is what will appear on the payer's bank statement.
`{% include "code/addresses.json" %}` | Customer billing and shipping address. This is purely metadata and has no fixed format. It is used opportunistically where applicable and is visible in our dashboard.
`{% include "code/items.json" %}` | {% include "code/items.md" %}
`{% include "code/autocapture.json" %}` | Automatically [capture][states] the payment. Default is `false`, which means that payments are [authorized][states], but not [captured][states]. If set to `true` then [partial authorizations][partial] are rejected and should the [capture][states] attempt fail then the [authorization][states] will be automatically [voided][states] and not saved in the transaction database.
`{% include "code/successurl.json" %}` | The URL we redirect the payer to after a successful payment.
`{% include "code/language.json" %}` | The desired payment window language in [ISO 639-1](https://en.wikipedia.org/wiki/ISO_639-1). Default is the browser language.
`{% include "code/lifetime.json" %}` | Payment link lifetime in days (<code class="hljs-string">"d"</code>), hours (<code class="hljs-string">"h"</code>), minutes (<code class="hljs-string">"m"</code>), and seconds (<code class="hljs-string">"s"</code>). The default is <code class="hljs-string">"1h"</code> and max is <code class="hljs-string">"30d"</code>. Increasing the lifetime will also increase the length of the returned URL.

## Response

JSON field | Description
-----------|------------
`{% include "code/response-url.json" %}` | The payment link. You can redirect the customer to this URL to complete the payment.
`{% include "code/response-id.json" %}` | The payment ID you need when making API calls regarding the payment link.

### Link Parameters

By default, all payment methods are available from the payment window.
You can, however, direct users towards specific methods by appending the
appropriate parameter:

Link parameter | Description
---------------|------------
<code>?go=<span class="hljs-func">mobilepay</span></code> | Directly redirect the customer to MobilePay Online.
<code>?go=<span class="hljs-func">applepay</span></code> | Focus the Apple Pay button.
