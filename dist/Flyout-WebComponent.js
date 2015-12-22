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
