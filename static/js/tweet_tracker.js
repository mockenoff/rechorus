function toQueryString(obj) {
	var parts = [];
	for (var i in obj) {
		if (obj.hasOwnProperty(i)) {
			parts.push(encodeURIComponent(i) + '=' + encodeURIComponent(obj[i]));
		}
	}
	return parts.join('&');
}


function TweetTracker(container, settings) {
	var isLoaded = false,
		tweets = null,
		minutes = null,
		format = d3.time.format('%Y-%m-%d %H:%M:%S'),
		defaultSettings = {
			end: null,
			start: null,
			duration: null,
			onLoadTweets: null,
		};

	// Extend the default settings
	if (typeof settings !== 'object') {
		settings = {};
	}
	for (var key in defaultSettings) {
		if (key in settings === false) {
			settings[key] = defaultSettings[key];
		}
	}

	// Determine full ranges
	if (typeof settings.start === 'string') {
		settings.start = format.parse(settings.start);
	}
	if (typeof settings.end === 'string') {
		settings.end = format.parse(settings.end);
	}
	if (typeof settings.duration === 'string') {
		settings.duration = parseInt(settings.duration, 10);
	}
	if (typeof settings.duration === 'number') {
		if (typeof settings.start === 'object') {
			settings.end = new Date(settings.start.getTime() + settings.duration);
		} else if (typeof settings.end === 'object') {
			settings.start = new Date(settings.end.getTime() - settings.duration);
		}
	}

	this.loadTweets = function() {
		if (settings.start === null || settings.end === null) {
			console.error('Missing settings', settings);
			return false;
		}

		d3.json('/tweets/?' + toQueryString({start: format(settings.start), end: format(settings.end)}), function(error, data) {
			if (error) {
				return console.error(error);
			}

			console.log('TWEETS', data);
			tweets = data.tweets;
			minutes = data.minutes;

			if (typeof settings.onLoadTweets === 'function') {
				settings.onLoadTweets(tweets, minutes);
			}
		});
	}.bind(this);

	this.morphMinutes = function(data) {
		var morphed = [];
		for (var key in data) {
			morphed.push({
				minute: key,
				count: data[key].length,
			});
		}
		morphed.sort(function(a, b) {
			return a.minute.localeCompare(b.minute);
		});
		for (var i = 0, l = morphed.length; i < l; i++) {
			morphed[i] = morphed[i].count;
		}
		return morphed;
	}.bind(this);
}
