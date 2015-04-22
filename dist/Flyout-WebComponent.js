var flyoutElem = Object.create(HTMLElement.prototype);
EnzeyNet.applyFunctions(flyoutElem, EnzeyNet.FlyoutServices);

// IE8 Shims needed Array.forEach, Array.map, HTMLElement.classList
document.registerElement('fly-out', {
	prototype: flyoutElem
});
