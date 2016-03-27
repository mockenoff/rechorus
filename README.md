# rechorus

Replay a live stream with the accompanying Twitter fun!

## Local Development

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
