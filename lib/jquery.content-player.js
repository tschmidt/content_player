/*
    jQuery Content Player v0.1
    Copyright (c) 2011 Terry Schmidt
    This plugin is available for use in all personal or commercial projects
    under the DBAD license - http://dbad-license.org/license
*/

/*
    ==========================================================================
    jQuery Plugin: Content Player
    ==========================================================================
    
    The idea behind this plugin is to allow the developer to create a "player"
    where the tracks are HTML elements. This could be text, images, movies,
    whatever; we don't care. The main thing is to allow the user to create a
    slideshow regardless of markup. Well...almost.
    
    --------------------------------------------------------------------------
    Requirements
    --------------------------------------------------------------------------
    
    This plugin requires the jquery.easing plugin. The most common ways of
    including this is either by referencing the easing plugin itself or
    including the jquery-ui library.
    
    There is also one HTML requirement and that is you wrap your "slides" in 
    some block container. For example:
    
      <div class="slide-wrapper">
        <section>
          ...
        </section>
        <section>
          ...
        </section>
      </div>
    
    In this example, each section will be treated as a "slide". The <div />
    is the wrapper that will tell this plugin which children belong to the
    slideshow.
*/

var slideshowCount = 1; // This is used to track the number of slideshows on the page

$.fn.content_player = function (opts) {
  var options = $.extend({
    autoPlay: false,                            // Automatically start the slideshow
    
    autoPlayInterval: 7000,                     // How much time between slides
    
    autoPlayStopWhenClicked: true,              // Should the slideshow stop when you click a tab or arrow
                                                // If you set autoPlayStopWhenClicked to false it will pause the slideshow
                                                // for the time given in autoPlayInterval
                                                
    autoPlayRestartAfterInterval: 15000,        // Amount of time to wait before restarting the slideshow
    
    locationHashSupport: true,                  // Support hashes in the URL
    
    dynamicArrows: true,                        // Create elements for next and prev arrows
    
    dynamicArrowsPrevText: "&#171; prev",       // The content for the "prev" element
    
    dynamicArrowsNextText: "next &#187;",       // The content for the "next" element
    
    dynamicTabs: true,                          // Dynamically generate tabs for the slides
    
    dynamicTabsPosition: "top",                 // The default position for the tabs ["top", "bottom"]
    
    firstSlideToLoad: 1,                        // The slide that should be active on load
    
    tabTitleSelector: ".title",                 // The css selector to use for setting the tab label
    
    slideEaseDuration: 1000,                    // The time it takes to show the next slide
    
    slideEaseFunction: "jswing"          // The easing that is used when showing the next slide
  }, opts);
  
  return this.each(function () {
    
    var slidePosition,                          // Stores the current slide position
        $slideshow,                             // Store a reference to the current slideshow
        $slides,                                // Stores the child elements of the slideshow, essentially the slides
        $slidesWrapper,                         // This will contain all the slides stacked side-by-side ($slides.length() * $slideshow.width())
        slideshowWidth,                         // The width of the slideshow
        slidesWrapperWidth,                     // The size of all slide widths ($slides.length() * $slideshow.width())
        locationHash,                           // Stores the hash in the URL if it contains one
        $nextArrow,
        $prevArrow,
        slidesCount,
        $tabs,
        $slidesWrapperOverflowDiv
    
    $slideshow = $(this);
    $slides = $slideshow.children();
    slidesCount = $slides.length;
    $slidesWrapper = $('<div class="content-player-slides-wrapper"><div /></div>');
    locationHash = location.hash;
    slidePosition = options.firstSlideToLoad;
    slideshowWidth = $slideshow.width();
    slidesWrapperWidth = (slideshowWidth * slidesCount);
    
    init();
    
    
    /* 
    
        Initialize the slideshow
    
    */
    function init () {
    // 1. Build the necessary HTML elements
    // 2. Wrap the slides with the slide container
      $slidesWrapper
        .css({ overflow: 'hidden' })
        .find(':first')
          .css({ width: slidesWrapperWidth, position: 'relative', overflow: 'hidden' })
          .addClass("clearfix");
      $slides
        .wrapAll($slidesWrapper)
        .css({ width: slideshowWidth, float: 'left' });
      $slidesWrapper = $slideshow.find(':first');
      $slidesWrapperOverflowDiv = $slidesWrapper.find(':first');
      
    // 3. Insert the tabbed menu
      if (options.dynamicTabs) {
        $tabs = $('<div class="content-player-tabs-container clearfix"><ol /></div>');
        $slides.each(function (num) {
          var $this, that, label;
          $this = $(this);
          that = this;
          if ($this.find(options.tabTitleSelector).length > 0) {
            label = $this.find(options.tabTitleSelector).text();
          } else {
            label = "Slide " + (num + 1);
          }
          $tabs.find(":first").append('<li><a href="#' + num + '">' + label + '</a></li>');
        });
        
        switch (options.dynamicTabsPosition) {
          case "bottom":
            $slideshow.after($tabs);
            break;
          default:
            $slideshow.before($tabs);
            break;
        }
      }
      
    // 4. Insert the nav arrows
      if (options.dynamicArrows) {
        $nextArrow = $('<div class="arrow-container next"><a href="#" class="next arrow">' + options.dynamicArrowsNextText + '</a></div>');
        $prevArrow = $nextArrow.clone()
                        .removeClass("next").addClass("prev")
                        .find(":first")
                          .removeClass("next")
                          .addClass("prev")
                          .html(options.dynamicArrowsPrevText)
                        .end(); // Make sure we return the top level element
        $slideshow.prepend($nextArrow).prepend($prevArrow);
      }
    
    // 5. Handle the link clicks
      if (options.dynamicTabs) {
        $tabs.find('a').bind("click", function (e) {
          e.preventDefault();
          if (options.autoPlayStopWhenClicked) { stop(); } else { pause(); };
          next(toInteger(this.hash));
        });
      }
      
      if (options.dynamicArrows) {
        $nextArrow.find('a').bind("click", function (e) {
          e.preventDefault();
          if (options.autoPlayStopWhenClicked) { stop(); } else { pause(); };
          next();
        });
        
        $prevArrow.find('a').bind("click", function (e) {
          e.preventDefault();
          if (options.autoPlayStopWhenClicked) { stop(); } else { pause(); };
          prev();
        });
      }
      
    // n. Play the slideshow
      
      // Set the initial slide
      if (options.locationHashSupport && locationHash) {
        slidePosition = toInteger(locationHash);
      } else if (options.firstSlideToLoad != 1) {
        slidePosition = options.firstSlideToLoad
      } else {
        slidePosition = 1
      }
      
      next(slidePosition - 1);
      
      // Start the slideshow
      if (options.autoPlay) {
        play();
      }
    }
    
    
    /*
    
        Instantiates the timer for playing the slideshow. This will be stored
        in a variable that can then be cleared for the pause and stop functions.
        
    */
    function play () {
      $slideshow.slideTimer = setInterval(next, options.autoPlayInterval);
    };
    
    /*
    
        Play the next slide in the set. If we are at the end of the slides
        then we need to wrap back to the first slide in the list.
    
    */
    function next (currentSlideIndex) {
      slidePosition = typeof(currentSlideIndex) != 'undefined' ? currentSlideIndex : slidePosition;
      var $nextSlide, offset;
      if (slidePosition <= slidesCount-1) {
        $nextSlide = $slides.eq(slidePosition);
      } else {
        $nextSlide = $slides.eq(0);
        slidePosition = 0;
      }
      
      offset = -(slideshowWidth * ($nextSlide.index()));
      $slidesWrapperOverflowDiv.animate({ marginLeft : offset, height : $nextSlide.height() }, options.slideEaseDuration, options.slideEaseFunction);
      setCurrentTab(slidePosition);
      slidePosition++;
    };
    
    function prev (currentSlideIndex) {
      slidePosition = typeof(currentSlideIndex) != 'undefined' ? currentSlideIndex : slidePosition;
      slidePosition--;
      var $prevSlide, offset;
      if (slidePosition > 0) {
        $prevSlide = $slides.eq(slidePosition - 1);
      } else {
        $prevSlide = $slides.eq(slidesCount - 1);
        slidePosition = slidesCount;
      }
      
      offset = -(slideshowWidth * ($prevSlide.index()));
      $slidesWrapperOverflowDiv.animate({ marginLeft : offset, height : $prevSlide.height() }, options.slideEaseDuration, options.slideEaseFunction);
      setCurrentTab(slidePosition - 1);
    };
    
    function pause () {
      clearInterval($slideshow.slideTimer);
      clearTimeout($slideshow.slideTimeout);
      $slideshow.slideTimeout = setTimeout(play, options.autoPlayRestartAfterInterval);
    };
    
    function stop () {
      clearInterval($slideshow.slideTimer);
      clearTimeout($slideshow.slideTimeout);
    };
    
    function setCurrentTab (position) {
      if (options.dynamicTabs) {
        $tabs
          .find('.current-tab')
            .removeClass('current-tab')
          .end()
          .find('[href=#' + position + ']').addClass("current-tab");
      }
    };
    
    /*
    
        Convert a string that contains a number into an integer
        
        ----------------------------------------------------------------------
        Example
        ----------------------------------------------------------------------
        
        toInteger("I have 5 apples") #=> 5
        toInteger("#15") #=> 15
        toInteger(89) #=> 89
        toInteger("if you have 1 number and then a 2nd number only the first is returned") #=> 1
    
    */
    function toInteger (str) {
      if (typeof str == 'number') return str;
      var num;
      num = parseInt(str.match(/\d+/)[0])
      return num;
    };
    
    slideshowCount++;
  });
}