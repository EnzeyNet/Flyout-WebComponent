var Helpers = require('./helpers');

var register = function(fn, debounceTime, maxWait) {
	var eventData = eventMap.get(fn);
	if (!eventData) {
		eventData = {
			registerdTime: Date.now()
		}
		eventMap.set(fn, eventData);
	}

}

var activeFlyouts = new Set();
var containersToFlyouts = new WeakMap();
var childToParentMap = new WeakMap();
var isEventWatchingActive = false;

var findParentFlyout = function(newFlyout) {
	var parentFlyout;
	var domElem = newFlyout.flyoutElem;
	while (domElem) {
		var parentFlyout = containersToFlyouts.get(domElem)
		if (parentFlyout) {
			break;
		}
		domElem = domElem.parentElement
	}
	console.log(parentFlyout);

	return parentFlyout;
};

var enableWatch = function() {
	console.log('enable event watcher')
	isEventWatchingActive = true;
	document.addEventListener('mousemove', eventWatcher);
};

var disableWatch = function() {
	console.log('disable event watcher')
	document.removeEventListener('mousemove', eventWatcher);
	isEventWatchingActive = false;
};

var addActiveFlyout = function(flyout) {
	activeFlyouts.add(flyout);
	containersToFlyouts.set(flyout.flyoutContainer, flyout)

	var parentFlyout = findParentFlyout(flyout)
	childToParentMap.set(flyout, parentFlyout)

	if (!isEventWatchingActive) {
		enableWatch();
	}
}

var removeActiveFlyout = function(flyout) {
	activeFlyouts.delete(flyout);
	containersToFlyouts.delete(flyout.flyoutContainer)
	if (activeFlyouts.size < 1) {
		disableWatch();
	}
}

var processChildEvents = function(flyout, e) {
	var childFlyout = childToParentMap.get(flyout);
	var stopProcessing = false;
	if (childFlyout) {
		stopProcessing = processChildEvents(childFlyout, e)
	}
	if (!stopProcessing) {
		flyout.EVENTS.processMouseMove(flyout, e)
	}
}

var globalEventWatcher = function(e) {
	var parents = new Set();
	activeFlyouts.forEach(function(activeFlyout) {
		if (!childToParentMap.has(activeFlyout)) {
			parents.add(activeFlyout);
		}
	});
	if (parents.size === 0) {
		parents = activeFlyouts;
	}
	parents.forEach(function(rootFlyout) {
		processChildEvents(rootFlyout, e);
	})
}

var eventWatcher = Helpers.throttle(globalEventWatcher, 20)

module.exports = {
	addActiveFlyout: addActiveFlyout,
	removeActiveFlyout: removeActiveFlyout
};