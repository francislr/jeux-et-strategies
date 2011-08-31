
var hanoi = hanoi || {};

/**
 * Inherit the prototype methods from one constructor into another.
 * Taken from the Google Closure Library.
 * @param {Function} child Child class.
 * @param {Function} parent Parent class.
 */
hanoi.inherits = function (child, parent) {
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
hanoi.setClass = function (element, className) {
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
hanoi.random = function (max) {
  return Math.floor(Math.random() * max);
}

/**
 * Pad a number with leading zeros
 */
hanoi.pad = function (n, length) {
  var str = new String(n);
  while (str.length < length) {
      str = "0" + str;
  }
  return str;
};

/**
 * Returns the position of an element
 */
hanoi.findPosition = function (el) {
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
hanoi.setOpacity = function (element, value) {
  element.style.filter = 'alpha(opacity=' + value * 100 + ')';
  element.style.opacity = value;
};

hanoi.thisCall = function (_this, func) {
  return function () {
    func.apply(_this, arguments);
  };
};

hanoi.Localization = {
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
 * Default animations effect
 * @enum {Function}
 */
hanoi.Effects = {
  "selectTower": function (el, pos) {
    var px = parseInt(pos * -8);
    el.style.backgroundPosition = "0 " + px + "px";
  },
  "unselectTower": function (el, pos) {
    pos = 1 - pos;
    var px = parseInt(pos * -8);
    el.style.backgroundPosition = "0 " + px + "px";
  },
  "diskMotion": function (disk1, disk2) {
    return function (el, t) {
      var min = function (x1, x2) {
        return x1 > x2 ? x2 : x1;
      }
      var disk1_pos = hanoi.findPosition(disk1.element_),
          disk2_pos = hanoi.findPosition(disk2.element_);
      var u = 1 - t;
      var middle_x = (disk2_pos.x + disk1_pos.x) / 2,
          middle_y = min(disk2_pos.y, disk1_pos.y) - 100;
      var x = disk1_pos.x * u * u + middle_x * 2 * u * t + disk2_pos.x * t * t,
          y = disk1_pos.y * u * u + middle_y * 2 * u * t + disk2_pos.y * t * t;

      el.style.left = x + "px",
      el.style.top = y + "px";
    };
  },
  "endEffect": function (el, pos) {
    var px = parseInt(pos * 300);
    el.style.top = px + "px",
    el.style.left = "420px";
    hanoi.setOpacity(el, pos);
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
hanoi.Element = function (tag_name, parent, text) {
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
hanoi.Element.prototype.AnimInterval = 50;

/**
 * Returns whether the element has been created.
 * @return {boolean}
 * @public 
 */
hanoi.Element.prototype.hasElement = function () {
  return this.element_ != null;
};

hanoi.Element.prototype.appendChild = function (child) {
  if (!this.hasElement()) {
    return ;
  }
  this.element_.appendChild(child);
};

hanoi.Element.prototype.setAttribute = function (key, value) {
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
hanoi.Element.prototype.isAnimationPlaying = function () {
  return this.timer_id_ != null;
};

/**
 * Creates the DOM element.
 * @param {string} tag_name The HTML tag name of the element
 * @public
 */
hanoi.Element.prototype.create = function (tag_name) {
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
 * @param {(Element|hanoi.Element)} parent The parent node
 * @public
 */
hanoi.Element.prototype.attachTo = function (parent) {
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
hanoi.Element.prototype.destroy = function () {
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
hanoi.Element.prototype.setClass = function (classes) {
  if (!this.hasElement()) {
    return ;
  }
  hanoi.setClass(this.element_, classes);
};

/**
 * Sets the text of the element.
 * @param {string} text
 * @public
 */
hanoi.Element.prototype.setText = function (text) {
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

hanoi.Element.prototype.show = function () {
  if (!this.hasElement()) {
    return ;
  }
  this.element_.style.visibility = "visible";
};

hanoi.Element.prototype.hide = function () {
  if (!this.hasElement()) {
    return ;
  }
  this.element_.style.visibility = "hidden";
};

/**
 * Sets the display state of the element
 * @param {string} state Same value as the CSS display property
 */
hanoi.Element.prototype.display = function (state) {
  this.element_.style.display = state;
};

/**
 * Called when the user click the element.
 * May be overloaded
 * @protected
 */
hanoi.Element.prototype.handle_click = function () {

};

/**
 * Called when the mouse gets over the element.
 * May be overloaded
 * @protected
 */
hanoi.Element.prototype.handle_mouse_over = function () {

};

/**
 * Called when the mouse gets out the element.
 * May be overloaded
 * @protected
 */
hanoi.Element.prototype.handle_mouse_out = function () {
  
};

/**
 * Animates the element
 * @param {Function} anim_func Function called to animate
 * @param {number} duration Time in milliseconds
 */
hanoi.Element.prototype.start = function (anim_func, duration, end_func) {
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
hanoi.Element.prototype.stop = function () {
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
hanoi.Element.prototype.tick_ = function () {
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

hanoi.Button = function (parent, class_name, onclick_handler) {
  hanoi.Element.call(this);
  this.create("BUTTON");
  if (parent) {
    this.attachTo(parent);
  }
  if (class_name) {
    this.setClass(class_name);
  }
  this.onclick_handler_ = onclick_handler;
};

hanoi.inherits(hanoi.Button, hanoi.Element);

hanoi.Button.prototype.handle_click = function (e) {
  if (!this.onclick_handler_) {
    return ;
  }
  this.onclick_handler_.call(undefined);
};

/**
 * A state keeps track of pegs and disks of the game.
 * @param {hanoi.GameState=} state Uses data from another state.
 * @param {Number=} pegs Number of pegs.
 * @param {Number} disk_count
 * @public
 */
hanoi.GameState = function (state, pegs, disk_count) {
  hanoi.Element.call(this);

  /**
   * An Array containing all the disk identifier in pegs.
   * @type {Array<Array<Number>>}
   * @private
   */
  this.pegs_ = new Array();

  this.disk_count_ = disk_count;

  if (pegs) {
    for (var i = 0; i < pegs; i++) {
      var peg = new Array();
      this.pegs_.push(peg);
    }
  }
};

hanoi.inherits(hanoi.GameState, hanoi.Element);

/**
 * Creates the initial disks.
 * @param {Number} peg_index Peg index to store disks
 * @param {Number} disk_count Number of disks
 * @public
 */
hanoi.GameState.prototype.init = function (peg_index, disk_count) {
  if (peg_index >= this.pegs_.length) {
    return false;
  }
  this.reset();
  for (var i = disk_count; i > 0; i--) {
    this.pushDisk(peg_index, i);
  }
  return true;
};

/**
 * Removes all disks from all pegs.
 * @public
 */
hanoi.GameState.prototype.reset = function () {
  for (var i = 0; i < this.pegs_.length; i++) {
    while (this.popDisk(i));
  }
};

hanoi.GameState.prototype.load = function (state) {
  this.reset();
  for (var i = 0; i < state.pegs_.length; i++) {
    var peg = state.pegs_[i];
    for (j = 0; j < peg.length; j++) {
      this.pushDisk(i, peg[j]);
    }
  }
};

/**
 * moves a disk to another peg. Removes it from the peg and adds it
 * to another one.
 * @param {Number} source_peg Peg index, starting at 0 from left.
 * @param {Number} dest_peg Peg indexs
 * @return {Boolean} Returns whether the move is done.
 * @public
 */
hanoi.GameState.prototype.move = function (source_peg, dest_peg) {
  var disk_id = this.popDisk(source_peg);
  if (!disk_id) {
    return false;
  }
  if (!this.pushDisk(dest_peg, disk_id)) {
    return false;
  }
  var source_disks = this.pegs_[source_peg],
      dest_disks = this.pegs_[dest_peg];
  var dest_pos = 0,
      source_pos = source_disks.length;
  if (dest_disks.length > 0) {
    dest_pos = dest_disks.length - 1;
  }
  this.onMove(source_peg, dest_peg, source_pos, dest_pos);
  return true;
};

/**
 * Exchanges two disk identifiers between two pegs.
 * @param {Number} peg_index1
 * @param {Number} peg_index2
 * @return {Boolean} Returns whether the move is done.
 * @public
 */
hanoi.GameState.prototype.exchange = function (peg_index1, peg_index2) {
  var disk_id1 = this.getTopId(peg_index1),
      disk_id2 = this.getTopId(peg_index2);
  var source_peg = peg_index2,
      dest_peg = peg_index1;
  if (disk_id1 && disk_id2) {
    if (disk_id1 < disk_id2) {
      source_peg = peg_index1,
      dest_peg = peg_index2;
    }
  }
  else {
    if (!disk_id2 && disk_id1) {
      source_peg = peg_index1,
      dest_peg = peg_index2;
    }
  }
  return this.move(source_peg, dest_peg);
};

/**
 * Removes a disk from the top of a peg.
 * @param {Number} peg_index Peg index
 * @public
 */
hanoi.GameState.prototype.popDisk = function (peg_index) {
  if (peg_index >= this.pegs_.length) {
    return null;
  }
  var peg = this.pegs_[peg_index];
  if (peg.length == 0) {
    return null;
  }
  this.set(peg_index, peg.length - 1, null);
  return peg.pop();
};

/**
 * Adds a disk to the top of a peg.
 * @param {Number} peg_index Peg index
 * @param {Number} disk_id Disk identifier to add.
 */
hanoi.GameState.prototype.pushDisk = function (peg_index, disk_id) {
  if (peg_index >= this.pegs_.length) {
    return false;
  }
  var peg = this.pegs_[peg_index];
  this.set(peg_index, peg.length, disk_id);
  peg.push(disk_id);
  return true;
};

/**
 * Gets the top identifier of a peg.
 * @param {Number} peg_index
 * @return {Number?}
 */
hanoi.GameState.prototype.getTopId = function (peg_index) {
  if (peg_index >= this.pegs_.length) {
    return null;
  }
  var peg = this.pegs_[peg_index];
  if (peg.length == 0) {
    return null;
  }
  return peg[peg.length - 1];
};

/**
 * Sets the disk number from a peg. Must be overriden
 * by a super class.
 * @param {Number} peg_index Peg index
 * @param {Number} disk_position 0-based Position of the disk
 * @param {Number?} disk_id Disk identifier to set to.
 * @public
 */
hanoi.GameState.prototype.set = function (peg_index, disk_position, disk_id) {
};

hanoi.GameState.prototype.onMove = function (source_peg, dest_peg, source_position, dest_position) {
};

hanoi.GameState.prototype.save = function (state) {
};

hanoi.Disk = function () {
  hanoi.Element.call(this);
  this.create("DIV");

  this.id_ = null;

  this.setIdentifier(null);
};

hanoi.inherits(hanoi.Disk, hanoi.Element);

hanoi.Disk.prototype.setIdentifier = function (disk_id) {
  var disk_class = disk_id ? "Disk" + disk_id
                           : "None";
  this.setClass("Disk " + disk_class);
  this.disk_id_ = disk_id;
  if (!disk_id) {
    this.hide();
  }
  else {
    this.show();
  }
};

hanoi.Disk.prototype.getId = function () {
  return this.disk_id_;
};

hanoi.Disk.prototype.show = function () {
  if (!this.disk_id_) {
    return ;
  }
  hanoi.Disk.superClass_.show.call(this);
};

hanoi.DiskGhost = function () {
  hanoi.Disk.call(this);
  this.element_.style.position = "absolute";
};

hanoi.inherits(hanoi.DiskGhost, hanoi.Disk);

hanoi.DiskGhost.prototype.startMotion = function (source_disk, dest_disk) {
  
};

hanoi.Tower = function (parent, disk_count, tower_id,
                        tower_select_handler) {
  hanoi.Element.call(this);
  var tower_name = "ABCDEFGHIJKLMN"[tower_id];

  this.create("DIV");
  this.attachTo(parent);
  this.setClass("Tower");

  this.ribbon_ = new hanoi.Button(this, "Ribbon"/*,
    hanoi.thisCall(this, this.handle_select)*/);
  this.disks_ = new Array(disk_count);
  this.id_ = tower_id;
  this.tower_select_handler_ = tower_select_handler;

  this.ribbon_.setText(tower_name);

  for (var i = 0; i < disk_count; i++) {
    var disk = new hanoi.Disk();
    this.disks_[i] = disk;
  }
  for (var i = this.disks_.length - 1; i >= 0; i--) {
    this.disks_[i].attachTo(this);
  }
};

hanoi.inherits(hanoi.Tower, hanoi.Element);

hanoi.Tower.prototype.getDisk = function (disk_position) {
  if (disk_position >= this.disks_.length) {
    return null;
  }
  return this.disks_[disk_position];
};

hanoi.Tower.prototype.handle_select = function () {
  if (!this.tower_select_handler_) {
    return ;
  }
  this.tower_select_handler_.call(undefined, this.id_);
};

hanoi.Tower.prototype.handle_click = function (e) {
  this.handle_select();
};

hanoi.Tower.prototype.setDiskIdentifier = function (disk_position, disk_id) {
  if (disk_position >= this.disks_.length) {
    return false;
  }
  this.disks_[disk_position].setIdentifier(disk_id);
  return true;
};

hanoi.Tower.prototype.select = function () {
  this.ribbon_.start(hanoi.Effects.selectTower, 500);
};

hanoi.Tower.prototype.unselect = function () {
  this.ribbon_.start(hanoi.Effects.unselectTower, 500);
};

hanoi.TableState = function (pegs, disk_count, index, restore_handler) {
  hanoi.GameState.call(this, undefined, pegs, disk_count);

  this.create("BUTTON");
  this.setClass("State");

  this.index_ = index;
  this.restore_handler_ = restore_handler || null;
  this.title_ = new hanoi.Element("H3", this, new String(index));

  this.table_ = new hanoi.Element("TABLE", this);
  this.table_.setClass("GameState");
  this.table_.setAttribute("border", "0");
  this.table_.setAttribute("cellpadding", "0");
  this.table_.setAttribute("cellspacing", "0");
  this.table_.attachTo(this);

  this.rows_ = new Array();

  for (var i = 0; i < disk_count; i++) {
    var tr = document.createElement("TR");
    var column = new Array();
    for (var j = 0; j < pegs; j++) {
      var row = new hanoi.Element("TD", tr);
      row.attachTo(tr);
      column.push(row);
    }
    this.rows_.unshift(column);
    this.table_.appendChild(tr);
  }
};

hanoi.inherits(hanoi.TableState, hanoi.GameState);

hanoi.TableState.prototype.handle_click = function (e) {
  if (!this.restore_handler_) {
    return ;
  }
  this.restore_handler_.call(undefined, this);
};

hanoi.TableState.prototype.getIndex = function () {
  return this.index_;
};

hanoi.TableState.prototype.set = function (peg_index, disk_position, disk_id) {
  
  var disk_id_str = "";
  if (disk_id) {
    disk_id_str = new String(disk_id);
  }
  this.rows_[disk_position][peg_index].setText(disk_id_str);
};

hanoi.UndoBuffer = function (peg_count, disk_count, restore_handler) {
  hanoi.Element.call(this);
  this.create("DIV");
  this.setClass("Logger");

  this.peg_count_ = peg_count;
  this.disk_count_ = disk_count;
  this.restore_handler_ = restore_handler || null;
  this.current_state_index_ = 0;
  this.states_ = new Array();
  
};

hanoi.inherits(hanoi.UndoBuffer, hanoi.Element);

hanoi.UndoBuffer.prototype.checkpoint = function (state) {
  if (this.states_.length != this.current_state_index_ + 1) {
    while (this.states_.length > this.current_state_index_ + 1) {
      var removed_state = this.states_.pop();
      removed_state.destroy();
    }
  }
  this.current_state_index_ = this.states_.length;
  var restore_handler = hanoi.thisCall(this, this.handleRestore);
  var saved_state = new hanoi.TableState(this.peg_count_, this.disk_count_,
    this.current_state_index_, restore_handler);
  saved_state.load(state);
  saved_state.attachTo(this);
  this.states_.push(saved_state);
};

hanoi.UndoBuffer.prototype.bufferSize = function () {
  return this.states_.length;
};

hanoi.UndoBuffer.prototype.handleRestore = function (state) {
  if (!this.restore_handler_) {
    return ;
  }
  this.current_state_index_ = state.getIndex();
  this.restore_handler_.call(undefined, state);
};

hanoi.Timer = function (parent) {
  hanoi.Element.call(this);

  this.timer_ = null;
  this.started_time_ = null;

  this.create("DIV");
  this.setClass("Timer");
};

hanoi.inherits(hanoi.Timer, hanoi.Element);

hanoi.Timer.prototype.startTimer = function () {
  this.stopTimer();
  this.timer_ = setInterval(hanoi.thisCall(this, this.update), 500);
  this.started_time_ = new Date().getTime();
};

hanoi.Timer.prototype.stopTimer = function () {
  if (this.timer_ == null) {
    return ;
  }
  this.update();
  clearInterval(this.timer_);
  this.timer_ = null;
};

hanoi.Timer.prototype.destroy = function () {
  hanoi.Timer.superClass_.destroy.call(this);
  this.stopTimer();
};

hanoi.Timer.prototype.update = function () {
  var elapsed = new Date().getTime() - this.started_time_;
  var seconds = parseInt(elapsed / 1000) % 60,
      minutes = parseInt(elapsed / 60000);
  var str = hanoi.pad(minutes, 2) + ":" + hanoi.pad(seconds, 2);
  this.setText(str);
};

hanoi.Game = function (element_id, lang, pegs, initial_peg_index, disk_count) {
  hanoi.GameState.call(this, undefined, pegs, disk_count);
  this.create("DIV");
  this.setClass("Hanoi");
  if (element_id) {
    this.attachTo(element_id);
  }
  var restore_handler = hanoi.thisCall(this, this.handleRestore);

  this.towers_ = new Array(pegs);
  this.disk_ghost_ = new hanoi.DiskGhost();
  this.undo_buffer_ = new hanoi.UndoBuffer(pegs, disk_count, restore_handler);
  this.solve_timer_ = null;
  this.solve_step_ = 0;

  this.lang_ = lang;

  /**
   * The victory/loss message element
   * @type {hanoi.Element}
   * @private
   */
  this.end_message_ = new hanoi.Element("SPAN", this);

  /**
   * Index of first selected tower
   * -1 for no selection.
   * @type {Number}
   * @private
   */
  this.selected_tower_id_ = -1;

  /**
   * Minimum movements 2n - 1
   * @type {Number}
   * @private
   */
  this.min_movements_ = Math.pow(2, disk_count) - 1;

  /**
   * @type {hanoi.Timer}
   * @private
   */
  this.timer_ = new hanoi.Timer();

  /**
   * @type {Boolean}
   * @private
   */
  this.game_started_ = false;

  this.initial_peg_index_ = initial_peg_index;

  this.end_message_.display("none");
  this.disk_ghost_.attachTo(this);
  this.timer_.attachTo(this);
  //this.disk_ghost_.hide();
  var tower_select_handler = hanoi.thisCall(this,
    this.handleSelectTower);
  for (var i = 0; i < pegs; i++) {
    var tower = new hanoi.Tower(this, disk_count, i,
      tower_select_handler);
    this.towers_[i] = tower;
  }
  this.undo_buffer_.attachTo(this);

  this.init(initial_peg_index, disk_count);
  this.undo_buffer_.checkpoint(this);
};

hanoi.inherits(hanoi.Game, hanoi.GameState);

hanoi.Game.prototype.destroy = function () {
  hanoi.Game.superClass_.destroy.call(this);
  this.stopSolve();
};

hanoi.Game.prototype.getLocalizedMessage = function (key) {
  var lang = this.lang_;
  if (!hanoi.Localization[lang]) {
    lang = this.default_lang_;
    if (!hanoi.Localization[lang]) {
      return "";
    }
  }
  if (!hanoi.Localization[lang][key]) {
    lang = this.default_lang_;
  }
  if (!hanoi.Localization[lang][key]) {
    return "";
  }
  return hanoi.Localization[lang][key];
};

hanoi.Game.prototype.set = function (peg_index, disk_position, disk_id) {
  this.towers_[peg_index].setDiskIdentifier(disk_position, disk_id);
};

hanoi.Game.prototype.onMove = function (source_peg, dest_peg, source_position, dest_position) {
  var disk1 = this.towers_[source_peg].getDisk(source_position),
      disk2 = this.towers_[dest_peg].getDisk(dest_position);
  if (this.disk_ghost_.isAnimationPlaying()) {
    this.disk_ghost_.stop();
  }
  this.disk_ghost_.setIdentifier(disk2.getId());
  var self = this;
  var end_effect = function () {
    disk2.show();
    self.disk_ghost_.hide();
  };
  this.disk_ghost_.start(hanoi.Effects.diskMotion(disk1, disk2), 500, end_effect);
  disk2.hide();
  this.undo_buffer_.checkpoint(this);
  if ((this.undo_buffer_.bufferSize() - 1) == this.min_movements_) {
    var victory = this.isComplete();
    var end_message_text, end_message_class;

    if (!victory) {
      end_message_class = "LoseMessage";
      end_message_text = this.getLocalizedMessage("LOSE_GAME");
    }
    else {
      end_message_class = "WinMessage";
      end_message_text = this.getLocalizedMessage("WIN_GAME");
    }
    this.end_message_.start(hanoi.Effects.endEffect, 750);
    this.end_message_.setClass("EndMessage " + end_message_class);
    this.end_message_.setText(end_message_text);
    this.end_message_.display("inline");
    this.stopSolve();
    this.timer_.stopTimer();
  }
  else {
    this.end_message_.display("none");
  }
  if (!this.game_started_) {
    this.timer_.startTimer();
    this.game_started_ = true;
  }
};

hanoi.Game.prototype.handleRestore = function (state) {
  this.stopSolve();
  this.load(state);
  this.end_message_.display("none");
};

hanoi.Game.prototype.handleSelectTower = function (tower_id) {
  if (this.selected_tower_id_ == tower_id) {
    /* Unselect */
    this.unselectTower();
    return ;
  }
  else if (!this.isTowerSelected()) {
    /* Select */
    this.selectTower(tower_id);
  }
  else {
    /* Move */
    this.stopSolve();
    this.exchange(this.selected_tower_id_, tower_id);
    this.unselectTower();
  }
};

hanoi.Game.prototype.isTowerSelected = function () {
  return this.selected_tower_id_ != -1;
};

hanoi.Game.prototype.selectTower = function (tower_id) {
  if (tower_id >= this.towers_.length) {
    return false;
  }
  this.unselectTower();
  this.towers_[tower_id].select();
  this.selected_tower_id_ = tower_id;
};

hanoi.Game.prototype.unselectTower = function () {
  if (this.selected_tower_id_ == -1) {
    return false;
  }
  this.towers_[this.selected_tower_id_].unselect();
  this.selected_tower_id_ = -1;
};

hanoi.Game.prototype.isComplete = function () {
  for (var i = 0; i < this.pegs_.length; i++) {
    if (this.pegs_[i].length == this.disk_count_) {
      return this.initial_peg_index_ != i;
    }
  }
  return false;
};

hanoi.Game.prototype.solve = function () {
  this.stopSolve();
  this.solve_step_ = 0;
  this.solve_timer_ = setInterval(hanoi.thisCall(this, this.solveStep), 670);
};

hanoi.Game.prototype.stopSolve = function () {
  if (this.solve_timer_ == null) {
    return ;
  }
  clearInterval(this.solve_timer_);
  this.solve_timer_ = null;
};

hanoi.Game.prototype.solveStep = function () {
  var columns;
  switch (this.initial_peg_index_) {
  case 0:
    columns = [ 0, 1, 2 ];
    break ;
  case 1:
    columns = [ 1, 0, 2 ];
    break ;
  case 2:
    columns = [ 2, 1, 0 ];
    break ;
  }
  var m = this.solve_step_ % 3;
  switch (m) {
  case 0:
    this.exchange(columns[0], columns[1]); /* A and B */
    break ;
  case 1:
    this.exchange(columns[0], columns[2]); /* A and C */
    break ;
  case 2:
    this.exchange(columns[1], columns[2]); /* B and C */
    break ;
  }
  this.solve_step_++;
};
