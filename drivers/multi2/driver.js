'use strict';

const Homey = require('homey');
const DRIVER_LOCATION = "/app/com.oskarirauta.virtual2/drivers/multi2/";

class MultiDriver2 extends Homey.Driver {

  onInit() {
		this.log('Initialized driver for Multi-Modes');

    let multiModeTrigger = this.homey.flow.getDeviceTriggerCard('multi_changed');
    
    this.registerFlowCardCondition('multi_mode_is', 'multi_state');
    this.registerFlowCardAction('multi_set_state', 'multi_state', multiModeTrigger);
	}

  onPair( session ) {
    let pairingDevice = {
      "name": this.homey.__( 'pair.default.name.multi' ),
      "settings": {},
      "data": {
        id: guid(),
        version: 3,
        state_names: {}
      },
      "class": "other",
      "capabilities": ["multi_state", "previous_state"],
      "mobile": {
        "components": []
      }
    };
    let nextModeName = this.homey.__( 'pair.default.name.sub')
    let subModeList = []
    let mainComponent = {
      "id": "sensor",
      "capabilities": ["multi_state"],
      "options": {
        "icons": {}
      }
    }
    let modesComponent = {
      "id": "button",
      "capabilities": [],
      "options": {
        "icons": {},
        "showTitle": [ ]
      }
    }

    session.setHandler('log', ( msg ) => {
        console.log(msg);
        return 'ok';
    });

    session.setHandler('setName', ( data ) => {
        console.log('setName: ' + data);
        pairingDevice.name = data.name;
        console.log('pairingDevice: ' + JSON.stringify(pairingDevice));
        return pairingDevice;
    });

    session.setHandler('setModeName', ( data ) => {
        console.log('setModeName: ' + JSON.stringify(data));
        nextModeName = data.name;
        return pairingDevice;
    });

    session.setHandler('getPairingDevice', ( data ) => {
        return pairingDevice;
    });

    session.setHandler('getPairingModeName', ( data ) => {
        return nextModeName;
    });

    session.setHandler('getIcons', ( data ) => {
        var device_data = [
          getIconNameAndLocation('house'),
          getIconNameAndLocation('away'),
	        getIconNameAndLocation('event'),
	        getIconNameAndLocation('holiday'),
	        getIconNameAndLocation('movie'),
	        getIconNameAndLocation('party'),
	        getIconNameAndLocation('quiet'),
	        getIconNameAndLocation('relax'),
	        getIconNameAndLocation('secure'),
          getIconNameAndLocation('sleep'),
          getIconNameAndLocation('morning'),
          getIconNameAndLocation('day'),
          getIconNameAndLocation('evening'),
          getIconNameAndLocation('night'),
          getIconNameAndLocation('energize'),
          getIconNameAndLocation('heart'),
          getIconNameAndLocation('reading'),
          getIconNameAndLocation('work'),
          getIconNameAndLocation('ambiance'),
          getIconNameAndLocation('concentrate'),
          getIconNameAndLocation('window_closed'),
          getIconNameAndLocation('window_open'),
          getIconNameAndLocation('number-zero'),
          getIconNameAndLocation('number-one'),
          getIconNameAndLocation('number-two'),
          getIconNameAndLocation('number-three'),
          getIconNameAndLocation('number-four'),
	    ]

        return device_data;
    });

    session.setHandler('setIcon', ( data ) => {
        console.log('setIcon: ' + JSON.stringify(data));
        mainComponent.options.icons.multi_state = 'drivers/multi2/assets/' + data.icon.location
        pairingDevice.data.icon_name = data.icon.name
        pairingDevice.icon = data.icon.location
        if ( this.homey.version == undefined ) {
          pairingDevice.icon = DRIVER_LOCATION + "assets/" + data.icon.location
        }
        pairingDevice.mobile.components = [ mainComponent, modesComponent ]

        console.log('setIcon - pairingDevice: ' + JSON.stringify(pairingDevice))
        return pairingDevice;
    });

    session.setHandler('setModeIcon', ( data ) => {
        console.log('setModeIcon: ' + JSON.stringify(data));
        var nrOfSubModes = modesComponent.capabilities.length + 1
        var modeCapability = "onoff.opt" + nrOfSubModes
        console.log('new Mode Capability: ' + modeCapability);

        modesComponent.capabilities.push(modeCapability)
        // modesComponent.options.icons[modeCapability] = 'drivers/multi/assets/' + data.icon.location;
        modesComponent.options.icons[modeCapability] = data.icon.location;
        if ( this.homey.version == undefined ) {
          modesComponent.options.icons[modeCapability] = 'drivers/multi/assets/' + data.icon.location;
        }
        console.log('setModeIcon - modesComponent: ' + JSON.stringify(modesComponent));

        pairingDevice.capabilities.push(modeCapability)
        pairingDevice.data.state_names[modeCapability] = nextModeName;
        console.log('setModeIcon - pairingDevice: ' + JSON.stringify(pairingDevice))

        var subMode = {
          'id': guid(),
          'name': nextModeName,
          'icon': data.icon
        }
        subModeList.push(subMode)
        console.log('setModeIcon - subModeList: ' + JSON.stringify(subModeList))

        nextModeName = this.homey.__( 'pair.default.name.sub')
        return pairingDevice;
    });

    session.setHandler('getSubModes', ( data ) => {
        return subModeList;
    });

    session.setHandler('setModes', ( data ) => {
      console.log('setModes: ' + JSON.stringify(data));
        modesComponent.capabilities = data.capabilities
        modesComponent.options.icons = data.modeIcons
        pairingDevice.data.state_names = data.modeNames
        pairingDevice.mobile.components = [ mainComponent, modesComponent ]

        console.log('setModes - pairingDevice: ' + JSON.stringify(pairingDevice));
        return pairingDevice;
    });

    session.setHandler('removeMode', ( data ) => {
      console.log('removeMode: ' + JSON.stringify(data))
      var newSubModeList = []
      var newIconList = {}
      var newStateNames = {}
      for (var i = 0; i < subModeList.length; i++) {
        var subMode = subModeList[i]
        var oldModeCapability = "onoff.opt" + (i+1)

        if ( subMode.id !== data.mode.id ) {
          newSubModeList.push(subMode)
          var nrOfNewSubModes = newSubModeList.length
          var newModeCapability = "onoff.opt" + nrOfNewSubModes
          newIconList[newModeCapability] = modesComponent.options.icons[oldModeCapability]
          newStateNames[newModeCapability] = pairingDevice.data.state_names[oldModeCapability]

        } else {
          console.log("This one will be removed: " + oldModeCapability)
        }
      }

      modesComponent.capabilities.pop()
      pairingDevice.capabilities.pop()

      modesComponent.options.icons = newIconList
      pairingDevice.data.state_names = newStateNames

      subModeList = newSubModeList
      return subModeList;
    });

    session.setHandler('disconnect', function(){
        console.log('User aborted pairing, or pairing is finished');
    })
  }

  registerFlowCardCondition(card_name, capability) {
    let flowCardCondition = this.homey.flow.getConditionCard(card_name);
    flowCardCondition
      .registerRunListener(( args, state ) => {
        try {
          let device = validateItem('device', args.device);

          let stateToCheck = getState( args );
          this.log(device.getName() + ' -> Condition checked: ' + simpleStringify(device.getState()) );

          if (stateToCheck === device.getState()[capability]) {
            return Promise.resolve( true );
          } else {
            return Promise.resolve( false );
          }
        }
        catch(error) {
          this.log('Device condition checked with missing information: ' + error.message)
          return Promise.reject(error);
        }
      })
  }

  registerFlowCardAction(card_name, capability, flow_trigger) {
    let flowCardAction = this.homey.flow.getActionCard(card_name);
    flowCardAction
      .registerRunListener(( args, state ) => {
        try {
          let device = validateItem('device', args.device);
          let newState = getState( args );
          this.log(device.getName() + ' -> Multi-State set to ' + newState);

          if ( ! device.isStateAllowed(newState) ) {
            var allowedStates = Object.values(device.getData().state_names);
            this.error(newState + ' is not an allowed state. Allowed states are: ', JSON.stringify(allowedStates));
            return Promise.resolve( false );
          }

          if (device.getMultiState() === newState) {
            this.log('Multi-State did not change')
            return Promise.resolve(); // no change, no triggers
          }

          device.setMultiState(newState);

          if (flow_trigger) {
            flow_trigger.trigger( device, {}, null) //, newState ) // Fire and forget
              .catch( this.error );
          }

          return Promise.resolve( true );
        }
        catch(error) {
          this.log('Device action called with missing information: ' + error.message)
          return Promise.reject(error);
        }
      })
  }
}

module.exports = MultiDriver2;

function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

function getIconNameAndLocation( name ) {
	return {
		'name': name,
		'location': '../assets/obsolete.svg'
	}
};

function getState( args ) {
  let argums = cleanJson(args);
  let firstKey = Object.keys(argums)[0];
  return argums[firstKey];
}

function validateItem(item, value) {
  if (typeof(value) == 'undefined' || value == null ) {
    throw new ReferenceError( item + ' is null or undefined' );
  }
  return value;
}

function cleanJson (object){
    var simpleObject = {};
    for (var prop in object ){
        if (!object.hasOwnProperty(prop)){
            continue;
        }
        if (typeof(object[prop]) == 'object'){
            continue;
        }
        if (typeof(object[prop]) == 'function'){
            continue;
        }
        simpleObject[prop] = object[prop];
    }
    return simpleObject; // returns cleaned up Object
};

function simpleStringify (object) {
    var simpleObject = cleanJson(object);
    return JSON.stringify(simpleObject);
};
