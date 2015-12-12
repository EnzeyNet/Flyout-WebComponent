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

},{"./flyout-prototype":3}],2:[function(require,module,exports){
var Helpers = require('./helpers');

var EventsBinder = function (flyoutElem) {

	var events = this;

	var processMouseMove = function (flyoutElem, event) {
		var mX = event.clientX;
		var mY = event.clientY;
		var flyoutAnchorElemPos = Helpers.getBoxData(flyoutElem.flyoutAlignedToElem);

		var aL = flyoutAnchorElemPos.left;
		var aR = aL + flyoutAnchorElemPos.width;
		var aT = flyoutAnchorElemPos.top;
		var aB = aT + flyoutAnchorElemPos.height;

		var isOutsideAncher = false;
		if (mX < aL || mX > aR || mY < aT || mY > aB) {
			isOutsideAncher = true;
		}

		var isOutsideContainer = false;
		var flyoutContainerPos = Helpers.getBoxData(flyoutElem.flyoutContainer);

		var cL = flyoutContainerPos.left;
		var cR = cL + flyoutContainerPos.width;
		var cT = flyoutContainerPos.top;
		var cB = cT + flyoutContainerPos.height;

		if (mX < cL || mX > cR || mY < cT || mY > cB) {
			isOutsideContainer = true;
		}

		if (isOutsideAncher && isOutsideContainer) {
			flyoutElem.unbindEvents();
			flyoutElem.close();
			flyoutElem.parentElement.addEventListener('mouseover', events.watchMouseOver);
		}
	};

	this.watchMouseOver = function (event) {
		flyoutElem.unbindEvents();
		flyoutElem.displayFlyout();
		if (!flyoutElem.getFlyoutParent()) {
			document.body.addEventListener('mousemove', events.watchMouseMove);
		}
	};

	this.watchMouseMove = function (event) {
		var flyoutChild = this.getFlyoutChild();
		if (flyoutChild) {
			events.watchMouseMove.call(flyoutChild, event);
		}

		if (flyoutElem.isActive() && (!flyoutChild || !flyoutChild.isActive())) {
			processMouseMove(this, event);
		}
	};

	this.clickEvent = function (event) {
		EnzeyNet.Services.registerClickAwayAction(flyoutElem.close, flyoutElem.flyoutContainer, flyoutElem.parentElement);

		flyoutElem.displayFlyout();
	};
};

module.exports = EventsBinder;
/*
module.exports = function(bindable) {
	var boundClones = {};
	Object.keys(events).forEach(function(key) {
		var fn = events[key];
		boundClones[key] = fn.bind(bindable)
	})

	return boundClones;
};

module.exports = events;
*/

},{"./helpers":4}],3:[function(require,module,exports){
var EventsBinder = require('./events');
var Helpers = require('./helpers');

var flyoutComponent = function () {
	// expect Array.prototype.forEach
	// expect Array.prototype.map
};
var flyoutProto = flyoutComponent.prototype;

flyoutProto.registerScrollEvent = function (elem) {
	var flyoutElem = this;
	var wrappedScrollEvent = function () {
		if (flyoutElem.isActive()) {
			flyoutElem.positionFlyout(flyoutElem.flyoutAlignedToElem);
		} else {
			elem.removeEventListener('scroll', wrappedScrollEvent);
		}
	};
	flyoutElem.watchedElements.push({
		elem: elem,
		fn: wrappedScrollEvent
	});
	elem.addEventListener('scroll', wrappedScrollEvent);
};

flyoutProto.removeScrollEvents = function () {
	var flyoutElem = this;
	if (flyoutElem.watchedElements) {
		flyoutElem.watchedElements.forEach(function (group) {
			group.elem.removeEventListener('scroll', group.fn);
		});
	}
	flyoutElem.watchedElements = [];
};

flyoutProto.getPositioningKeys = function () {
	return {
		attributes: [],
		classes: ['flyout-against']
	};
};

flyoutProto.findParentToPositionAgainst = function () {
	var flyoutElem = this;
	var positionAgainstElem;
	if (true) {
		// Get things to check for on parent.
		var positioningKeys = flyoutElem.getPositioningKeys();
		if (positioningKeys.attributes) {
			var clone = positioningKeys.attributes.slice(0);
			clone.map(function (attr) {
				return 'data-' + attr;
			}).forEach(function (attr) {
				positioningKeys.attributes.push(attr);
			});
		}

		// Transverse DOM looking for element to position against.
		var searchParentElem = flyoutElem.parentElement;
		while (searchParentElem && !positionAgainstElem) {
			if (positioningKeys.classes instanceof Array) {
				positioningKeys.classes.forEach(function (someClass) {
					if (!positionAgainstElem) {
						if (searchParentElem.classList.contains(someClass)) {
							positionAgainstElem = searchParentElem;
						}
					}
				});
			}
			if (positioningKeys.attributes instanceof Array) {
				positioningKeys.attributes.forEach(function (someAttribute) {
					if (!positionAgainstElem) {
						if (searchParentElem.attributes[someAttribute]) {
							positionAgainstElem = searchParentElem;
						}
					}
				});
			}

			searchParentElem = searchParentElem.parentElement;
		}
	}
	if (!positionAgainstElem) {
		positionAgainstElem = flyoutElem.parentElement;
	}

	return positionAgainstElem;
};

flyoutProto.createdCallback = function () {
	var flyoutId = this.getAttribute('id');
	if (!flyoutId) {
		flyoutId = 'f' + Date.now();
		this.setAttribute('id', flyoutId);
	}
	this.flyoutTempalte = this.innerHTML;
	this.innerHTML = '';
	this.watchedElements = [];

	this.displayFlyout = this.displayFlyout.bind(this);
	this.positionFlyout = this.positionFlyout.bind(this);
	this.unbindEvents = this.unbindEvents.bind(this);
	this.close = this.close.bind(this);
	this.clearTimers = this.clearTimers.bind(this);
	this.isActive = this.isActive.bind(this);
	this.EVENTS = new EventsBinder(this);

	var flyoutElem = this;
	(function () {
		var flyoutParent = null;
		flyoutElem.setFlyoutParent = function (elem) {
			flyoutParent = elem;
		};
		flyoutElem.getFlyoutParent = function (elem) {
			return flyoutParent;
		};
	})();
	(function () {
		var flyoutChild = null;
		flyoutElem.setFlyoutChild = function (elem) {
			flyoutChild = elem;
		};
		flyoutElem.getFlyoutChild = function (elem) {
			return flyoutChild;
		};
	})();
};

flyoutProto.attachedCallback = function () {
	// Process element attributes
	this.attributeChangedCallback('flyout-on', null, this.getAttribute('flyout-on'));
};

flyoutProto.detachedCallback = function () {
	// Process element attributes
	this.attributeChangedCallback('flyout-on', this.getAttribute('flyout-on'), null);
};

flyoutProto.attributeChangedCallback = function (name, oldValue, newValue) {
	if (name === 'flyout-on') {
		if (newValue) {
			this.bindFlyoutAction(newValue, oldValue);
		}
	}
};

flyoutProto.isActive = function () {
	if (this.flyoutAlignedToElem && this.flyoutContainer) {
		return true;
	};
	return false;
};

flyoutProto.bindFlyoutAction = function (newValue, oldValue) {
	var flyoutElem = this;
	flyoutElem.unbindEvents();
	if (typeof newValue === 'string') {
		newValue = newValue.split(' ');
		if (newValue.indexOf('click') >= 0) {
			flyoutElem.parentElement.addEventListener('click', flyoutElem.EVENTS.clickEvent);
		} else if (newValue.indexOf('hover') >= 0) {
			flyoutElem.parentElement.addEventListener('mouseover', flyoutElem.EVENTS.watchMouseOver);
		}
	}
};

flyoutProto.unbindEvents = function () {
	var flyoutElem = this;

	flyoutElem.parentElement.removeEventListener('click', flyoutElem.EVENTS.clickEvent);
	flyoutElem.parentElement.removeEventListener('mouseover', flyoutElem.EVENTS.watchMouseOver);
	document.body.removeEventListener('mousemove', flyoutElem.EVENTS.watchMouseMove);
};

flyoutProto.clearTimers = function () {
	if (this.pendingRenderActions) {
		window.cancelAnimationFrame(this.pendingRenderActions.animationFrame);
		window.clearTimeout(this.pendingRenderActions.timeout);
	}
	this.pendingRenderActions = {};
};
flyoutProto.close = function () {
	var flyoutElem = this;

	flyoutElem.unlinkFlyouts();
	flyoutElem.clearTimers();
	flyoutElem.flyoutContainer.parentElement.removeChild(flyoutElem.flyoutContainer);
	flyoutElem.removeScrollEvents();
	flyoutElem.flyoutContainer = null;
	flyoutElem.flyoutAlignedToElem = null;
};

flyoutProto.displayFlyout = function () {
	var flyoutElem = this;

	flyoutElem.clearTimers();
	this.linkFlyouts();
	flyoutElem.flyoutAlignedToElem = this.findParentToPositionAgainst();

	flyoutElem.pendingRenderActions.animationFrame = window.requestAnimationFrame(function () {
		if (!flyoutElem.flyoutContainer) {
			flyoutElem.flyoutContainer = document.createElement('div');
			flyoutElem.flyoutContainer.innerHTML = flyoutElem.flyoutTempalte;

			var iframeShim = document.createElement('iframe');
			iframeShim.classList.add('shim');
			iframeShim.style.position = 'absolute';
			iframeShim.style.height = '100%';
			iframeShim.style.width = '100%';
			iframeShim.style.top = 0;
			iframeShim.style.left = 0;
			iframeShim.style.border = 'none';

			EnzeyNet.Services.prepend(flyoutElem.flyoutContainer, iframeShim);

			window.document.body.appendChild(flyoutElem.flyoutContainer);

			flyoutElem.flyoutContainer.style.position = 'fixed';
			flyoutElem.flyoutContainer.style.top = '0';
			elemLeft = '0';
			flyoutElem.flyoutContainer.style.visibility = 'hidden';

			flyoutElem.flyoutContainer.getFlyoutOwner = function () {
				return flyoutElem;
			};
		}

		flyoutElem.pendingRenderActions.timeout = setTimeout(function () {
			// Transverse DOM looking for element to position against.
			var searchParentElem = flyoutElem.flyoutAlignedToElem.parentElement;
			while (searchParentElem) {
				flyoutElem.registerScrollEvent(searchParentElem);
				searchParentElem = searchParentElem.parentElement;
			}
			flyoutElem.registerScrollEvent(document);
			flyoutElem.positionFlyout(flyoutElem.flyoutAlignedToElem);
		}, 0);
	});
};

var extractElemPostion = function (alignMyAttr, alignToAttr) {
	var result = null;
	if (alignMyAttr) {
		if (alignToAttr) {
			var alignMyArray = alignMyAttr.split(' ');
			if (alignMyArray.length !== 2) {
				return;
			}

			var myVerticalPredicate = alignMyArray[0];
			var myHorizontalPredicate = alignMyArray[1];

			var alignToArray = alignToAttr.split(' ');
			if (alignToArray.length !== 2) {
				return;
			}

			var itsVerticalPredicate = alignToArray[0];
			var itsHorizontalPredicate = alignToArray[1];

			result = {
				horizontal: {
					my: myHorizontalPredicate,
					its: itsHorizontalPredicate
				},
				vertical: {
					my: myVerticalPredicate,
					its: itsVerticalPredicate
				}
			};
		}
	}

	return result;
};

var getLeftPos = function (hPos, flyoutContainerPos, flyoutAnchorElemPos) {
	var elemLeft = 0;
	if (hPos.my === 'center') {
		if (hPos.its === 'center') {
			elemLeft = inputPos.left - boxPos.width + 'px';
		} else if (hPos.its === 'left') {
			elemLeft = inputPos.left - boxPos.width + 'px';
		} else if (hPos.its === 'right') {
			elemLeft = inputPos.left - boxPos.width + 'px';
		}
	} else if (hPos.my === 'left') {
		if (hPos.its === 'center') {
			elemLeft = flyoutAnchorElemPos.left + 'px';
		} else if (hPos.its === 'left') {
			elemLeft = flyoutAnchorElemPos.left + 'px';
		} else if (hPos.its === 'right') {
			elemLeft = flyoutAnchorElemPos.left + flyoutAnchorElemPos.width + 'px';
		}
	} else if (hPos.my === 'right') {
		if (hPos.its === 'center') {
			elemLeft = inputPos.left - boxPos.width + 'px';
		} else if (hPos.its === 'left') {
			elemLeft = flyoutAnchorElemPos.left - flyoutContainerPos.width + 'px';
		} else if (hPos.its === 'right') {
			elemLeft = flyoutAnchorElemPos.left - flyoutContainerPos.width + flyoutAnchorElemPos.width + 'px';
		}
	}

	return elemLeft;
};

var getTopPos = function (vPos, flyoutContainerPos, flyoutAnchorElemPos) {
	var elemTop = 0;
	if (vPos.my === 'center') {
		if (vPos.its === 'center') {
			elemTop = inputPos.left - boxPos.width + 'px';
		} else if (vPos.its === 'top') {
			elemTop = inputPos.left - boxPos.width + 'px';
		} else if (vPos.its === 'bottom') {
			elemTop = inputPos.left - boxPos.width + 'px';
		}
	} else if (vPos.my === 'top') {
		if (vPos.its === 'center') {
			elemTop = flyoutAnchorElemPos.left + 'px';
		} else if (vPos.its === 'top') {
			elemTop = flyoutAnchorElemPos.top + 'px';
		} else if (vPos.its === 'bottom') {
			elemTop = flyoutAnchorElemPos.top + flyoutAnchorElemPos.height + 'px';
		}
	} else if (vPos.my === 'bottom') {
		if (vPos.its === 'center') {
			elemTop = inputPos.left - boxPos.width + 'px';
		} else if (vPos.its === 'top') {
			elemTop = flyoutAnchorElemPos.top - flyoutContainerPos.height + 'px';
		} else if (vPos.its === 'bottom') {
			elemTop = flyoutAnchorElemPos.top - flyoutContainerPos.height + flyoutAnchorElemPos.height + 'px';
		}
	}

	return elemTop;
};

flyoutProto.positionFlyout = function (alignToElement) {
	var flyoutElem = this;
	var alignMyAttr = this.getAttribute('align-my');
	var alignToAttr = this.getAttribute('align-to');

	var positioning = extractElemPostion(alignMyAttr, alignToAttr);
	if (positioning) {
		var flyoutAnchorElemPos = Helpers.getBoxData(alignToElement);
		var flyoutContainerPos = Helpers.getBoxData(flyoutElem.flyoutContainer);

		var elemLeft = getLeftPos(positioning.horizontal, flyoutContainerPos, flyoutAnchorElemPos);
		var elemTop = getTopPos(positioning.vertical, flyoutContainerPos, flyoutAnchorElemPos);

		flyoutElem.pendingRenderActions.animationFrame = window.requestAnimationFrame(function () {
			flyoutElem.flyoutContainer.style.left = elemLeft;
			flyoutElem.flyoutContainer.style.top = elemTop;
			flyoutElem.flyoutContainer.style.visibility = 'visible';
		});
	}
};

flyoutProto.findParentFlyout = function () {
	var searchElem = this.parentElement;
	while (searchElem) {
		if (searchElem.getFlyoutOwner) {
			return searchElem.getFlyoutOwner();
		}
		searchElem = searchElem.parentElement;
	}
};

flyoutProto.linkFlyouts = function () {
	var parentFlyout = this.findParentFlyout();
	if (parentFlyout) {
		parentFlyout.setFlyoutChild(this);
		this.setFlyoutParent(parentFlyout);
	}
};

flyoutProto.unlinkFlyouts = function () {
	var parentFlyout = this.getFlyoutChild();
	if (parentFlyout) {
		parentFlyout.setFlyoutChild(null);
	}
	this.setFlyoutParent(null);
};

module.exports = flyoutComponent;

},{"./events":2,"./helpers":4}],4:[function(require,module,exports){
var helpers = {

	getBoxData: function (node) {
		var computedStyles = window.getComputedStyle(node);
		var boxData = node.getBoundingClientRect();
		boxData.marginLeft = parseInt(computedStyles.marginLeft);
		boxData.marginRight = parseInt(computedStyles.marginRight);
		boxData.marginTop = parseInt(computedStyles.marginTop);
		boxData.marginBottom = parseInt(computedStyles.marginBottom);

		return boxData;
	}

};

module.exports = helpers;

},{}]},{},[1]);
