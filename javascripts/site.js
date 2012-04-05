$(document).ready(function () {
  $("#slideshow1").content_player();
  
  $("#slideshow2").content_player();
  
  $("#slideshow3").content_player({
    firstSlideToLoad: 2
  });
  
  $("#slideshow4").content_player({
    autoPlay: true,
    autoPlayInterval: 2000
  });
  
  $("#slideshow5").content_player({
    autoPlay: true,
    autoPlayInterval: 2000,
    dynamicTabs: false
  });
  
  $("#slideshow6").content_player({
    autoPlay: true,
    autoPlayInterval: 2000,
    dynamicTabs: false,
    dynamicArrows: false
  });
  
  $("#slideshow7").content_player({
    autoPlay: true,
    autoPlayInterval: 2000,
    autoPlayStopWhenClicked: false,
    autoPlayRestartAfterInterval: 3500
  });
});