<!--
title: Implementation Notes
description: The synchronization API will keep all your systems up-to-date with changes to your payments.
url: /synchronization/implementation-notes
link: Implementation Notes
order: 90
-->

[changes]: ../changes/
[seq-trn]: ../changes/#transaction
[seq-sub]: ../changes/#subscriber
[seq-charge]: ../changes/#charge
[uri]: /overview/#uris
[seq]: ../sequence-request/
[ping]: ../ping/
[capture]: /transactions/capture/
[charge]: /subscriptions/charge-subscriber/

# Implementation Notes

The aim of these notes is to disambiguate the intricacies of
synchronizing with [seq][seq], so you can write a robust integration
that scales well under load. It is written from the perspective of us
having our database, you having your database, and the aim being for you
to merge our database into yours.

## Merging Databases in Practice

The first problem you will encounter is that you've received some
database entries ([*changes*][changes]) from us and now you need to
somehow map them to the entries in your database.

The way to do this for [transactions][seq-trn] is to match the `orderid`
field from a given [*change*][changes] to the table of orders in your
database.  Similarly, for [subscribers][seq-sub], you should match the
`ref` field to your table of subscribers. For [charges][seq-charge] you
have the option of using either the `orderid` field or the
`subscriber.id` field or, preferably, a combination of both.

The purpose of this mapping is not just to enter our data into your
database. You also need to be able to refer to the entries in ours. All
of our API calls use immutable [URIs][uri] that you can construct using
the `type` and `id` fields. You will want to save the `id` in your
database. It is usually unnecessary to store the `type` as it can be
derived implicitly.

## Scaling Sublinearly

To illustrate how [seq][seq] works at scale, let's imagine a sequence of
10 events that goes:

1. The shop receives a new order. We call it <u>*trn#1*</u>.
2. The shop receives another order, <u>*trn#2*</u>.
3. The shop receives a third order, <u>*trn#3*</u>.
4. The owner ships the merchandise for <u>*trn#1*</u> and captures it.
5. The owner ships <u>*trn#3*</u> and captures it too.
6. The shop receives a new subscriber called <u>*sub#1*</u>.
7. The subscriber *sub#1* gets charged, creating <u>*trn#4*</u>.
8. The customer who made <u>*trn#2*</u> cancels the order, so the owner
   voids it.
9. The owner ships <u>*trn#4*</u> and captures it.
10. The shop receives a new order, <u>*trn#5*</u>.

You might expect that this would mean you need to call [seq][seq] 10
times to retrieve all 10 events, but that's not the case. Let's look at
how this sequence of events might be synchronized. Note that each event
is denoted only by the [database identifier][uri] and not by what has
actually changed.

<figure id="fig" style="max-width:700px;margin:auto">{% include "img/seq-requests.svg" %}</figure>

As you can see, this example only takes 3 round trips to retrieve all 10
events and then once more where it receives no new events. Each
[seq][seq] request retrieves the next part of the sequence and the new
position after all the changes have been merged. This permits a trivial
implementation where to retrieve the entire sequence you simply call
[seq][seq] in a loop until the `"seq"` value you receive back is the
same as the one you called with.

You may have noticed that the 3rd call only returned 3 changes despite
advancing 4 events in the sequence. That happens because we're not
sending deltas but rather the entire transaction or subscriber whenever
a change occurs. This means that we can (and do) deduplicate the entries
we send back. For that reason, you can't simply count the number of
entries in the `"changes"` array to advance the `seq` counter; instead,
you must use the `"seq"` value you receive from us.

## Recommendations and Pitfalls

If you're working with a language like PHP, you probably read the
[introduction](../) and thought to yourself that you're just going to
run your synchronization code whenever you receive a ping request.
Before you do that, let's go over the one massive issue you're likely to
smash head-first into if you do that:

<u style="text-align:center;font-size:1.1em;display:block">
    Multiple synchronizations happening simultaneously.
</u>

Except for a bit of hysteresis, we send pings immediately when there is
something new for you to fetch, and we do not wait for you to respond
before sending another one. In practice, this means that if you get 2
transactions in quick succession, you will receive 2 pings, and the
first synchronization will not have time to finish before the second
ping arrives to start the second synchronization. This can be a big
problem as you will be running into lots of potential
[TOCTOU](https://en.wikipedia.org/wiki/Time-of-check_to_time-of-use)
races. Consider this timeline of events:

<figure style="max-width:480px;margin:auto">{% include "img/ping.svg" %}</figure>

In this example, not only is <u>*trn#1*</u> being processed twice
simultaneously, possibly messing up its data in unpredictable ways, but
because the left process was slow and the right process was fast, the
older `"seq"` value was saved over the newer one.

Solving this problem is simple on paper. All you need to do is take a
lock before beginning the synchronization and release it when you
finish. Now, you will only ever have 1 synchronization process running
at a time. This, however, can be a lot more difficult in practice than
it sounds. For example: if you're using a MariaDB lock in PHP and your
script crashes for whatever reason, you'll find that the lock hasn't
been released. This is because PHP multiplexes multiple scripts into a
single process, and it shares the MariaDB connection between them for
performance reasons. Similarly, you can't just use `flock()` because the
lock it takes belongs to the process and will stick around after a
crash.

### Fully Synchronous Seq

As was pointed out in the [introduction](../), you fundamentally only
ever need to run one single process that keeps calling [seq][seq] in an
infinite loop. This is a perfectly viable and very efficient solution,
but then you need a solution to the problem of waiting for more changes
when you reach the current end of the sequence. Care must be taken to
avoid race conditions between [ping][ping] and [seq][seq]. A simple
solution using common threading primitives could look like this:

<pre><code><b>global</b> <i>LastSeqFromPing</i> := 0

<b>function</b> <span class="hljs-built_in">OnPing</span>(<i>ping</i>)
    <span class="hljs-built_in">Lock</span>()
    <abbr title="Networks are unreliable so pings can arrive out of order. This algorithm requires that LastSeqFromPing must always be the largest one seen so you need to check explicitly."><b>if</b> <i>LastSeqFromPing</i> &lt; <a class="hljs-attr" href="../ping/#fields">ping.seq</a> <b>then</b></abbr>
        <i>LastSeqFromPing</i> := <a class="hljs-attr" href="../ping/#fields">ping.seq</a>
        <span class="hljs-built_in">ConditionSignal</span>()
    <b>end if</b>
    <span class="hljs-built_in">Unlock</span>()
<b>end function</b>

<b>process</b>
    <i>localSeq</i> := <span class="hljs-built_in">LoadLocalSeq</span>()
    <b>loop</b>
        <i>data</i> := <span class="hljs-built_in">JSONDecode</span>(GET <span class="hljs-string">"https://api.scanpay.dk/v2/<a href="/overview/#uris" class="hljs-attr">{shopid}</a>:seq:"</span> ‖ <i>localSeq</i>)
        <b>for each</b> <i>change</i> <b>in</b> <a class="hljs-attr" href="../sequence-request/#response">data.changes</a> <b>do</b>
            <span class="hljs-built_in">Update</span>(<i>change</i>)
        <b>end for</b>
        <abbr title="If the old seq value differs from the new one it means you advanced in the sequence, so you'll want to persistently store the new seq value so you don't end up fetching the same bit again."><b>if</b> <i>localSeq</i> < <a class="hljs-attr" href="../sequence-request/#response">data.seq</a> <b>then</b></abbr>
            <i>localSeq</i> := <a class="hljs-attr" href="../sequence-request/#response">data.seq</a>
            <span class="hljs-built_in">StoreLocalSeq</span>(<a class="hljs-attr" href="../sequence-request/#response">data.seq</a>)
        <abbr title="If instead you received no new changes, you need to wait for a ping with a seq value higher than the highest one you've received from the call to seq, taking into account that one could have arrived between the time you made the last call to seq and now."><b>else</b></abbr>
            <span class="hljs-built_in">Lock</span>()
            <b>while</b> <i>localSeq</i> ≥ <i>LastSeqFromPing</i> <b>do</b>
                <span class="hljs-built_in">ConditionWait</span>()
            <b>end while</b>
            <abbr title="By consuming the value here you prevent an invalid or malicious ping from triggering an infinite loop where LastSeqFromPing is always greater than localSeq causing this loop to never wait."><i>LastSeqFromPing</i> := 0</abbr>
            <span class="hljs-built_in">Unlock</span>()
        <b>end if</b>
    <b>end loop</b>
<b>end process</b>
</code></pre>

This is the most efficient way to synchronize. A single process calling
[seq][seq] in a loop forever, where a [ping][ping] causes the function
`OnPing()` to run and update a global variable, as well as signal the
potentially sleeping process to wake up. This avoids all potential races
between [ping][ping] and [seq][seq], and guarantees that there is only
ever one running instance of `Update()`.

Since this approach saves `"seq"` immediately upon receiving the
[ping][ping] you can also respond to it immediately with `ok`. That way,
you will not keep receiving unnecessary pings.

### The Asynchronous Solution

Instead of, or in addition to, implementing machinery around preventing
simultaneous calls to `Update()`, you could simply make `Update()`
capable of running multiple times in parallel. [Atomic (transactional)
database updates](https://en.wikipedia.org/wiki/Database_transaction)
make it possible to, at least in some use cases, run completely
asynchronous synchronization.

In the simplest case where you just want to update whatever data you
extract from a [*change*][changes] and react to whatever data was there
before, you can use the `rev` field as the condition for an atomic
store. For example, if you want to send a confirmation email after the
first time you match our transaction to your order you could do this:

<pre><code><b>function</b> <span class="hljs-built_in">Update</span>(<i>change</i>)
    <i>trnid</i>, <i>email</i> := <span class="hljs-built_in">MariaDB</span>(
        <b>START TRANSACTION</b>;
        <b>SELECT</b> trnid,email <b>FROM</b> orders
            <b>WHERE</b> trnid='<a class="hljs-attr" href="../changes/">change.id</a>' <b>OR</b> orderid='<a class="hljs-attr" href="../changes/">change.orderid</a>' <b>FOR UPDATE</b>;
        <b>UPDATE</b> orders <b>SET</b> trnid='<a class="hljs-attr" href="../changes/">change.id</a>',rev='<a class="hljs-attr" href="../changes/">change.rev</a>',…
            <b>WHERE</b> (trnid='<a class="hljs-attr" href="../changes/">change.id</a>' <b>OR</b> orderid='<a class="hljs-attr" href="../changes/">change.orderid</a>') <b>AND</b> rev&lt;'<a class="hljs-attr" href="../changes/">change.rev</a>';
        <b>COMMIT</b>;
    )
    <b>if</b> <i>trnid</i> = 0 <b>and</b> <i>email</i> ≠ <span class="hljs-string">""</span> <b>then</b>
        <span class="hljs-built_in">SendMail</span>(<i>email</i>, <span class="hljs-string">"Order confirmation …"</span>)
    <b>end if</b>
<b>end function</b>
</code></pre>

Here we take advantage of valid IDs being non-zero, so a previous value
of `0` means that the order had not yet been matched to a transaction.

Note than an asynchronous-capable `Update()` function does not preclude
you from using a synchronous approach to calling [seq][seq], and could
in fact add greater safety. Full asynchronicity could result in calling
[seq][seq] multiple times for the same data, which is fundamentally less
efficient than only fetching it once.

## Frequently Questioned Answers

### Do I get pinged before the payer gets redirected to my successurl?

No in theory. In practice, probably.

Pings are sent whenever our seq database updates. For safety reasons,
our seq database updates fully asynchronously. This also means that you
are not guaranteed to see a new transaction in the [seq][seq] response
before a payer lands on your `successurl`, or even after a successful
call to eg. [capture][capture] or [charge][charge].

In practice, this update process is orders of magnitude faster than the
average network latency. Assuming you're trying to use data from
[seq][seq] on some sort of order-done page, you should
[implement a fallback](https://github.com/scanpay/woocommerce-scanpay/blob/master/src/hooks/wp-scanpay-thankyou.php);
even if only to safely handle a potential error on our end.

### What do I do if synchronization fails?

Simply don't save the new `"seq"` value you received and allow the
synchronization to run again. No data has been lost, and synchronization
can proceed from the same point next time. A nice side effect of this is
that you can always synchronize the entire sequence from the beginning
or any arbitrary point thereafter should you need to for any reason,
such as when restoring from a backup.

### How do I know what has changed in any given transaction or subscriber?

If you need that information, you must keep track of it yourself.
Referring to the [example figure](#fig), let's assume this
synchronization occurred after all 10 events had already happened. You
might expect that on the `…:seq:0` request, you will get a
<u>*trn#3*</u> that looks like ⓐ, and then on the `…:seq:3` request,
you'll get a <u>*trn#3*</u> that looks like ⓑ; however you will, in
fact, get ⓑ both times.

<div class="side-by-side">
  <figure>
    <pre><code>{% include "code/change-without-acts.json" %}</code></pre>
    <figcaption>ⓐ Without capture action</figcaption>
  </figure>
  <figure>
    <pre><code>{% include "code/change-with-acts.json" %}</code></pre>
    <figcaption>ⓑ With capture action</figcaption>
  </figure>
</div>

So why is this? It happens because we don't track what has happened to
any given transaction or subscriber, only that something has happened
and in what order it happened relative to other transactions and
subscribers. If you look at the [example figure](#fig), I'll ask you
again to note that the only things recorded, represented by the square
boxes, are the IDs of the transactions and subscribers that have
changed. In practice, the ping arrives so quickly that you're likely to
only ever see a single event in the `"changes"` array when calling
[seq][seq], but that's not a property you may depend on. This is
especially important to get right as it will likely only ever be
relevant under heavy load, such as on Black Friday.

### Are changes ordered chonologically?

Yes and no. Because changes are whole objects and not deltas and we
deduplicate them before sending, perfect chronological ordering is lost;
however we do provide strong guarantees about ordering.

Internally, the seq database is a digraph sorted in dependency order. It
provides 2 strong guarantees:

1. The first instance of <u>*DB#N*</u> will always appear later than the
   first instance of <u>*DB#N-1*</u>.<br/>
   *This guarantees that there are no gaps (missing
   transactions/subscribers).*
2. The first instance of a charge on <u>*sub#N@M*</u> will always appear
   later than the first instance of <u>*sub#N@≥M*</u>.<br/>
   *This guarantees that you always receive a subscriber <u>before</u>
   you receive a charge for that subscriber.*

This, of course, only applies to the sequence as a whole, not to every
subset of it.

### Why would you foist this upon us?

Despite the obvious complexity on display here, do not mistake it for
being the result of making you pull data from us. Synchronization is an
unfortunately difficult problem regardless of methodology. The webhook
(push) method suffers the exact same issues laid out here but also much,
much worse ones, such as:

- Any implementation of strong ordering guarantees would incur a
  potentially enormous latency penalty.
- The pushed data by necessity becomes use-it-or-lose-it, because the
  ability to resend all data would, in effect, be a [DoS
  attack](https://en.wikipedia.org/wiki/Denial-of-service_attack)
  button.
- If the specified endpoint changes, then we would potentially be
  sending sensitive data to an unknown third party.
- If there is a network or server outage, then we would have to resend
  the data. The question then becomes: how many times do we resend it,
  and when? This can (and frequently does) result in permanent data
  loss.
- If a system isn't responding correctly to these requests, then we will
  effectively be conducting a [DoS
  attack](https://en.wikipedia.org/wiki/Denial-of-service_attack),
  potentially on both our customers and ourselves, by constantly
  resending.

The latter two issues can (and have, many times) manifested in the need
to shut down these callback systems due to extreme server loads. This,
again, results in permanent data loss. We consider this unacceptable.
