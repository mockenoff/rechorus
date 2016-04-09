# rechorus

Replay a live stream with the accompanying Twitter fun!

## Start the server

All you really need to do is create a virtualenv, install the requirements, and start up the Flask server.

```
$ # Raw virtualenv
$ virtualenv --python=/usr/local/bin/python3 env/
$ source env/bin/activate

$ # With pyenv
$ pyenv virtualenv --python=/usr/local/bin/python3 rechorus

$ pip install -r requirements.txt
$ python rechorus/server.py
```

## Building assets

You also have to install the Gulp requirements and compile the assets.

```
$ npm install
$ bower install
$ gulp build --env production
```

## Local development

For local development, there's a `watch` task that will autocompile assets whenever there's a change.

```
$ gulp watch --env local
```

The `local` environment will prevent minifying the CSS and JavaScript.
