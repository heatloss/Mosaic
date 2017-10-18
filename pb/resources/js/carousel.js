(function() {
  /* jshint -W058, esversion: 5 */
  var Carousel = function() {
    this.carousels = document.querySelectorAll('.feedsList');
    var self = this;
    if (this.carousels.length > 0) {
      for (var i = 0; i < this.carousels.length; i++) {
        var carInstance = Object.create(self);
        carInstance.initCarousel(this.carousels[i]);
      }
    }
  };

  Carousel.prototype = {
    initCarousel: function(carousel) {
      this.carousel = carousel; // storing the DOM object
     this.drag = 0;
      this.touching = false;
      this.x = 0;
      this.y = 0;
      this.transformAttr = window
        .getComputedStyle(carousel, null)
        .getPropertyValue('transform')
        ? 'transform'
        : '-webkit-transform';
      this.transformStyle = window
        .getComputedStyle(carousel, null)
        .getPropertyValue('transform')
        ? 'transform'
        : 'webkitTransform';
      this.initSlides();

      if ('ontouchstart' in window) {
        this.startEvent = 'touchstart';
        this.moveEvent = 'touchmove';
        this.endEvent = 'touchend';
        this.parseEventData = function(e) {
          return this.parseE(e).targetTouches[0];
        };
      } else {
        this.startEvent = 'mousedown';
        this.moveEvent = 'mousemove';
        this.endEvent = 'mouseup';
        this.parseEventData = function(e) {
          return e;
        };
      }
      this.startFunc = this.startDragFunc.bind(this);
      this.moveFunc = this.moveDragFunc.bind(this);
      this.endFunc = this.endDragFunc.bind(this);
      if (this.snaps.lastIndex > 0) {
        this.carousel.addEventListener(this.startEvent, this.startFunc);
        this.carousel.addEventListener(
          this.moveEvent,
          this.iOS10DisableScroll.bind(this)
        );
        window.addEventListener('orientationchange', this.initSnaps.bind(this));
        window.addEventListener('resize', this.initSnaps.bind(this));
      }
//       this.triggerEvent('loaded', this.carousel);
    },

    iOS10DisableScroll: function(e) {
      //    if (this.carousel.primaryDir === "x") { // Disabling all scrolling, not just horizontal.
      e.preventDefault();
      e.stopPropagation();
      //    }
    },

    resetSlides: function() {
      this.initSlideStates();
      if (this.snapping) {
        this.drag = 0; // Should really reset to the snapstart value
        for (var i = 0; i < this.slides.length; i++) {
          this.slides[i].style[this.transformStyle] = '';
          this.slides[i].classList.remove('snap');
        }
        this.slides[0].classList.add('snap');
      }
    },

    initSlideStates: function() {
      this.previndex = this.carousel.hasAttribute('data-snapstart')
        ? parseInt(this.carousel.dataset.snapstart, 10)
        : 0;
      this.snapping = this.carousel.dataset.snap === 'no' ? false : true;
    },

    initSlides: function() {
      this.initSlideStates();
      this.slides = this.carousel.querySelectorAll(':scope > li'); // NOTE: :scope has been deprecated.
			this.cube = document.querySelector(".cube.depth");
      this.initSnaps();
    },

    getSnapPoints: function(slideslist) {
      var snapsArray = [];
      var snapWidths = 0;
      for (var i = 0; i < this.slides.length; i++) {
        snapsArray.push(snapWidths);
        snapWidths -= this.slides[i].offsetWidth;
      }
      return snapsArray;
    },

    initSnaps: function(obj) {
      this.snaps = this.getSnapPoints(this.slides);
      this.snaps.lastIndex = this.snaps.length - 1;
      this.dragMax = this.snaps[0];
      this.dragMin =
        this.snaps[this.snaps.lastIndex] -
        this.slides[this.snaps.lastIndex].offsetWidth +
        this.carousel.offsetWidth;
      if (this.snapping) {
        this.snapCarousel();
      }
    },

    startDragFunc: function(e) {
      if ('ontouchstart' in window) {
        if (this.parseE(e).targetTouches.length !== 1) {
          return false; // Don't track motion when multiple touches are down in this element (that's a gesture)
        }
      }
      //       e.preventDefault();
      //       e.stopPropagation();
      var evtData = this.parseEventData(e);
      this.x = evtData.pageX;
      this.y = evtData.pageY;
      this.dir = 0;
      this.carousel.primaryDir = '';
      this.carousel.addEventListener(this.moveEvent, this.moveFunc);
      window.addEventListener(this.endEvent, this.endFunc);
      this.touching = true;
      this.tap = true;
      this.swiped = false;
      requestAnimationFrame(this.update.bind(this));
      if (this.snapping) {
        for (var i = 0; i < this.slides.length; i++) {
          this.slides[i].classList.remove('snap');
        }
      }
    },

    moveDragFunc: function(e) {
      var evtData = this.parseEventData(e);
      var xPos = evtData.pageX;
      var yPos = evtData.pageY;
      var xDelta = xPos - this.x;
      var yDelta = yPos - this.y;
      if (
        this.carousel.primaryDir === '' &&
        Math.abs(xDelta) + Math.abs(yDelta) > 1
      ) {
        // The drag direction needs a minimum delta to be set; can't be changed until the touch is released.
        this.carousel.primaryDir =
          Math.abs(xDelta) > Math.abs(yDelta * 2.83) ? 'x' : 'y'; // Initial horizontal movement must be 2.83x the vertical movement in order to trigger a swipe
        if (this.carousel.primaryDir === 'x') {
          this.carousel.classList.add('dragging');
          this.swiped = true;
        }
      }
      if (this.carousel.primaryDir === 'x') {
        e.preventDefault(); // This no longer works in iOS10 Safari. We've hacked around it via the iOS10DisableScroll function, but should be removed as soon as the bug is fixed. See: https://openradar.appspot.com/28479522
        e.stopPropagation();
        this.slidesController(xDelta, yDelta);
        this.x = xPos;
        this.y = yPos;
      }
      this.tap = false;
    },

    endDragFunc: function() {
      this.carousel.removeEventListener(this.moveEvent, this.moveFunc);
      window.removeEventListener(this.endEvent, this.endFunc);
      this.touching = false;
      this.carousel.classList.remove('dragging');
      if (this.swiped && this.snapping) {
        this.calcSnap();
      }
    },

    update: function() {
      if (!this.touching) return;
      requestAnimationFrame(this.update.bind(this)); // Use of requestAnimationFrame improves performance on slower CPUs.
      for (var i = 0; i < this.slides.length; i++) {
        this.slides[i].style[this.transformStyle] =
          'translate3d(' + this.drag + 'px, 0, 0)';
      }

			var dragDistance = this.drag - this.snaps[this.previndex];
			var spanDistance = this.snaps[this.previndex - this.dir] - this.snaps[this.previndex];
      var rotateAmount = (90*dragDistance/spanDistance*this.dir);
      this.cube.style[this.transformStyle] = 'rotateY(' + rotateAmount + 'deg)';
    },

    slidesController: function(x, y) {
      this.drag += x;
      if (Math.abs(x) > 0) {
        this.dir = x / Math.abs(x); // this.dir can flip back and forth with the drag direction, but won't go back to zero until the touch is released.
      }
      this.drag = this.drag < this.dragMax ? this.drag : this.dragMax;
      this.drag = this.drag > this.dragMin ? this.drag : this.dragMin;
    },

    getClosestIndex: function(num, ar) {
      var i = 0,
        closest,
        closestIndex,
        closestDiff,
        currentDiff;
      if (ar.length) {
        closest = ar[0];
        closestIndex = 0;
        for (i; i < ar.length; i++) {
          closestDiff = Math.abs(num - closest);
          currentDiff = Math.abs(num - ar[i]);
          if (currentDiff < closestDiff) {
            closest = ar[i];
            closestIndex = i;
          }
          closestDiff = null;
          currentDiff = null;
        }
        //returns first element that is closest to number
        return closestIndex;
      }
      //no length
      return false;
    },

    calcSnap: function() {
      var closestIndex = this.getClosestIndex(this.drag, this.snaps);
      var snapIndex = closestIndex;
      var goalIndex = Math.min(
        Math.max(this.previndex - this.dir, 0),
        this.snaps.lastIndex
      );
      if (closestIndex !== goalIndex) {
        var dragDistance = this.drag - this.snaps[this.previndex];
        var spanDistance = this.snaps[goalIndex] - this.snaps[closestIndex];
        var dragPercent = dragDistance / spanDistance;
        if (dragPercent > 0.1) {
          snapIndex = goalIndex;
        }
      }
      this.snapCarousel(snapIndex);
    },

    snapCarousel: function(targetIndex) {
      var snapIndex =
        typeof targetIndex !== 'undefined' ? targetIndex : this.previndex;
      this.drag = this.snaps[snapIndex];
      var i = 0,
        slidesLength = this.slides.length;
      if (this.drag === 0) {
        for (; i < slidesLength; i++) {
          this.slides[i].style[this.transformStyle] = '';
        }
      } else {
        for (; i < slidesLength; i++) {
          this.slides[i].style[this.transformStyle] =
            'translate3d(' + this.drag + 'px, 0, 0)';
          this.slides[i].classList.remove('snap');
        }
      }
      
            this.cube.style[this.transformStyle] = 'rotateY(0deg)';

      this.slides[snapIndex].classList.add('snap');
      if (this.previndex !== snapIndex) {
        //         this.triggerEvent("snap", this.carousel);
        this.previndex = snapIndex;
      } else {
        this.previndex = snapIndex;
      }
    },

    parseE: function(e) {
      if (e.targetTouches) {
        return e;
      } else {
        return e.originalEvent;
      }
    },

    triggerEvent: function(theEvent, theElement) {
      var e = document.createEvent('Events');
      var element = theElement || window;
      e.initEvent(theEvent, true, true);
      element.dispatchEvent(e);
    }
  };

  window.addEventListener('DOMContentLoaded', function() {
    new Carousel();
  });
})();
