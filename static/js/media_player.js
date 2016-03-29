var API_READY = false,
	MEDIA_PLAYERS = [];

function MediaPlayer(container, settings) {
	var player,
		isReady = false,
		videoStats = {
			id: null,
			url: null,
			duration: 0,
		},
		defaultSettings = {
			playerId: 'player',
			skipChunk: 5,
			volumeChunk: 5,
			autoplay: false,
			gradients: [
				'#ffffb2',
				'#fd8d3c',
				'#fd8d3c',
				'#f03b20',
				'#bd0026',
			],
			onPlayerReady: null,
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


	// Grab the necessary elements
	var loader = container.querySelector('.loader'),
		plause = container.querySelector('.plause'),
		progress = {
			width: 0,
			svg: null,
			container: container.querySelector('.progress'),
			progress: container.querySelector('progress'),
			track: container.querySelector('.track'),
		};


	// Pause/play button event
	plause.addEventListener('click', function(ev) {
		ev.preventDefault();
		if (player.getPlayerState() === YT.PlayerState.PAUSED) {
			player.playVideo();
		} else {
			player.pauseVideo();
		}
	});


	// For when the video is ready to play
	this.onPlayerReady = function(ev) {
		console.log('READY', isReady, videoStats.id, ev);

		if (typeof videoStats.id === 'string') {
			if (isReady === false) {
				return player.loadVideoById(videoStats.id);
			}

			videoStats.duration = player.getDuration();
			progress.progress.setAttribute('max', videoStats.duration);
			progress.progress.setAttribute('value', player.getCurrentTime());

			player.setVolume(100);
			if (settings.autoplay === true) {
				player.playVideo();
			} else {
				player.pauseVideo();
			}

			updateTime();

			if (typeof settings.onPlayerReady === 'function') {
				settings.onPlayerReady(videoStats.id, videoStats.duration);
			}
		}
	}.bind(this);


	// For when the player changes state
	this.onPlayerStateChange = function(ev) {
		console.log('STATE', isReady, ev);
		if (ev.data < 0) {
			isReady = false;
		} else if (isReady === false) {
			if (ev.data === YT.PlayerState.PLAYING) {
				isReady = true;
				this.onPlayerReady(ev);
			}
		}
		if (ev.data === YT.PlayerState.PAUSED) {
			plause.setAttribute('data-state', 'pause');
		} else {
			plause.setAttribute('data-state', 'play');
		}
	}.bind(this);


	// Callback to when the YouTube iframe API is ready
	this.onYouTubeIframeAPIReady = function() {
		if (player === undefined) {
			player = new YT.Player(settings.playerId, {
				width: '1280',
				height: '720',
				playerVars: {
					'rel': 0,
					'controls': 0,
					'showinfo': 0,
					'disablekb': 1,
					'modestbranding': 0,
					'autoplay': settings.autoplay === true ? 1 : 0,
				},
				events: {
					'onReady': this.onPlayerReady,
					'onStateChange': this.onPlayerStateChange,
				},
			});
		}
	}.bind(this);


	// Key bindings
	document.body.addEventListener('keydown', function(ev) {
		var preventDefault = false,
			keyCode = ev.keyCode || ev.which;

		if (isReady === false) {
			return;
		}

		if (keyCode === 32) {
			if (player.getPlayerState() === YT.PlayerState.PAUSED) {
				player.playVideo();
			} else {
				player.pauseVideo();
			}
			preventDefault = true;
		} else if (keyCode === 37) {
			var timeDelta = ev.shiftKey === true ? settings.skipChunk * 2 : settings.skipChunk,
				newTime = Math.max(0, player.getCurrentTime() - timeDelta);
			player.seekTo(newTime, true);
			preventDefault = true;
		} else if (keyCode === 39) {
			var timeDelta = ev.shiftKey === true ? settings.skipChunk * 2 : settings.skipChunk,
				newTime = Math.min(player.getDuration(), player.getCurrentTime() + timeDelta);
			player.seekTo(newTime, true);
			preventDefault = true;
		} else if (keyCode === 38) {
			var newVolume = Math.min(100, player.getVolume() + settings.volumeChunk);
			player.setVolume(newVolume);
			preventDefault = true;
		} else if (keyCode === 40) {
			var newVolume = Math.max(0, player.getVolume() - settings.volumeChunk);
			player.setVolume(newVolume);
			preventDefault = true;
		}

		if (preventDefault === true) {
			ev.preventDefault();
		}
	});
	document.body.focus();


	// Mouse tracking
	progress.container.addEventListener('click', function(ev) {
		console.log('CLICK', ev);
		player.seekTo((player.getDuration() * (ev.offsetX / progress.width)), true);
	});

	progress.container.addEventListener('mouseover', function(ev) {
		progress.container.addEventListener('mousemove', onMousemove);
	});

	progress.container.addEventListener('mouseout', function(ev) {
		progress.container.removeEventListener('mousemove', onMousemove);
		progress.track.style.width = '0%';
	});

	var onMousemove = function(ev) {
		progress.track.style.width = (100 * (ev.offsetX / progress.width))+'%';
	}.bind(this);


	// Big function to load a video, collect tweets, and go
	this.loadVideo = function(videoId, startTime, username) {
		console.log('LOAD', videoId);
		videoStats.id = videoId;
		if (API_READY === true) {
			player.loadVideoById(videoId);
		}
	}.bind(this);


	// Catch resizes so the SVG scales
	var onResize = function(ev) {
		progress.width = progress.container.clientWidth;
		if (progress.svg !== null) {
			progress.svg.attr('width', progress.container.clientWidth).attr('height', progress.container.clientHeight);
		}
	}.bind(this);

	window.addEventListener('optimizedResize', onResize);
	onResize();


	// The progress tracker has to update
	var updateTime = function() {
		if (progress.progress.getAttribute('max') !== undefined && player !== undefined) {
			progress.progress.setAttribute('value', player.getCurrentTime());
			requestAnimationFrame(updateTime);
		}
	}.bind(this);
	requestAnimationFrame(updateTime);


	// Toggle loader overlay
	this.toggleLoader = function(doShow) {
		if (doShow === undefined) {
			loader.classList.toggle('hide');
		} else if (doShow === true) {
			loader.classList.remove('hide');
		} else {
			loader.classList.add('hide');
		}
	}.bind(this);


	// Play/pause functions
	this.play = function() {
		player.playVideo();
	}.bind(this);

	this.pause = function() {
		player.pauseVideo();
	}.bind(this);


	// Graph tweet density on the SVG
	this.createGraph = function(data) {
		if (data === undefined || typeof data.push !== 'function') {
			data = [];
		}
		console.log('GRAPH', data);

		// Make sure the SVG eixsts
		if (progress.svg === null) {
			progress.svg = d3.select(progress.container).append('svg');
		} else {
			progress.svg.selectAll('path').remove();
			progress.svg.selectAll('defs').remove();
		}
		progress.svg.attr('width', progress.container.clientWidth).attr('height', progress.container.clientHeight);

		// Create gradients
		var gLength = settings.gradients.length,
			dRange = d3.extent(data, function(d) { return d; }),
			gradient = progress.svg.append('defs').append('linearGradient')
				.attr('id', 'gradient')
				.attr('x1', '0%')
				.attr('y1', '0%')
				.attr('x2', '100%')
				.attr('y2', '0%')
				.attr('spreadMethod', 'pad');

		// Pad out the start of the data
		data.unshift(dRange[0]);
		gradient.append('stop')
			.attr('offset', '0%')
			.attr('stop-color', settings.gradients[0])
			.attr('stop-opacity', 1);

		// Generate gradient stops based on the data
		for (var i = 0, dLength = data.length; i < dLength; i++) {
			gradient.append('stop')
				.attr('offset', ((i / dLength) * 100)+'%')
				.attr('stop-color', settings.gradients[Math.max(0, Math.floor(gLength * ((data[i] - dRange[0]) / (dRange[1] - dRange[0]))) - 1)])
				.attr('stop-opacity', 1);
		}

		// Add boundary items so it fills the entire graph
		data.push(data[data.length - 1]);

		// Turn them into minute-based tuples
		for (i = 0, dLength = data.length; i < dLength; i++) {
			data[i] = [i, data[i]];
		}

		// Draw the graph
		var x = d3.time.scale().range([0, progress.container.clientWidth]),
			y = d3.scale.linear().range([progress.container.clientHeight, 0]);

		x.domain(d3.extent(data, function(d) { return d[0]; }));
		y.domain(d3.extent(data, function(d) { return d[1]; }));

		var area = d3.svg.area().interpolate('basis').x(function(d) { return x(d[0]); }).y0(progress.container.clientHeight).y1(function(d) { return y(d[1]); });
		progress.svg.append('path').datum(data).style('fill', 'url(#gradient)').attr('d', area);
	}.bind(this);


	// Add to the global tracker and init if the API is ready
	MEDIA_PLAYERS.push(this);
	if (API_READY === true && player === undefined) {
		this.onYouTubeIframeAPIReady();
	}
}


// Global callback for when the YouTube iframe API is ready
window.onYouTubeIframeAPIReady = function() {
	console.log('API');
	API_READY = true;
	for (var i = 0, l = MEDIA_PLAYERS.length; i < l; i++) {
		MEDIA_PLAYERS[i].onYouTubeIframeAPIReady();
	}
}


// Create an optimized version of the resize event
;(function() {
	var throttle = function(type, name, obj) {
		obj = obj || window;
		var running = false,
			func = function() {
				if (running) {
					return;
				}
				running = true;
				 requestAnimationFrame(function() {
					obj.dispatchEvent(new CustomEvent(name));
					running = false;
				});
			};
		obj.addEventListener(type, func);
	};

	throttle('resize', 'optimizedResize');
})();
