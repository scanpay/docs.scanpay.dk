# docs.scanpay.dk

This repository contains the files used to generate [docs.scanpay.dk](https://docs.scanpay.dk).

## Contributing

So, you are interested in contributing? Welcome! Every single contribution is very much encouraged and appreciated. If you find a bug, typo or something that could be improved, please submit a bug report ([github issue](https://github.com/scanpaydk/docs.scanpay.dk/issues/new)) or contact us on e-mail, IRC or Slack.

To build it locally, you will need to install [Node.js](https://nodejs.org/en/) and [Gulp4](http://gulpjs.com).


```bash
git clone git@github.com:scanpaydk/docs.scanpay.dk.git
cd docs.scanpay.dk
npm install
npm link gulp
gulp
```

## Browser support

Compatibility table for [docs.scanpay.dk](https://docs.scanpay.dk) where struckthrough means fixed with babel or polyfill:

Feature              | Chrome | Safari   | Firefox | Edge   | Opera
-------------------- | :-----:| :------: | :-----: | :----: | :----:
TLS 1.2              | 30     | 7        | 27      | 12     | 17
Promises             | 32     | 7.1      | 27      | 12     | 19
Let                  | **49** | 10       | **44**  | 12     | **36**
Const                | 49     | 10       | 36      | 12     | 36
Arrow Functions      | 45     | 10       | 22      | 12     | 32
~~Fetch~~            | 42     | **10.1** | 39      | **14** | 29


## TODO

* Describe 'X-Signature' in /security
* Check composer Magento 2
