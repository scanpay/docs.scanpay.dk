# docs.scanpay.dev

This repository contains the files used to generate [docs.scanpay.dev](https://docs.scanpay.dev).

### Contributing

So, you are interested in contributing? Welcome! Every single contribution is very much encouraged and appreciated. If you find a bug, typo or something that could be improved, please submit a bug report ([github issue](https://github.com/scanpay/docs.scanpay.dk/issues/new)) or contact us on e-mail or IRC.

To build it locally, you will need to install [Node.js](https://nodejs.org/en/) and npm/pnpm.

Install dependencies
```bash
corepack prepare pnpm@latest --activate
pnpm install
pnpm -g install gulp-cli
```

Now you can build the docs with:
```bash
gulp
```

### Browser support

Compatibility table for [docs.scanpay.dev](https://docs.scanpay.dev):

Feature              | Chrome | Safari   | Firefox | Edge   | Opera
-------------------- | :-----:| :------: | :-----: | :----: | :----:
TLS 1.2              | 30     | 7        | 27      | 12     | 17
Promises             | 32     | 7.1      | 27      | 12     | 19
Let                  | **49** | 10       | **44**  | 12     | **36**
Const                | 49     | 10       | 36      | 12     | 36
Arrow Functions      | 45     | 10       | 22      | 12     | 32
Fetch                | 42     | **10.1** | 39      | **14** | 29

