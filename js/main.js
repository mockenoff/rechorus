var player,
	controls = document.querySelector('.controls'),
	plause = controls.querySelector('.plause'),
	progress = controls.querySelector('progress'),
	SKIP_CHUNK = 5,
	VOLUME_CHUNK = 5;


function onYouTubeIframeAPIReady() {
	player = new YT.Player('player', {
		width: '1280',
		height: '720',
		videoId: 'vlRZ2UxAe0E',
		playerVars: {
			'rel': 0,
			'autoplay': 1,
			'controls': 0,
			'showinfo': 0,
			'disablekb': 1,
			'modestbranding': 0,
		},
		events: {
			'onReady': onPlayerReady,
			'onStateChange': onPlayerStateChange,
		},
	});
}


function onPlayerReady(ev) {
	console.log('READY', ev);
	progress.setAttribute('max', player.getDuration());
	progress.setAttribute('value', player.getCurrentTime());
	player.setVolume(100);
	player.playVideo();
	updateTime();
	createGraph();
}


function onPlayerStateChange(ev) {
	console.log('CHANGE', ev);
	if (player.getPlayerState() === YT.PlayerState.PAUSED) {
		plause.setAttribute('data-state', 'pause');
	} else {
		plause.setAttribute('data-state', 'play');
	}
}


plause.addEventListener('click', function(ev) {
	ev.preventDefault();
	if (player.getPlayerState() === YT.PlayerState.PAUSED) {
		player.playVideo();
	} else {
		player.pauseVideo();
	}
});


var progressContainer = progress.parentNode,
	progressTrack = progressContainer.querySelector('.track'),
	progressWidth = progressContainer.clientWidth;

progressContainer.addEventListener('click', function(ev) {
	console.log('CLICK', ev);
	player.seekTo((player.getDuration() * (ev.offsetX / progressWidth)), true);
});

progressContainer.addEventListener('mouseover', function(ev) {
	progressContainer.addEventListener('mousemove', mousemove);
});

progressContainer.addEventListener('mouseout', function(ev) {
	progressContainer.removeEventListener('mousemove', mousemove);
	progressTrack.style.width = '0%';
});

function mousemove(ev) {
	progressTrack.style.width = (100 * (ev.offsetX / progressWidth))+'%';
}


document.body.addEventListener('keydown', function(ev) {
	var input = false,
		keyCode = ev.keyCode || ev.which;

	if (keyCode === 32) {
		if (player.getPlayerState() === YT.PlayerState.PAUSED) {
			player.playVideo();
		} else {
			player.pauseVideo();
		}
		input = true;
	} else if (keyCode === 37) {
		var timeDelta = ev.shiftKey === true ? SKIP_CHUNK * 2 : SKIP_CHUNK,
			newTime = Math.max(0, player.getCurrentTime() - timeDelta);
		player.seekTo(newTime, true);
		input = true;
	} else if (keyCode === 39) {
		var timeDelta = ev.shiftKey === true ? SKIP_CHUNK * 2 : SKIP_CHUNK,
			newTime = Math.min(player.getDuration(), player.getCurrentTime() + timeDelta);
		player.seekTo(newTime, true);
		input = true;
	} else if (keyCode === 38) {
		var newVolume = Math.min(100, player.getVolume() + VOLUME_CHUNK);
		player.setVolume(newVolume);
		input = true;
	} else if (keyCode === 40) {
		var newVolume = Math.max(0, player.getVolume() - VOLUME_CHUNK);
		player.setVolume(newVolume);
		input = true;
	}

	if (input === true) {
		ev.preventDefault();
	}
});
document.body.focus();


function updateTime(timestamp) {
	if (progress.getAttribute('max') !== undefined && player !== undefined) {
		progress.setAttribute('value', player.getCurrentTime());
		requestAnimationFrame(updateTime);
	}
}
requestAnimationFrame(updateTime);


function createGraph() {
	var DATA = [];
	for (var i = 0, l = Math.ceil(player.getDuration() / 60); i < l; i++) {
		DATA.push(Math.round(Math.random() * 20));
	}
	// Append SVG
	var svg = d3.select(progress.parentNode).append('svg').attr('width', progress.clientWidth).attr('height', progress.clientHeight),
	// Create gradients
	gRange = [
		'#ffffb2',
		'#fd8d3c',
		'#fd8d3c',
		'#f03b20',
		'#bd0026',
	],
	gLength = gRange.length,
	dRange = d3.extent(DATA, function(d) { return d; }),
	gradient = svg.append('defs').append('linearGradient')
	.attr('id', 'gradient')
	.attr('x1', '0%')
	.attr('y1', '0%')
	.attr('x2', '100%')
	.attr('y2', '0%')
	.attr('spreadMethod', 'pad');

	// Pad out the start of the data
	DATA.unshift(dRange[0]);
	gradient.append('stop')
	.attr('offset', '0%')
	.attr('stop-color', gRange[0])
	.attr('stop-opacity', 1);

	// Generate gradient stops based on the data
	for (var i = 0, dLength = DATA.length; i < dLength; i++) {
		console.log('A', i, DATA[i], Math.max(0, Math.floor(gLength * ((DATA[i] - dRange[0]) / (dRange[1] - dRange[0]))) - 1));
		gradient.append('stop')
		.attr('offset', ((i / dLength) * 100)+'%')
		.attr('stop-color', gRange[Math.max(0, Math.floor(gLength * ((DATA[i] - dRange[0]) / (dRange[1] - dRange[0]))) - 1)])
		.attr('stop-opacity', 1);
	}

	// Add boundary items so it fills the entire graph
	DATA.push(DATA[DATA.length - 1]);
	// Turn them into minute-based tuples
	for (i = 0, dLength = DATA.length; i < dLength; i++) {
		DATA[i] = [i, DATA[i]];
	}

	// Draw the graph
	var x = d3.time.scale().range([0, progress.clientWidth]);
	var y = d3.scale.linear().range([progress.clientHeight, 0]);
	x.domain(d3.extent(DATA, function(d) { return d[0]; }));
	y.domain(d3.extent(DATA, function(d) { return d[1]; }));
	var area = d3.svg.area().interpolate('basis').x(function(d) { return x(d[0]); }).y0(progress.clientHeight).y1(function(d) { return y(d[1]); });
	svg.append('path').datum(DATA).style('fill', 'url(#gradient)').attr('d', area);
}
