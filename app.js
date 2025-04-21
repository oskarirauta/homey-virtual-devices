"use strict";

const Homey = require('homey');

class VirtualDevices2 extends Homey.App {

	onInit() {

		if (process.env.DEBUG === '1' || false) {
			try {
				require('inspector').waitForDebugger();
			}
			catch (error) {
				require('inspector').open(9210, '0.0.0.0', true);
			}
		}
		this.log('Virtual Devices App is initialized');
	}
}

module.exports = VirtualDevices2;
