<!--
title: Ping Request
description: The synchronization API will keep all your systems up-to-date with changes to your payments.
url: /synchronization/ping
link: Ping
order: 10
-->

[uri]: /overview/#uris
[seq]: ../sequence-request/

# Ping

A request we send to you whenever there are new changes.

## Request

<span class="endpoint">
  `POST` Any URL of your choosing
</span>

### Headers

HTTP header | Description
------------|------------
`{% include "code/ping-signature.html" %}` | Base64 encoded HMAC-SHA2-256 signature of the body signed with your API key.

### Fields

JSON field | Description
-----------|------------
`{% include "code/ping-shopid.json" %}` | The [shopid][uri] this ping is for.
`{% include "code/ping-seq.json" %}` | The current maximum `seq` value.

Every API key can optionally be assigned a ping endpoint. You can
configure these endpoints in the
[dashboard](https://dashboard.scanpay.dk).

- Shop API keys receive pings for that shop.
- User API keys receive pings for all shops the user has access to.
- Partner API keys receive pings for all shops owned by the partner.

When you receive the ping request you can verify its authenticity using
the `X-Signature` header:

<pre><code><b>if</b> <span class="hljs-built_in">Base64</span>(<span class="hljs-built_in">HMAC-SHA2-256</span>(<i>body</i>, <i>apikey</i>)) <span class="fsize15">≠</span> <i>headers</i>[<span class="hljs-string">"X-Signature"</span>] <b>then</b>
    <span class="hljs-built_in">Log</span>(<span class="hljs-string">"Warning: Invalid ping signature!"</span>)
    <b>exit</b>
<b>end if</b>
</code></pre>

For our mutual benefit, we include the maximum `"seq"` value at the time
of the ping in the request body. That way, you can compare it to the
`"seq"` value you received from the last successful call to [seq][seq]
and, if the value received in the ping is less than or equal to it,
avoid calling [seq][seq], thus saving us both an unnecessary request:

<pre><code><i>ping</i> := <span class="hljs-built_in">JSONDecode</span>(<i>body</i>)
<b>if</b> <a class="hljs-attr" href="#fields">ping.seq</a> &gt; <i>localSeq</i> <b>then</b>
    <span class="hljs-built_in">Synchronize</span>()
<b>end if</b>
</code></pre>

## Response

It is not required to respond to a ping request, and we only wait
approximately 7 seconds for a response to arrive. Pings are sent
continuously, not just once after the `"seq"` value increases, so it is
perfectly safe to not respond.

You can "acknowledge" a ping by responding with a single line containing
either:

    ok

or

    ok: free form text

This will stop pings from being sent until the `"seq"` value changes.

The first line of the ping response is visible in your logs and can be a
useful debugging tool.
