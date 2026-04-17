export default class Swipe {
  constructor() {
    this.rightSwipeCb = null;
    this.leftSwipeCb = null;
    this.swipeStartX = 0;
    this.swipeDeltaX = 0;
    this.isSwiping = false;

    // Since these methods are event listeners,
    // we need to explicitly bind `this` context to them
    // so it does not get overwritten by the event
    this.startSwipe = this.startSwipe.bind(this);
    this.moveSwipe = this.moveSwipe.bind(this);
  }

  debounce(func, delay) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => func(...args), delay);
    };
  }

  resetSwipe() {
    this.swipeStartX = 0;
    this.swipeDeltaX = 0;
    this.isSwiping = false;
  }

  startSwipe(event) {
    this.swipeStartX = event.clientX || event.touches[0].clientX;
    this.isSwiping = true;
  }

  moveSwipe(event) {
    if (!this.isSwiping) return;
    this.swipeDeltaX = (event.clientX || event.touches[0].clientX) - this.swipeStartX;

    if (this.swipeDeltaX > 50) {
      this.rightSwipeCb();
      this.isSwiping = false;
      this.resetSwipe();
    } else if (this.swipeDeltaX < -50) {
      this.leftSwipeCb();
      this.isSwiping = false;
      this.resetSwipe();
    }
  }

  start(swipeContainer, rightSwipeCb, leftSwipeCb) {
    this.rightSwipeCb = rightSwipeCb;
    this.leftSwipeCb = leftSwipeCb;

    this.enableSwipe(swipeContainer);

    window.addEventListener('resize', this.debounce(() => {
      this.enableSwipe(swipeContainer);
    }, 200));
  }

  removeListeners(swipeContainer) {
    swipeContainer.removeEventListener('touchstart', this.startSwipe);
    swipeContainer.removeEventListener('touchmove', this.moveSwipe);
  }

  enableSwipe(swipeContainer) {
    if (window.innerWidth > 1600) {
      swipeContainer.addEventListener('touchstart', this.startSwipe);
      swipeContainer.addEventListener('touchmove', this.moveSwipe);
    } else {
      this.removeListeners(swipeContainer);
    }
  };
}
