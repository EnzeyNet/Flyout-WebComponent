var EventsBinder = require('./events');
var Helpers = require('./helpers');
var EventManager = require('./event-manager');

var Flyout = function(flyoutElem) {
	// expect Array.prototype.forEach
	// expect Array.prototype.map

	if (!flyoutElem || !flyoutElem.prototype instanceof HTMLElement) {
		throw 'flyoutElem must be an HTMLElement'
	}

	this.flyoutElem = flyoutElem;
	this.watchedElements = [];
	this.EVENTS = new EventsBinder(this);

	// Set id on element
	var flyoutId = flyoutElem.getAttribute('id');
	if (!flyoutId) {
		flyoutId = 'f' + Date.now();
		flyoutElem.setAttribute('id', flyoutId);
	}

	// Store inner HTML
	this.flyoutTempalte = flyoutElem.innerHTML;
	flyoutElem.innerHTML = '';

};
var flyoutProto = Flyout.prototype;

flyoutProto.registerScrollEvent = function(elem) {
	var flyoutElem = this.flyoutElem;
	var wrappedScrollEvent = function() {
		if (this.isActive()) {
			this.positionFlyout(flyoutElem.flyoutAlignedToElem);
		} else {
			elem.removeEventListener('scroll', wrappedScrollEvent);
		}
	};
	this.watchedElements.push({
		elem: elem,
		fn: wrappedScrollEvent
	});
	elem.addEventListener('scroll', wrappedScrollEvent);
};

flyoutProto.removeScrollEvents = function() {
	var flyoutElem = this.flyoutElem;
	if (this.watchedElements) {
		this.watchedElements.forEach(function(group) {
			group.elem.removeEventListener('scroll', group.fn);
		});
	}
	this.watchedElements.length = 0;
};

flyoutProto.getPositioningKeys = function() {
	return {
		attributes: [
		],
		classes: [
			'flyout-against'
		]
	};
};

flyoutProto.findParentToPositionAgainst = function() {
	var flyoutElem = this.flyoutElem;
	var positionAgainstElem;
	if (true) {
		// Get things to check for on parent.
		var positioningKeys = this.getPositioningKeys();
		if (positioningKeys.attributes) {
			var clone = positioningKeys.attributes.slice(0);
			clone.map(function(attr) {
				return 'data-' + attr;
			}).forEach(function(attr) {
				positioningKeys.attributes.push(attr);
			});
		}

		// Transverse DOM looking for element to position against.
		var searchParentElem = flyoutElem.parentElement;
		while (searchParentElem && !positionAgainstElem) {
			if (positioningKeys.classes instanceof Array) {
				positioningKeys.classes.forEach(function(someClass) {
					if (!positionAgainstElem) {
						if (searchParentElem.classList.contains(someClass)) {
							positionAgainstElem = searchParentElem;
						}
					}
				});
			}
			if (positioningKeys.attributes instanceof Array) {
				positioningKeys.attributes.forEach(function(someAttribute) {
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

flyoutProto.attachedCallback = function() {
	// Process element attributes
	this.attributeChangedCallback('flyout-on',  null, this.getAttribute('flyout-on'));
};

flyoutProto.detachedCallback = function() {
	// Process element attributes
	this.attributeChangedCallback('flyout-on',  this.getAttribute('flyout-on'), null);
};

flyoutProto.attributeChangedCallback = function (name, oldValue, newValue) {
	if (name === 'flyout-on') {
		if (newValue) {
			this.bindFlyoutAction(newValue, oldValue);
		}
	}
};

flyoutProto.isActive = function() {
	if (this.flyoutAlignedToElem && this.flyoutContainer) {
		return true;
	};
	return false;
};

flyoutProto.bindFlyoutAction = function(newValue, oldValue) {
	var flyoutElem = this.flyoutElem;

	this.unbindEvents();
	if (typeof newValue === 'string') {
		newValue = newValue.split(' ');
		if (newValue.indexOf('click') >= 0) {
			flyoutElem.parentElement.addEventListener('click', this.EVENTS.clickEvent);
		} else if (newValue.indexOf('hover') >= 0) {
			flyoutElem.parentElement.addEventListener('mouseover', this.EVENTS.watchMouseOver);
		}
	}
};

flyoutProto.unbindEvents = function() {
	var flyoutElem = this.flyoutElem;

	flyoutElem.parentElement.removeEventListener('click', this.EVENTS.clickEvent);
	flyoutElem.parentElement.removeEventListener('mouseover', this.EVENTS.watchMouseOver);
};

flyoutProto.clearTimers = function() {
	if (this.pendingRenderActions) {
		window.cancelAnimationFrame(this.pendingRenderActions.animationFrame);
		window.clearTimeout(this.pendingRenderActions.timeout);
	}
	this.pendingRenderActions = {};
};
flyoutProto.close = function() {
	EventManager.removeActiveFlyout(this);
	this.clearTimers();
	this.flyoutContainer.parentElement.removeChild(this.flyoutContainer);
	this.removeScrollEvents();
	this.flyoutContainer = null;
	this.flyoutAlignedToElem = null;
};

flyoutProto.displayFlyout = function() {
	var flyout = this;
	var flyoutElem = this.flyoutElem;

	this.clearTimers();
	this.flyoutAlignedToElem = this.findParentToPositionAgainst();

	this.pendingRenderActions.animationFrame = window.requestAnimationFrame(function() {
		if (!this.flyoutContainer) {
			this.flyoutContainer = document.createElement('div');
			this.flyoutContainer.innerHTML = this.flyoutTempalte;

			var iframeShim = document.createElement('iframe');
			iframeShim.classList.add('shim');
			iframeShim.style.position = 'absolute';
			iframeShim.style.height = '100%';
			iframeShim.style.width = '100%';
			iframeShim.style.top = 0;
			iframeShim.style.left = 0;
			iframeShim.style.border = 'none';

			EnzeyNet.Services.prepend(this.flyoutContainer, iframeShim);

			window.document.body.appendChild(this.flyoutContainer);

			this.flyoutContainer.style.position = 'fixed';
			this.flyoutContainer.style.top = '0';
			elemLeft = '0';
			this.flyoutContainer.style.visibility = 'hidden';

			this.flyoutContainer.getFlyoutOwner = function() {
				return flyoutElem;
			};
		}

		this.pendingRenderActions.timeout = setTimeout(function() {
			// Transverse DOM looking for element to position against.
			var searchParentElem = this.flyoutAlignedToElem.parentElement;
			while (searchParentElem) {
				this.registerScrollEvent(searchParentElem);
				searchParentElem = searchParentElem.parentElement;
			}
			this.registerScrollEvent(document);
			this.positionFlyout(this.flyoutAlignedToElem);
			EventManager.addActiveFlyout(flyout);
		}.bind(this), 0);
	}.bind(this));

}

var extractElemPostion = function(alignMyAttr, alignToAttr) {
	var result = null;
	if (alignMyAttr) {
		if (alignToAttr) {
			var alignMyArray = alignMyAttr.split(' ');
			if (alignMyArray.length !== 2) {return;}

			var myVerticalPredicate   = alignMyArray[0];
			var myHorizontalPredicate = alignMyArray[1];

			var alignToArray = alignToAttr.split(' ');
			if (alignToArray.length !== 2) {return;}

			var itsVerticalPredicate   = alignToArray[0];
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

var getLeftPos = function(hPos, flyoutContainerPos, flyoutAnchorElemPos) {
	var elemLeft = 0;
	if (hPos.my === 'center') {
		if (hPos.its === 'center') {
			elemLeft = (inputPos.left - boxPos.width) + 'px';
		} else if (hPos.its === 'left') {
			elemLeft = (inputPos.left - boxPos.width) + 'px';
		} else if (hPos.its === 'right') {
			elemLeft = (inputPos.left - boxPos.width) + 'px';
		}
	} else if (hPos.my === 'left') {
		if (hPos.its === 'center') {
			elemLeft = (flyoutAnchorElemPos.left) + 'px';
		} else if (hPos.its === 'left') {
			elemLeft = (flyoutAnchorElemPos.left) + 'px';
		} else if (hPos.its === 'right') {
			elemLeft = (flyoutAnchorElemPos.left + flyoutAnchorElemPos.width) + 'px';
		}
	} else if (hPos.my === 'right') {
		if (hPos.its === 'center') {
			elemLeft = (inputPos.left - boxPos.width) + 'px';
		} else if (hPos.its === 'left') {
			elemLeft = (flyoutAnchorElemPos.left - flyoutContainerPos.width) + 'px';
		} else if (hPos.its === 'right') {
			elemLeft = (flyoutAnchorElemPos.left - flyoutContainerPos.width + flyoutAnchorElemPos.width) + 'px';
		}
	}

	return elemLeft;
};

var getTopPos = function(vPos, flyoutContainerPos, flyoutAnchorElemPos) {
	var elemTop = 0;
	if (vPos.my === 'center') {
		if (vPos.its === 'center') {
			elemTop = (inputPos.left - boxPos.width) + 'px';
		} else if (vPos.its === 'top') {
			elemTop = (inputPos.left - boxPos.width) + 'px';
		} else if (vPos.its === 'bottom') {
			elemTop = (inputPos.left - boxPos.width) + 'px';
		}
	} else if (vPos.my === 'top') {
		if (vPos.its === 'center') {
			elemTop = (flyoutAnchorElemPos.left) + 'px';
		} else if (vPos.its === 'top') {
			elemTop = (flyoutAnchorElemPos.top) + 'px';
		} else if (vPos.its === 'bottom') {
			elemTop = (flyoutAnchorElemPos.top + flyoutAnchorElemPos.height) + 'px';
		}
	} else if (vPos.my === 'bottom') {
		if (vPos.its === 'center') {
			elemTop = (inputPos.left - boxPos.width) + 'px';
		} else if (vPos.its === 'top') {
			elemTop = (flyoutAnchorElemPos.top - flyoutContainerPos.height) + 'px';
		} else if (vPos.its === 'bottom') {
			elemTop = (flyoutAnchorElemPos.top - flyoutContainerPos.height + flyoutAnchorElemPos.height) + 'px';
		}
	}

	return elemTop;
};

flyoutProto.positionFlyout = function(alignToElement) {
	var flyoutElem = this.flyoutElem;
	var alignMyAttr = flyoutElem.getAttribute('align-my');
	var alignToAttr = flyoutElem.getAttribute('align-to');

	var positioning = extractElemPostion(alignMyAttr, alignToAttr);
	if (positioning) {
		var flyoutAnchorElemPos = Helpers.getBoxData(alignToElement);
		var flyoutContainerPos = Helpers.getBoxData(this.flyoutContainer);

		var elemLeft = getLeftPos(positioning.horizontal, flyoutContainerPos, flyoutAnchorElemPos);
		var elemTop = getTopPos(positioning.vertical, flyoutContainerPos, flyoutAnchorElemPos);

		this.pendingRenderActions.animationFrame = window.requestAnimationFrame(function() {
			this.flyoutContainer.style.left = elemLeft;
			this.flyoutContainer.style.top = elemTop;
			this.flyoutContainer.style.visibility = 'visible';
		}.bind(this));
	}

};

flyoutProto.findParentFlyout = function() {
	var searchElem = this.flyoutElem.parentElement;
	while (searchElem) {
		if (searchElem.getFlyoutOwner) {
			return searchElem.getFlyoutOwner();
		}
		searchElem = searchElem.parentElement;
	}
};

module.exports = Flyout;