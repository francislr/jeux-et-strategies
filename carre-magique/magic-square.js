
ms = {};

/**f
 * Inherit the prototype methods from one constructor into another.
 * Taken from the Google Closure Library.
 * @param {Function} child Child class.
 * @param {Function} parent Parent class.
 */
ms.inherits = function (child, parent) {
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
ms.setClass = function (element, className) {
  if (element.className) {
    element.className = className;
  }
  else {
    element.setAttribute("class", className);
  }
};

/**
 * A 2 dimensional array, displayed as a DOM table.
 * @param {number=} size The size of the grid, in case unit.
 * @constructor
 */
ms.MagicSquareMatrix = function (size) {
  /**
   * The 2 dimensional array used to store the numbers.
   * @type {?Array.<Array.<?number>>}
   * @private
   */
  this.grid_ = null;

  /**
   * The size of the grid, in block unit
   * @type {?number}
   * @private
   */
  this.grid_size_ = null;

  /**
   * The constant sum of the magic square
   * @type {?number}
   * @private
   */
  this.constant_sum_ = null;

  /**
   * Array to keep track of the assignement of numbers
   * @type {?Array.<boolean>}
   * @private
   */
  this.grid_assignement_ = null;

  /**
   * The root element
   * @type {Element}
   * @private
   */
  this.element_ = document.createElement("DIV");

  /**
   * The title element
   * @type {Element}
   * @private
   */
  this.title_ = document.createElement("H3");

  /**
   * The text node of the title element
   * @type {Text}
   * @private
   */
  this.title_node_ = document.createTextNode("");

  /**
   * The DOM element of the table
   * @type {Element}
   * @private
   */
  this.table_ = null;

  /**
   * The control container element
   * @type {Element}
   * @private
   */
  this.controls_ = document.createElement("DIV");

  /**
   * The clear button
   * @type {Element}
   * @private
   */
  this.clear_button_ = document.createElement("BUTTON");

  /**
   * The solve button
   * @type {Element}
   * @private
   */
  this.solve_button_ = document.createElement("BUTTON");

  /**
   * Completion status element
   * @type {Element}
   * @private
   */
  this.status_ = document.createElement("SPAN");

  /**
   * Completion status text node
   * @type {Text}
   * @private
   */
  this.status_text_ = document.createTextNode("");

  ms.setClass(this.element_, "MagicSquare");
  ms.setClass(this.title_, "MagicSquareTitle");
  ms.setClass(this.controls_, "MagicSquareControls");
  ms.setClass(this.clear_button_, "button");
  ms.setClass(this.solve_button_, "button");
  this.title_.appendChild(this.title_node_);
  this.status_.appendChild(this.status_text_);
  this.element_.appendChild(this.title_);
  this.controls_.appendChild(this.clear_button_);
  this.controls_.appendChild(this.solve_button_);
  this.controls_.appendChild(this.status_);
  this.element_.appendChild(this.controls_);
  this.clear_button_.appendChild(document.createTextNode("Effacer"));
  this.solve_button_.appendChild(document.createTextNode("Résoudre"));

  var self = this;
  /* addEventListener doesn't work in Internet Explorer */
  this.clear_button_.onclick = function (e) {
    self.clearGrid();
  };
  this.solve_button_.onclick = function (e) {
    self.solve();
  };

  if (size) {
    this.createGrid(size);
  }
  this.updateTitle_();
  this.updateStatus_();
};

/**
 * The validity states of the magic square
 * @enum {number}
 * @const
 */
ms.ValidityState = {
  VALID: 0,       /* The sum of all lines give the magic number */
  INVALID: 1,     /* There is at least one line that doesn't sum up to magic number */
  INCOMPLETE: 2,   /* The grid is incomplete */
  ERROR: -1
};

/**
 * Returns if the grid has been created.
 * @return {boolean}
 * @private
 */
ms.MagicSquareMatrix.prototype.hasGrid_ = function () {
  return this.grid_ != null && this.grid_assignement_ != null;
};

/**
 * Returns if the table element has been created.
 * @return {boolean}
 * @private
 */
ms.MagicSquareMatrix.prototype.hasTable_ = function () {
  return this.table_ != null && this.hasGrid_();
};

/**
 * Checks if the number is whitin the allowed range.
 * @param {number} value The number
 * @return {boolean}
 * @private
 */
ms.MagicSquareMatrix.prototype.isNumberAllowed_ = function (value) {
  if (!this.hasGrid_()) {
    return false;
  }
  return typeof value == "number" &&
         value > 0 &&
         value <= this.grid_assignement_.length;
};

/**
 * Checks if the number has already been set.
 * @param {number} value The number
 * @return {number}
 * @private
 */
ms.MagicSquareMatrix.prototype.isNumberAssigned_ = function (value) {
  if (!this.isNumberAllowed_(value)) {
    return false;
  }
  return this.grid_assignement_[value];
};

/**
 * Checks if the magic square is respected.
 * @return {ms.ValidityState}
 */
ms.MagicSquareMatrix.prototype.isMagicSquareValid = function () {
  if (!this.hasGrid_()) {
    return ms.ValidityState.ERROR;
  }
  for (i = 1; i < this.grid_assignement_.length; i++) {
    if (!this.grid_assignement_[i]) {
      return ms.ValidityState.INCOMPLETE;
    }
  }
  var sum;
  /* Checks the sum of the horizontal lines */
  for (var y = 0; y < this.grid_.length; y++) {
    var cols = this.grid_[y];
    sum = 0;
    for (var x = 0; x < cols.length; x++) {
      sum += cols[x];
    }
    if (sum != this.constant_sum_) {
      return ms.ValidityState.MISTAKE;
    }
  }
  /* Checks the sum of the vertical lines */
  for (var x = 0; x < this.grid_size_; x++) {
    sum = 0;
    for (var y = 0; y < this.grid_size_; y++) {
      sum += this.grid_[y][x];
    }
    if (sum != this.constant_sum_) {
      return ms.ValidityState.MISTAKE;
    }
  }
  /* Checks the sum of the diagonal lines */
  sum = 0;
  for (var xy = 0; xy < this.grid_size_; xy++) {
    sum += this.grid_[xy][xy];
  }
  if (sum != this.constant_sum_) {
    return ms.ValidityState.MISTAKE;
  }
  sum = 0;
  for (var xy = 0; xy < this.grid_size_; xy++) {
    sum += this.grid_[this.grid_size_ - xy - 1][xy];
  }
  if (sum != this.constant_sum_) {
    return ms.ValidityState.MISTAKE;
  }
  return ms.ValidityState.VALID;
};

/**
 * Get the input element from the table by its position.
 * @param {number} x The position of the column
 * @param {number} y The position of the row
 * @return {?Element}
 * @private
 */
ms.MagicSquareMatrix.prototype.getColumnElement_ = function (x, y) {
  if (!this.hasTable_()) {
    return null;
  }
  var rows = this.table_.getElementsByTagName("TR");
  if (y >= rows.length) {
    return null;
  }
  var row = rows.item(y);
  var cols = row.getElementsByTagName("TD");
  if (x >= cols.length) {
    return null;
  }
  var column = cols.item(x);
  var inputs = column.getElementsByTagName("INPUT");
  if (inputs.length != 1) {
    return null;
  }
  return inputs.item(0);
};

/**
 * Sets the assignement status of the number
 * @param {number} value
 * @param {boolean} status
 * @return {boolean}
 * @private
 */
ms.MagicSquareMatrix.prototype.setAssignement_ = function (value, status) {
  if (!this.hasGrid_()) {
    return false;
  }
  if (value >= this.grid_assignement_.length) {
    return false;
  }
  this.grid_assignement_[value] = status;
};

/**
 * Clear the grid number
 * @return {boolean}
 * @public
 */
ms.MagicSquareMatrix.prototype.clearGrid = function () {
  if (!this.hasGrid_()) {
    return false;
  }
  for (var y = 0; y < this.grid_.length; y++) {
    for (var x = 0; x < this.grid_[y].length; x++) {
      this.setValue(x, y, null);
    }
  }
  this.updateStatus_();
  return true;
};

/**
 * Called by the event handler when an input has
 * lost the focus.
 * @param {number} x
 * @param {number} y
 * @param {Element} element The input element
 * @private
 */
ms.MagicSquareMatrix.prototype.handleLostFocus_ = function (x, y, element) {
  var old_value = this.getValue(x, y),
      new_value = element.value;
  /* Convert the new value string to integer */
  new_value = parseInt(new_value);
  var accept_value = true;
  if (this.isNumberAssigned_(new_value)) {
    this.setValue(x, y, null);
    if (!this.changeValue(new_value, old_value)) {
      accept_value = false;
    }
  }
  if (new_value == Number.NaN ||
      !this.isNumberAllowed_(new_value))
  {
    accept_value = false;
  }
  if (!accept_value) {
    var value_str = "";
    if (old_value != null) {
      value_str = new String(old_value);
    }
    element.value = value_str;
    return ;
  }
  this.setValue(x, y, new_value);
  this.updateStatus_();
};

/**
 * Set the text of the title element
 * @private
 */
ms.MagicSquareMatrix.prototype.updateTitle_ = function () {
  var title_text = "Carré Magique";
  if (this.grid_size_) {
    title_text += " " + this.grid_size_ + "x" + this.grid_size_;
  }
  if (this.constant_sum_) {
    title_text += " (" + this.constant_sum_ + ")";
  }
  this.title_node_.data = title_text;
};

/**
 * Set the text of the status element
 * @private
 */
ms.MagicSquareMatrix.prototype.updateStatus_ = function () {
  var validity_state = this.isMagicSquareValid();
  var status_text = "",
      status_class = "";
  switch (validity_state) {
  case ms.ValidityState.INCOMPLETE:
    status_text = "Incomplet";
    status_class = "IncompleteStatus";
    break ;
  case ms.ValidityState.MISTAKE:
    status_text = "Incorrect";
    status_class = "MistakeStatus";
    break ;
  case ms.ValidityState.VALID:
    status_text = "Valide";
    status_class = "ValidStatus";
    break ;
  }
  ms.setClass(this.status_, "MagicSquareStatus " + status_class);
  this.status_text_.data = status_text;
};

/**
 * Initialize the data grid
 * @public
 */
ms.MagicSquareMatrix.prototype.createGrid = function (size) {
  this.grid_size_ = size;
  this.grid_ = new Array(size);

  /* Fill the array to default values */
  for (var y = 0; y < size; y++) {
    this.grid_[y] = new Array(size);
    var column = this.grid_[y];
    for (var x = 0; x < size; x++) {
      column[x] = null;
    }
  }

  this.grid_assignement_ = new Array((size * size) + 1);
  for (var i = 0; i < this.grid_assignement_.length; i++) {
    this.grid_assignement_[i] = false;
  }
  this.constant_sum_ = ((size * size * size) + size) / 2;
  this.updateTitle_();
};

/**
 * Creates the DOM table
 * @public
 */
ms.MagicSquareMatrix.prototype.createTableElement = function () {
  var table = document.createElement("TABLE");
  table.className = "MagicSquareMatrix";
  table.setAttribute("class", "MagicSquareMatrix");
  table.setAttribute("border", "0");
  table.setAttribute("cellpadding", "0");
  table.setAttribute("cellspacing", "0");
  //table.setAttribute("");
  this.element_.appendChild(table);
  this.table_ = table;
};

/**
 * Add or remove rows and columns from the table.
 */
ms.MagicSquareMatrix.prototype.initTableElement = function () {
  if (!this.hasGrid_()) {
    return ;
  }
  if (!this.hasTable_()) {
    this.createTableElement();
  }
  var rows = this.table_.getElementsByTagName("TR");
  /* Remove all rows from table */
  while (rows.length > 0) {
    var row = rows.item(0);
    row.parentNode.removeChild(row);
  }
  /* Add rows */
  for (var y = rows.length; y < this.grid_size_; y++) {
    var tr = document.createElement("TR");
    this.table_.appendChild(tr);
  }
  rows = this.table_.getElementsByTagName("TR");
  for (var y = 0; y < rows.length; y++) {
    /* Remove extra columns from rows */
    var row = rows[y];
    var cols = row.getElementsByTagName("TD");
    /* Add columns */
    for (var x = cols.length; x < this.grid_size_; x++) {
      var td = document.createElement("TD"),
          input = document.createElement("INPUT");
      input.className = "NumberEntry";
      input.setAttribute("class", "NumberEntry");
      var self = this;
      var fn = (function (x, y) {
        return function (e) {
          e = e || window.event;
          var element = e.srcElement || e.target;
          self.handleLostFocus_(x, y, element);
        }
      })(x, y);
      input.onblur = fn;
      td.appendChild(input);
      row.appendChild(td);
    }
  }
  this.updateStatus_();
};

ms.MagicSquareMatrix.prototype.setValue = function (x, y, value) {
  if (!this.hasGrid_()) {
    return false;
  }
  if (value != null && this.isNumberAssigned_(value)) {
    return false;
  }
  var old_value = this.getValue(x, y);
  if (old_value != null) {
    this.setAssignement_(old_value, false);
  }
  if (y >= this.grid_.length) {
    return false;
  }
  var cols = this.grid_[y];
  if (x >= cols.length) {
    return false;
  }
  cols[x] = value;
  if (value != null) {
    this.setAssignement_(value, true);
  }
  if (this.hasTable_()) {
    var column = this.getColumnElement_(x, y);
    if (column == null) {
      return false;
    }
    var str_value = new String(value);
    if (value == null) {
      str_value = "";
    }
    column.value = str_value;
  }
  return true;
};

ms.MagicSquareMatrix.prototype.changeValue = function (value, new_value) {
  if (!this.hasGrid_()) {
    return false;
  }
  for (var y = 0; y < this.grid_.length; y++) {
    var cols = this.grid_[y];
    for (var x = 0; x < cols.length; x++) {
      if (cols[x] == value) {
        return this.setValue(x, y, new_value);
      }
    }
  }
  return false;
};

/**
 * Get a number from the data array
 * @param {number} x The position of the column
 * @param {number} y The position of the row
 * @return {?number}
 * @public
 */
ms.MagicSquareMatrix.prototype.getValue = function (x, y) {
  if (!this.hasGrid_()) {
    return null;
  }
  if (y >= this.grid_.length) {
    return null;
  }
  var rows = this.grid_[y];
  if (x >= rows.length) {
    return null;
  }
  return rows[x];
};

ms.MagicSquareMatrix.prototype.solve = function () {
  if (!this.hasGrid_()) {
    return false;
  }
  this.clearGrid();
  var result = false;
  var odd = this.grid_size_ % 2 == 1,
      mul4 = this.grid_size_ % 4 == 0;
  if (odd) {
    result = this.solveOdd();
  }
  else { /* Even */
    if (mul4) {
      result = this.solveMul4();
    }
  }
  this.updateStatus_();
  return result;
};

/**
 * Solve the puzzle with the odd trick
 */
ms.MagicSquareMatrix.prototype.solveOdd = function () {
  if (!this.hasGrid_()) {
    return false;
  }
  /* Check the parity */
  if ((this.grid_size_ % 2) != 1) {
    return false;
  }
  this.clearGrid();
  var y = parseInt(this.grid_size_ / 2),
      x = 0;
  var i = 1;
  do {
    if (!this.setValue(x, y, i)) {
      break ;
    }
    i++;
    var next_x = (x + 2) % this.grid_size_,
        next_y = (y - 1) % this.grid_size_;
    if (next_x < 0) {
      next_x += this.grid_size_;
    }
    if (next_y < 0) {
      next_y += this.grid_size_;
    }
    if (this.getValue(next_x, next_y)) {
      next_x = (x + 1) % this.grid_size_;
      next_y = y;
      if (this.getValue(next_x, next_y)) {
        break ;
      }
    }
    x = next_x,
    y = next_y;
  } while (1);
  return true;
};

ms.MagicSquareMatrix.prototype.solveMul4 = function () {
  if (!this.hasGrid_()) {
    return false;
  }
  /* Fill the tempoary grid by incrementing the number */
  var number_grid = new Array(this.grid_size_);
  var i = 1;
  for (var y = 0; y < this.grid_size_; y++) {
    number_grid[y] = new Array(this.grid_size_);
    for (var x = 0; x < this.grid_size_; x++) {
      number_grid[y][x] = i;
      i++;
    }
  }

  var change_number = [
    true,  false, false, true,
    false, true,  true,  false,
    false, true,  true,  false,
    true,  false, false, true
  ];
  var number_total = this.grid_size_ * this.grid_size_ + 1;
  for (var base_y = 0; base_y < this.grid_size_; base_y += 4) {
    for (var base_x = 0; base_x < this.grid_size_; base_x += 4) {
      for (var n = 0; n < 16; n++) {
        var change = change_number[n];
        var x = (n % 4) + base_x,
            y = parseInt(n / 4) + base_y;
        var value = number_grid[y][x];
        if (!value) {
          break ;
        }
        if (change) {
          value = number_total - value;
        }
          this.setValue(x, y, value);
      }
    }
  }
};

/**
 * Append the root element to an element.
 * @param {Element} element The DOM element to append to.
 */
ms.MagicSquareMatrix.prototype.appendTo = function (element) {
  if (typeof element == "string") {
    element = document.getElementById(element);
  }
  if (!this.table_) {
    this.createTableElement();
  }
  element.appendChild(this.element_);
};

window['ms'] = ms;