# node-red-node-ademco

Two nodes used to work with the AD2USB Data stream either from a Serial Node or MQTT message.

## Installation

```sh
$ npm i node-red-node-ademco
```

## Documentation

AdemcoListener Node:
====================

Parses the panel messages from the NuTech AD2USB via a serial port input node or MQTT node, converts it into a JavaScript object and either reports partition state changes or every input message; as defined in the node configuration, into the JavaScript object specified below.

```js
partitionState ={
	partitionNumber : 1,         // Indicates the Partition ID
	messageLine1 : "",           // Alpha panel Message Line 1
	messageLine2 : "",           // Alpha panel Message Line 2
	lastUpdated : null,          // DateTime the message was parsed
	systemState : AlarmStateEnum.NOT_READY,  // StateMachinable value, see System State object
	lastTransitionDate : null,   // Prior State Change DateTime
	lastSystemState : AlarmStateEnum.NOT_READY, // Prior StateMachinable value, see System State object
	panels : [],                 // List of Panel IDs this message is ment for
	zoneFaults : [],             // List of faulted Zones  (Not Working)
	partitionReady : false,      // Indicates the Partition is ready to arm (No Faults)
	partitionArmedAway : false,  // Indicates the Partition is Armed Away ( Motion Detection == Instant Alarm ) 
	partitionArmedStay : false,  // Indicates the Partition is Armed Stay ( Motion Detection Zones disabled ) 
	backlight : false,           // Panel Backlight should be lit
	programmingMode : false,     // Indicates System is in Programming Mode
	beepCount : 0,               // Indicates Panel should beep x times
	zoneBypass : false,          // Indicates one or more zones bypassed on partition
	linePower : false,           // Indicates System is on AC Power
	chimeEnabled : false,        // Indicates Panel should chime when Zones are faulted in Disarmed State
	alarmOccurred : false,       // Indicates an alarm has been triggered  (Could be Silent Alarm!)
	alarmSounding : false,       // Indicates the Alarm Siren is triggered
	batteryLow : false,          // Indicates the Backup Battery is Low/not charging
	delayOff : false,            // Indicates the System is Armed Instant ( AKA Night Mode )
	fireAlarm : false,           // Indicates the Fire Zones have been triggered
	zoneFaulted : false,         // Indicates one or more Zones are faulted
	perimeterOnly : false,       // Indicates non-motion zones are armed
	stateChange : false          // Indicates the Primary Arming state has changed
};
```


The Partition state Enum Values:
```js
var AlarmStateEnum = {
	DISARMED : 0,       // Partition is in an unknown state or initialized
	NOT_READY : 1,      // Partition is Disarmed but but not ready to arm (One or more Faults)
	READY : 2,          // Partition is Disarmed but ready to arm (No Faults)
	ARMED_AWAY : 3,     // Partition is Armed Away, Motion Detection active
	ARMED_STAY : 4,     // Partition is Armed Stat, Motion Detection not active
	ARMED_INSTANT : 5,  // Partition is Armed Instant, Motion Detection not active (No Entry Delay)
	ALARM : 6,          // Partition is in a Faulted Alarm State
	FIRE_ALARM : 7      // Partition is in a Faulted Fire Alarm State
};
```

AdemcoStatus Node:
====================

Using the current panel message state from the Listener Node, this will either use the message.partion == Partition Number or the Node Configuration to export the current partition state on the output message.payload.  Use this node to query the current alarm panel state(s).

Example Flow
```js
[{"id":"a019b186.5fe65","type":"AdemcoStatus","name":"","partition":"2","x":561,"y":426,"z":"88661d46.7799e","wires":[["a328679e.5cd798"]]},{"id":"a328679e.5cd798","type":"debug","name":"","active":true,"console":"false","complete":"true","x":726,"y":425,"z":"88661d46.7799e","wires":[]},{"id":"373bc3f2.c8c43c","type":"inject","name":"","topic":"","payload":"partition","payloadType":"date","repeat":"","crontab":"","once":false,"x":175,"y":425,"z":"88661d46.7799e","wires":[["6f7f728.f90808c"]]},{"id":"6f7f728.f90808c","type":"change","action":"replace","property":"partition","from":"","to":"1","reg":false,"name":"","x":349,"y":425,"z":"88661d46.7799e","wires":[["a019b186.5fe65"]]}]
```

If you have any questions, just [open an issue](https://github.com/jlong23/node-red-node-ademco/issues/mew).

To order a AD2USB Module for your Ademco Alarm Panel
 - [NuTech AD2USB Order Site](http://www.alarmdecoder.com/catalog/advanced_search_result.php?keywords=AD2USB&search_in_description=1&x=0&y=0)

And the Protocol/Strings exported from the Panel
 - [AD2USB Protocol](http://www.alarmdecoder.com/wiki/index.php/Protocol)



## Example Function
Example Nod-Red 'function' that formats Partition State Messages, and routes them according to importance:
```js
var partition = msg.payload;

if( partition !== undefined ) {
    var alarmText = "";

    // Format for core alarm State
    alarmText += "Partition ";
    alarmText += partition.partitionNumber;
    alarmText += " is ";

    switch ( partition.systemState ) {
        case 0:
            alarmText += "DISARMED";
            break;
        case 1:
            alarmText += "NOT READY";
            break;
	    case 2:
            alarmText += "DISARMED READY";
            break;
	    case 3:
            alarmText += "ARMED AWAY";
            break;
	    case 4:
            alarmText += "ARMED STAY";
            break;
	    case 5:
            alarmText += "ARMED INSTANT";
            break;
        case 6:
            alarmText += "ALARM";
            break;
	    case 7:
            alarmText += "FIRE ALARM";
            break;
        default:
            alarmText += "UNKNOWN";
            break;		    
    } 

    // Format for Alarms and Faults
    if(  partition.systemState >= 6  ||  partition.systemState == 1 ) {
    	alarmText += "; ";
	    alarmText += partition.messageLine1.trim();
	    alarmText +=  "  ";
	    alarmText += partition.messageLine2.trim();
    }
    
    msg.payload = alarmText;
    
    // Route the Messages to the correct output
    // Critical Events are Sent on Output 2
    if( partition.systemState > 2 ) {
        return [ null, msg ];
    } else {
        // Status Events are sent on Output 1 
        if ( partition.systemState == 2 && partition.lastSystemState > 2 ) {
            // Unless it's transition from Higher States to Ready/Disarmed
            return [ null, msg ];
        } else {
        	// Non Critical Events are Sent on Output 1
            return [ msg, null ];
        }
    }
}

// Fail to parse, return nothing
return [null, null];
```


