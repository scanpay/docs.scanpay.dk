# docs.scanpay.dk

This repository contains the files used to generate [docs.scanpay.dk](https://docs.scanpay.dk).

## Contributing

So, you are interested in contributing? Welcome! Every single contribution is very much encouraged and appreciated. If you find a bug, typo or something that could be improved, please submit a bug report ([github issue](https://github.com/scanpaydk/docs.scanpay.dk/issues/new)) or contact us on e-mail, IRC or Slack.

To build it locally, you will need to install [Node.js](https://nodejs.org/en/) and [Gulp4](http://gulpjs.com).

```bash
git clone git@github.com:scanpaydk/docs.scanpay.dk.git
cd docs.scanpay.dk
npm install
gulp
```

## Browser support

Compatibility table for [docs.scanpay.dk](https://docs.scanpay.dk) where struckthrough means fixed with babel:

Feature              | Chrome | Safari | Firefox |  Edge  |  IE    |  Opera
-------------------- | :-----:| :----: | :-----: | :----: | :----: | :----:
TLS 1.2              | 30     | 7      | 27      | 12     | 9/11   | 17
Promises             | 32     | 7.1    | 27      | 12     | :x:    | 19
Let                  | 49     | 10     | 44      | 12     | 11     | 36
Const                | 49     | 10     | 36      | 12     | 11     | 36
Arrow Functions      | 45     | 10     | 22      | 12     | :x:    | 32
~~Fetch~~            | 42     | 10.1   | 39      | 14     | :x:    | 29


## TODO

* ecommerce -> eCommerce
* Describe 'X-Signature' in /security
* Add .NET library
* Add maxSeq() to /API-libraries
* Update and align some libs
* Add missing #links to <h2> tags
