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
	start_str = flask.request.args.get('start')

	if not url or not start_str:
		return flask.render_template('form.html')

	query = parse.parse_qs(parse.urlparse(url).query)
	if 'v' not in query or not query['v']:
		return flask.render_template('form.html', error='Invalid YouTube video URL')

	try:
		start = datetime.datetime.strptime(start_str, '%Y-%m-%d %H:%M:%S')
	except ValueError:
		return flask.render_template('form.html', error='Invalid start time')

	return flask.render_template('player.html', video_id=query['v'][0], start=start, start_str=start_str)


@APP.route('/tweets/', methods=['GET'])
@utils.crossdomain(origin='*')
def tweets():
	access_token = flask.session.get('access_token')
	access_token_secret = flask.session.get('access_token_secret')

	if not access_token or not access_token_secret:
		return utils.json_response(
			{'error': 'Must authenticate Rechorus with your Twitter account first'},
			status=401)

	start = flask.request.args.get('start')
	end = flask.request.args.get('end')

	if not start or not end:
		return utils.json_response({'error': 'Missing parameters'}, status=400)

	import simplejson as json
	data = json.loads('[{"text": "Clarifying the @ESPN dodgeball story: average throws are around 50mph &amp; Rise of Brutality is the top team, not Doom https://t.co/GNRc5uT8Li", "user": {"name": "Tim Poon", "screen_name": "mockenoff", "profile_image_url": "https://pbs.twimg.com/profile_images/378800000679332660/93d8a67c62e0d949521a5a585a7367bb_normal.jpeg"}, "created_at": "2016-03-27 22:23:35", "formatted_text": "Clarifying the <a href=\\"https://twitter.com/espn\\" target=\\"_blank\\">@ESPN</a> dodgeball story: average throws are around 50mph &amp; Rise of Brutality is the top team, not Doom <a href=\\"http://espn.go.com/video/clip?id=15068981&ex_cid=sportscenterTW&sf23216185=1\\" target=\\"_blank\\">espn.go.com/video/clip?id=\\u2026</a>", "is_retweet": false, "id": 714216322213609472}, {"media": [{"media_url": "https://pbs.twimg.com/media/CeWlKO4UMAAuyrl.jpg", "expanded_url": "http://twitter.com/bradshoemaker/status/713157711878197248/photo/1"}], "text": "RT @bradshoemaker: The future is now. https://t.co/Ecz9M4OdM9", "user": {"name": "Tim Poon", "screen_name": "mockenoff", "profile_image_url": "https://pbs.twimg.com/profile_images/378800000679332660/93d8a67c62e0d949521a5a585a7367bb_normal.jpeg"}, "created_at": "2016-03-25 01:22:18", "formatted_text": "RT <a href=\\"https://twitter.com/bradshoemaker\\" target=\\"_blank\\">@bradshoemaker</a>: The future is now. <a href=\\"http://twitter.com/bradshoemaker/status/713157711878197248/photo/1\\" target=\\"_blank\\">pic.twitter.com/Ecz9M4OdM9</a>", "is_retweet": true, "id": 713174134037983232}, {"text": "@saruhstritt @jimmydeez @tubatootinrox booooo", "user": {"name": "Tim Poon", "screen_name": "mockenoff", "profile_image_url": "https://pbs.twimg.com/profile_images/378800000679332660/93d8a67c62e0d949521a5a585a7367bb_normal.jpeg"}, "created_at": "2016-03-22 04:33:31", "formatted_text": "<a href=\\"https://twitter.com/saruhstritt\\" target=\\"_blank\\">@saruhstritt</a> <a href=\\"https://twitter.com/jimmydeez\\" target=\\"_blank\\">@jimmydeez</a> <a href=\\"https://twitter.com/tubatootinrox\\" target=\\"_blank\\">@tubatootinrox</a> booooo", "is_retweet": false, "id": 712135090902405120}, {"text": "@JoLammert anywhere near Rainey?", "user": {"name": "Tim Poon", "screen_name": "mockenoff", "profile_image_url": "https://pbs.twimg.com/profile_images/378800000679332660/93d8a67c62e0d949521a5a585a7367bb_normal.jpeg"}, "created_at": "2016-03-20 00:28:12", "formatted_text": "<a href=\\"https://twitter.com/JoLammert\\" target=\\"_blank\\">@JoLammert</a> anywhere near Rainey?", "is_retweet": false, "id": 711348579416219650}, {"text": "@JoLammert Jo! Are you still around SXSW things?", "user": {"name": "Tim Poon", "screen_name": "mockenoff", "profile_image_url": "https://pbs.twimg.com/profile_images/378800000679332660/93d8a67c62e0d949521a5a585a7367bb_normal.jpeg"}, "created_at": "2016-03-19 23:35:23", "formatted_text": "<a href=\\"https://twitter.com/JoLammert\\" target=\\"_blank\\">@JoLammert</a> Jo! Are you still around SXSW things?", "is_retweet": false, "id": 711335290045014018}, {"media": [{"media_url": "https://pbs.twimg.com/media/Cd71eUsUEAAd8eh.jpg", "expanded_url": "http://twitter.com/DaveOshry/status/711275701782106112/photo/1"}], "text": "RT @DaveOshry: Fox News interviewing Cloud Strife at #SXSW. Let\'s Make Midgar Great Again. https://t.co/BAIZGOSRzL", "user": {"name": "Tim Poon", "screen_name": "mockenoff", "profile_image_url": "https://pbs.twimg.com/profile_images/378800000679332660/93d8a67c62e0d949521a5a585a7367bb_normal.jpeg"}, "created_at": "2016-03-19 21:47:52", "formatted_text": "RT <a href=\\"https://twitter.com/DaveOshry\\" target=\\"_blank\\">@DaveOshry</a>: Fox News interviewing Cloud Strife at #SXSW. Let\'s Make Midgar Great Again. <a href=\\"http://twitter.com/DaveOshry/status/711275701782106112/photo/1\\" target=\\"_blank\\">pic.twitter.com/BAIZGOSRzL</a>", "is_retweet": true, "id": 711308232757633024}, {"text": "@Vahn16 duuuude they got cancelled last night due to rain. It would have been my first time seeing them live :0(", "user": {"name": "Tim Poon", "screen_name": "mockenoff", "profile_image_url": "https://pbs.twimg.com/profile_images/378800000679332660/93d8a67c62e0d949521a5a585a7367bb_normal.jpeg"}, "created_at": "2016-03-19 18:02:43", "formatted_text": "<a href=\\"https://twitter.com/Vahn16\\" target=\\"_blank\\">@Vahn16</a> duuuude they got cancelled last night due to rain. It would have been my first time seeing them live :0(", "is_retweet": false, "id": 711251572257239040}, {"text": "Today\'s hero of SXSW: this guy taking a picture with his iPad and trying to swipe away his own finger covering the lens.", "user": {"name": "Tim Poon", "screen_name": "mockenoff", "profile_image_url": "https://pbs.twimg.com/profile_images/378800000679332660/93d8a67c62e0d949521a5a585a7367bb_normal.jpeg"}, "created_at": "2016-03-18 20:36:41", "formatted_text": "Today\'s hero of SXSW: this guy taking a picture with his iPad and trying to swipe away his own finger covering the lens.", "is_retweet": false, "id": 710927931103576069}, {"text": "@griffinmcelroy hey man, you down around Gaming right now?", "user": {"name": "Tim Poon", "screen_name": "mockenoff", "profile_image_url": "https://pbs.twimg.com/profile_images/378800000679332660/93d8a67c62e0d949521a5a585a7367bb_normal.jpeg"}, "created_at": "2016-03-17 21:40:18", "formatted_text": "<a href=\\"https://twitter.com/griffinmcelroy\\" target=\\"_blank\\">@griffinmcelroy</a> hey man, you down around Gaming right now?", "is_retweet": false, "id": 710581550165823488}, {"text": "@kalyncorrigan that is a happy equation I can abide.", "user": {"name": "Tim Poon", "screen_name": "mockenoff", "profile_image_url": "https://pbs.twimg.com/profile_images/378800000679332660/93d8a67c62e0d949521a5a585a7367bb_normal.jpeg"}, "created_at": "2016-03-17 05:31:50", "formatted_text": "<a href=\\"https://twitter.com/kalyncorrigan\\" target=\\"_blank\\">@kalyncorrigan</a> that is a happy equation I can abide.", "is_retweet": false, "id": 710337826869522433}, {"text": "@DaveOshry but you\'re missing a doughnut showcase on 6th", "user": {"name": "Tim Poon", "screen_name": "mockenoff", "profile_image_url": "https://pbs.twimg.com/profile_images/378800000679332660/93d8a67c62e0d949521a5a585a7367bb_normal.jpeg"}, "created_at": "2016-03-17 05:00:44", "formatted_text": "<a href=\\"https://twitter.com/DaveOshry\\" target=\\"_blank\\">@DaveOshry</a> but you\'re missing a doughnut showcase on 6th", "is_retweet": false, "id": 710330003330719744}, {"text": "@kalyncorrigan come onnnn. One of us owes the other one a birthday hat. Is that right? Where am I pulling this hat thing from?", "user": {"name": "Tim Poon", "screen_name": "mockenoff", "profile_image_url": "https://pbs.twimg.com/profile_images/378800000679332660/93d8a67c62e0d949521a5a585a7367bb_normal.jpeg"}, "created_at": "2016-03-17 04:57:14", "formatted_text": "<a href=\\"https://twitter.com/kalyncorrigan\\" target=\\"_blank\\">@kalyncorrigan</a> come onnnn. One of us owes the other one a birthday hat. Is that right? Where am I pulling this hat thing from?", "is_retweet": false, "id": 710329120144490497}, {"text": "@kalyncorrigan probably right now! Goooooo!", "user": {"name": "Tim Poon", "screen_name": "mockenoff", "profile_image_url": "https://pbs.twimg.com/profile_images/378800000679332660/93d8a67c62e0d949521a5a585a7367bb_normal.jpeg"}, "created_at": "2016-03-17 04:43:07", "formatted_text": "<a href=\\"https://twitter.com/kalyncorrigan\\" target=\\"_blank\\">@kalyncorrigan</a> probably right now! Goooooo!", "is_retweet": false, "id": 710325569070575617}, {"text": "@mistahoppa I never saw any of the animated series but I imagine they had to end it because it was *too* good", "user": {"name": "Tim Poon", "screen_name": "mockenoff", "profile_image_url": "https://pbs.twimg.com/profile_images/378800000679332660/93d8a67c62e0d949521a5a585a7367bb_normal.jpeg"}, "created_at": "2016-03-17 03:57:16", "formatted_text": "<a href=\\"https://twitter.com/mistahoppa\\" target=\\"_blank\\">@mistahoppa</a> I never saw any of the animated series but I imagine they had to end it because it was *too* good", "is_retweet": false, "id": 710314032368975872}, {"text": "@kalyncorrigan I made top 500? Yay! There\'s also still time to get here. We can go to the Voodoo Doughnut on 6th!", "user": {"name": "Tim Poon", "screen_name": "mockenoff", "profile_image_url": "https://pbs.twimg.com/profile_images/378800000679332660/93d8a67c62e0d949521a5a585a7367bb_normal.jpeg"}, "created_at": "2016-03-17 03:55:08", "formatted_text": "<a href=\\"https://twitter.com/kalyncorrigan\\" target=\\"_blank\\">@kalyncorrigan</a> I made top 500? Yay! There\'s also still time to get here. We can go to the Voodoo Doughnut on 6th!", "is_retweet": false, "id": 710313491702226944}, {"text": "How many highlanders did this guy have to kill to gain this power https://t.co/UBGFWXezRE", "user": {"name": "Tim Poon", "screen_name": "mockenoff", "profile_image_url": "https://pbs.twimg.com/profile_images/378800000679332660/93d8a67c62e0d949521a5a585a7367bb_normal.jpeg"}, "created_at": "2016-03-17 03:43:16", "formatted_text": "How many highlanders did this guy have to kill to gain this power <a href=\\"https://youtu.be/kF9WbaJ0GZ4\\" target=\\"_blank\\">youtu.be/kF9WbaJ0GZ4</a>", "is_retweet": false, "id": 710310506301554688}, {"text": "@maskedrepublic thanks! It was fantastic last night. The fans really made it something special.", "user": {"name": "Tim Poon", "screen_name": "mockenoff", "profile_image_url": "https://pbs.twimg.com/profile_images/378800000679332660/93d8a67c62e0d949521a5a585a7367bb_normal.jpeg"}, "created_at": "2016-03-16 19:00:55", "formatted_text": "<a href=\\"https://twitter.com/maskedrepublic\\" target=\\"_blank\\">@maskedrepublic</a> thanks! It was fantastic last night. The fans really made it something special.", "is_retweet": false, "id": 710179052854779904}, {"media": [{"media_url": "https://pbs.twimg.com/media/CdofqgIUMAENZyP.jpg", "expanded_url": "http://twitter.com/mockenoff/status/709914795424657408/photo/1"}], "text": "Oh my yes, the band at the Lucha Underground event is all wearing luchador masks and now covering the Black Keys https://t.co/ubT6jMJ4uf", "user": {"name": "Tim Poon", "screen_name": "mockenoff", "profile_image_url": "https://pbs.twimg.com/profile_images/378800000679332660/93d8a67c62e0d949521a5a585a7367bb_normal.jpeg"}, "created_at": "2016-03-16 01:30:51", "formatted_text": "Oh my yes, the band at the Lucha Underground event is all wearing luchador masks and now covering the Black Keys <a href=\\"http://twitter.com/mockenoff/status/709914795424657408/photo/1\\" target=\\"_blank\\">pic.twitter.com/ubT6jMJ4uf</a>", "is_retweet": false, "id": 709914795424657408}, {"media": [{"media_url": "https://pbs.twimg.com/media/CdiNGE6WAAIVG3t.jpg", "expanded_url": "http://twitter.com/DannyDutch/status/709472084729208833/photo/1"}], "text": "RT @DannyDutch: If you face swap Mulder &amp; Scully they look like a great Synth Pop band. https://t.co/Sai6CsC8Am", "user": {"name": "Tim Poon", "screen_name": "mockenoff", "profile_image_url": "https://pbs.twimg.com/profile_images/378800000679332660/93d8a67c62e0d949521a5a585a7367bb_normal.jpeg"}, "created_at": "2016-03-15 20:26:39", "formatted_text": "RT <a href=\\"https://twitter.com/DannyDutch\\" target=\\"_blank\\">@DannyDutch</a>: If you face swap Mulder &amp; Scully they look like a great Synth Pop band. <a href=\\"http://twitter.com/DannyDutch/status/709472084729208833/photo/1\\" target=\\"_blank\\">pic.twitter.com/Sai6CsC8Am</a>", "is_retweet": true, "id": 709838239243177984}, {"media": [{"media_url": "https://pbs.twimg.com/media/CdjSxr2UEAA3lCM.jpg", "expanded_url": "http://twitter.com/mockenoff/status/709548706500968448/photo/1"}], "text": "Like Texas Ranger Cordell Walker before them, Texas is under the watch of these immense warriors of justice tonight https://t.co/vCBHKdrTWn", "user": {"name": "Tim Poon", "screen_name": "mockenoff", "profile_image_url": "https://pbs.twimg.com/profile_images/378800000679332660/93d8a67c62e0d949521a5a585a7367bb_normal.jpeg"}, "created_at": "2016-03-15 01:16:09", "formatted_text": "Like Texas Ranger Cordell Walker before them, Texas is under the watch of these immense warriors of justice tonight <a href=\\"http://twitter.com/mockenoff/status/709548706500968448/photo/1\\" target=\\"_blank\\">pic.twitter.com/vCBHKdrTWn</a>", "is_retweet": false, "id": 709548706500968448}, {"media": [{"media_url": "https://pbs.twimg.com/tweet_video_thumb/CdJPr9iWEAUtPi8.jpg", "expanded_url": "http://twitter.com/_Pandy/status/707716963443851269/photo/1"}], "text": "RT @_Pandy: VR is the next big thing and i\'m going to make millions with my virtual reality cat petting simulator https://t.co/YrGik5xOf9", "user": {"name": "Tim Poon", "screen_name": "mockenoff", "profile_image_url": "https://pbs.twimg.com/profile_images/378800000679332660/93d8a67c62e0d949521a5a585a7367bb_normal.jpeg"}, "created_at": "2016-03-10 17:27:30", "formatted_text": "RT <a href=\\"https://twitter.com/_Pandy\\" target=\\"_blank\\">@_Pandy</a>: VR is the next big thing and i\'m going to make millions with my virtual reality cat petting simulator <a href=\\"http://twitter.com/_Pandy/status/707716963443851269/photo/1\\" target=\\"_blank\\">pic.twitter.com/YrGik5xOf9</a>", "is_retweet": true, "id": 707981216532660224}, {"text": "RT @everywhereist: Bottom right corner: these two dudes at a Trump rally are GODS. \\n\\nhttps://t.co/FLluTjjukZ", "user": {"name": "Tim Poon", "screen_name": "mockenoff", "profile_image_url": "https://pbs.twimg.com/profile_images/378800000679332660/93d8a67c62e0d949521a5a585a7367bb_normal.jpeg"}, "created_at": "2016-03-07 23:44:47", "formatted_text": "RT <a href=\\"https://twitter.com/everywhereist\\" target=\\"_blank\\">@everywhereist</a>: Bottom right corner: these two dudes at a Trump rally are GODS. \\n\\n<a href=\\"http://i.imgur.com/bUcTvOx.gifv\\" target=\\"_blank\\">i.imgur.com/bUcTvOx.gifv</a>", "is_retweet": true, "id": 706988999722676224}, {"text": "And in more inspiring news, an American artist documented her worldly travels by painting in a Moleskine notebook https://t.co/KKlWVokkVh", "user": {"name": "Tim Poon", "screen_name": "mockenoff", "profile_image_url": "https://pbs.twimg.com/profile_images/378800000679332660/93d8a67c62e0d949521a5a585a7367bb_normal.jpeg"}, "created_at": "2016-03-02 12:30:50", "formatted_text": "And in more inspiring news, an American artist documented her worldly travels by painting in a Moleskine notebook <a href=\\"http://www.boredpanda.com/100-landscape-paintings-sketchbook-missy-dunaway/\\" target=\\"_blank\\">boredpanda.com/100-landscape-\\u2026</a>", "is_retweet": false, "id": 705007456070402048}, {"text": "A fascinating, terrifying, and depressing read on authoritarianism and the impending triptych of American politics https://t.co/6aN6mH1E3l", "user": {"name": "Tim Poon", "screen_name": "mockenoff", "profile_image_url": "https://pbs.twimg.com/profile_images/378800000679332660/93d8a67c62e0d949521a5a585a7367bb_normal.jpeg"}, "created_at": "2016-03-02 12:17:44", "formatted_text": "A fascinating, terrifying, and depressing read on authoritarianism and the impending triptych of American politics <a href=\\"http://www.vox.com/2016/3/1/11127424/trump-authoritarianism\\" target=\\"_blank\\">vox.com/2016/3/1/11127\\u2026</a>", "is_retweet": false, "id": 705004158550564864}]')
	minutes = {24294208: [707981216532660224], 24305857: [710927931103576069], 24307143: [711251572257239040], 24307528: [711348579416219650], 24282378: [705004158550564864], 24282391: [705007456070402048], 24318924: [714216322213609472], 24303512: [710337826869522433], 24307475: [711335290045014018], 24301831: [709914795424657408], 24301527: [709838239243177984], 24300376: [709548706500968448], 24290265: [706988999722676224], 24314782: [713174134037983232], 24304480: [710581550165823488], 24302881: [710179052854779904], 24303463: [710325569070575617], 24307368: [711308232757633024], 24303403: [710310506301554688], 24303481: [710330003330719744], 24303477: [710329120144490497], 24303415: [710313491702226944], 24303417: [710314032368975872], 24310654: [712135090902405120]}
	return utils.json_response({'tweets': data, 'minutes': minutes}, status=200)


if __name__ == '__main__':
	APP.secret_key = 'dummykey'
	APP.run(debug=True)
