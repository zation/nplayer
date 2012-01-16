function NPlayer(containerId) {
    var nPlayer = this;

    nPlayer.playBox = document.getElementById('nPlayer_playBox');
    nPlayer.player = document.getElementById('nPlayer_player');
    nPlayer.fileChoser = document.getElementById('nPlayer_fileChoser');
    nPlayer.backChoser = document.getElementById('nPlayer_backChoser');
    nPlayer.container = containerId ? document.getElementById(containerId) : document;
    nPlayer.playList = document.getElementById('nPlayer_playList');

    nPlayer.btnPause = document.getElementById('nPlayer_pause');
    nPlayer.btnPlay = document.getElementById('nPlayer_play');
    nPlayer.btnSound = document.getElementById('nPlayer_sound');

    nPlayer.soundControl = document.getElementById('nPlayer_soundControl');
    nPlayer.soundOutLine = document.getElementById('nPlayer_soundOutLine');
    nPlayer.soundInLine = document.getElementById('nPlayer_soundInLine');
    nPlayer.soundBar = document.getElementById('nPlayer_soundBar');

    nPlayer.timeControl = document.getElementById('nPlayer_timeControl');
    nPlayer.timeOutLine = document.getElementById('nPlayer_timeOutLine');
    nPlayer.timeInLine = document.getElementById('nPlayer_timeInLine');
    nPlayer.timeBar = document.getElementById('nPlayer_timeBar');

    nPlayer.timeNumCur = document.getElementById('nPlayer_timeNumCur');
    nPlayer.timeNumMax = document.getElementById('nPlayer_timeNumMax');

    nPlayer.btnLoopAll = document.getElementById('nPlayer_loopAll');
    nPlayer.btnNormal = document.getElementById('nPlayer_normal');
    nPlayer.btnLoopOne = document.getElementById('nPlayer_loopOne');

    nPlayer.list = document.getElementById('nPlayer_list');

    nPlayer.cover = document.getElementById('nPlayer_cover');
    nPlayer.info = document.getElementById('nPlayer_info');
    nPlayer.infoClose = document.getElementById('nPlayer_infoClose');

    nPlayer.manuAbout = document.getElementById('nPlayer_manuAbout');
    nPlayer.manuReset = document.getElementById('nPlayer_manuReset');
    nPlayer.originSet = {
	mod: nPlayer.MOD_NORMAL,
	back: nPlayer.playBox.style.backgroundImage
    }

    nPlayer.currentSong = null;
    nPlayer.currentList = null;

    nPlayer.init();
}

NPlayer.prototype.MOD_NORMAL = '0'
NPlayer.prototype.MOD_LOOPONE = '1'
NPlayer.prototype.MOD_LOOPALL = '2'

NPlayer.prototype.dbOpen = function() {
    var nPlayer = this;
    var version = '1.1';
    var playListCurrent = '';
    //sys - |=version
    //pl - :cur, :=plName:plName:...
    //sl - ?plName=songName?songName?...
    //song - [plName]>[songName]=songUrl
    if (localStorage.length == 0 || localStorage['|ver'] != version) {
	localStorage.clear();
	localStorage['|ver'] = version;
	localStorage['|back'] = '';
	localStorage['|mod'] = '';
	localStorage[':cur'] = 'Default';
	localStorage[':'] = 'Default';
	nPlayer.currentList = nPlayer.addPlayList('Default');
	nPlayer.setMod(nPlayer.MOD_NORMAL);
    } else {
	if (localStorage['|back'] && localStorage['|back'] != '') {
	    nPlayer.playBox.style.backgroundImage = 'url("' + localStorage['|back'] + '")';
	}
	if (localStorage['|mod'] != '') {
	    nPlayer.setMod(localStorage['|mod']);
	} else {
	    nPlayer.setMod(nPlayer.MOD_NORMAL);
	}
	var playLists = localStorage[':'].split(':');
	var playListCur = localStorage[':cur'];
	for (var i = 0; i < playLists.length; i++) {
	    var playListName = playLists[i]
	    var playList = nPlayer.addPlayList(playListName);
	    if (playListCur == playListName) {
		nPlayer.currentList = playList;
	    }
	    if (localStorage['?' + playListName]) {
		var songLists = localStorage['?' + playListName].split('?');
		for (var j = 0; j < songLists.length; j++) {
		    var songName = songLists[j];
		    nPlayer.addSongList(songName, localStorage[playListName + '>' + songName], playList)
		}
	    }
	}
    }
    nPlayer.setList(nPlayer.currentList);
}

NPlayer.prototype.fileImplement = function(fileList) {
    var nPlayer = this;
    for (var i = 0; i < fileList.length; i++) {
	var reader = new FileReader();
	//need to research
	reader.onload = (function(file) {
	    return function(e) {
		nPlayer.addSongList(file.name, e.target.result)
	    }
	})(fileList[i]);
	reader.onerror = function(e) {
	    switch (e.target.error.code) {
	    case e.target.error.NOT_FOUND_ERR:
		alert("file not found");
		break;
	    case e.target.error.SECURITY_ERR:
		alert('security error');
		break;
	    case e.target.error.NOT_READABLE_ERR:
		alert("file not readable");
		break;
	    case e.target.error.ABORT_ERR:
		alert("aborted");
		break;
	    case e.target.error.ENCODING_ERR:
		alert('encoding error');
		break;
	    default:
		alert('generic error: ' + e.target.error.code);
	    }
	}
	reader.readAsDataURL(fileList[i]);
    }
    var reader = new FileReader();
    reader.readAsDataURL(fileList[0]);
}
NPlayer.prototype.backImplement = function(file) {
    var nPlayer = this;
    var reader = new FileReader();
    reader.onload = function(e) {
	nPlayer.playBox.style.backgroundImage = 'url("' + e.target.result + '")';
	localStorage['|back'] = e.target.result;
    }
    reader.onerror = function(e) {
	console.log(e);
    }
    reader.readAsDataURL(file);
}
NPlayer.prototype.currentSongEnd = function() {
    var nPlayer = this;
    var nextSong = null;
    if (nPlayer.currentList.childNodes.length > 1) {
	switch (nPlayer.mod) {
	case nPlayer.MOD_NORMAL:
	    if (nPlayer.currentSong.nextSibling) {
		nextSong = nPlayer.currentSong.nextSibling;
	    }
	    break;
	case nPlayer.MOD_LOOPONE:
	    nextSong = nPlayer.currentSong;
	    break;
	case nPlayer.MOD_LOOPALL:
	    if (nPlayer.currentSong.nextSibling) {
		nextSong = nPlayer.currentSong.nextSibling;
	    } else {
		nextSong = nPlayer.currentList.firstChild;
	    }
	    break;
	}
	if (nextSong) {
	    nPlayer.setSong(nextSong);
	    nPlayer.play(true);
	} else {
	    nPlayer.stop();
	    //nPlayer.btnPlay.className = 'nPlayer_icon_play nPlayer_icon';
	    //nPlayer.timeBar.style.left = 0 - Math.round(nPlayer.timeBar.clientWidth / 2) + 'px';
	    //nPlayer.timeInLine.style.width = '0';
	    //nPlayer.player.setAttribute('src', ''); //not work?
	}
    }
    else if(nPlayer.currentList.childNodes.length==1){
	nPlayer.stop();
    }
}
NPlayer.prototype.init = function() {
    var nPlayer = this;
    nPlayer.dbOpen();
    nPlayer.fileChoser.addEventListener('change', function(e) {
	nPlayer.fileImplement(e.target.files);
    }, false);
    nPlayer.backChoser.addEventListener('change', function(e) {
	var file = e.target.files[0];
	if (file.size > 3 * 1024 * 1024) {
	    alert('请选择3MB以下的图片。');
	} else {
	    nPlayer.backImplement(e.target.files[0]);
	}
    }, false)
    nPlayer.btnPlay.addEventListener('click', function(e) {
	e.stopPropagation();
	e.preventDefault();
	if (nPlayer.player.paused || nPlayer.player.ended) {
	    nPlayer.play(false);
	} else {
	    nPlayer.pause();
	}
    }, false)
    nPlayer.container.addEventListener('dragenter', function(e) {
	e.stopPropagation();
	e.preventDefault();
    }, false)
    nPlayer.container.addEventListener('dragover', function(e) {
	e.stopPropagation();
	e.preventDefault();
    }, false)
    nPlayer.container.addEventListener('drop', function(e) {
	e.stopPropagation();
	e.preventDefault();
	nPlayer.cover.style.display = 'none';
	nPlayer.info.style.display = 'none';
	nPlayer.fileImplement(e.dataTransfer.files);
    }, false)
    nPlayer.player.addEventListener('ended', function() {
	nPlayer.currentSongEnd();
    }, false)

    var timeBarOverFlag = false;
    var timeBarOver = document.createElement('div');
    timeBarOver.setAttribute('id', 'nPlayer_timeBarOver');
    timeBarOver.addEventListener('click', function(e) {
	if (nPlayer.player.currentTime > 0) {
	    nPlayer.player.currentTime = (e.clientX - nPlayer.pageX(nPlayer.timeOutLine)) * nPlayer.player.duration / nPlayer.timeOutLine.clientWidth;
	}
    }, false)
    timeBarOver.addEventListener('mousemove', function(e) {
	var timeBarOverLeft = e.clientX - nPlayer.pageX(nPlayer.timeOutLine) - Math.round(nPlayer.timeBar.clientWidth / 2);
	if (timeBarOverLeft >= (0 - Math.round(timeBarOver.clientWidth / 2)) && timeBarOverLeft <= (nPlayer.timeOutLine.clientWidth - Math.round(timeBarOver.clientWidth / 2))) {
	    timeBarOver.style.left = timeBarOverLeft + 'px';
	} else {
	    nPlayer.timeControl.removeChild(timeBarOver);
	    timeBarOverFlag = false;
	}
    }, false)
    timeBarOver.addEventListener('mouseout', function(e) {
	if (timeBarOverFlag) {
	    nPlayer.timeControl.removeChild(timeBarOver);
	    timeBarOverFlag = false;
	}
    }, false)
    nPlayer.timeOutLine.addEventListener('mouseover', function(e) {
	if (!timeBarOverFlag) {
	    timeBarOver.style.left = e.clientX - nPlayer.pageX(nPlayer.timeOutLine) - Math.round(nPlayer.timeBar.clientWidth / 2) + 'px';
	    nPlayer.timeControl.appendChild(timeBarOver);
	    timeBarOverFlag = true;
	} else {
	    timeBarOver.style.left = e.clientX - nPlayer.pageX(nPlayer.timeOutLine) - Math.round(nPlayer.timeBar.clientWidth / 2) + 'px';
	}
    }, false)

    nPlayer.player.addEventListener('timeupdate', function() {
	var durationWidth = nPlayer.player.currentTime * nPlayer.timeOutLine.clientWidth / nPlayer.player.duration;
	var timeBarWidth = Math.round(nPlayer.timeBar.clientWidth / 2)
	nPlayer.timeBar.style.left = durationWidth - timeBarWidth + 'px';
	nPlayer.timeInLine.style.width = durationWidth + timeBarWidth + 'px';
	nPlayer.timeNumCur.innerHTML = nPlayer.getTime(nPlayer.player.currentTime);

    }, false)
    nPlayer.player.addEventListener('durationchange', function() {
	nPlayer.timeNumMax.innerHTML = nPlayer.getTime(nPlayer.player.duration);
    }, false)

    nPlayer.btnLoopAll.addEventListener('click', function() {
	nPlayer.setMod(nPlayer.MOD_LOOPALL);
    }, false)
    nPlayer.btnLoopOne.addEventListener('click', function() {
	nPlayer.setMod(nPlayer.MOD_LOOPONE);
    }, false)
    nPlayer.btnNormal.addEventListener('click', function() {
	nPlayer.setMod(nPlayer.MOD_NORMAL);
    }, false)

    nPlayer.btnSound.addEventListener('click', function() {
	if (nPlayer.player.muted) {
	    nPlayer.btnSound.className = 'nPlayer_icon_sound';
	    nPlayer.player.muted = false;
	} else {
	    nPlayer.btnSound.className = 'nPlayer_icon_mute';
	    nPlayer.player.muted = true;
	}
    }, false)
    var isInBtnSound = false;
    nPlayer.btnSound.addEventListener('mouseover', function() {
	nPlayer.soundControl.style.display = 'block';
	if (soundControlHideTime) {
	    clearTimeout(soundControlHideTime);
	}
	isInBtnSound = true;
    }, false)
    var soundControlHideTime;
    nPlayer.btnSound.addEventListener('mouseout', function() {
	isInBtnSound = false;
	soundControlHideTime = setTimeout(function() {
	    nPlayer.soundControl.style.display = 'none';
	}, 1000)
    }, false)
    nPlayer.soundControl.addEventListener('mouseover', function() {
	clearTimeout(soundControlHideTime);
    }, false)
    nPlayer.soundControl.addEventListener('mouseout', function() {
	if (!isInBtnSound) {
	    soundControlHideTime = setTimeout(function() {
		nPlayer.soundControl.style.display = 'none';
	    }, 1000)
	}
    }, false)

    var soundBarOverFlag = false;
    var soundBarOver = document.createElement('div');
    soundBarOver.setAttribute('id', 'nPlayer_soundBarOver');
    soundBarOver.addEventListener('click', function(e) {
	if (nPlayer.player.muted) {
	    nPlayer.player.muted = false;
	    nPlayer.btnSound.className = 'nPlayer_icon_sound';
	}
	var soundBarOverHeight = e.clientY - nPlayer.pageY(nPlayer.soundOutLine)
	nPlayer.player.volume = soundBarOverHeight / nPlayer.soundOutLine.clientHeight;
	nPlayer.soundInLine.style.height = soundBarOverHeight + 'px';
	nPlayer.soundBar.style.top = soundBarOverHeight - 4 + 'px';
    }, false)
    soundBarOver.addEventListener('mousemove', function(e) {
	var soundBarOverTop = e.clientY - nPlayer.pageY(nPlayer.soundOutLine) - 4;
	if (soundBarOverTop >= -4 && soundBarOverTop <= (nPlayer.soundOutLine.clientHeight - 4)) {
	    soundBarOver.style.top = soundBarOverTop + 'px';
	} else {
	    nPlayer.soundControl.removeChild(soundBarOver);
	    soundBarOverFlag = false;
	}
    }, false)
    soundBarOver.addEventListener('mouseout', function(e) {
	if (soundBarOverFlag) {
	    nPlayer.soundControl.removeChild(soundBarOver);
	    soundBarOverFlag = false;
	}
    }, false)
    nPlayer.soundOutLine.addEventListener('mouseover', function(e) {
	if (!soundBarOverFlag) {
	    soundBarOver.style.top = e.clientY - nPlayer.pageY(nPlayer.soundOutLine) - 4 + 'px';
	    nPlayer.soundControl.appendChild(soundBarOver);
	    soundBarOverFlag = true;
	} else {
	    soundBarOver.style.top = e.clientY - nPlayer.pageY(nPlayer.soundOutLine) - 4 + 'px';
	}
    }, false)
    nPlayer.manuAbout.addEventListener('click', function(e) {
	nPlayer.cover.style.display = 'block';
	nPlayer.info.style.display = 'block';
    }, false)
    nPlayer.manuReset.addEventListener('click', function(e) {
	nPlayer.playBox.style.backgroundImage = nPlayer.originSet.back
	localStorage['|back'] = '';
	nPlayer.setMod(nPlayer.originSet.mod);
    }, false)
    nPlayer.infoClose.addEventListener('click', function(e) {
	nPlayer.cover.style.display = 'none';
	nPlayer.info.style.display = 'none';
    }, false)

    //save db
    //    window.addEventListener('unload', function() {
    //	if (confirm('Will you save the song list?')) {
    //	    var dbPlayLists = [];
    //
    //	    var songLists = nPlayer.getElementsByClassName('nPlayer_songList', nPlayer.container, 'ul');
    //
    //	    for (var i = 0; i < songLists.length; i++) {
    //		console.log(songLists[i].getElementsByTagName('li'))
    //		var songs = songLists[i].getElementsByTagName('li');
    //		var listName = songLists[i].getAttribute('listname');
    //		var dbSongLists = [];
    //		dbPlayLists.push(listName);
    //		for (var j = 0; j < songs.length; j++) {
    //		    var songName = songs[i].firstChild.nodeValue;
    //		    dbSongLists.push(songName);
    //		    localStorage[listName + '>' + songName] = '1';
    //		}
    //		localStorage['?' + listName] = dbSongLists.join('?');
    //	    }
    //	    localStorage[':'] = dbPlayLists.join(':');
    //	}
    //    }, false)

}

NPlayer.prototype.addSongList = function(name, url, list) {
    var nPlayer = this;
    if (!list) {
	list = nPlayer.currentList;
    }
    var songs = list.getElementsByTagName('li');

    //dom operation
    if (songs.length > 0) {
	for (var i = 0; i < songs.length; i++) {
	    if (songs[i].firstChild.nodeValue == name) {
		return null;
	    }
	}
    }

    var song = document.createElement('li');
    song.fileurl = url
    song.innerHTML = name;
    song.addEventListener('dblclick', function(e) {
	e.stopPropagation();
	nPlayer.setSong(this);
	nPlayer.play(true);
    }, false)
    list.appendChild(song);

    var dragSong = document.createElement('img');
    dragSong.setAttribute('src', 'gnome_audio_x_generic.png')
    var dragLine = document.createElement('div');
    dragLine.setAttribute('id', 'nPlayer_dragLine');

    song.setAttribute('draggable', 'true');
    song.addEventListener('dragstart', function(e) {
	e.stopPropagation();
	e.dataTransfer.setDragImage(dragSong, 25, 15)
    }, false)
    song.addEventListener('drag', function(e) {
	var dragSongNum = Math.round((e.clientY - nPlayer.pageY(list.childNodes[0])) / songs[0].clientHeight);
	if (dragSongNum <= 0) {
	    list.insertBefore(dragLine, songs[0]);
	} else if (dragSongNum < songs.length) {
	    list.insertBefore(dragLine, songs[dragSongNum]);
	} else {
	    list.appendChild(dragLine);
	}
    }, false)
    song.addEventListener('dragend', function(e) {
	if (dragLine.nextSibling) {
	    list.insertBefore(song, dragLine.nextSibling);
	} else {
	    list.appendChild(song);
	}
	list.removeChild(dragLine);
    }, false)

    var btnDelsong = document.createElement('div');
    btnDelsong.innerHTML = 'x';
    btnDelsong.className = 'nPlayer_btnDelsong';
    btnDelsong.addEventListener('click', function(e) {
	e.stopPropagation();
	nPlayer.delSong(this);
    }, false)
    song.appendChild(btnDelsong);

    if (nPlayer.player.paused && !nPlayer.currentSong) {
	nPlayer.setSong(song);
	nPlayer.play(true);
    }

    return song;
}
NPlayer.prototype.addPlayList = function(name) {
    var nPlayer = this;
    var listItems = nPlayer.playList.getElementsByTagName('li');

    //dom operation
    for (var i = 0; i < listItems.length; i++) {
	if (listItems[i].firstChild.nodeValue == name) {
	    return null;
	}
    }
    var listItem = document.createElement('li');
    listItem.innerHTML = name;
    nPlayer.playList.appendChild(listItem);

    var songList = document.createElement('ul');
    songList.className = 'nPlayer_songList hide';
    songList.setAttribute('listName', name);
    nPlayer.list.appendChild(songList);
    return songList;
}
NPlayer.prototype.delSong = function(delItem) {
    var nPlayer = this;

    //dom operation
    delItem = delItem.parentNode;
    if (delItem == nPlayer.currentSong) {
	nPlayer.currentSongEnd();
    }
    delItem.parentNode.removeChild(delItem);
}
NPlayer.prototype.setList = function(list) {
    var nPlayer = this;
    nPlayer.currentList.className = 'nPlayer_songList hide';
    list.className = 'nPlayer_songList';
    nPlayer.currentList = list;
}
NPlayer.prototype.setSong = function(song) {
    var nPlayer = this;

    //dom operation
    if (nPlayer.currentSong) {
	nPlayer.currentSong.className = '';
    }
    nPlayer.timeBar.style.left = 0;
    nPlayer.timeInLine.style.width = 0;
    song.className = 'current'
    nPlayer.currentSong = song;
    nPlayer.player.setAttribute('src', song.fileurl);
}
NPlayer.prototype.play = function(isDelay) {
    var nPlayer = this;
    if (nPlayer.player.getAttribute('src')) {
	nPlayer.btnPlay.className = 'nPlayer_icon_pause nPlayer_icon';
	if (isDelay) {
	    var playTimer = setTimeout(function() {
		nPlayer.player.play();
		clearTimeout(playTimer);
	    }, 1000)
	} else {
	    nPlayer.player.play();
	}
    }
}
NPlayer.prototype.pause = function() {
    var nPlayer = this;
    if (nPlayer.player.played) {
	nPlayer.btnPlay.className = 'nPlayer_icon_play nPlayer_icon';
	nPlayer.player.pause();
    }
}
NPlayer.prototype.stop = function() {
    var nPlayer = this;
    nPlayer.pause();
    nPlayer.player.setAttribute('src', '');
    nPlayer.btnPlay.className = 'nPlayer_icon_play nPlayer_icon';
    var timeBarWidth = Math.round(nPlayer.timeBar.clientWidth / 2)
    nPlayer.timeBar.style.left = 0 - timeBarWidth + 'px';
    nPlayer.timeInLine.style.width = timeBarWidth + 'px';
    nPlayer.timeNumCur.innerHTML = ' 0 ';
    nPlayer.timeNumMax.innerHTML = ' 0 ';
}

NPlayer.prototype.pageX = function(ele) {
    var nPlayer = this;
    if (ele.offsetParent) {
	return ele.offsetLeft + nPlayer.pageX(ele.offsetParent);
    } else {
	return ele.offsetLeft;
    }
}

NPlayer.prototype.pageY = function(ele) {
    var nPlayer = this;
    if (ele.offsetParent) {
	return ele.offsetTop + nPlayer.pageY(ele.offsetParent);
    } else {
	return ele.offsetTop;
    }
}

NPlayer.prototype.getElementsByClassName = function(classname, node, tag) {
    var nPlayer = this;
    if (!node) {
	node = nPlayer.container;
    }
    if (!tag) {
	tag = '*';
    }
    var a = [],
	re = new RegExp('\\b' + classname + '\\b');
    els = node.getElementsByTagName(tag);
    for (var i = 0, j = els.length; i < j; i++) {
	if (re.test(els[i].className)) {
	    a.push(els[i]);
	}
    }
    return a;
}

NPlayer.prototype.getTime = function(timeLong) {
    var second = Math.round(timeLong % 60);
    if (second < 10) {
	second = '0' + second;
    }
    var minite = Math.floor(timeLong / 60);
    return minite + ':' + second
}

NPlayer.prototype.setMod = function(mod) {
    var nPlayer = this;
    if (nPlayer.mod != mod) {
	nPlayer.btnLoopOne.parentNode.className = nPlayer.btnLoopOne.parentNode.className.replace('nPlayer_modSelect', '');
	nPlayer.btnLoopAll.parentNode.className = nPlayer.btnLoopAll.parentNode.className.replace('nPlayer_modSelect', '');
	nPlayer.btnNormal.parentNode.className = nPlayer.btnNormal.parentNode.className.replace('nPlayer_modSelect', '');

	switch (mod) {
	case nPlayer.MOD_NORMAL:
	    nPlayer.btnNormal.parentNode.className += ' nPlayer_modSelect';
	    break;
	case nPlayer.MOD_LOOPONE:
	    nPlayer.btnLoopOne.parentNode.className += ' nPlayer_modSelect';
	    break;
	case nPlayer.MOD_LOOPALL:
	    nPlayer.btnLoopAll.parentNode.className += ' nPlayer_modSelect';
	    break;
	}

	nPlayer.mod = mod;
	localStorage['|mod'] = mod;
    }
}

//No neccessary to use
NPlayer.prototype.hasClass = function(ele, cls) {
    return ele.className.match(new RegExp('(\\s|^)' + cls + '(\\s|$)'));
}
NPlayer.prototype.addClass = function(ele, cls) {
    var nPlayer = this;
    if (!nPlayer.hasClass(ele, cls)) {
	ele.className += ' ' + cls
    }
}
NPlayer.prototype.removeClass = function(ele, cls) {
    var nPlayer = this;
    if (nPlayer.hasClass(ele, cls)) {
	var reg = new RegExp('(\\s|^)' + cls + '(\\s|$)');
	ele.className = ele.className.replace(reg, ' ');
    }
}