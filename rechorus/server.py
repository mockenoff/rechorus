"""
.. module:: server
	:platform: Unix
	:synopsis: Flask server endpoints
.. moduleauthor:: Tim Poon <timothycpoon@gmail.com>

"""

import os
import random
import datetime
from urllib import parse

import flask
import tweepy

import utils
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

	url = flask.request.args.get('url')
	start = flask.request.args.get('start')

	if not url or not start:
		return flask.render_template('form.html')

	query = parse.parse_qs(parse.urlparse(url).query)
	if 'v' not in query or not query['v']:
		return flask.render_template('form.html', error='Invalid YouTube video URL')

	try:
		start = datetime.datetime.strptime(start, '%Y-%m-%d %H:%M:%S')
	except ValueError:
		return flask.render_template('form.html', error='Invalid start time')

	return flask.render_template('player.html', video_id=query['v'][0], start=start)


if __name__ == '__main__':
	APP.secret_key = 'dummykey'
	APP.run(debug=True)
