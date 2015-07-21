# node-red-node-ademco

Parses the panel messages from the NuTech AD2USB via a serial port input node, converts it into a JavaScript object and either reports partition state changes or converts each message into a payload.

The Payload consists of a Single Partion state object:
```JavaScript
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
