
var allumettes = allumettes || {};

/**
 * Inherit the prototype methods from one constructor into another.
 * Taken from the Google Closure Library.
 * @param {Function} child Child class.
 * @param {Function} parent Parent class.
 */
allumettes.inherits = function (child, parent) {
  var dummy = function () { };
  dummy.prototype = parent.prototype;
  child.superClass_ = parent.prototype;
  child.prototype = new dummy;
  child.prototype.constructor = child;
};

/**
 * Sets the class of a DOM element.
 * @param {Element} element
 * @param {string} className
 */
allumettes.setClass = function (element, className) {
  if (element.className) {
    element.className = className;
  }
  else {
    element.setAttribute("class", className);
  }
};

/**
 * Returns a random number from 0 to max-1
 * @param {number} max
 */
allumettes.random = function (max) {
  return Math.floor(Math.random() * max);
}

/**
 * Sets the opacity of a DOM element.
 * @param {Element} element
 * @param {number} value
 */
allumettes.setOpacity = function (element, value) {
  element.style.filter = 'alpha(opacity=' + value * 100 + ')';
  element.style.opacity = value;
};

allumettes.thisCall = function (_this, func) {
  return function () {
    func.apply(_this, arguments);
  };
};

/**
 * Default animations effect
 * @enum {Function}
 */
allumettes.Effects = {
  "fadeIn": function (el, pos) {
    allumettes.setOpacity(el, pos);
  },
  "fadeOut": function (el, pos) {
    allumettes.setOpacity(el, 1 - pos);
    var px = parseInt(pos * 10);
    el.style.top = "-" + px + "px";
  },
  "endEffect": function (el, pos) {
    var px = parseInt(pos * 50);
    el.style.top = px + "%";
    allumettes.setOpacity(el, pos);
  }
};

/**
 * Goals of the game
 * @enum {string}
 */
allumettes.Goal = {
  "last_win": "1",
  "last_lose": "2"
}

allumettes.Localization = {
  "fr": {
    "WIN_GAME": "Vous avez gagné!",
    "LOSE_GAME": "Vous avez perdu!",
    "TOO_MANY_OBJECTS": "Vous avez spécifié trop d'objets,\n" +
      "ce qui peut ralentir le jeu.\n" +
      "Êtes-vous sûr de vouloir continuer ?"
  },
  "en": {
    "WIN_GAME": "You win!",
    "LOSE_GAME": "You lose!",
    "TOO_MANY_OBJECTS": "You have specified too many objects,\n" +
      "this can slow down the game.\n" +
      "Are you sure you want to continue ?"
  }
};

/**
 * An object representing a DOM element.
 * If the tag_name is not supplied, then the element must
 * be created by using the create function.
 * @param {string=} tag_name The HTML tag name of the element
 * @param {Element=} parent The parent to attach to 
 * @param {string=} text The text node of the element
 * @constructor
 */
allumettes.Element = function (tag_name, parent, text) {
  /**
   * The DOM element of the object
   * @type {?Element}
   * @protected
   */
  this.element_ = null;

  /**
   * The Text Node element of the element
   * @type {?TextNode}
   * @protected
   */
  this.text_node_ = null;

  /**
   * The timer id of the animation
   * @type {?number}
   * @private
   */
  this.timer_id_ = null;

  /**
   * The duration of the animation or null
   * @type {?number}
   * @private
   */
  this.anim_duration_ = null;

  /**
   * The time since the start of the animation.
   * @type {?number}
   * @private
   */
  this.anim_elapsed_ = null;

  /**
   * The animation interpolation function
   * The function takes the element as the first argument
   * and the number of milliseconds since the start.
   * @type {Function}
   * @private
   */
  this.anim_func_ = null;

  /**
   * Function to call when the animation end
   * @type {?Function}
   * @private
   */
  this.anim_end_func_ = null;

  if (tag_name) {
    this.create(tag_name);
    if (parent) {
      this.attachTo(parent);
    }
    if (text) {
      this.setText(text);
    }
  }
};

/**
 * The time in milliseconds to update an animation
 * @type {number}
 * @const
 */
allumettes.Element.prototype.AnimInterval = 50;

/**
 * Returns whether the element has been created.
 * @return {boolean}
 * @public 
 */
allumettes.Element.prototype.hasElement = function () {
  return this.element_ != null;
};

/**
 * Returns whether the animation is currently playing.
 * @return {boolean}
 * @public
 */
allumettes.Element.prototype.isAnimationPlaying = function () {
  return this.timer_id_ != null;
};

/**
 * Creates the DOM element.
 * @param {string} tag_name The HTML tag name of the element
 * @public
 */
allumettes.Element.prototype.create = function (tag_name) {
  this.destroy();
  this.element_ = document.createElement(tag_name);
  (function (self) {
    self.element_.onclick = function (e) {
      self.handle_click(e);
    };
    self.element_.onmouseover = function (e) {
      self.handle_mouse_over(e);
    };
    self.element_.onmouseout = function (e) {
      self.handle_mouse_out(e);
    };
  })(this);
};

/**
 * Attach this element to a parent node
 * @param {(Element|allumettes.Element)} parent The parent node
 * @public
 */
allumettes.Element.prototype.attachTo = function (parent) {
  if (!this.hasElement()) {
    return ;
  }
  if (typeof parent == "string") {
    parent = document.getElementById(parent);
  }
  if (parent.element_) {
    parent = parent.element_;
  }
  parent.appendChild(this.element_);
};

/**
 * Removes the DOM element from its parent. Must be
 * called before releasing the object.
 * @public
 */
allumettes.Element.prototype.destroy = function () {
  if (!this.hasElement()) {
    /* The object is not created */
    return ;
  }
  if (this.element_.parentNode) {
    /* Remove this DOM element from its parent */
    this.element_.parentNode.removeChild(this.element_);
  }
  this.element_ = null;
};

/**
 * Sets the cascade style sheet class for the element
 * @param {string} classes
 * @public
 */
allumettes.Element.prototype.setClass = function (classes) {
  if (!this.hasElement()) {
    return ;
  }
  allumettes.setClass(this.element_, classes);
};

/**
 * Sets the text of the element.
 * @param {string} text
 * @public
 */
allumettes.Element.prototype.setText = function (text) {
  if (!this.hasElement()) {
    return ;
  }
  if (!this.text_node_) {
    this.text_node_ = document.createTextNode(text);
    this.element_.appendChild(this.text_node_);
  }
  else {
    this.text_node_.data = text;
  }
};

allumettes.Element.prototype.show = function () {
  if (!this.hasElement()) {
    return ;
  }
  this.element_.style.visibility = "visible";
};

allumettes.Element.prototype.hide = function () {
  if (!this.hasElement()) {
    return ;
  }
  this.element_.style.visibility = "hidden";
};

/**
 * Sets the display state of the element
 * @param {string} state Same value as the CSS display property
 */
allumettes.Element.prototype.display = function (state) {
  this.element_.style.display = state;
};

/**
 * Called when the user click the element.
 * May be overloaded
 * @protected
 */
allumettes.Element.prototype.handle_click = function () {

};

/**
 * Called when the mouse gets over the element.
 * May be overloaded
 * @protected
 */
allumettes.Element.prototype.handle_mouse_over = function () {

};

/**
 * Called when the mouse gets out the element.
 * May be overloaded
 * @protected
 */
allumettes.Element.prototype.handle_mouse_out = function () {
  
};

/**
 * Animates the element
 * @param {Function} anim_func Function called to animate
 * @param {number} duration Time in milliseconds
 */
allumettes.Element.prototype.start = function (anim_func, duration, end_func) {
  this.stop();
  this.anim_elapsed_ = 0,
  this.anim_duration_ = duration,
  this.anim_func_ = anim_func;
  this.anim_end_func_ = end_func || null;
  var self = this;
  this.timer_id_ = setInterval(function () {
    self.tick_();
  }, this.AnimInterval);
  self.tick_();
};

/**
 * Stop the animation
 */
allumettes.Element.prototype.stop = function () {
  if (!this.isAnimationPlaying()) {
    return ;
  }
  if (this.anim_elapsed_ < this.anim_duration_) {
    if (this.anim_func_) {
      this.anim_func_(this.element_, 1.0);
    }
  }
  if (this.anim_end_func_) {
    this.anim_end_func_.call(this);
  }
  this.anim_elapsed_ = null,
  this.anim_duration_ = null,
  this.anim_func_ = null;
  this.anim_end_func_ = null;
  clearInterval(this.timer_id_);
};

/**
 * @private
 */
allumettes.Element.prototype.tick_ = function () {
  if (!this.isAnimationPlaying() || this.anim_elapsed_ > this.anim_duration_) {
    this.stop();
    return ;
  }
  var position = (this.anim_elapsed_ / this.anim_duration_);
  if (this.anim_func_) {
    this.anim_func_.call(this, this.element_, position);
  }
  this.anim_elapsed_ += this.AnimInterval;
  if (this.anim_elapsed_ > this.anim_duration_) {
    this.stop();
  }
};

allumettes.Board = function (parent, theme, mouse_out_handler) {
  allumettes.Element.call(this, "DIV", parent);
  this.setClass("Board " + theme);
  this.mouse_out_handler_ = mouse_out_handler;
};

allumettes.inherits(allumettes.Board, allumettes.Element);

allumettes.Board.prototype.handle_mouse_out = function () {
  if (!this.mouse_out_handler_) {
    return ;
  }
  this.mouse_out_handler_();
};

allumettes.Object = function (parent, index, focus_callback, click_callback) {
  allumettes.Element.call(this, "BUTTON", parent);

  this.index_ = index;
  this.enabled_ = true;

  this.setClass("Object");

  this.focus_callback_ = focus_callback || null;
  this.click_callback_ = click_callback || null;
};

allumettes.inherits(allumettes.Object, allumettes.Element);

allumettes.Object.prototype.disable = function () {
  this.enabled_ = false;
};

allumettes.Object.prototype.setHighlight = function () {
  allumettes.setOpacity(this.element_, 1.0);
};

allumettes.Object.prototype.unsetHighlight = function () {
  allumettes.setOpacity(this.element_, 0.5);
};

allumettes.Object.prototype.handle_mouse_over = function (e) {
  if (!this.enabled_) {
    return ;
  }
  if (this.focus_callback_) {
    this.focus_callback_(this.index_);
  }
};

allumettes.Object.prototype.handle_click = function () {
  if (!this.enabled_) {
    return ;
  }
  if (this.click_callback_) {
    this.click_callback_(this.index_);
  }
};

allumettes.Game = function (lang, theme, object_count,
  pickup_quantity, first_player, goal, parent)
{
  allumettes.Element.call(this, "DIV", parent);

  /**
   * Initial object quantity
   * @type {number}
   * @private
   */
  this.initial_object_count_ = object_count;

  /**
   * Objects container
   * @type {Array.<allumettes.Object>?}
   * @private
   */
  this.objects_ = null;

  /**
   * Object quantity
   * @type {number}
   * @private
   */
  this.object_count_ = null;

  /**
   * The allowed quantity to pickup
   * @type {number}
   * @private
   */
  this.pickup_quantity_ = pickup_quantity;

  /**
   * The first player to start the game
   * @type {string}
   * @private
   */
  this.first_player_ = first_player;

  /**
   * The goal of the game
   * @type {allumettes.Goal}
   * @private
   */
  this.goal_ = goal;

  /**
   * Flag is set when the player can play
   * @type {boolean}
   * @private
   */
  this.player_turn_ = false;

  /**
   * Flag is set when the game is ended.
   * @type {boolean}
   * @private
   */
  this.game_ended_ = true;

  /**
   * Language code of 2 character
   * @type {string}
   * @private
   */
  this.lang_ = lang;

  /**
   * Fallback if the language has not been found
   * @type {string}
   * @private
   */
  this.default_lang_ = "en";

  /**
   * The element where the game is playing
   * @type {allumettes.Board}
   * @private
   */
  this.board_element_ = new allumettes.Board(this,
    theme, allumettes.thisCall(this, this.highlightObjects_)
  );

  /**
   * The victory/loss message element
   * @type {allumettes.Element}
   * @private
   */
  this.end_message_ = new allumettes.Element("SPAN", this);

  /**
   * Timer id of the timer used to delay
   * the computer playing
   * @type {number}
   * @private
   */
  this.computer_timer_id_ = null;
  if (object_count > 200) {
    if (!confirm(this.getLocalizedMessage("TOO_MANY_OBJECTS"))) {
      return ;
    }
  }
  this.setClass("Allumettes");
  this.newGame();
};

allumettes.inherits(allumettes.Game, allumettes.Element);

allumettes.Game.prototype.getLocalizedMessage = function (key) {
  var lang = this.lang_;
  if (!allumettes.Localization[lang]) {
    lang = this.default_lang_;
    if (!allumettes.Localization[lang]) {
      return "";
    }
  }
  if (!allumettes.Localization[lang][key]) {
    lang = this.default_lang_;
  }
  if (!allumettes.Localization[lang][key]) {
    return "";
  }
  return allumettes.Localization[lang][key];
};

allumettes.Game.prototype.newGame = function () {
  this.end_message_.display("none");
  this.createObjects_();
  this.player_turn_ = this.first_player_ == "human";
  this.game_ended_ = false;
  this.gameProceed();
};

allumettes.Game.prototype.allowedQuantity_ = function (quantity) {
  return this.pickup_quantity_ >= quantity;
};

allumettes.Game.prototype.haveObjectsLeft = function () {
  return this.object_count_ > 0;
};

allumettes.Game.prototype.createObjects_ = function () {
  this.objects_ = new Array();
  for (var i = 0; i < this.initial_object_count_; i++) {
    var obj = new allumettes.Object(this.board_element_,
      this.initial_object_count_ - i,
      allumettes.thisCall(this, this.onFocus),
      allumettes.thisCall(this, this.onClick)
    );
    this.objects_.push(obj);
  }
  this.object_count_ = parseInt(this.initial_object_count_);
};

allumettes.Game.prototype.removeObjects_ = function (quantity) {
  while (quantity > 0 && this.object_count_ > 0) {
    var obj = this.objects_.shift();
    obj.disable();
    var dispose_func = (function (obj) {
      return function () {
        obj.destroy();
      };
    })(obj);
    obj.start(allumettes.Effects.fadeOut, 500, dispose_func);
    quantity--;
    this.object_count_--;
  }
};

allumettes.Game.prototype.highlightObjects_ = function () {
  if (!this.objects_) {
    return ;
  }
  for (var i = 0; i < this.objects_.length; i++) {
    var obj = this.objects_[i];
    obj.setHighlight();
  }
};

allumettes.Game.prototype.onFocus = function (index) {
  if (!this.player_turn_ || this.game_ended_) {
    return ;
  }
  var quantity = this.object_count_ - index + 1;
  if (quantity < 1) {
    return ;
  }
  this.highlightObjects_();
  if (!this.allowedQuantity_(quantity)) {
    return ;
  }
  for (var i = quantity; i < this.objects_.length; i++) {
    var obj = this.objects_[i];
    obj.unsetHighlight();
  }
};

allumettes.Game.prototype.onClick = function (index) {
  var quantity = this.object_count_ - index + 1;
  if (quantity < 1) {
    return ;
  }
  if (!this.allowedQuantity_(quantity)) {
    return ;
  }
  this.pickup(quantity);
  this.highlightObjects_();
};

allumettes.Game.prototype.pickup = function (quantity) {
  if (!this.player_turn_ || this.game_ended_) {
    return ;
  }
  this.removeObjects_(quantity);
  this.player_turn_ = false;
  this.gameProceed();
};

allumettes.Game.prototype.computerPickup = function () {
  if (this.player_turn_ || this.game_ended_) {
    return ;
  }
  var strategy = this.resolvePickUp();
  if (!strategy) {
    return ;
  }
  this.removeObjects_(strategy.pick_up_quantity);
  this.player_turn_ = true;
  this.gameProceed();
};

allumettes.Game.prototype.gameProceed = function () {
  if (this.game_ended_) {
    return ;
  }
  if (!this.haveObjectsLeft()) {
    var end_message_text, end_message_class;
    var victory = (this.player_turn_ && this.goal_ == allumettes.Goal.last_lose)
      || (!this.player_turn_ && this.goal_ == allumettes.Goal.last_win);
    if (!victory) {
      end_message_class = "LoseMessage";
      end_message_text = this.getLocalizedMessage("LOSE_GAME");
    }
    else {
      end_message_class = "WinMessage";
      end_message_text = this.getLocalizedMessage("WIN_GAME");
    }
    this.end_message_.start(allumettes.Effects.endEffect, 1000);
    this.end_message_.setClass("EndMessage " + end_message_class);
    this.end_message_.setText(end_message_text);
    this.end_message_.display("inline");
    this.game_ended_ = true;
    return ;
  }
  if (this.computer_timer_id_) {
    clearTimeout(this.computer_timer_id_);
    this.computer_timer_id_ = null;
  }
  if (!this.player_turn_) {
    var self = this;
    this.computer_timer_id_ = setTimeout(function () {
      self.computerPickup();
    }, 1000);
  }
};

allumettes.Game.prototype.resolvePickUp = function () {
  if (!this.object_count_) {
    return null;
  }
  var pick_random = false;
  var x = this.object_count_;
  if (this.goal_ == allumettes.Goal.last_lose) {
    x = this.object_count_ - 1;
  }
  var quantity = x % (this.pickup_quantity_ + 1);
  if (quantity <= 0) {
    pick_random = true;
  }
  if (pick_random) {
    quantity = allumettes.random(this.pickup_quantity_) + 1;
  }
  return {
    "pick_up_quantity": quantity,
    "advantage": !pick_random
  };
};
