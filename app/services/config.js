import Ember from 'ember';

export default Ember.Object.extend({
  deckEffects: ['expose', 'stack'],
  deckEffect: Ember.computed({
    get: function() {
      return (localStorage && localStorage.deckEffect) || this.deckEffects[0];
    },
    set: function(key, value) {
      localStorage && localStorage.deckEffect = value;
      return value;
    }
  }),
});
