<!--
title: Sequence Request
description: The synchronization API will keep all your systems up-to-date with changes to your payments.
url: /synchronization/sequence-request
link: Seq
order: 10
-->

[changes]: ../changes/

# Sequence Request

Pull changes from our database.

## Request

<span class="endpoint">
  `GET` https://api.scanpay.dk/v2/[{shopid}](/overview/#uris):seq:[{prevseq}](/overview/#uris)
</span>

- <span class="hljs-attr">prevseq</span> is the `"seq"` value you
  received in the previous seq response. To start at the beginning, set
  it to `0`.

## Response

JSON field | Description
-----------|------------
`{% include "code/seq-changes.json" %}` | An array with [changes][changes] after the requested sequence number in dependency order.
`{% include "code/seq-seq.json" %}` | The <code class="hljs-attr">"prevseq"</code> value for the next call when you have successfully merged all the changes into your database.

Seq will return an arbitrary amount of changes. The total response size
is currently limited to **64 KiB**, except in the extremely unlikely
event that a single change is larger than that. This limit is likely to
change in the future so you must be prepared to receive larger
responses.
