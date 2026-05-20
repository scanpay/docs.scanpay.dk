An array with one or more items. Each item needs a `total`, but all other fields are optional.

- **name**: The name of the product or service.
- **quantity**: The amount of this item. This must be an integer.
- **total**: The line total, i.e. the unit price times quantity, with an
  [ISO 4217 currency code](https://en.wikipedia.org/wiki/ISO_4217).
- **sku**: A [SKU](https://en.wikipedia.org/wiki/Stock_keeping_unit) for
  this line item.

*Note: in this example the total amount is 13497.9986 DKK. We do not
support fractions of the minor currency unit (here øre, 0.01 DKK) and as
such sending this would yield an error.*
