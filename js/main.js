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
