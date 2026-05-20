HTTP header | Description
------------|------------
<code><span class="hljs-attribute">Idempotency-Key</span>: xM3h1STdPREZVWXVNeTBqNzkwUTZUaHdCRWp4ZldGWHdKWjBX</code> | Sending this header lets you fetch the result of the request at a later time even if the connection gets cut off. Simply send an identical request with the same key to retrieve the response.
