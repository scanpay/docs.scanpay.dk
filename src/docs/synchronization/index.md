<!--
title: Synchronization API
description: The synchronization API will keep all your systems up-to-date with changes to your payments.
url: /synchronization/
link: Synchronization
order: 90
-->

[why]: implementation-notes/#why-would-you-foist-this-upon-us
[seq]: sequence-request/
[ping]: ping/
[notes]: implementation-notes/

# Synchronization

Unlike absolutely everyone else's, and [for a whole host of very good
reasons][why], our synchronization mechanism is completely decoupled
from the creation and modification of transactions, subscribers, etc.
There is no webhook for pushing updated data (*changes*) to you. You
pull changes from us:

<figure style="max-width:450px;margin:auto">{% include "img/seq.svg" %}</figure>

We call this synchronization mechanism **seq** because it fetches a
**seq**uence of events. Fundamentally, what you're trying to do is to
call [seq][seq] in an infinte loop, where every call to [seq][seq] uses
the `"seq"` value returned from the previous call, like so:

<pre><code><i>localSeq</i> := 0
<b>loop</b>
    <i>data</i> := <span class="hljs-built_in">JSONDecode</span>(GET <span class="hljs-string">"https://api.scanpay.dk/v2/<a class="hljs-attr" href="/overview/#uris">{shopid}</a>:seq:"</span> ‖ <i>localSeq</i>)
    <b>for each</b> <i>change</i> <b>in</b> <a class="hljs-attr" href="sequence-request/#response">data.changes</a> <b>do</b>
        <span class="hljs-built_in">Update</span>(<i>change</i>)
    <b>end for</b>
    <i>localSeq</i> := <a class="hljs-attr" href="sequence-request/#response">data.seq</a>
<b>end loop</b>
</code></pre>

However since [seq][seq] does *not* block until a new change comes in,
this would result in pegging the CPU at 100%. To address that, we have a
service called [ping][ping]. Whenever a change happens in our database,
we will send a [ping][ping] request to a URL of your choosing. This is
your prompt to call [seq][seq]:

<pre><code><i>localSeq</i> := <span class="hljs-built_in">LoadLocalSeq</span>()
<b>while</b> <i>localSeq</i> &lt; <a class="hljs-attr" href="ping/#fields">ping.seq</a> <b>do</b>
    <i>data</i> := <span class="hljs-built_in">JSONDecode</span>(GET <span class="hljs-string">"https://api.scanpay.dk/v2/<a href="/overview/#uris" class="hljs-attr">{shopid}</a>:seq:"</span> ‖ <i>localSeq</i>)
    <b>for each</b> <i>change</i> <b>in</b> <a class="hljs-attr" href="sequence-request/#response">data.changes</a> <b>do</b>
        <span class="hljs-built_in">Update</span>(<i>change</i>)
    <b>end for</b>
    <span class="hljs-built_in">StoreLocalSeq</span>(<a class="hljs-attr" href="sequence-request/#response">data.seq</a>)
    <i>localSeq</i> := <a class="hljs-attr" href="sequence-request/#response">data.seq</a>
<b>end while</b>
</code></pre>

And with that, you've implemented what was shown in the drawing. Now
you're done... or are you?

There are two hard problems in computer science: cache invalidation and
naming things, and unfortunately we're not talking about naming things.
The requests are simple but synchronization at scale is extremely
difficult and full of pitfalls. For a deep dive into the intricacies,
see the [implementation notes][notes]. It's long and boring and
extremely recommended reading.
