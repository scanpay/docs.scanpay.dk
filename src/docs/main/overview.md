<!--
title: API Overview
description: Overview of common API traits and use patterns.
url: /overview/
link: Overview
order: 2
-->

[ping]: /synchronization/ping/
[seq]: /synchronization/sequence-request/
[json]: https://en.wikipedia.org/wiki/JSON

# API Overview

Our API is designed around a simple principle: when objects are created
or modified in our system, you receive a notification in the form of a
[ping][ping], which tells you there's new data ready to fetch using the
[seq request][seq]. These objects are referred to using URIs in our API:

## URIs

All API requests are made to whole or partial URIs. A URI is built up of
4 components:

<pre><code><span class="hljs-attr">shopid</span>:<span class="hljs-attr">db</span>#<span class="hljs-attr">id</span>@<span class="hljs-attr">rev</span></code></pre>

- <span class="hljs-attr">shopid</span> is the ID associated with the
  shop. It can be found in the dashboard.
- <span class="hljs-attr">db</span> is which database the object is
  located in.
- <span class="hljs-attr">id</span> is the ID of the entry in that
  database.
- <span class="hljs-attr">rev</span> is the revision (version) of the
  object.

No API request uses a full URI as no request refers to a specific
revision of an object. Similarly, some API requests only refer to
databases and not specific objects. Since `#` can be very annoying to
encode in an HTTP request, we allow the use of `:` instead, so all API
request URLs follow this scheme:

<pre><code>https://api.scanpay.dk/v2/<span class="hljs-attr">{shopid}</span>:<span class="hljs-attr">{db}</span>/<span class="hljs-func">{action}</span>
https://api.scanpay.dk/v2/<span class="hljs-attr">{shopid}</span>:<span class="hljs-attr">{db}</span>:<span class="hljs-attr">{id}</span>/<span class="hljs-func">{action}</span></code></pre>

## Authentication

All API requests require
[HTTP Basic authentication](https://en.wikipedia.org/wiki/Basic_access_authentication)
using an API key as the credential:

<pre><code><span class="hljs-attribute">Authorization</span>: Basic <span class="hljs-built_in">Base64Encode</span>(<span class="hljs-string">"<span class="hljs-attr">{apikey}</span>"</span>)</code></pre>

### API keys

All actions, be they performed through the API documented here or the
dashboard, are done by traceable API keys. Users, shops, and partners can all
have associated API keys of the following format:

<pre><code>u<span class="hljs-attr">{userid}</span>#<span class="hljs-attr">{keyid}</span>:entropy
s<span class="hljs-attr">{shopid}</span>#<span class="hljs-attr">{keyid}</span>:entropy
p<span class="hljs-attr">{partnerid}</span>#<span class="hljs-attr">{keyid}</span>:entropy
</code></pre>

- <span class="hljs-attr">userid</span> /
  <span class="hljs-attr">shopid</span> /
  <span class="hljs-attr">partnerid</span>
  is the ID of the user/shop/partner the key was issued by.
- <span class="hljs-attr">keyid</span> is the immutable unique ID of the
  key itself. It is only unique to that given user, shop, or partner,
  not globally.

## Requests

Request bodies are always a single [JSON][json] object. The fields
described in this documentation are the keys in this root object and
their respective values:

<pre><code style="max-width:100%;text-overflow:ellipsis;overflow:hidden"><span class="hljs-attribute">POST</span> /v2/1234:trn:21/refund
<span class="hljs-attribute">Host</span>: api.scanpay.dk
<span class="hljs-attribute">Authorization</span>: Basic czEyMzQ6RmhuSUpWUzJaZ1JpMkIzNUpCSnNlXzZvUUUzUGlPS0ZFS3FQVDItcmk4NTBEdXpvUnNRNUdPTnoyZWdZLXpRWA==
<span class="hljs-attribute">Content-Length</span>: 41

{
    <span class="hljs-attr">"total"</span>: <span class="hljs-string">"20 DKK"</span>,
    <span class="hljs-attr">"index"</span>: <span class="hljs-number">1</span>
}</code></pre>

## Responses

Successful requests always have an HTTP response code of `200` and a
[JSON][json] object in the response body. On error, responses always
have a non-`200` code and a textual error message both as the HTTP
response message and as a singular line in the response body:

<pre><code><span class="hljs-attribute">HTTP/1.1</span> 403 <span class="hljs-string">invalid apikey</span>
<span class="hljs-attribute">Content-Length</span>: 15

<span class="hljs-string">invalid apikey</span></code></pre>

## Environments

We have two distinct environments: a production and a testing
environment. They are in no way connected and an account on one confers
no access to the other. The test environment is for developing
integrations and accounts on the testing environment can only be created
manually by us.

- **Production endpoint**: `api.scanpay.dk`
- **Testing endpoint**: `api.scanpay.dev`

To get a test account, [contact us](mailto:support@scanpay.dk) and let
us know what you need it for.
