var EventsBinder = require('./events');
var Helpers = require('./helpers');

var flyoutComponent = function() {
	// expect Array.prototype.forEach
	// expect Array.prototype.map
};
var flyoutProto = flyoutComponent.prototype;

flyoutProto.registerScrollEvent = function(elem) {
	var flyoutElem = this;
	var wrappedScrollEvent = function() {
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

flyoutProto.removeScrollEvents = function() {
	var flyoutElem = this;
	if (flyoutElem.watchedElements) {
		flyoutElem.watchedElements.forEach(function(group) {
			group.elem.removeEventListener('scroll', group.fn);
		});
	}
	flyoutElem.watchedElements = [];
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
	var flyoutElem = this;
	var positionAgainstElem;
	if (true) {
		// Get things to check for on parent.
		var positioningKeys = flyoutElem.getPositioningKeys();
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

flyoutProto.createdCallback = function() {
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
	(function() {
		var flyoutParent = null;
		flyoutElem.setFlyoutParent = function(elem) {
			flyoutParent = elem;
		};
		flyoutElem.getFlyoutParent = function(elem) {
			return flyoutParent;
		};
	})();
	(function() {
		var flyoutChild = null;
		flyoutElem.setFlyoutChild = function(elem) {
			flyoutChild = elem;
		};
		flyoutElem.getFlyoutChild = function(elem) {
			return flyoutChild;
		};
	})();
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

flyoutProto.unbindEvents = function() {
	var flyoutElem = this;

	flyoutElem.parentElement.removeEventListener('click', flyoutElem.EVENTS.clickEvent);
	flyoutElem.parentElement.removeEventListener('mouseover', flyoutElem.EVENTS.watchMouseOver);
	document.body.removeEventListener('mousemove', flyoutElem.EVENTS.watchMouseMove);
};

flyoutProto.clearTimers = function() {
	if (this.pendingRenderActions) {
		window.cancelAnimationFrame(this.pendingRenderActions.animationFrame);
		window.clearTimeout(this.pendingRenderActions.timeout);
	}
	this.pendingRenderActions = {};
};
flyoutProto.close = function() {
	var flyoutElem = this;

	flyoutElem.unlinkFlyouts();
	flyoutElem.clearTimers();
	flyoutElem.flyoutContainer.parentElement.removeChild(flyoutElem.flyoutContainer);
	flyoutElem.removeScrollEvents();
	flyoutElem.flyoutContainer = null;
	flyoutElem.flyoutAlignedToElem = null;
};

flyoutProto.displayFlyout = function() {
	var flyoutElem = this;

	flyoutElem.clearTimers();
	this.linkFlyouts();
	flyoutElem.flyoutAlignedToElem = this.findParentToPositionAgainst();

	flyoutElem.pendingRenderActions.animationFrame = window.requestAnimationFrame(function() {
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

			flyoutElem.flyoutContainer.getFlyoutOwner = function() {
				return flyoutElem;
			};
		}

		flyoutElem.pendingRenderActions.timeout = setTimeout(function() {
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
	var flyoutElem = this;
	var alignMyAttr = this.getAttribute('align-my');
	var alignToAttr = this.getAttribute('align-to');

	var positioning = extractElemPostion(alignMyAttr, alignToAttr);
	if (positioning) {
		var flyoutAnchorElemPos = Helpers.getBoxData(alignToElement);
		var flyoutContainerPos = Helpers.getBoxData(flyoutElem.flyoutContainer);

		var elemLeft = getLeftPos(positioning.horizontal, flyoutContainerPos, flyoutAnchorElemPos);
		var elemTop = getTopPos(positioning.vertical, flyoutContainerPos, flyoutAnchorElemPos);

		flyoutElem.pendingRenderActions.animationFrame = window.requestAnimationFrame(function() {
			flyoutElem.flyoutContainer.style.left = elemLeft;
			flyoutElem.flyoutContainer.style.top = elemTop;
			flyoutElem.flyoutContainer.style.visibility = 'visible';
		});
	}

};

flyoutProto.findParentFlyout = function() {
	var searchElem = this.parentElement;
	while (searchElem) {
		if (searchElem.getFlyoutOwner) {
			return searchElem.getFlyoutOwner();
		}
		searchElem = searchElem.parentElement;
	}
};

flyoutProto.linkFlyouts = function() {
	var parentFlyout = this.findParentFlyout();
	if (parentFlyout) {
		parentFlyout.setFlyoutChild(this);
		this.setFlyoutParent(parentFlyout);
	}
};

flyoutProto.unlinkFlyouts = function() {
	var parentFlyout = this.getFlyoutChild();
	if (parentFlyout) {
		parentFlyout.setFlyoutChild(null);
	}
	this.setFlyoutParent(null);
};

module.exports = flyoutComponent;