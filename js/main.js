var player,
	progress = document.querySelector('.controls progress'),
	SKIP_CHUNK = 5,
	VOLUME_CHUNK = 5;

function onYouTubeIframeAPIReady() {
	player = new YT.Player('player', {
		width: '1280',
		height: '720',
		videoId: 'M7lc1UVf-VE',
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
	player.playVideo();
	updateTime();
	createGraph();
}

function onPlayerStateChange(ev) {
	console.log('CHANGE', ev);
}

document.body.addEventListener('keydown', function(ev) {
	var keyCode = ev.keyCode || ev.which;
	if (keyCode === 32) {
		if (player.getPlayerState() === YT.PlayerState.PAUSED) {
			player.playVideo();
		} else {
			player.pauseVideo();
		}
	} else if (keyCode === 37) {
		var timeDelta = ev.shiftKey === true ? SKIP_CHUNK * 2 : SKIP_CHUNK,
			newTime = Math.max(0, player.getCurrentTime() - timeDelta);
		player.seekTo(newTime, true);
	} else if (keyCode === 39) {
		var timeDelta = ev.shiftKey === true ? SKIP_CHUNK * 2 : SKIP_CHUNK,
			newTime = Math.min(player.getDuration(), player.getCurrentTime() + timeDelta);
		player.seekTo(newTime, true);
	} else if (keyCode === 38) {
		var newVolume = Math.min(100, player.getVolume() + VOLUME_CHUNK);
		player.setVolume(newVolume);
	} else if (keyCode === 40) {
		var newVolume = Math.max(0, player.getVolume() - VOLUME_CHUNK);
		player.setVolume(newVolume);
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

var DATA = [2, 2, 0, 6, 10, 18, 4, 12, 15, 6, 8, 10, 1, 3, 6, 9, 15, 8, 9, 17, 10, 8];
// Add boundary items so it fills the entire graph
DATA.unshift(0);
DATA.push(DATA[DATA.length - 1]);
// Turn them into minute-based tuples
for (var i = 0, l = DATA.length; i < l; i++) {
	DATA[i] = [i, DATA[i]];
}
// Append SVG
var svg = d3.select(progress.parentNode).append('svg').attr('width', progress.clientWidth).attr('height', progress.clientHeight);

function createGraph() {
	var x = d3.time.scale().range([0, progress.clientWidth]);
	var y = d3.scale.linear().range([progress.clientHeight, 0]);
	x.domain(d3.extent(DATA, function(d) { return d[0]; }));
	y.domain(d3.extent(DATA, function(d) { return d[1]; }));
	var area = d3.svg.area().interpolate('basis').x(function(d) { return x(d[0]); }).y0(progress.clientHeight).y1(function(d) { return y(d[1]); });
	svg.append('path').datum(DATA).attr('class', 'area').attr('d', area);
}
