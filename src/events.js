var Helpers = require('./helpers');

var EventsBinder  = function(flyoutElem) {

    var events = this;

	var processMouseMove = function(flyoutElem, event) {
		var mX = event.clientX;
		var mY = event.clientY;
		var flyoutAnchorElemPos = Helpers.getBoxData(flyoutElem.flyoutAlignedToElem);

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
		var flyoutContainerPos = Helpers.getBoxData(flyoutElem.flyoutContainer);

		var cL = flyoutContainerPos.left;
		var cR = cL + flyoutContainerPos.width;
		var cT = flyoutContainerPos.top;
		var cB = cT + flyoutContainerPos.height;

		if (mX < cL || mX > cR || mY < cT || mY > cB) {
			isOutsideContainer = true
		}

		if (isOutsideAncher && isOutsideContainer) {
			flyoutElem.unbindEvents();
			flyoutElem.close();
			flyoutElem.parentElement.addEventListener('mouseover', events.watchMouseOver);
		}
	};

	this.watchMouseOver = function(event) {
		flyoutElem.unbindEvents();
		flyoutElem.displayFlyout();
		if (!flyoutElem.getFlyoutParent()) {
			document.body.addEventListener('mousemove', events.watchMouseMove);
		}
	};

	this.watchMouseMove = function(event) {
		var flyoutChild = this.getFlyoutChild();
		if (flyoutChild) {
			events.watchMouseMove.call(flyoutChild, event);
		}

		if (flyoutElem.isActive() && (!flyoutChild || !flyoutChild.isActive())) {
			processMouseMove(this, event);
		}
	};

	this.clickEvent = function(event) {
		EnzeyNet.Services.registerClickAwayAction(
			flyoutElem.close,
			flyoutElem.flyoutContainer,
			flyoutElem.parentElement
		);

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