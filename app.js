"use strict";

const Homey = require('homey');

class VirtualDevices extends Homey.App {

	onInit() {

		//if (process.env.DEBUG === '1') require('inspector').open(9229, '0.0.0.0', true);
		this.log('Virtual Devices App is initialized');
	}
}

module.exports = VirtualDevices;
