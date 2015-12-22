if (!window.EnzeyNet) {window.EnzeyNet = {};}
if (!EnzeyNet.Services) {EnzeyNet.Services = {};}

EnzeyNet.Services.Eventing = {};
EnzeyNet.Services.Eventing.eventMatchers = {
	'HTMLEvents': {
		isEvent: function(eventName) {
			return /^(?:load|unload|abort|error|select|change|submit|reset|focus|blur|resize|scroll)$/.test(eventName);
		},
		fireEvent: function(element, eventName, options) {
			var oEvent = null;
			if (document.createEvent) {
				oEvent = document.createEvent('HTMLEvents');
				oEvent.initEvent(eventName, options.bubbles, options.cancelable);
				oEvent.flyoutElem = 'foo';
				element.dispatchEvent(oEvent);
			} else {
				options.clientX = options.pointerX;
				options.clientY = options.pointerY;
				var evt = document.createEventObject();
				oEvent = extend(evt, options);
				element.fireEvent('on' + eventName, oEvent);
			}
		}
	},
	'MouseEvents': {
		isEvent: function(eventName) {
			return /^(?:click|dblclick|mouse(?:down|up|over|move|out))$/.test(eventName);
		},
		fireEvent: function(element, eventName, options) {
			var oEvent = null;
			if (document.createEvent) {
				oEvent = document.createEvent('MouseEvents');
				oEvent.initMouseEvent(eventName, options.bubbles, options.cancelable, document.defaultView,
				options.button, options.pointerX, options.pointerY, options.pointerX, options.pointerY,
				options.ctrlKey, options.altKey, options.shiftKey, options.metaKey, options.button, options.element);
				element.dispatchEvent(oEvent);
			} else {
				options.clientX = options.pointerX;
				options.clientY = options.pointerY;
				var evt = document.createEventObject();
				oEvent = extend(evt, options);
				element.fireEvent('on' + eventName, oEvent);
			}
		}
	}
};

EnzeyNet.Services.Eventing.defaultOptions = {
	pointerX: 0,
	pointerY: 0,
	button: 0,
	ctrlKey: false,
	altKey: false,
	shiftKey: false,
	metaKey: false,
	bubbles: true,
	cancelable: true
};

EnzeyNet.Services.dispatchEvent = function(element, eventName) {
	var options = arguments[2] ? arguments[2] : angular.copy(EnzeyNet.Services.Eventing.defaultOptions);
	options.element = options.element ? options.element : element
	var fireEventFn = null;

	var eventMatchers = EnzeyNet.Services.Eventing.eventMatchers;
	for (var name in eventMatchers) {
		if (eventMatchers[name].isEvent(eventName)) {
			fireEventFn = eventMatchers[name].fireEvent;
			break;
		}
	}

	if (!fireEventFn) {
		throw new SyntaxError('Only HTMLEvents and MouseEvents interfaces are supported');
	}

	fireEventFn(element, eventName, options);
};

EnzeyNet.Services.dispatchCustomEvent = function(element, eventName) {
	var options = arguments[2] ? arguments[2] : angular.copy(EnzeyNet.Services.Eventing.defaultOptions);
	options.element = options.element ? options.element : element
	var fireEventFn = EnzeyNet.Services.Eventing.eventMatchers['HTMLEvents'].fireEvent;

	fireEventFn(element, eventName, options);
};

EnzeyNet.Services.prepend = function(parentElem, newChild) {
	var children = parentElem.children;
	if (children.length === 0) {
		parentElem.appendChild(newChild);
	} else {
		parentElem.insertBefore(newChild, children[0]);
	}
};

EnzeyNet.Services.registerClickAwayAction = function(clickAwayAction) {
	var getChildElems = function(elem) {
		if (!elem instanceof HTMLElement) {throw 'must be an HTMLElement';}

		var childElems = [];
		if (elem.children) {
			var children = elem.children;
			for (var i=0; i < children.length; i++) {
				getChildElems(children[i]).forEach(function(childElem) {
					childElems.push(childElem);
				});
			}
		}
		childElems.push(elem);

		return childElems;
	};

	var parentElems = [];
	for (var i = 1; i < arguments.length; i++) {
		parentElems.push(arguments[i]);
	}
	var wrappedClickAwayAction = null;
	wrappedClickAwayAction  = function(event) {
		var allElements = [];
		parentElems.forEach(function(parentElem) {
			getChildElems(parentElem).forEach(function (elem) {
				allElements.push(elem);
			});
		});
		if (allElements.indexOf(event.target) === -1) {
			document.removeEventListener('click', wrappedClickAwayAction);
			clickAwayAction(event);
		}
	};
	setTimeout(function() {
		document.addEventListener('click', wrappedClickAwayAction);
	});
};

EnzeyNet.Services.getJsStyleName = function(styleName) {
	var firstCharacterRegex = new RegExp('^.');
	styleName = styleName.split('-');
	for (var i = 1; i < styleName.length; i++) {
		styleName[i] = styleName[i].replace(firstCharacterRegex, styleName[i][0].toUpperCase());
	}
	return styleName.join('');
};
EnzeyNet.Services.copyComputedStyles = function(toElement, fromElement) {
	var comStyle = window.getComputedStyle(fromElement);
	for (var i = 0; i < comStyle.length; i++) {
		var styleName = EnzeyNet.Services.getJsStyleName(comStyle[i]);
		toElement.style[ styleName ] = comStyle[ styleName ];
	}

	return toElement;
};

//End of file
(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
if (!window.EnzeyNet) {
	window.EnzeyNet = {};
}
EnzeyNet.FlyoutComponent = require('./flyout-prototype');

try {
	EnzeyNet.applyFunctions = function (someElem, someService) {
		for (var f in someService.prototype) {
			if ('function' === typeof someService.prototype[f]) {
				someElem[f] = someService.prototype[f];
			}
		};
	};

	var flyoutElem = Object.create(HTMLElement.prototype);
	EnzeyNet.applyFunctions(flyoutElem, EnzeyNet.FlyoutComponent);

	// IE8 Shims needed Array.forEach, Array.map, HTMLElement.classList
	document.registerElement('fly-out', {
		prototype: flyoutElem
	});
} catch (e) {
	console.error('Could not create flyout webcomponent');
}

},{"./flyout-prototype":2}],2:[function(require,module,exports){

},{}]},{},[1]);
