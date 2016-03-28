import datetime
from collections import defaultdict

import tweepy

class Twitter(object):
	CONSUMER_KEY = 'dummykey'
	CONSUMER_SECRET = 'dummykey'

	def __init__(self, access_token, access_token_secret):
		self.auth = Twitter.make_auth()
		self.auth.set_access_token(access_token, access_token_secret)
		self.api = tweepy.API(self.auth)

	@property
	def friends_ids(self):
		return tweepy.Cursor(self.api.friends_ids)

	@staticmethod
	def make_auth():
		return tweepy.OAuthHandler(Twitter.CONSUMER_KEY, Twitter.CONSUMER_SECRET)

	@staticmethod
	def get_formatted_text(status):
		text = status.text

		entities = []
		for key in ('urls', 'user_mentions', 'media'):
			if key in status.entities:
				entities += status.entities[key]
		entities.sort(key=lambda x: x['indices'][0], reverse=True)

		for entity in entities:
			replacement = text[entity['indices'][0]:entity['indices'][1]]
			if 'url' in entity:
				replacement = '<a href="%s" target="_blank">%s</a>' % (entity['expanded_url'], entity['display_url'])
			elif 'screen_name' in entity:
				replacement = '<a href="https://twitter.com/%s" target="_blank">%s</a>' % (entity['screen_name'], text[entity['indices'][0]:entity['indices'][1]])
			text = text[0:entity['indices'][0]] + replacement + text[entity['indices'][1]:]

		return text

	@staticmethod
	def format_status(status):
		data = {
			'user': {
				'name': status.user.name,
				'screen_name': status.user.screen_name,
				'profile_image_url': status.user.profile_image_url_https,
			},
			'id': status.id,
			'text': status.text,
			'formatted_text': Twitter.get_formatted_text(status),
			'created_at': status.created_at,
			'is_retweet': hasattr(status, 'retweeted_status'),
		}
		if 'media' in status.entities:
			data['media'] = [{
				'media_url': media['media_url_https'],
				'expanded_url': media['expanded_url'],
			} for media in status.entities['media']]
		return data

	def get_timeline(self, user_ids, start, end=None):
		if isinstance(user_ids, str):
			user_ids = [user_ids]
		if isinstance(start, str):
			start = datetime.datetime.strptime(start, '%Y-%m-%d %H:%M:%S')
		if isinstance(end, str):
			end = datetime.datetime.strptime(end, '%Y-%m-%d %H:%M:%S')
		if not end:
			end = datetime.datetime.now()

		tweets = []
		for user_id in user_ids:
			page = 1
			while True:
				statuses = self.api.user_timeline(user_id=user_id, count=200, page=page)
				if statuses and statuses[0].created_at >= start and statuses[len(statuses)-1].created_at <= end:
					page += 1
					for status in statuses:
						if status.created_at >= start and status.created_at <= end:
							tweets.append(Twitter.format_status(status))
				else:
					break

		tweets.sort(key=lambda x: x['created_at'], reverse=True)
		return tweets

	def make_minutes(self, tweets):
		silo = defaultdict(list)
		for tweet in tweets:
			minute = round(tweet['created_at'].timestamp() / 60)
			silo[minute].append(tweet['id'])
		return silo
