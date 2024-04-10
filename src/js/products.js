/**
* ----------------------------------------------------------------------------
* Video embed handling
* ----------------------------------------------------------------------------
*/

var currentPlayer;
var player = [];
var playerCounter =0;
function loadYoutube(id, videoId, ht) {
  player[playerCounter] = new YT.Player(id, {
   height: ht,
   width: '100%',
   videoId: videoId,
   rel: '0',
   events: {
    'onReady': onPlayerReady,
    'onStateChange': onPlayerStateChange
   }
  });

  currentPlayer = player[playerCounter];
  playerCounter++;
}

var vimeoVideos = [];

function loadVimeo(id, url, width, options) {
  var { background, autoplay, muted, loop } = JSON.parse(options);

  var vimeoVideo = new Vimeo.Player(id, {
    url: url,
    width: width,
    quality: (window.innerWidth < 469 ? "360p" : "720p"),
    background: background || false,
    loop: loop || true,
    autoplay: autoplay || true,
    muted: muted || true
  });

  vimeoVideos.push(vimeoVideo);

  vimeoVideo.play();
}

function onPlayerReady(event) {
  //stop all other players
  event.target.playVideo();
}

function onPlayerStateChange(event) {
  if(event.data==1){
    if(currentPlayer!==event.target) {
      currentPlayer.pauseVideo();
      currentPlayer = event.target;
    }
  }
}

function pauseAllVideos(){
  for(var i=0;i<playerCounter;i++){
    if(player[i].getPlayerState()==1) {
      player[i].pauseVideo();
    }
  }

  for (var i = 0; i < vimeoVideos.length; i++) {
    vimeoVideos[i].pause();
  };
}

function changeToVideo(element) {
  var objPlayer = element.querySelector(".video-changer__player");
  var videoUrl = element.getAttribute("href").trim();

  pauseAllVideos();

  if (videoUrl.includes('youtu.be')) {
      // YouTube video handling if needed
  } else if (videoUrl.includes('vimeo')) {
      loadVimeo(
          objPlayer.getAttribute("id"),
          videoUrl,
          element.getAttribute('width') || objPlayer.querySelector(".video-changer__image-overlay").offsetWidth,
          element.getAttribute("data-options")
      );
  }
  objPlayer.classList.add('embed-container');

  var playerSrc = objPlayer.getAttribute('src');
  objPlayer.setAttribute('src', playerSrc + "&rel=0");
  objPlayer.style.display = 'block';
  element.querySelector(".video-changer__image-overlay-container").style.display = 'none';
}


function legacyChangeToVideo(element) {
  var objPlayer = element.querySelector(".player");
  var videoUrl = element.getAttribute("href").trim();

  pauseAllVideos();

  if (videoUrl.includes('youtu.be')) {
      loadYoutube(
          objPlayer.getAttribute("id"),
          objPlayer.getAttribute("ref"),
          element.querySelector(".thumb>img").offsetHeight
      );
  } else if (videoUrl.includes('vimeo')) {
      loadVimeo(
          objPlayer.getAttribute("id"),
          videoUrl,
          element.querySelector(".thumb>img").offsetWidth,
          objPlayer.getAttribute("data-options")
      );
  }
  objPlayer.classList.add('embed-container');

  var playerSrc = objPlayer.getAttribute('src');
  objPlayer.setAttribute('src', playerSrc + "&rel=0");
  objPlayer.style.display = 'block';
  element.querySelector(".thumb").style.display = 'none';
}

document.addEventListener("DOMContentLoaded", function(event) {

  document.querySelectorAll('.button--video-changer').forEach(function(element) {
      element.addEventListener('click', function(e) {
          e.preventDefault();

          changeToVideo(this); 
          return false;
      });
  });

  // Query all elements with the class 'video-changer' and add click event listeners
  document.querySelectorAll('.video-changer').forEach(function(element) {
      element.addEventListener('click', function(e) {
          e.preventDefault();

          legacyChangeToVideo(this); 
          return false;
      });
  });
});

