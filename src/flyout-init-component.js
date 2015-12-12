EnzeyNet.applyFunctions = function(someElem, someService) {
	for(var f in someService.prototype) {
		if ('function' === typeof someService.prototype[f]) {
			someElem[f] = someService.prototype[f];
		}
	};
};

var flyoutElem = Object.create(HTMLElement.prototype);
EnzeyNet.applyFunctions(flyoutElem, EnzeyNet.FlyoutServices);

// IE8 Shims needed Array.forEach, Array.map, HTMLElement.classList
document.registerElement('fly-out', {
	prototype: flyoutElem
});
