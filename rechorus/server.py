import os
import random

import flask
import tweepy

from twitter import Twitter

APP = flask.Flask(
	__name__, static_url_path='',
	static_folder=os.path.join(
		os.path.dirname(os.path.abspath(__file__)), os.pardir, 'static'),
	template_folder=os.path.join(
		os.path.dirname(os.path.abspath(__file__)), os.pardir, 'templates'))

@APP.route('/', methods=['GET'])
def index():
	access_token = flask.session.get('access_token')
	access_token_secret = flask.session.get('access_token_secret')
	if access_token and access_token_secret:
		return flask.redirect('/player/')
	return flask.render_template('index.html')

@APP.route('/connect/', methods=['GET'])
def connect():
	oauth_token = flask.request.args.get('oauth_token')
	oauth_verifier = flask.request.args.get('oauth_verifier')
	auth = Twitter.make_auth()

	if oauth_token and oauth_verifier:
		token = flask.session.pop('request_token', None)
		if token:
			auth.request_token = token
			verifier = flask.request.args.get('oauth_verifier')
			try:
				auth.get_access_token(verifier)
			except tweepy.TweepError:
				print('Error! Failed to get access token.')
				return flask.render_template('error.html', message='Could not get access token from Twitter')
			flask.session['access_token'] = auth.access_token
			flask.session['access_token_secret'] = auth.access_token_secret
			return flask.redirect('/player/')
	else:
		try:
			redirect_url = auth.get_authorization_url()
		except tweepy.TweepError:
			print('Error! Failed to get request token.')
			return flask.render_template('error.html', message='Could not get request token from Twitter')
		flask.session['request_token'] = auth.request_token
		return flask.redirect(redirect_url, code=302)

@APP.route('/player/', methods=['GET'])
def player():
	access_token = flask.session.get('access_token')
	access_token_secret = flask.session.get('access_token_secret')

	if not access_token or not access_token_secret:
		return flask.redirect('/connect/')

	twt = Twitter(
		access_token=access_token,
		access_token_secret=access_token_secret)

	total = 0
	subset = []
	friends = twt.friends_ids.items()
	while total <= 180:
		choice = random.choice(friends)
		friends.pop(friends.index(choice))
		subset.append(choice)

	return flask.render_template('player.html')

if __name__ == '__main__':
	APP.secret_key = 'dummykey'
	APP.run(debug=True)
