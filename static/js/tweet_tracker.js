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

	// Get the templates
	var marker = /\[\[\s*([\w\d_]+)\s*\]\]/gim,
		templates = {
			tweet: 'tweet-template',
			list: 'media-list-template',
			item: 'media-item-template',
		};
	for (var key in templates) {
		templates[key] = document.querySelector('#' + templates[key]).innerHTML;
		templates[key] = templates[key].replace(marker, '[[$1]]');
	}


	// Fill templates with data
	this.renderTemplate = function(template, data) {
		if (template in templates === false) {
			return console.error('No template named ' + template);
		}

		var render = templates[template];
		for (var key in data) {
			render = render.replace(new RegExp('\\[\\['+key+'\\]\\]', 'gim'), data[key]);
		}

		return render.replace(marker, '');
	}.bind(this);


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

			var html = '';
			for (var i = 0, l = data.tweets.length; i < l; i++) {
				var media = '',
					curr = format.parse(data.tweets[i].created_at).getTime() - settings.start.getTime();

				if (curr < 0) {
					continue;
				}

				timeline.push(curr);
				tweets.push(data.tweets[i]);

				if (data.tweets[i].media !== undefined) {
					for (var j = 0, k = data.tweets[i].media.length; j < k; j++) {
						media += this.renderTemplate('item', data.tweets[i].media[j]);
					}
					media = this.renderTemplate('list', {images: media});
				}

				html += this.renderTemplate('tweet', {
					media: media,
					created_at: data.tweets[i].created_at,
					screen_name: data.tweets[i].user.screen_name,
					formatted_text: data.tweets[i].formatted_text,
					profile_image_url: data.tweets[i].user.profile_image_url,
				});
			}
			container.innerHTML = html;

			for (i = 0, l = timeline.length; i < l; i++) {
				timeline[i] = {
					curr: timeline[i],
					next: i < 1 ? null : timeline[i - 1].curr,
					prev: i === l - 1 ? null : timeline[i + 1],
				};
			}
			active = l - 1;
			console.log('TIME', timeline);

			if (typeof settings.onLoadTweets === 'function') {
				settings.onLoadTweets(data.tweets, minutes);
			}
		}.bind(this));
	}.bind(this);


	// Turn an object of minutes into an array of amplitude
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
