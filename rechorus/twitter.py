import tweepy

class Twitter(object):
	CONSUMER_KEY = 'MLhwOfLaGMIIqoXZjrWbhrGIl'
	CONSUMER_SECRET = 'hmvActnMkCacha2cAF3oi1XhUI0Q8NbvFdTAqYS2pFTYCpYBHz'

	def __init__(self):
		auth = tweepy.OAuthHandler(Twitter.CONSUMER_KEY, Twitter.CONSUMER_SECRET)
		try:
			redirect_url = auth.get_authorization_url()
		except tweepy.TweepError:
			print 'Error! Failed to get request token.'
