var Helpers = require('./helpers');

var EventsBinder  = function(flyout) {

	var unbound = {};

	var processMouseMove = function(flyout, event) {
		var mX = event.clientX;
		var mY = event.clientY;
		var flyoutAnchorElemPos = Helpers.getBoxData(flyout.flyoutAlignedToElem);

		var aL = flyoutAnchorElemPos.left;
		var aR = aL + flyoutAnchorElemPos.width;
		var aT = flyoutAnchorElemPos.top;
		var aB = aT + flyoutAnchorElemPos.height;

		var isOutsideAncher = false;
		if (
			(mX < aL || mX > aR || mY < aT || mY > aB)
		) {
			isOutsideAncher = true;
		}

		var isOutsideContainer = false;
		var flyoutContainerPos = Helpers.getBoxData(flyout.flyoutContainer);

		var cL = flyoutContainerPos.left;
		var cR = cL + flyoutContainerPos.width;
		var cT = flyoutContainerPos.top;
		var cB = cT + flyoutContainerPos.height;

		if (mX < cL || mX > cR || mY < cT || mY > cB) {
			isOutsideContainer = true
		}

		if (isOutsideAncher && isOutsideContainer) {
			flyout.unbindEvents();
			flyout.close();
			flyout.flyoutElem.parentElement.addEventListener('mouseover', unbound.watchMouseOver);

			return true;
		}
	};

	unbound.watchMouseOver = function(event) {
		flyout.unbindEvents();
		flyout.displayFlyout();
	};
	this.watchMouseOver = unbound.watchMouseOver.bind(flyout)

	unbound.watchMouseMove = function(event) {
		var flyoutChild = flyout.getFlyoutChild();
		if (flyoutChild) {
			unbound.watchMouseMove.call(flyoutChild, event);
		}

		if (flyout.isActive() && (!flyoutChild || !flyoutChild.isActive())) {
			processMouseMove(flyout, event);
		}
	};
	this.watchMouseMove = unbound.watchMouseMove.bind(flyout)

	unbound.clickEvent = function(event) {
		EnzeyNet.Services.registerClickAwayAction(
			flyout.close,
			flyout.flyoutContainer,
			flyout.parentElement
		);

		flyout.displayFlyout();
	};
	this.clickEvent = unbound.clickEvent.bind(flyout)

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