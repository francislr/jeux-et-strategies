
var mm = mm || {};

/**
 * Inherit the prototype methods from one constructor into another.
 * Taken from the Google Closure Library.
 * @param {Function} child Child class.
 * @param {Function} parent Parent class.
 */
mm.inherits = function (child, parent) {
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
mm.setClass = function (element, className) {
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
mm.random = function (max) {
  return Math.floor(Math.random() * max);
}

/**
 * Returns a random element from the array.
 * @param {Array} x
 */
mm.randomArray = function (x, remove) {
  if (x.length == 0) {
    return null;
  }
  var index = mm.random(x.length);
  if (index >= x.length) {
    index = 0;
  }
  var value = x[index];
  if (remove) {
    x.splice(index, 1);
  }
  return value;
};

mm.arrayContains = function (x, value) {
  for (var i = 0; i < x.length; i++) {
    if (x[i] == value) {
      return i;
    }
  }
  return -1;
};

mm.arrayCount = function (array, value) {
  var count = 0;
  for (var i = 0; i < array.length; i++) {
    if (array[i] == value) {
      count++;
    }
  }
  return count;
};

mm.arrayHasDuplicated = function (array) {
  for (var i = 0; i < array.length; i++) {
    if (mm.arrayCount(array, array[i]) > 1) {
      return true;
    }
  }
  return false;
};

/**
 * Pad a number with leading zeros
 */
mm.pad = function (n, length) {
  var str = new String(n);
  while (str.length < length) {
      str = "0" + str;
  }
  return str;
};

/**
 * Returns the position of an element
 */
mm.findPosition = function (el) {
	var x = y = 0;
	if (!el.offsetParent) {
    return null;
  }
	do {
    x += el.offsetLeft;
    y += el.offsetTop;
  } while (el = el.offsetParent);
  return {
    "x": x, "y": y
  };
};

/**
 * Sets the opacity of a DOM element.
 * @param {Element} element
 * @param {number} value
 */
mm.setOpacity = function (element, value) {
  element.style.filter = 'alpha(opacity=' + value * 100 + ')';
  element.style.opacity = value;
};

mm.thisCall = function (_this, func) {
  return function () {
    func.apply(_this, arguments);
  };
};

mm.Localization = {
  "fr": {
    "WIN_GAME": "Vous avez gagné!",
    "LOSE_GAME": "Vous avez perdu!",
    "VALIDATE_BUTTON": "Valider"
  },
  "en": {
    "WIN_GAME": "You win!",
    "LOSE_GAME": "You lose!",
    "VALIDATE_BUTTON": "Validate"
  }
};

/**
 * Default animations effect
 * @enum {Function}
 */
mm.Effects = {
  "endEffect": function (el, pos) {
    var px = parseInt(pos * 300);
    el.style.top = px + "px",
    el.style.left = "305px";
    mm.setOpacity(el, pos);
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
mm.Element = function (tag_name, parent, text) {
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
mm.Element.prototype.AnimInterval = 50;

/**
 * Returns whether the element has been created.
 * @return {boolean}
 * @public 
 */
mm.Element.prototype.hasElement = function () {
  return this.element_ != null;
};

mm.Element.prototype.appendChild = function (child) {
  if (!this.hasElement()) {
    return ;
  }
  this.element_.appendChild(child);
};

mm.Element.prototype.setAttribute = function (key, value) {
  if (!this.hasElement()) {
    return ;
  }
  /* TODO: special case for "class" and "for" */
  this.element_.setAttribute(key, value);
};

/**
 * Returns whether the animation is currently playing.
 * @return {boolean}
 * @public
 */
mm.Element.prototype.isAnimationPlaying = function () {
  return this.timer_id_ != null;
};

/**
 * Creates the DOM element.
 * @param {string} tag_name The HTML tag name of the element
 * @public
 */
mm.Element.prototype.create = function (tag_name) {
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
 * @param {(Element|mm.Element)} parent The parent node
 * @public
 */
mm.Element.prototype.attachTo = function (parent) {
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
mm.Element.prototype.destroy = function () {
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
mm.Element.prototype.setClass = function (classes) {
  if (!this.hasElement()) {
    return ;
  }
  mm.setClass(this.element_, classes);
};

/**
 * Sets the text of the element.
 * @param {string} text
 * @public
 */
mm.Element.prototype.setText = function (text) {
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

mm.Element.prototype.show = function () {
  if (!this.hasElement()) {
    return ;
  }
  this.element_.style.visibility = "visible";
};

mm.Element.prototype.hide = function () {
  if (!this.hasElement()) {
    return ;
  }
  this.element_.style.visibility = "hidden";
};

/**
 * Sets the display state of the element
 * @param {string} state Same value as the CSS display property
 */
mm.Element.prototype.display = function (state) {
  this.element_.style.display = state;
};

/**
 * Called when the user click the element.
 * May be overloaded
 * @protected
 */
mm.Element.prototype.handle_click = function () {

};

/**
 * Called when the mouse gets over the element.
 * May be overloaded
 * @protected
 */
mm.Element.prototype.handle_mouse_over = function () {

};

/**
 * Called when the mouse gets out the element.
 * May be overloaded
 * @protected
 */
mm.Element.prototype.handle_mouse_out = function () {
  
};

/**
 * Animates the element
 * @param {Function} anim_func Function called to animate
 * @param {number} duration Time in milliseconds
 */
mm.Element.prototype.start = function (anim_func, duration, end_func) {
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
mm.Element.prototype.stop = function () {
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
mm.Element.prototype.tick_ = function () {
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

mm.Button = function (parent, class_name, onclick_handler) {
  mm.Element.call(this);
  this.create("BUTTON");
  if (parent) {
    this.attachTo(parent);
  }
  if (class_name) {
    this.setClass(class_name);
  }
  this.onclick_handler_ = onclick_handler;
};

mm.inherits(mm.Button, mm.Element);

mm.Button.prototype.handle_click = function (e) {
  if (!this.onclick_handler_) {
    return ;
  }
  this.onclick_handler_.call(undefined);
};

mm.CodePeg = function (parent, onclick_handler, color_code, enabled, user_data) {
  mm.Button.call(this, parent, "CodePeg", onclick_handler);
  this.user_data_ = user_data;
  this.has_focus_ = false;
  this.setColorCode(color_code);
  this.setEnabled(enabled || false);
};

mm.inherits(mm.CodePeg, mm.Button);

mm.CodePeg.prototype.handle_click = function (e) {
  if (!this.onclick_handler_ || !this.enabled_) {
    return ;
  }
  this.onclick_handler_.call(undefined, this.color_code_, this.user_data_);
};

mm.CodePeg.prototype.setColorCode = function (color_code) {
  color_code = color_code || null;
  this.color_code_ = color_code;
  this.updateCssClass_();
};

mm.CodePeg.prototype.getColorCode = function () {
  return this.color_code_;
};

mm.CodePeg.prototype.setEnabled = function (enabled) {
  this.enabled_ = enabled ? true : false;
  this.updateCssClass_();
};

mm.CodePeg.prototype.setFocus = function (has_focus) {
  this.has_focus_ = has_focus ? true : false;
  this.updateCssClass_();
};

mm.CodePeg.prototype.updateCssClass_ = function () {
  var css_class = "CodePeg";
  if (this.color_code_) {
    css_class += " CodePeg" + this.color_code_;
  }
  else {
    css_class += " Hole";
  }
  if (this.enabled_) {
    css_class += " Enabled";
  }
  if (this.has_focus_) {
    css_class += " Focus";
  }
  this.setClass(css_class);
};

mm.CodePegPicker = function (parent, onchange_handler, color_count) {
  mm.Element.call(this, "DIV", parent);
  this.setClass("CodePegPicker");
  this.onchange_handler_ = onchange_handler || null;
  this.color_count_ = color_count;
  this.selected_color_code_ = 0;
  this.code_pegs_ = new Array(color_count);
  var onclick_handler = mm.thisCall(this, this.handle_click_);
  for (var i = 0; i < color_count; i++) {
    this.code_pegs_[i] = new mm.CodePeg(this, onclick_handler, i + 1, true);
  }
};

mm.inherits(mm.CodePegPicker, mm.Element);

mm.CodePegPicker.prototype.handle_click_ = function (color_code) {
  for (var i = 0; i < this.color_count_; i++) {
    var code_peg = this.code_pegs_[i];
    if (color_code == (i + 1)) {
      code_peg.setFocus(true);
    }
    else {
      code_peg.setFocus(false);
    }
  }
  this.selected_color_code_ = color_code;
  if (this.onchange_handler_) {
    this.onchange_handler_.call(undefined, color_code);
  }
};

mm.CodePegPicker.prototype.getSelectedColorCode = function () {
  return this.selected_color_code_;
};

mm.GameResult = function (parent) {
  mm.Element.call(this, "DIV", parent);
  this.setClass("Result");
  this.code_pegs_ = new Array(4);
  for (var i = 0; i < 4; i++) {
    this.code_pegs_[i] = new mm.CodePeg(this, null, null, false);
  }
};

mm.inherits(mm.GameResult, mm.Element);

mm.GameResult.prototype.setResult = function (result) {
  for (var i = 0; i < result.length; i++) {
    var code_peg = this.code_pegs_[i];
    code_peg.setColorCode(result[i]);
  }
};

mm.GameRow = function (parent, selected_color_code, onchange_handler) {
  mm.Element.call(this, "DIV", parent);
  this.setClass("Row");
  this.onchange_handler_ = onchange_handler || null;
  this.selected_color_code_ = selected_color_code || null;
  this.enabled_ = true;
  this.code_pegs_ = new Array(4);
  var onclick_handler = mm.thisCall(this, this.handle_click_);
  for (var i = 0; i < 4; i++) {
    this.code_pegs_[i] = new mm.CodePeg(this, onclick_handler, null, true, i);
  }
};

mm.inherits(mm.GameRow, mm.Element);

mm.GameRow.prototype.setEnabled = function (enabled) {
  this.enabled_ = enabled ? true : false;
};

mm.GameRow.prototype.handle_click_ = function (color_code, index) {
  if (!this.selected_color_code_) {
    return ;
  }
  if (this.code_pegs_.length <= index) {
    return ;
  }
  if (!this.enabled_) {
    return ;
  }
  this.code_pegs_[index].setColorCode(this.selected_color_code_);
};

mm.GameRow.prototype.setSelectedColorCode = function (color_code) {
  this.selected_color_code_ = color_code;
};

mm.GameRow.prototype.getColorSet = function () {
  var color_set = new Array(4);
  for (var i = 0; i < 4; i++) {
    var code_peg = this.code_pegs_[i];
    color_set[i] = code_peg.getColorCode();
  }
  return color_set;
};

mm.GameRow.prototype.setColorSet = function (color_set) {
  for (var i = 0; i < color_set.length; i++) {
    this.code_pegs_[i].setColorCode(color_set[i]);
  }
};

mm.Game = function (element_id, lang, color_count, allow_duplicated) {
  this.create("DIV");
  this.setClass("Mastermind");
  if (element_id) {
    this.attachTo(element_id);
  }

  this.lang_ = lang;
  this.default_lang_ = "fr";
  this.color_count_ = color_count;
  this.allow_duplicated_ = allow_duplicated;
  this.current_selected_color_code_ = 0;
  this.solution_set_ = null;
  this.board_ = new mm.Element("DIV", this);
  this.board_.setClass("Board");
  this.result_column_ = new mm.Element("DIV", this);
  this.result_column_.setClass("ResultColumn");

  var code_pick_handler = mm.thisCall(this, this.onPickColor),
      color_change_handler = mm.thisCall(this, this.onColorChange),
      validate_handler = mm.thisCall(this, this.onValidate);

  this.picker_ = new mm.CodePegPicker(this, code_pick_handler, color_count);
  this.validate_button_ = new mm.Button(this, "Button", validate_handler);
  this.end_message_ = new mm.Element("SPAN", this);
  this.validate_button_.setText(this.getLocalizedMessage("VALIDATE_BUTTON"));

  this.current_row_ = null;
  this.current_result_ = null;

  this.generateRandomCombinaison();
  this.advance();
};

mm.inherits(mm.Game, mm.Element);

mm.Game.prototype.getLocalizedMessage = function (key) {
  var lang = this.lang_;
  if (!mm.Localization[lang]) {
    lang = this.default_lang_;
    if (!mm.Localization[lang]) {
      return "";
    }
  }
  if (!mm.Localization[lang][key]) {
    lang = this.default_lang_;
  }
  if (!mm.Localization[lang][key]) {
    return "";
  }
  return mm.Localization[lang][key];
};

mm.Game.prototype.generateRandomCombinaison = function () {
  var color_set = new Array(this.color_count_);
  for (var i = 0; i < this.color_count_; i++) {
    var color_code = i + 1;
    color_set[i] = color_code;
  }
  var solution_set = new Array(4);
  for (var i = 0; i < 4; i++) {
    var remove_from_set = !this.allow_duplicated_;
    var color_code = mm.randomArray(color_set, remove_from_set);
    solution_set[i] = color_code;
  }
  if (this.allow_duplicated_) {
    if (!mm.arrayHasDuplicated(solution_set)) {
      var color_code = mm.randomArray(solution_set, true);
      mm.randomArray(solution_set, true);
      var index = mm.random(solution_set.length);
      solution_set.splice(index, 0, color_code);
      index = mm.random(solution_set.length);
      solution_set.splice(index, 0, color_code);
    }
  }
  this.solution_set_ = solution_set;
};

mm.Game.prototype.advance = function () {
  if (this.current_row_) {
    this.current_row_.setEnabled(false);
  }
  this.current_row_ = new mm.GameRow(this.board_,
    this.current_selected_color_code_, null);
  this.current_result_ = new mm.GameResult(this.result_column_);

};

mm.Game.prototype.onPickColor = function (color_code) {
  this.current_selected_color_code_ = color_code;
  this.current_row_.setSelectedColorCode(color_code);
};

mm.Game.prototype.onValidate = function () {
  if (!this.solution_set_) {
    return ;
  }
  var solution_set = this.solution_set_.slice();
  var color_set = this.current_row_.getColorSet();
  var placed = 0,
      contained = 0;
  var result = new Array();
  for (var i = 0; i < 4; i++) {
    var solution_color = solution_set[i];
    if (!solution_color) {
      continue ;
    }
    if (solution_color == color_set[i]) {
      placed++;
      result.push(-2);
      color_set[i] = undefined;
      solution_set[i] = undefined;
    }
  }
  for (var i = 0; i < 4; i++) {
    var solution_color = solution_set[i];
    if (!solution_color) {
      continue ;
    }
    var found_index = mm.arrayContains(color_set, solution_color);
    if (found_index != -1) {
      contained++;
      result.push(-1);
      color_set[found_index] = undefined;
      solution_set[i] = undefined;
    }
  }
  this.current_result_.setResult(result);
  if (placed == 4) {
    this.endGame(true);
  }
  else {
    this.advance();
  }
};

mm.Game.prototype.endGame = function (victory) {
  var end_message_text, end_message_class;

  if (!victory) {
    end_message_class = "LoseMessage";
    end_message_text = this.getLocalizedMessage("LOSE_GAME");
  }
  else {
    end_message_class = "WinMessage";
    end_message_text = this.getLocalizedMessage("WIN_GAME");
  }
  this.end_message_.start(mm.Effects.endEffect, 750);
  this.end_message_.setClass("EndMessage " + end_message_class);
  this.end_message_.setText(end_message_text);
  this.end_message_.display("inline");
};
