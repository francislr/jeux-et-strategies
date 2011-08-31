
var nim = nim || {};

/**
 * Inherit the prototype methods from one constructor into another.
 * Taken from the Google Closure Library.
 * @param {Function} child Child class.
 * @param {Function} parent Parent class.
 */
nim.inherits = function (child, parent) {
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
nim.setClass = function (element, className) {
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
nim.random = function (max) {
  return Math.floor(Math.random() * max);
}

/**
 * Sets the opacity of a DOM element.
 * @param {Element} element
 * @param {number} value
 */
nim.setOpacity = function (element, value) {
  element.style.filter = 'alpha(opacity=' + value * 100 + ')';
  element.style.opacity = value;
};

nim.thisCall = function (_this, func) {
  return function () {
    func.apply(_this, arguments);
  };
};

/**
 * Default animations effect
 * @enum {Function}
 */
nim.Effects = {
  "fadeIn": function (el, pos) {
    nim.setOpacity(el, pos);
  },
  "fadeOut": function (el, pos) {
    nim.setOpacity(el, 1 - pos);
    var px = parseInt(pos * 10);
    el.style.top = "-" + px + "px";
  },
  "endEffect": function (el, pos) {
    var px = parseInt(pos * 50);
    el.style.top = px + "%";
    nim.setOpacity(el, pos);
  }
};

nim.Localization = {
  "fr": {
    "WIN_GAME": "Vous avez gagné!",
    "LOSE_GAME": "Vous avez perdu!"
  },
  "en": {
    "WIN_GAME": "You win!",
    "LOSE_GAME": "You lose!"
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
nim.Element = function (tag_name, parent, text) {
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
nim.Element.prototype.AnimInterval = 50;

/**
 * Returns whether the element has been created.
 * @return {boolean}
 * @public 
 */
nim.Element.prototype.hasElement = function () {
  return this.element_ != null;
};

/**
 * Returns whether the animation is currently playing.
 * @return {boolean}
 * @public
 */
nim.Element.prototype.isAnimationPlaying = function () {
  return this.timer_id_ != null;
};

/**
 * Creates the DOM element.
 * @param {string} tag_name The HTML tag name of the element
 * @public
 */
nim.Element.prototype.create = function (tag_name) {
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
 * @param {(Element|nim.Element)} parent The parent node
 * @public
 */
nim.Element.prototype.attachTo = function (parent) {
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
nim.Element.prototype.destroy = function () {
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
nim.Element.prototype.setClass = function (classes) {
  if (!this.hasElement()) {
    return ;
  }
  nim.setClass(this.element_, classes);
};

/**
 * Sets the text of the element.
 * @param {string} text
 * @public
 */
nim.Element.prototype.setText = function (text) {
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

nim.Element.prototype.show = function () {
  if (!this.hasElement()) {
    return ;
  }
  this.element_.style.visibility = "visible";
};

nim.Element.prototype.hide = function () {
  if (!this.hasElement()) {
    return ;
  }
  this.element_.style.visibility = "hidden";
};

/**
 * Sets the display state of the element
 * @param {string} state Same value as the CSS display property
 */
nim.Element.prototype.display = function (state) {
  this.element_.style.display = state;
};

/**
 * Called when the user click the element.
 * May be overloaded
 * @protected
 */
nim.Element.prototype.handle_click = function () {

};

/**
 * Called when the mouse gets over the element.
 * May be overloaded
 * @protected
 */
nim.Element.prototype.handle_mouse_over = function () {

};

/**
 * Called when the mouse gets out the element.
 * May be overloaded
 * @protected
 */
nim.Element.prototype.handle_mouse_out = function () {
  
};

/**
 * Animates the element
 * @param {Function} anim_func Function called to animate
 * @param {number} duration Time in milliseconds
 */
nim.Element.prototype.start = function (anim_func, duration, end_func) {
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
nim.Element.prototype.stop = function () {
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
nim.Element.prototype.tick_ = function () {
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

nim.Object = function (parent, index, focus_callback, click_callback) {
  nim.Element.call(this, "BUTTON", parent);
  this.index_ = index;
  this.enabled_ = true;
  this.setClass("Object");
  this.focus_callback_ = focus_callback || null;
  this.click_callback_ = click_callback || null;
};

nim.inherits(nim.Object, nim.Element);

nim.Object.prototype.disable = function () {
  this.enabled_ = false;
};

nim.Object.prototype.setFocus = function () {
  nim.setOpacity(this.element_, 0.5);
};

nim.Object.prototype.unsetFocus = function () {
  nim.setOpacity(this.element_, 1.0);
};

nim.Object.prototype.handle_mouse_over = function (e) {
  if (!this.enabled_) {
    return ;
  }
  if (this.focus_callback_) {
    this.focus_callback_(this.index_);
  }
};

nim.Object.prototype.handle_click = function () {
  if (!this.enabled_) {
    return ;
  }
  if (this.click_callback_) {
    this.click_callback_(this.index_);
  }
};

nim.BoardRow = function (board, row_index, count) {
  nim.Element.call(this, "DIV", board);
  this.arrow_ = new nim.Element("SPAN", this.element_);
  this.arrow_.hide();
  this.arrow_.setClass("Arrow");
  this.row_index_ = row_index;
  this.count_ = count;
  this.board_ = board;
  this.setClass("BoardRow");
  this.objects_ = new Array();
  if (count) {
    this.set(count);
  }
};

nim.inherits(nim.BoardRow, nim.Element);

nim.BoardRow.prototype.set = function (count) {
  this.count_ = count;
  while (this.objects_.length > count) {
    var obj = this.objects_.shift();
    obj.disable();
    var dispose_func = (function (obj) {
      return function () {
        obj.destroy();
      };
    })(obj);
    obj.start(nim.Effects.fadeOut, 500, dispose_func);
  }
  while (this.objects_.length < count) {
    var obj = new nim.Object(this.element_, this.objects_.length,
      nim.thisCall(this, this.onFocus), nim.thisCall(this, this.onClick));
    this.objects_.unshift(obj);
  }
  if (this.objects_.length <= 0) {
    this.arrow_.hide()
  }
};

nim.BoardRow.prototype.removeObjects = function (count) {
  if (this.count_ - count < 0) {
    count = this.count_;
  }
  this.set(this.count_ - count);
};

nim.BoardRow.prototype.resetFocus = function () {
  for (var i = 0; i < this.objects_.length; i++) {
    this.objects_[i].unsetFocus();
  }
};

nim.BoardRow.prototype.onFocus = function (index) {
  if (this.objects_.length <= 0) {
    return ;
  }
  this.arrow_.show();
  this.resetFocus();
  var obj_count = this.objects_.length;
  for (var i = index + 1; i < obj_count; i++) {
    this.objects_[obj_count - i - 1].setFocus();
  }
};

nim.BoardRow.prototype.onClick = function (item_index) {
  this.resetFocus();
  this.board_.pickup(this.row_index_, item_index);
};

nim.BoardRow.prototype.handle_mouse_out = function () {
  this.arrow_.hide();
  this.resetFocus();
};

nim.Board = function (game) {
  nim.Element.call(this, "SPAN", game);

  /**
   * Rows of the game, containing all the objects
   * @type {?Array.<nim.BoardRow>}
   */
  this.rows_ = null;

  this.game_ = game;

  this.setClass("Board");
};

nim.inherits(nim.Board, nim.Element);

nim.Board.prototype.getRow = function (row_index) {
  if (row_index >= this.rows_.length) {
    return null;
  }
  return this.rows_[row_index];
};

nim.Board.prototype.createObjects = function (rows) {
  this.destroyObjects();
  var rows_count = rows.length;
  this.rows_ = new Array(rows_count);

  for (var i = 0; i < rows_count; i++) {
    var row = new nim.BoardRow(this, i, rows[i]);
    this.rows_[i] = row;
  }
};

nim.Board.prototype.destroyObjects = function () {
  if (!this.rows) {
    return ;
  }
  for (var i = 0; i < this.rows_.length; i++) {
    this.rows_[i].destroy();
  }
  this.rows_ = null;
};

nim.Board.prototype.set = function (row_index, quantity) {
  var row = this.getRow(row_index);
  if (!row) {
    return ;
  }
  row.set(quantity);
};

nim.Board.prototype.removeObjects = function (row_index, quantity) {
  var row = this.getRow(row_index);
  if (!row) {
    return ;
  }
  row.removeObjects(quantity);
};

nim.Board.prototype.pickup = function (row_index, item_index) {
  this.game_.pickup(row_index, item_index);
};

/**
 * The NIM Game
 * @param {Array.<number>} heaps
 * @param {string} first_player
 * @param {(Element|nim.Element)=} parent
 * @constructor
 */
nim.Game = function (lang, heaps, first_player, parent, game_class) {
  nim.Element.call(this, "DIV", parent);

  /**
   * Initial heap quantity
   * @type {Array.<number>}
   * @private
   */
  this.initial_heaps_ = heaps;

  /**
   * The quantity of heaps
   * @type {Array.<number>}
   * @private
   */
  this.heaps_ = null;

  /**
   * The first player to start the game
   * @type {string}
   * @private
   */
  this.first_player_ = first_player;

  /**
   * The visual presentation of the game
   * @type {nim.Board}
   * @private
   */
  this.board_ = new nim.Board(this);

  /**
   * The victory/loss message element
   * @type {nim.Element}
   * @private
   */
  this.end_message_ = new nim.Element("SPAN", this);

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
   * Timer id of the timer used to delay
   * the computer playing
   * @type {number}
   * @private
   */
  this.computer_timer_id_ = null;

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

  this.setClass("NIM " + game_class);
  this.end_message_.setClass("EndMessage");
  this.newGame();
};

nim.inherits(nim.Game, nim.Element);

nim.Game.prototype.getLocalizedMessage = function (key) {
  var lang = this.lang_;
  if (!nim.Localization[lang]) {
    lang = this.default_lang_;
    if (!nim.Localization[lang]) {
      return "";
    }
  }
  if (!nim.Localization[lang][key]) {
    lang = this.default_lang_;
  }
  if (!nim.Localization[lang][key]) {
    return "";
  }
  return nim.Localization[lang][key];
};

nim.Game.prototype.removeObjects = function (row_index, quantity) {
  if (row_index >= this.heaps_.length) {
    return ;
  }
  this.heaps_[row_index] -= quantity;
  if (this.heaps_[row_index] < 0) {
    this.heaps_[row_index] = 0;
  }
  this.board_.removeObjects(row_index, quantity);
};

/**
 * Returns whether or not there still objects left
 * @return {boolean}
 * @public
 */
nim.Game.prototype.haveObjectsLeft = function () {
  if (!this.heaps_) {
    return false;
  }
  for (var i = 0; i < this.heaps_.length; i++) {
    if (this.heaps_[i] > 0) {
      return true;
    }
  }
  return false;
};

nim.Game.prototype.newGame = function () {
  this.end_message_.display("none");
  this.heaps_ = this.initial_heaps_.slice(0);
  this.board_.createObjects(this.heaps_);
  this.player_turn_ = this.first_player_ == "human";
  this.game_ended_ = false;
  this.gameProceed();
};

nim.Game.prototype.pickup = function (row_index, item_index) {
  if (!this.player_turn_ || this.game_ended_) {
    return ;
  }
  this.removeObjects(row_index, item_index + 1);
  this.player_turn_ = false;
  this.gameProceed();
};

nim.Game.prototype.gameProceed = function () {
  if (this.game_ended_) {
    return ;
  }
  if (!this.haveObjectsLeft()) {
    var end_message_text, end_message_class;
    if (this.player_turn_) {
      end_message_class = "LoseMessage";
      end_message_text = this.getLocalizedMessage("LOSE_GAME");
    }
    else {
      end_message_class = "WinMessage";
      end_message_text = this.getLocalizedMessage("WIN_GAME");
    }
    this.end_message_.start(nim.Effects.endEffect, 1000);
    this.end_message_.setClass("EndMessage " + end_message_class);
    this.end_message_.setText(end_message_text);
    this.end_message_.display("inline");
    this.game_ended_ = true;
    return ; // Exit
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

nim.Game.prototype.computerPickup = function () {
  var strategy = this.resolvePickup();
  this.removeObjects(strategy.row_index, strategy.remove_quantity);
  this.player_turn_ = true;
  this.gameProceed();
};

nim.Game.prototype.resolvePickup = function () {
  var heaps = this.heaps_,
      x = null;
  var pick_random = false;
  var row_index = 0,
      remove_quantity = 1;
  var non_empty = new Array();
  for (i = 0; i < heaps.length; i++) {
    var q = heaps[i];
    if (q > 0) {
      non_empty.push(i);
    }
  }
  for (var i = 0; i < heaps.length; i++) {
    if (x != null) {
      x = x ^ heaps[i];
    }
    else {
      x = heaps[i];
    }
  }
  if (x == 0) {
    pick_random = true;
  }
  else {
    var strategy_choices = new Array();
    for (i = 0; i < heaps.length; i++) {
      var q = heaps[i];
      if ((q ^ x) < q) {
        strategy_choices.push(i);
      }
    }
    if (strategy_choices.length > 0) {
      i = nim.random(strategy_choices.length);
      row_index = strategy_choices[i];
      remove_quantity = heaps[row_index] - (heaps[row_index] ^ x);
    }
    else {
      pick_random = true;
    }
  }
  if (pick_random) {
    i = nim.random(non_empty.length);
    row_index = non_empty[i];
    var row_quantity = heaps[row_index];
    remove_quantity = nim.random(row_quantity) + 1;
  }

  return {
    'remove_quantity': remove_quantity,
    'row_index': row_index,
    'advantage': !pick_random
  };
};
