<!--
title: Getting Started with Scanpay
description: Getting started with Scanpay and online payments.
url: /
link: Getting Started
order: 0
-->

[states]: https://knowledge.scanpay.dev/transaction-states/
[seq]: /synchronization/sequence-request/
[overview]: /overview/

# Getting started

This is the entirety of our API:

<pre><code><a href="/payment-links/create/">https://api.scanpay.dk/v2/<span class="hljs-attr">{shopid}</span>:pay/new</a>
<a href="/payment-links/expire/">https://api.scanpay.dk/v2/<span class="hljs-attr">{shopid}</span>:pay:<span class="hljs-attr">{payid}</span>/expire</a>
<a href="/transactions/capture/">https://api.scanpay.dk/v2/<span class="hljs-attr">{shopid}</span>:trn:<span class="hljs-attr">{trnid}</span>/capture</a>
<a href="/transactions/refund/">https://api.scanpay.dk/v2/<span class="hljs-attr">{shopid}</span>:trn:<span class="hljs-attr">{trnid}</span>/refund</a>
<a href="/transactions/void/">https://api.scanpay.dk/v2/<span class="hljs-attr">{shopid}</span>:trn:<span class="hljs-attr">{trnid}</span>/void</a>
<a href="/subscriptions/charge-subscriber/">https://api.scanpay.dk/v2/<span class="hljs-attr">{shopid}</span>:sub:<span class="hljs-attr">{subid}</span>/charge</a>
<a href="/subscriptions/renew-subscriber/">https://api.scanpay.dk/v2/<span class="hljs-attr">{shopid}</span>:sub:<span class="hljs-attr">{subid}</span>/renew</a>
<a href="/subscriptions/invalidate-subscriber/">https://api.scanpay.dk/v2/<span class="hljs-attr">{shopid}</span>:sub:<span class="hljs-attr">{subid}</span>/invalidate</a>
<a href="/synchronization/sequence-request/">https://api.scanpay.dk/v2/<span class="hljs-attr">{shopid}</span>:seq:<span class="hljs-attr">{prevseq}</span></a></code></pre>

What it all means will be covered in the <a href="/overview/">API overview</a> section.

## How do I use it?

First, you (the merchant) create a payment link:</p>

<pre><code class="code--cmdln">curl -u <span class="hljs-attr">{apikey}</span> -d <nobr>'{"items":[{"total":"99.95DKK"}]}'</nobr> <nobr>https://api.scanpay.dk/v2/<span class="hljs-attr">{shopid}</span>:pay/new</nobr></code></pre>
<pre><code>{
  "url": "https://betal.scanpay.dk/q3z3amhrkmyrgk6i",
  "id": "q3z3amhrkmyrgk6i"
}</code></pre>

You then redirect the customer (payer) to the returned URL. The payer,
in turn, enters his credit card information in our payment window and
clicks the "Pay" button.

Now that the order has been paid, a transaction has been created in our
transaction database. Let's retrieve the information:

<pre><code class="code--cmdln">curl -u <span class="hljs-attr">{apikey}</span> <nobr>https://api.scanpay.dk/v2/<span class="hljs-attr">{shopid}</span>:seq:0</nobr></code></pre>
<pre><code>{
  "changes": [
    {
      "type": "transaction",
      <span class="hljs-attr">"id": 1</span>,
      "rev": 1,
<details><summary></summary>      "locked": null,
      "method": {
        "type": "card",
        "id": "JlVFYo77jukOmuAmy6PavAjClA61pM0ydR2rAhCs7lw",
        "card": {
          "brand": "visa",
          "last4": "1111"
        }
      },
      "services": [
        "clearhaus-1"
      ],
      "info": {
        "ip": "198.51.100.2",
        "ndisplay": 1,
        "nfail": 0
      },
      "time": {
        "created": 1761139386,
        "authorized": 1761139415
      },
      "orderid": "",
      "billing": {
        "name": "",
        "company": "",
        "vatin": "",
        "gln": "",
        "email": "",
        "phone": "",
        "address": [],
        "city": "",
        "zip": "",
        "state": "",
        "country": ""
      },
      "shipping": {
        "name": "",
        "company": "",
        "email": "",
        "phone": "",
        "address": [],
        "city": "",
        "zip": "",
        "state": "",
        "country": ""
      },
      "items": [
        {
          "quantity": 1,
          "total": "99.95 DKK",
          "name": "",
          "sku": ""
        }
      ],</details>      "acts": [],
      "totals": {
        "attempted": "99.95 DKK",
        "authorized": "99.95 DKK",
        "captured": "0 DKK",
        "refunded": "0 DKK",
        "voided": "0 DKK",
        "left": "99.95 DKK"
      }
    }
  ],
  "seq": 1
}</code></pre>

If you expand the above you'll see that almost none of it is filled out.
That's because we didn't fill it out when we made the payment link.
However more importantly, you now have access to the transaction ID
(highlighted above), with which you can
[capture the authorization][states]:

<pre><code class="code--cmdln">curl -u <span class="hljs-attr">{apikey}</span> -d <nobr>'{"total":"99.95DKK","index":0}'</nobr> <nobr>https://api.scanpay.dk/v2/<span class="hljs-attr">{shopid}</span>:trn:1/capture</nobr></code></pre>

    {}

And as you can see, that returned absolutely nothing of use, except to
say that the capture was successful. So let's go and get the updated
transaction data. Last time we called [seq][seq] with a value of `0` and
it told us that next time we need to call it with a value of `1`:

<pre><code class="code--cmdln">curl -u <span class="hljs-attr">{apikey}</span> <nobr>https://api.scanpay.dk/v2/<span class="hljs-attr">{shopid}</span>:seq:1</nobr></code></pre>
<pre><code>{
  "changes": [
    {
      "type": "transaction",
      "id": 1,
      <span class="hljs-attr">"rev": 2</span>,
<details><summary></summary>      "locked": null,
      "method": {
        "type": "card",
        "id": "JlVFYo77jukOmuAmy6PavAjClA61pM0ydR2rAhCs7lw",
        "card": {
          "brand": "visa",
          "last4": "1111"
        }
      },
      "services": [
        "clearhaus-1"
      ],
      "info": {
        "ip": "198.51.100.2",
        "ndisplay": 1,
        "nfail": 0
      },
      "time": {
        "created": 1761139386,
        "authorized": 1761139415
      },
      "orderid": "",
      "billing": {
        "name": "",
        "company": "",
        "vatin": "",
        "gln": "",
        "email": "",
        "phone": "",
        "address": [],
        "city": "",
        "zip": "",
        "state": "",
        "country": ""
      },
      "shipping": {
        "name": "",
        "company": "",
        "email": "",
        "phone": "",
        "address": [],
        "city": "",
        "zip": "",
        "state": "",
        "country": ""
      },
      "items": [
        {
          "quantity": 1,
          "total": "99.95 DKK",
          "name": "",
          "sku": ""
        }
      ],</details>      "acts": [
        <span class="hljs-attr">{
          "act": "capture",
          "time": 1761139447,
          "who": "s1379#1",
          "total": "99.95 DKK",
          "history": []
        }</span>
      ],
      "totals": {
        "attempted": "99.95 DKK",
        "authorized": "99.95 DKK",
        <span class="hljs-attr">"captured": "99.95 DKK"</span>,
        "refunded": "0 DKK",
        "voided": "0 DKK",
        <span class="hljs-attr">"left": "0 DKK"</span>
      }
    }
  ],
  "seq": 2
}</code></pre>

A few things have changed. There is now an entry in the `"acts"` array
that denotes a capture action has been performed, when it happened, and
by whom it was initiated. The `"totals"` have been updated to reflect
how much money can be used for what. However most importantly, the
`"rev"` field has been increased, denoting the revision (or version) of
the data. This is what will allow you to safely merge this data into
your own database.

You may also notice that this time we received `"seq": 2` back, telling
us that next time we need to call seq with a value of `2`.

Now let's dig a little deeper in the [API overview][overview] section.
