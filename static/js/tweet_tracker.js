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
	console.log('SETTINGS', settings.start, settings.end, settings.duration);
	if (typeof settings.duration === 'number') {
		if (typeof settings.start === 'object') {
			settings.end = new Date(settings.start.getTime() + (settings.duration * 1000));
		} else if (typeof settings.end === 'object') {
			settings.start = new Date(settings.end.getTime() - (settings.duration * 1000));
		}
	}
	console.log('SETTINGS', settings.start, settings.end, settings.duration);

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
		var morphed = []
			start = Math.floor(settings.start.getTime() / (60 * 1000));
		for (var i = 0, l = Math.ceil(settings.duration / 60); i <= l; i++) {
			var minute = start + i;
			if (minute in data) {
				morphed.push(data[minute].length);
			} else {
				morphed.push(0);
			}
		}
		return morphed;
	}.bind(this);
}
