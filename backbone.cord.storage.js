;(function(root) {
'use strict';

var Backbone = root.Backbone || require('backbone');

root.Storage.prototype.setItemTrigger = function(key, value) {
	// Just doing a localStorage.setItem will trigger storage events on other windows but not the current one
	// Doing a sessionStorage.setItem will trigger storage events on all other windows (iframes) on the current window but not on the current window itself
	// This method will also trigger the event on the current window
	// http://stackoverflow.com/questions/4679023/bug-with-chromes-localstorage-implementation
	// https://developer.mozilla.org/en-US/docs/Web/Events/storage
	// https://developer.mozilla.org/en-US/docs/Web/API/StorageEvent
	var evt = document.createEvent('StorageEvent');
	evt.initStorageEvent('storage', true, true, key, this.getItem(key), value, root.location.href, this);
	this.setItem(key, value);
	root.dispatchEvent(evt);
};

function _storageListener(namespace, storage, e) {
	if(e.storageArea === storage)
		this._invokeObservers(e.key, e.newValue, namespace);
}

function _storagePlugin(name, prefix, storage) {
	var prefixKey = name + 'Prefix';
	var namespace = name;
	var plugin = {
		name: name,
		scope: {
			namespace: namespace,
			getKey: function(key) {
				if(key.indexOf(Backbone.Cord.config[prefixKey]) === 0)
					return key.substr(Backbone.Cord.config[prefixKey].length);
			},
			observe: function() {
				if(!this._hasObservers(null, name)) {
					this._storageListener = _storageListener.bind(this, namespace, storage);
					root.addEventListener('storage', this._storageListener);
				}
			},
			unobserve: function() {
				if(!this._hasObservers(null, name))
					root.removeEventListener('storage', this._storageListener);
			},
			getValue: function(key) {
				return storage.getItem(key);
			},
			setValue: function(key, value) {
				storage.setItemTrigger(key, value);
			}
		},
		remove: function() {
			root.removeEventListener('storage', this._storageListener);
		}
	};
	plugin.config = {};
	plugin.config[prefixKey] = prefix;
	return plugin;
}

// Scopes for both localStorange and sessionStorage
Backbone.Cord.plugins.push(_storagePlugin('localstoragescope', 'ls_', root.localStorage));
Backbone.Cord.plugins.push(_storagePlugin('sessionstoragescope', 'ss_', root.sessionStorage));

})(((typeof self === 'object' && self.self === self && self) || (typeof global === 'object' && global.global === global && global)));
