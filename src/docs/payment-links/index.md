<!--
title: Payment Link API
description: Generate payment links, that you can send to your customers.
url: /payment-links/
link: Payment Links
order: 10
-->

[create]: create/#fields
[expire]: expire/

# Payment Links

Payment links are unique, shareable URLs that direct customers to our
hosted payment window, where they can securely enter their payment
details.

## Stateful Payments

Payment links reference server-side state. Because of this, they can
provide strong guarantees about the payment process. This has the
distinct advantage of making it perfectly safe to use regular browser
navigation.

### Double Payments

While a payment link can be accessed multiple times, on multiple
devices, even simultaneously, it is only possible to successfully pay
exactly once.

### Lifetime

Payment links have a limited lifespan. By default, a payment link lasts
1 hour, but this can be changed to anything between 5 minutes and 30
days using the [`lifetime`][create] parameter.

The lifespan provides a hard limit on when a payment can be submitted,
meaning if the payer has not completed all authentication before the
time limit, the payment will be rejected.

Payment links can also be explicitly deleted by [expiring][expire] them.
