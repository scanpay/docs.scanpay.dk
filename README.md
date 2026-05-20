# docs.scanpay.dev

This repository contains the files used to generate [docs.scanpay.dev](https://docs.scanpay.dev).

### Contributing

So, you are interested in contributing? Welcome! Every single contribution is very much encouraged and appreciated. If you find a bug, typo or something that could be improved, please submit a bug report ([github issue](https://github.com/scanpay/docs.scanpay.dk/issues/new)) or contact us on e-mail or IRC.

To build it locally, you will need to install GNU make, Python 3.9 or higher, awk, Dart Sass, html-minifier, and esbuild. Now you can build the docs with:
```bash
make -j
```

You can set up a continuous build with:
```bash
make -j watch
```

To run an HTTP server for the local build, use one of these:
```bash
make serve
make livereload
```

You can override tools in your own `config.mak` if you want. They are all assumed to take a single file as a final argument and write the output to stdout.
```make
SASS=/path/to/your/own/dart-sass
SASSFLAGS=--your-own-flags
MINIFY=htmlmin
MINIFYFLAGS=-p code -c
TSC=esbuild-0.25.1
TSCFLAGS=--bundle --something-else
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
