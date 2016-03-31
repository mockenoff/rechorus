function toQueryString(obj) {
	var parts = [];
	for (var i in obj) {
		if (obj.hasOwnProperty(i)) {
			parts.push(encodeURIComponent(i) + '=' + encodeURIComponent(obj[i]));
		}
	}
	return parts.join('&');
}


window.TweetTracker = function(container, settings) {
	var isLoaded = false,
		tweets = null,
		minutes = null,
		active = null,
		timeline = null,
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
			settings.end = new Date(settings.start.getTime() + (settings.duration * 1000));
		} else if (typeof settings.end === 'object') {
			settings.start = new Date(settings.end.getTime() - (settings.duration * 1000));
		}
	}


	// Load tweets based on settings
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
			timeline = [];
			isLoaded = true;

			tweets = [];
			minutes = data.minutes;

			for (var i = 0, l = data.tweets.length; i < l; i++) {
				var curr = format.parse(data.tweets[i].created_at).getTime() - settings.start.getTime();

				if (curr < 0) {
					continue;
				}

				timeline.push(curr / 1000);
				tweets.push(data.tweets[i]);
			}

			container.tweets = tweets;

			for (i = 0, l = timeline.length; i < l; i++) {
				timeline[i] = {
					done: false,
					curr: timeline[i],
					next: i < 1 ? null : timeline[i - 1].curr,
					prev: i === l - 1 ? null : timeline[i + 1],
				};
			}

			timeline[i] = {
				done: true,
				curr: Infinity,
				next: timeline[i - 1].curr,
				prev: null,
			};
			timeline[i - 1].prev = Infinity;
			active = l;
			console.log('TIME', active, timeline);

			if (typeof settings.onLoadTweets === 'function') {
				settings.onLoadTweets(data.tweets, minutes);
			}
		}.bind(this));
	}.bind(this);


	// Turn an object of minutes into an array of amplitude
	this.morphMinutes = function(data) {
		var morphed = [],
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


	// Update the display according to the time
	this.updateTime = function(currentTime) {
		if (timeline !== null && active in timeline === true) {
			if (timeline[active].next === null) {
				console.log('DONE');
				active = null;
			} else if (currentTime >= timeline[active].next) {
				console.log('NEXT');
				timeline[active].done = true;
				active--;
			}
		}
	}.bind(this);
};
