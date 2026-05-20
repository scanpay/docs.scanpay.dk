<!--
title: Invalidate Subscriber
description: ...
url: /subscriptions/invalidate-subscriber
link: Invalidate Subscriber
order: 40
-->

[renew]: ../renew-subscriber/
[seq]: /synchronization/sequence-request/

# Invalidate Subscriber

Delete all data associated with a subscriber and make it impossible to
charge it. Note that the subscriber is not deleted and because of that
the subscriber can still be [renewed][renew] to make it valid again
after this call.

## Request

<span class="endpoint">
  `POST` https://api.scanpay.dk/v2/[{shopid}](/overview/#uris):sub:[{subid}](/synchronization/changes/#subscriber)/invalidate
</span>

- <span class="hljs-attr">subid</span> is the ID you received from
  calling [seq][seq].

The request has no body.

## Response

There are no defined response fields and as such this returns an empty JSON object.
