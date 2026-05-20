<!--
title: Changelog
description: ...
url: /changelog/
link: Changelog
order: 9
-->

# Changelog

This changelog lists all major additions and updates, in chronological
order.

<dl id="changelog" markdown="1">

<dt>?</dt><dd>
Add v2 API.
</dd>

<dt>2026-05-05</dt><dd>
Add Apple Pay Dankort and subscriber support.
</dd>

<dt>2025-09-24</dt><dd>
Add new `kryten` daemon, allowing us to dynamically track and mess with
scammers through various switches, such as
[lie mode](https://www.youtube.com/watch?v=kzoxvczjY1A), which generates
real-looking but incorrect responses to authorization attempts.
</dd>

<dt>2024-07-12</dt><dd>
Add initial charge support, making it possible to create/renew a
subscriber and create a transaction in one go.
</dd>

<dt>2023-03-04</dt><dd>
Add Apple Pay support.
</dd>

<dt>2022-07-06</dt><dd>
Add `"method"` data to seq response.
</dd>

<dt>2019-09-27</dt><dd>
Add capture API.
</dd>

<dt>2019-06-06</dt><dd>
Add idempotency to subscriber charge request.
</dd>

<dt>2019-05-29</dt><dd>
Add capture/refund/void actions to sequence. These actions were
previously reported if present but not entered into the sequence,
meaning they would typically not be reported.
</dd>

<dt>2018-10-13</dt><dd>
Add subscriber API.
</dd>

<dt>2018-04-26</dt><dd>
Add MobilePay support.
</dd>

<dt>2018-04-26</dt><dd>
Change item `"price"` field to `"total"`. The `"price"` field was
multiplied by the `"quantity"` field which made it impossible to round
arbitrary quantities of sub-minor-currency amounts. This change puts the
onus of decimal multiplication on the client, which is why it was
originally designed with an unmultiplied price.
</dd>

</dl>
