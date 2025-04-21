'use strict';

const Homey = require('homey');
const fs = require('fs');
const DRIVER_LOCATION = "/app/com.oskarirauta.virtual2/drivers/virtual_switch2/";

class VirtualDriver2 extends Homey.Driver {
  onInit() {
    this.log('Initialized driver for Virtual Devices');

    this.registerFlowCardAction_sensor('set_sensor_value', false);
    this.registerFlowCardAction_sensor('set_sensor_value_oc', true);
  }

  onPair(session) {
    let pairingDevice = {
      name: this.homey.__('pair.default.name.device'),
      settings: {},
      data: {
        id: guid(),
        version: 3
      },
      capabilities: [],
      capabilitiesOptions: {}
    };

    session.setHandler('log', (data) => {
      console.log('log: ' + JSON.stringify(data));
      return "ok";
    });

    session.setHandler('setClass', (data) => {
      console.log('setClass: ' + data);
      pairingDevice.class = data.class;
      console.log('pairingDevice: ' + JSON.stringify(pairingDevice));
      return pairingDevice;
    });

    session.setHandler('setName', (data) => {
      console.log('setName: ' + data);
      pairingDevice.name = data.name;
      console.log('pairingDevice: ' + JSON.stringify(pairingDevice));
      return pairingDevice;
    });

    session.setHandler('getPairingDevice', (data) => {
      return pairingDevice;
    });

    session.setHandler('updateCapabilities', (data) => {
      console.log('updateCapabilities: ' + JSON.stringify(data));
      pairingDevice.capabilities = data.capabilities;
      return pairingDevice;
    });

    session.setHandler('updateCapabilitiesOptions', (capabilityOptionChanges) => {
      console.log('updateCapabilitiesOptions: ' + JSON.stringify(capabilityOptionChanges));
      Object.keys(capabilityOptionChanges).forEach(capability => {
        if (Object.keys(capabilityOptionChanges[capability]).length === 0) {
          delete pairingDevice.capabilitiesOptions[capability]
        } else {
          if (pairingDevice.capabilitiesOptions[capability] == null) pairingDevice.capabilitiesOptions[capability] = {}

          Object.keys(capabilityOptionChanges[capability]).forEach(capabilityOptionKey => {
            pairingDevice.capabilitiesOptions[capability][capabilityOptionKey] = JSON.parse(JSON.stringify(capabilityOptionChanges[capability][capabilityOptionKey]))
          })
        }
      })
      return pairingDevice;
    });

    session.setHandler('getIcons', (data) => {
      var device_data = [
        getIconNameAndLocation('switch'),
        getIconNameAndLocation('light'),
        getIconNameAndLocation('button'),
        getIconNameAndLocation('alarm'),
        getIconNameAndLocation('lock'),
        getIconNameAndLocation('door'),
        getIconNameAndLocation('window_open'),
        getIconNameAndLocation('motion'),
        getIconNameAndLocation('blinds'),
        getIconNameAndLocation('curtains'),
        getIconNameAndLocation('garage'),
        getIconNameAndLocation('tv'),
        getIconNameAndLocation('hifi'),
        getIconNameAndLocation('sensor'),
        getIconNameAndLocation('thermostat'),
        getIconNameAndLocation('radiator'),
        getIconNameAndLocation('fan'),
        getIconNameAndLocation('electricity'),
        getIconNameAndLocation('water'),
        getIconNameAndLocation('sensor2'),
        getIconNameAndLocation('coffee_maker'),
        getIconNameAndLocation('kettle'),
      ]

      return device_data;
    });

    session.setHandler('setIcon', (data) => {
      console.log('setIcon: ' + data);
      pairingDevice.data.icon = data.icon.location;
      pairingDevice.icon = data.icon.location;
      if (this.homey.version == undefined) {
        pairingDevice.icon = DRIVER_LOCATION + "assets/" + data.icon.location;
      }
      console.log('pairingDevice: ' + JSON.stringify(pairingDevice));
      return pairingDevice;
    });

    session.setHandler('saveIcon', function (data, callback) {
      try {
        console.log('saveIcon: ' + JSON.stringify(data));
        listFiles("/userdata");
        uploadIcon(data, pairingDevice.data.id);
        var deviceIcon = "../../../userdata/" + pairingDevice.data.id + ".svg";

        pairingDevice.data.icon = deviceIcon;
        pairingDevice.icon = deviceIcon;
        return pairingDevice;

      } catch (error) {
        console.log('saveIcon ERROR ' + JSON.stringify(error));
        throw error;
      }
    });

    session.setHandler('disconnect', () => {
      console.log("User aborted pairing, or pairing is finished");
      
      this.homey.setTimeout(() => {
        let devices = this.getDevices();
        if (typeof pairingDevice.data.icon !== 'undefined' && pairingDevice.data.icon !== null && pairingDevice.data.icon.indexOf("../userdata/") > -1 && !devices.find(x => x.getData().icon == pairingDevice.data.icon)) {
          removeIcon(pairingDevice.data.icon);
        }
      }, 10000);
      return true;
    })
  }

  registerFlowCardAction_sensor(card_name, oc) {
    let flowCardAction = this.homey.flow.getActionCard(card_name);
    flowCardAction
      .registerRunListener((args, state) => {
        try {
          this.log('args: ' + simpleStringify(args));
          let device = validateItem('device', args.device);
          let sensor = validateItem('sensor', oc ? (args.sensor ? args.sensor.id : undefined) : args.sensor);
          let value = validateItem('value', args.value);

          this.log(device.getName() + ' -> Sensor: ' + sensor);

          var valueToSet;
          if (isNaN(value)) {
            if (value.toLowerCase() === 'true') {
              valueToSet = true;
            } else if (value.toLowerCase() === 'false') {
              valueToSet = false;
            } else {
              valueToSet = value;
            }
          } else {
            valueToSet = parseFloat(value, 10);
          }

          this.log(device.getName() + ' -> Value:  ' + valueToSet);
          return device.setCapabilityValue(sensor, valueToSet)
        }
        catch (error) {
          this.log('Device triggered with missing information: ' + error.message)
          this.log('args: ' + simpleStringify(args));
          return Promise.reject(error);
        }
      });
    if (oc) flowCardAction.registerArgumentAutocompleteListener('sensor', async (query, args) => {

      let caps = args.device.getCapabilities();
      return caps.map(x => {
        return {
          name: x,
          id: x
        }
      });
    });
  }
}

module.exports = VirtualDriver2;

function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

function getIconNameAndLocation(name) {
  return {
    "name": name,
    "location": name + ".svg"
  }
};

function listFiles(path) {
  console.log("listFiles: ");
  return new Promise((resolve, reject) => {
    try {
      fs.readdirSync(path).forEach(file => {
        console.log(file);
      });
    } catch (error) {
      return reject(error);
    }
  })
}

function uploadIcon(img, id) {
  return new Promise((resolve, reject) => {
    try {
      const path = "../userdata/" + id + ".svg";
      const base64 = img.replace("data:image/svg+xml;base64,", '');
      fs.writeFile(path, base64, 'base64', (error) => {
        if (error) {
          return reject(error);
        } else {
          return resolve(true);
        }
      });
    } catch (error) {
      return reject(error);
    }
  })
}

function removeIcon(iconpath) {
  console.log("removeIcon( " + iconpath + " )");
  return new Promise((resolve, reject) => {
    try {
      if (fs.existsSync(iconpath)) {
        fs.unlinkSync(iconpath);
        return resolve(true);
      } else {
        return resolve(true);
      }
    } catch (error) {
      return reject(error);
    }
  })
}


function validateItem(item, value) {
  if (typeof (value) == 'undefined' || value == null) {
    throw new ReferenceError(item + ' is null or undefined');
  }
  return value;
}

function simpleStringify(object) {
  var simpleObject = cleanJson(object);
  return JSON.stringify(simpleObject);
};

function cleanJson(object) {
  var simpleObject = {};
  for (var prop in object) {
    if (!object.hasOwnProperty(prop)) {
      continue;
    }
    if (typeof (object[prop]) == 'object') {
      continue;
    }
    if (typeof (object[prop]) == 'function') {
      continue;
    }
    simpleObject[prop] = object[prop];
  }
  return simpleObject; // returns cleaned up Object
};
