import tweepy

class Twitter(object):
	CONSUMER_KEY = 'dummykey'
	CONSUMER_SECRET = 'dummykey'

	def __init__(self, access_token, access_token_secret):
		self.auth = Twitter.make_auth()
		self.auth.set_access_token(access_token, access_token_secret)
		self.api = tweepy.API(self.auth)

	@property
	def friends(self):
		return tweepy.Cursor(self.api.friends_ids)

	@staticmethod
	def make_auth():
		return tweepy.OAuthHandler(Twitter.CONSUMER_KEY, Twitter.CONSUMER_SECRET)
