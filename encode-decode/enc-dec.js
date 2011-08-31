
var enc = enc || {};

/**
 * Inherit the prototype methods from one constructor into another.
 * Taken from the Google Closure Library.
 * @param {Function} child Child class.
 * @param {Function} parent Parent class.
 */
enc.inherits = function (child, parent) {
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
enc.setClass = function (element, className) {
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
enc.random = function (max) {
  return Math.floor(Math.random() * max);
}

/**
 * Sets the opacity of a DOM element.
 * @param {Element} element
 * @param {number} value
 */
enc.setOpacity = function (element, value) {
  element.style.filter = 'alpha(opacity=' + value * 100 + ')';
  element.style.opacity = value;
};

enc.thisCall = function (_this, func) {
  return function () {
    func.apply(_this, arguments);
  };
};

/**
 * Default animations effect
 * @enum {Function}
 */
enc.Effects = {
  "fadeIn": function (el, pos) {
    enc.setOpacity(el, pos);
  },
  "fadeOut": function (el, pos) {
    enc.setOpacity(el, 1 - pos);
    var px = parseInt(pos * 10);
    el.style.top = "-" + px + "px";
  },
  "endEffect": function (el, pos) {
    var px = parseInt(pos * 50);
    el.style.top = px + "%";
    enc.setOpacity(el, pos);
  }
};

enc.Localization = {
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
enc.Element = function (tag_name, parent, text) {
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
enc.Element.prototype.AnimInterval = 50;

/**
 * Returns whether the element has been created.
 * @return {boolean}
 * @public 
 */
enc.Element.prototype.hasElement = function () {
  return this.element_ != null;
};

/**
 * Returns whether the animation is currently playing.
 * @return {boolean}
 * @public
 */
enc.Element.prototype.isAnimationPlaying = function () {
  return this.timer_id_ != null;
};

/**
 * Creates the DOM element.
 * @param {string} tag_name The HTML tag name of the element
 * @public
 */
enc.Element.prototype.create = function (tag_name) {
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
    self.element_.onblur = function (e) {
      self.handle_blur_event(e);
    };
  })(this);
};

/**
 * Attach this element to a parent node
 * @param {(Element|enc.Element)} parent The parent node
 * @public
 */
enc.Element.prototype.attachTo = function (parent) {
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
enc.Element.prototype.destroy = function () {
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
enc.Element.prototype.setClass = function (classes) {
  if (!this.hasElement()) {
    return ;
  }
  enc.setClass(this.element_, classes);
};

/**
 * Sets attributes from the supplied dict.
 * @param {Array<string, string>} attributes
 * @public
 */
enc.Element.prototype.setAttributes = function (attributes) {
  for (var key in attributes) {
    var value = attributes[key];
    if (key == "style") {
      this.element_.style.cssText = value;
    } else if (key == "class") {
      this.element_.className = value;
    } else if (key == "for") {
      this.element_.htmlFor = value;
    } else {
      this.element_.setAttribute(key, value);
    }
  }
};

/**
 * Sets the text of the element.
 * @param {string} text
 * @public
 */
enc.Element.prototype.setText = function (text) {
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

enc.Element.prototype.show = function () {
  if (!this.hasElement()) {
    return ;
  }
  this.element_.style.visibility = "visible";
};

enc.Element.prototype.hide = function () {
  if (!this.hasElement()) {
    return ;
  }
  this.element_.style.visibility = "hidden";
};

/**
 * Sets the display state of the element
 * @param {string} state Same value as the CSS display property
 */
enc.Element.prototype.display = function (state) {
  this.element_.style.display = state;
};

/**
 * Called when the user click the element.
 * May be overloaded
 * @protected
 */
enc.Element.prototype.handle_click = function () {

};

/**
 * Called when the mouse gets over the element.
 * May be overloaded
 * @protected
 */
enc.Element.prototype.handle_mouse_over = function () {

};

/**
 * Called when the mouse gets out the element.
 * May be overloaded
 * @protected
 */
enc.Element.prototype.handle_mouse_out = function () {
  
};

/**
 * Called when the element loses the focus.
 * May be overloaded
 * @protected
 */
enc.Element.prototype.handle_blur_event = function () {
  
};

/**
 * Animates the element
 * @param {Function} anim_func Function called to animate
 * @param {number} duration Time in milliseconds
 */
enc.Element.prototype.start = function (anim_func, duration, end_func) {
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
enc.Element.prototype.stop = function () {
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
enc.Element.prototype.tick_ = function () {
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

enc.MatrixCell = function (x, y, value, matrix, parent) {
  /**
   * row element of the table
   * @type {enc.Element}
   * @private
   */
  this.cell_ = new enc.Element("TD", parent);

  /**
   * Value of this cell
   * @type {Number}
   * @private
   */
  this.value_ = value || 0;

  this.matrix_ = matrix;

  enc.Element.call(this, "INPUT", this.cell_);

  this.setClass("text");
  this.setAttributes({"type": "text", "maxlength": "3"});

  this.updateValue_();
};

enc.inherits(enc.MatrixCell, enc.Element);

enc.MatrixCell.prototype.handle_blur_event = function (e) {
  var rollback = false;
  var new_value = parseInt(this.element_.value);
  if (isNaN(new_value)) {
    rollback = true; /* Not a Number */
  }
  if (new_value == this.value_) {
    rollback = true; /* No change */
  }
  if (rollback) {
    this.updateValue_();
    return ;
  }
  this.setValue(new_value);
  this.matrix_.onChange();
};

enc.MatrixCell.prototype.updateValue_ = function () {
  var str_value = new String(this.value_);
  this.element_.value = str_value;
};

enc.MatrixCell.prototype.setValue = function (value) {
  this.value_ = value;
  this.updateValue_();
};

enc.MatrixCell.prototype.getValue = function () {
  return this.value_;
};

enc.MatrixElement = function (dimension, parent, onchange_handler) {
  enc.Element.call(this, "TABLE", parent);
  this.setClass("matrix");

  this.dimension_ = dimension;

  this.rows_ = new Array();

  this.onchange_handler = onchange_handler || null;
  this.create_();
};

enc.inherits(enc.MatrixElement, enc.Element);

/**
 * Creates the matrix table
 * @private
 */
enc.MatrixElement.prototype.create_ = function () {
  if (!this.element_) {
    return ;
  }
  this.rows_ = new Array(this.dimension_);

  for (var y = 0; y < this.dimension_; y++) {
    var cols = new Array(this.dimension_);
    var tr_element = document.createElement("TR");
    this.element_.appendChild(tr_element);
    for (var x = 0; x < this.dimension_; x++) {
      var cell = new enc.MatrixCell(x, y, 0, this, tr_element);
      cols[x] = cell;
    }
    this.rows_[y] = cols;
  }
};

enc.MatrixElement.prototype.getCell_ = function (x, y) {
  if (x >= this.dimension_ || y >= this.dimension_) {
    return null;
  }
  return this.rows_[y][x];
};

enc.MatrixElement.prototype.getValue = function (x, y) {
  var cell = this.getCell_(x, y);
  if (!cell) {
    return null;
  }
  return cell.getValue();
};

enc.MatrixElement.prototype.setValue = function (x, y, value) {
  var cell = this.getCell_(x, y);
  if (!cell) {
    return false;
  }
  cell.setValue(value);
  return true;
};

enc.MatrixElement.prototype.onChange = function () {
  if (!this.onchange_handler) {
    return ;
  }
  this.onchange_handler.call(this);
};

enc.MatrixElement.prototype.getDimension = function () {
  return this.dimension_;
};

enc.Matrix = function (dimension) {
  this.rows_ = new Array(dimension);
  this.dimension_ = dimension;
  for (var x = 0; x < dimension; x++) {
    this.rows_[x] = new Array(dimension);
    for (var y = 0; y < dimension; y++) {
      this.rows_[x][y] = 0;
    }
  }
};

enc.Matrix.prototype.getValue = function (x, y) {
  if (x >= this.dimension_ || y >= this.dimension_) {
    return null;
  }
  return this.rows_[y][x];
};

enc.Matrix.prototype.setValue = function (x, y, value) {
  if (x >= this.dimension_ || y >= this.dimension_) {
    return ;
  }
  this.rows_[y][x] = value;
};

enc.Matrix.prototype.getDimension = function () {
  return this.dimension_;
};

enc.matrixMultiply = function (m, m1, m2) {
  if (m1.getDimension() != m2.getDimension()) {
    return false;
  }
  if (m1.getDimension() != m.getDimension()) {
    return false;
  }
  for (var y1 = 0; y1 < m.getDimension(); y1++) {
    for (var y2 = 0; y2 < m.getDimension(); y2++) {
      var sum = 0;
      for (var x1 = 0; x1 < m.getDimension(); x1++) {
        var value = m1.getValue(x1, y1) * m2.getValue(y2, x1);
        sum += value;
      }
      m.setValue(y2, y1, sum);
    }
  }
  return true;
};

enc.Game = function (lang) {
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

  this.word_length_ = 4;
  this.word_ = "";

  this.matrix_dimension_ = null;
  
  this.key_matrix_ = null;
  this.message_matrix_ = null;

  this.setMatrixDimension(2);
};

enc.Game.prototype.getLocalizedMessage = function (key) {
  var lang = this.lang_;
  if (!enc.Localization[lang]) {
    lang = this.default_lang_;
    if (!enc.Localization[lang]) {
      return "";
    }
  }
  if (!enc.Localization[lang][key]) {
    lang = this.default_lang_;
  }
  if (!enc.Localization[lang][key]) {
    return "";
  }
  return enc.Localization[lang][key];
};

enc.Game.prototype.destroy = function () {
  this.key_matrix_.destroy();
  this.message_matrix_.destroy();
};

enc.Game.prototype.setMatrixDimension = function (dimension) {
  if (this.matrix_dimension_ != dimension) {
    if (this.key_matrix_) {
      this.key_matrix_.destroy();
    }
    if (this.message_matrix_) {
      this.message_matrix_.destroy();
    }
    var update_handler = enc.thisCall(this, this.decode);
    this.key_matrix_ = new enc.MatrixElement(dimension, "enc-key", update_handler);
    this.message_matrix_ = new enc.MatrixElement(dimension, "enc-message", update_handler);
    this.current_matrix_dimension_ = this.matrix_dimension_;
    this.matrix_dimension_ = dimension;
  }
};

enc.Game.prototype.setWord = function (word) {
  this.word_ = word;
};

enc.Game.prototype.calculateDeterminant = function () {
  var matrix = this.key_matrix_;
  if (this.matrix_dimension_ == 3) {
    return (matrix.getValue(0, 0) * matrix.getValue(1, 1)) -
           (matrix.getValue(1, 0) * matrix.getValue(0, 1));
  }
};

enc.Game.prototype.getAlphaWord = function () {
  var codes = new Array();
  for (var i = 0; i < this.word_.length; i++) {
    var code = this.word_.charCodeAt(i);
    if (code >= 65 && code <= 90) {
      code -= 64;
    } else if (code >= 97 && code <= 122) {
      code -= 96;
    }
    else {
      continue ;
    }
    codes.push(code);
  }
  return codes;
};

enc.Game.prototype.getWordMatrix = function () {
  var alpha_word = this.getAlphaWord();
  if (alpha_word.length != 4 && alpha_word.length != 9) {
    return null;
  }
  var dimension = Math.sqrt(alpha_word.length);
  var matrix = new enc.Matrix(dimension);
  for (var i = 0; i < alpha_word.length; i++) {
    var c = alpha_word[i];
    var x = i % dimension,
        y = Math.floor(i / dimension);
    matrix.setValue(x, y, c);
  }
  return matrix;
};

enc.Game.prototype.update = function () {
};

enc.Game.prototype.encode = function () {
  var alpha_matrix = this.getWordMatrix();
  if (alpha_matrix == null) {
    return ;
  }
  if (alpha_matrix.getDimension() != this.key_matrix_.getDimension()) {
    return ;
  }
  enc.matrixMultiply(this.message_matrix_, alpha_matrix, this.key_matrix_);
};

enc.Game.prototype.decode = function () {

};
