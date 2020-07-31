var $ = jQuery;

var workerFrequencyMs = 500;
var startupDelayMs = 50;
var firstDisplayDelayMs = 1750;
var dismissMs = 500;
var introduceMs = 800;
var inbetweenMs = 1000;
var hookResizeHandlerMs = 5000;

var minimumClicksPerAvatar = 15;
var maximumClicksPerAvatar = 25;

var heroCount = 6;

var lastKnownWidth = null;

function resetAvatars() {
  var visible = avatars.filter(avatar => visibleAvatars[avatar]);
  visible.forEach(avatar => dismissAvatar(avatar));
}

function getOffset(element) {
  var item = element.getBoundingClientRect();
  return [item.top + window.pageYOffset - document.documentElement.clientTop, item.left + window.pageXOffset - document.documentElement.clientLeft];
}

function getSize(element) {
  var item = element.getBoundingClientRect();
  return [item.height, item.width];
}

function getRelativeOffset(element, container) {
  var container = getOffset(container);
  var item = getOffset(element);
  var top = item[0] - container[0];
  var left = item[1] - container[1];
  return [top, left];
}

var visibleAvatars = {};

var squareToAvatar = [];
var squareRemainingClicks = [];

var heroSquares = [];
var heroFigure = null;
var heroAvatarsContainer = null;

var avatars = null;

var recentAvatars = {};

var mapAvatarToId = {};
var mapAvatarIndex = 1;

function getNewAvatarIndex() {
  var index = mapAvatarIndex++;
  return 'heroAvatar' + index;
}

function startupAvatarLightup() {
  for (var i = 1; i <= heroCount; i++) {
    var element = $('#heroSquare' + i);
    if (element && element.length === 1) {
      heroSquares.push(i);
      squareRemainingClicks.push(0);
      squareToAvatar.push(null);
    }
    heroFigure = $('#hero-figure')[0];
    heroAvatarsContainer = $('#hero-avatars')[0];
  }

  loadAvatars();
}

function getHeroSquare(i) {
  var element = $('#heroSquare' + i);
  return element[0];
}

function getNextAvailableAvatar() {
  var remainingAvatars = avatars.filter(avatar => !recentAvatars[avatar]);
  if (remainingAvatars.length === 0) {
    recentAvatars = {};
    remainingAvatars = avatars;
  }
  var availableAvatars = remainingAvatars.filter(avatar => !visibleAvatars[avatar]);
  if (availableAvatars.length) {
    return randomElement(availableAvatars);
  }
}

function randomElement(arr) {
  if (!arr || !arr.length) {
    return null;
  }
  return arr[getRandomInt(0, arr.length)];
}

function featureNextAvatar(destinationSquareIndex) {
  var newAvatar = getNextAvailableAvatar();
  if (!newAvatar) {
    return;
  }
  var outgoingAvatar = squareToAvatar[destinationSquareIndex];
  if (outgoingAvatar) {
    dismissAvatar(outgoingAvatar);
  }
  var newAvatarId = getNewAvatarIndex();
  var newAvatarSelector = '#' + newAvatarId;
  mapAvatarToId[newAvatar] = newAvatarId;
  visibleAvatars[newAvatar] = true;
  recentAvatars[newAvatar] = true;
  squareToAvatar[destinationSquareIndex] = newAvatar;
  squareRemainingClicks[destinationSquareIndex] = getRandomInt(minimumClicksPerAvatar, maximumClicksPerAvatar);

  var heroSquare = getHeroSquare(heroSquares[destinationSquareIndex]);
  var heroPosition = getRelativeOffset(heroSquare, heroFigure);
  var heroSize = getSize(heroSquare);
  var heroImage = document.createElement('img');
  heroImage.src = newAvatar;
  heroImage.id = newAvatarId
  heroImage.alt = 'A random photo or avatar of an open source contributor from Microsoft';
  var style = heroImage.style;
  style.position = 'absolute';
  style.display = 'none';
  style.backgroundColor = '#000';
  style.borderRadius = '50%';
  style.height = (Math.ceil(heroSize[0]) + 1.5) + 'px';
  style.width = (Math.ceil(heroSize[1]) + 1.5) + 'px';
  style.top = (Math.round(heroPosition[0]) - 1) + 'px';
  style.left = (Math.round(heroPosition[1]) - 1) + 'px';
  heroAvatarsContainer.append(heroImage);
  setTimeout(() => {
    $(newAvatarSelector).fadeIn(introduceMs, function () {
      var rect = $(heroSquare).children('rect');
      if (rect && rect.length === 1) {
        $(rect).fadeOut(dismissMs, () => { ect.remove() });
      }
    });
  }, outgoingAvatar ? inbetweenMs : 1);
}

function dismissAvatar(avatar) {
  var outgoingId = mapAvatarToId[avatar];
  if (outgoingId) {
    mapAvatarToId[avatar] = null;
    var outgoingElement = $('#' + outgoingId);
    outgoingElement.fadeOut(dismissMs, function () {
      visibleAvatars[avatar] = false;
      outgoingElement.remove();
    });
  }
}

function loadAvatars() {
  $.ajax({
    type: 'GET',
    url: '/api/avatars',
    dataType: 'json',
    success: function(response) {
        if (response && response.avatars && response.avatars.length) {
            avatars = response.avatars;
        }
        setTimeout(worker, firstDisplayDelayMs);
        setTimeout(hookResize, hookResizeHandlerMs);
    },
  });
}

function hookResize() {
  window.onresize = onResize;
}

function onResize() {
  var width = window.innerWidth;
  if (lastKnownWidth !== width) {
    lastKnownWidth = width;
    resetAvatars();
  }
}

function worker() {
  var availableSquare = tryGetAvailableSquare();
  if (availableSquare !== undefined) {
    featureNextAvatar(availableSquare);
  }
  setTimeout(worker, workerFrequencyMs);
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

function tryGetAvailableSquare() {
  const squares = [];
  for (var i = 0; i < heroSquares.length; i++) {
    if (squareRemainingClicks[i]) {
      --squareRemainingClicks[i];
    }
    if (!squareRemainingClicks[i] || squareRemainingClicks[i] < 0) {
      squares.push(i);
    }
  }
  if (squares.length) {
    return randomElement(squares);
  }
}

setTimeout(startupAvatarLightup, startupDelayMs);