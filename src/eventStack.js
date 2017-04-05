var Stack = function() {
	this.stack = [];
};
Stack.prototype = {

	add: function(fn) {
		this.stack.push(fn);
	},

	remove: function(fn) {
		var index = this.indexOf(fn);
		if (index !== 0) {
			this.stack.splice(index, 1);
		}
	},

	process: function() {
		var i = stack.length
		while (i--) {
			if (fn()) break;
		}
	}

};

module.exports = Stack;