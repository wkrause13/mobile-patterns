import Ember from 'ember';
import SwipeGesture from 'mobile-patterns/utils/swipe-gesture';

var computed = Ember.computed;
var aMap = Array.prototype.map;

export default Ember.Component.extend({
  classNames: ['animated-deck'],
  classNameBindings: ['effectClass'],
  attributeBindings: ['style'],
  gesture: new SwipeGesture(),
  duration: 1000,

  // CPs
  effectClass: computed('effect', function() {
    return `effect-${this.effect}`;
  }),

  previous: computed('items.[]', 'current', function() {
    let items = this.get('items') || [];
    let index = items.indexOf(this.get('current'));
    return items.objectAt(index - 1);
  }),

  next: computed('items.[]', 'current', function() {
    let items = this.get('items') || [];
    let index = items.indexOf(this.get('current'));
    return items.objectAt(index + 1);
  }),

  // Observers
  resetAnimation: function() {
    this.player.currentTime = this.duration / 2;
  }.observes('current'),

  // Initializers
  setupAnimation: function() {
    this.width = this.element.offsetWidth;
    this.cards = this.element.querySelectorAll('.animated-card');
    let group = new AnimationGroup(aMap.call(this.cards, (c, i) => this.generateAnimation(c, i)));
    this.player = document.timeline.play(group);
    this.player.pause();
    this.player.currentTime = this.duration / 2;
    this.gesture.on('progress', () => this.updateAnimation());
    this.gesture.on('end', () => this.finalizeAnimation());
  }.on('didInsertElement'),

  // Event handling
  touchStart: function(e) {
    this.gesture.push(e.originalEvent);
  },
  touchMove: function(e) {
    this.gesture.push(e.originalEvent);
  },
  touchEnd: function(e) {
    this.gesture.push(e.originalEvent);
    this.gesture.clear();
  },

  // Functions
  updateAnimation: function() {
    this.player.currentTime = (-this.gesture.deltaX + this.gesture.startOffset + this.width) / (this.width * 2) * this.duration;
  },

  finalizeAnimation: function() {
    if (this.gesture.deltaX === 0) {
      return;
    }
    let progress = (-this.gesture.deltaX + this.gesture.startOffset + this.width) / (this.width * 2);
    let speed = this.gesture.speedX * (this.duration / 2) / this.width / this.duration;
    if (progress > 0.75 || speed < -1) {
      // go to next
      if (!this.get('next')) {
        return this.bounceBack();
      }
      this.player.playbackRate = Math.max(1, -speed);
      this.player.onfinish = () => {
        this.sendAction('onChange', this.get('next'));
        this.player.pause();
      };
      this.player.play();
    } else if (progress < 0.25 || speed > 1) {
      // go to previous
      if (!this.get('previous')) {
        return this.bounceBack();
      }
      this.player.playbackRate = Math.min(-1, -speed);
      this.player.onfinish = () => {
        this.sendAction('onChange', this.get('previous'));
        this.player.pause();
      };
      this.player.play();
    } else {
      // to go same
      this.bounceBack();
    }
  },

  bounceBack: function() {
    let progressDiff = (-this.gesture.deltaX + this.gesture.startOffset + this.width) / (this.width * 2) - 0.5;
    let frames = Math.ceil(Math.abs(progressDiff) * this.duration / 16.67);
    let frameDelta = progressDiff / frames;
    let tick = () => {
      this.player.currentTime = this.player.currentTime - (frameDelta * this.duration);
      if (--frames > 0) {
        requestAnimationFrame(tick);
      } else {
        this.animating = false;
      }
    };
    requestAnimationFrame(tick);
  },

  generateAnimation: function(card, index) {
    var keyframes;
    if (this.effect === 'expose') {
      keyframes = [
        { transform: `scale(1) translate(${this.width}px)` },
        { transform: `scale(0.9) translate(${this.width}px)`, offset: 1.5/20 },
        { transform: `scale(0.9) translate(0)`, offset: 8.5/20 },
        { transform: `scale(1) translate(0)`, offset: 10/20 },
        { transform: `scale(0.9) translate(0)`, offset: 11.5/20 },
        { transform: `scale(0.9) translate(-${this.width}px)`, offset: 18.5/20 },
        { transform: `scale(1) translate(-${this.width}px)` }
      ];
    } else if (this.effect === 'stack') {
      switch (index) {
        case 0:
          keyframes = [
            { transform: `scale(1) translate(0, 0)`, opacity: 1, visibility: 'visible' },
            { transform: `scale(0.8) translate(0, 0)`, opacity: 0, visibility: 'hidden' },
            { transform: `scale(0) translate(0, 0)`, opacity: 0, visibility: 'hidden' },
          ];
          break;
        case 1:
          keyframes = [
            { transform: `scale(1) translate(${this.width + 25}px, 50px) rotate(5deg)`, opacity: 1, visibility: 'hidden' },
            { transform: `scale(1) translate(0, 0) rotate(0)`, opacity: 1, visibility: 'visible' },
            { transform: `scale(0.8) translate(0, 0) rotate(0)`, opacity: 0, visibility: 'hidden' },
          ];
          break;
        case 2:
          keyframes = [
            { transform: `scale(1) translate(25px, 0) rotate(0)`, opacity: 0, visibility: 'hidden' },
            { transform: `scale(1) translate(25px, 50px) rotate(5deg)`, opacity: 1, visibility: 'hidden' },
            { transform: `scale(1) translate(${-this.width}px, 0) rotate(0)`, opacity: 1, visibility: 'visible' },
          ];
      }
    }
    var opts = { duration: this.duration, fill: 'both' };
    return new Animation(card, keyframes, opts);
  }
});

