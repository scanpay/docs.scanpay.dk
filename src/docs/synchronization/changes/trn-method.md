- **type**: The method that was used to authorize the transaction.
  Currently <code class="hljs-string">"card"</code>,
  <code class="hljs-string">"mobilepay"</code>, or
  <code class="hljs-string">"applepay"</code>.
- **id**: A shop-wide unique opaque ID representing the credit card or
  other payment device.
- **card**: Data identifying the credit card used. Note that all
  currently supported payment methods are technically credit cards so
  regardless of `type` you will get a `card` object. More may be
  introduced in the future, so you cannot rely on `card` always being
  available.
  - **brand**:
    <code class="hljs-string">"amex"</code>,
    <code class="hljs-string">"dankort"</code>,
    <code class="hljs-string">"diners"</code>,
    <code class="hljs-string">"discover"</code>,
    <code class="hljs-string">"forbrugsforening"</code>,
    <code class="hljs-string">"jcb"</code>,
    <code class="hljs-string">"maestro"</code>,
    <code class="hljs-string">"mastercard"</code>,
    <code class="hljs-string">"unionpay"</code>,
    <code class="hljs-string">"visa"</code>,
    <code class="hljs-string">"visadankort"</code>
  - **last4**: The last 4 digits of the card number.
