<!--
title: Subscriptions API
description: ...
url: /subscriptions/
link: Subscriptions
order: 40
-->

[types]: https://knowledge.scanpay.dev/transaction-types
[charge]: charge-subscriber/
[create]: create-subscriber/
[renew]: renew-subscriber/

# Subscriptions

The Subscriptions API allows you to handle merchant-initiated
transactions ([MITs][types]). You can use it to charge customers on a
regular basis or to save a customer's payment details, so the customer
does not have to enter the information again.

## Subscribers

Our API only tracks subscribers and not their individual subscriptions.
You are responsible for [charging][charge] the correct amount at the
correct time. You should only [create][create] one subscriber per person
and instead [renew][renew] subscribers whose payment details have
expired or have left and come back, rather than create new ones.
