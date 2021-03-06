import Ember from "ember";
import config from "./config/environment";

var Router = Ember.Router.extend({
  location: config.locationType
});

Router.map(function() {
  this.resource("news", function(){
    this.route("show", { path: "/:article_id" });
  });
  this.route("config");
});

export default Router;
