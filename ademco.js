/**
 * Copyright 2014, 2015 Andrew D Lindsay
 * 
 * @AndrewDLindsay http://blog.thiseldo.co.uk
 * 
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 * 
 * http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

module.exports = function(RED) {
	"use strict";

	var bitPositions = {
			BIT_READY : 0,
			BIT_ARMED_AWAY : 1,
			BIT_ARMED_STAY : 2,
			BIT_BACKLIGHT : 3,
			BIT_PROGRAMMING : 4,
			BIT_BEEP_COUNT : 5,
			BIT_ZONE_BYPASS : 6,
			BIT_AC_POWER : 7,
			BIT_CHIME_ENABLED : 8,
			BIT_ALARM_STICKY : 9,
			BIT_ALARM_SOUNDER : 10,
			BIT_BAT_LOW : 11,
			BIT_ENTRY_DELAY_OFF : 12,
			BIT_FIRE : 13,
			BIT_ZONE_FAULT : 14,
			BIT_PERIMETER_ONLY : 15
		};

		var AlarmStateEnum = {
			DISARMED : 0,
			NOT_READY : 1,
			READY : 2,
			ARMED_AWAY : 3,
			ARMED_STAY : 4,
			ARMED_INSTANT : 5,
			ALARM : 6,
			FIRE_ALARM : 7
		};


	function Ademco(n) {
		RED.nodes.createNode(this, n);
		this.config = RED.nodes.getNode(n.config);
		var node = this;

		if (node.systemState == null) {
			node.systemState = new Array(2);
		}
		
		node.status({});
		node.on( "input", function(msg) {
							this.report = n.report || msg.report || "all";

							var payload = "";

							if( typeof msg.payload == 'object' ) {
								payload = msg.payload.toString();
							} else {
								payload = msg.payload;
							}

							if( payload !== undefined && payload.length > 0 && payload.substring(0,1) == '[' ) {

							var segments = payload.split(',');

							var panels = parsePanels(segments[2]);
							var partitionNum = 1;
							for( var i = 0; i < panels.length; i ++ ) {
								if( panels[i] === 17 ) {
									partitionNum = 2;
								}
							}
							
							var AlarmPartitionState = getPartition( node.systemState, partitionNum );

							AlarmPartitionState.lastUpdated = new Date();
							AlarmPartitionState.panels = panels;
							
							// Make a backup of the Current Partition State
							AlarmPartitionState.lastSystemState = AlarmPartitionState.systemState;

							var bitsRaw = segments[0];

							for (var i = 1; i < 16; i++) {
								var value = (bitsRaw.substring(i, i + 1) == '1');

								switch (i - 1) {
								case bitPositions.BIT_READY:
									AlarmPartitionState.partitionReady = value;
									break;

								case bitPositions.BIT_ARMED_AWAY:
									AlarmPartitionState.partitionArmedAway = value;
									break;

								case bitPositions.BIT_ARMED_STAY:
									AlarmPartitionState.partitionArmedStay = value;
									break;

								case bitPositions.BIT_BACKLIGHT:
									AlarmPartitionState.backlight = value;
									break;

								case bitPositions.BIT_PROGRAMMING:
									AlarmPartitionState.programmingMode = value;
									break;

								case bitPositions.BIT_BEEP_COUNT:
									AlarmPartitionState.beepCount = bitsRaw
											.substring(i, i + 1);
									break;

								case bitPositions.BIT_ZONE_BYPASS:
									AlarmPartitionState.zoneBypass = value;
									break;

								case bitPositions.BIT_AC_POWER:
									AlarmPartitionState.linePower = value;
									break;

								case bitPositions.BIT_CHIME_ENABLED:
									AlarmPartitionState.chimeEnabled = value;
									break;

								case bitPositions.BIT_ALARM_STICKY:
									AlarmPartitionState.alarmOccurred = value;
									break;

								case bitPositions.BIT_ALARM_SOUNDER:
									AlarmPartitionState.alarmSounding = value;
									break;

								case bitPositions.BIT_BAT_LOW:
									AlarmPartitionState.batteryLow = value;
									break;

								case bitPositions.BIT_ENTRY_DELAY_OFF:
									AlarmPartitionState.delayOff = value;
									break;

								case bitPositions.BIT_FIRE:
									AlarmPartitionState.fireAlarm = value;
									break;

								case bitPositions.BIT_ZONE_FAULT:
									AlarmPartitionState.zoneFaulted = value;
									break;

								case bitPositions.BIT_PERIMETER_ONLY:
									AlarmPartitionState.perimeterOnly = value;
									break;

								default:
									break;
								}

								// Update the Current Partition State
								// By Default, the System/Partition is Disarmed
								AlarmPartitionState.systemState = AlarmStateEnum.DISARMED;

								// Disabled, spams quite a bit as zones go in an
								// out of ready state
								if (!AlarmPartitionState.partitionReady) {
									AlarmPartitionState.systemState = AlarmStateEnum.NOT_READY;
								} else {
									AlarmPartitionState.systemState = AlarmStateEnum.READY;
								}

								if (AlarmPartitionState.partitionArmedAway) {
									AlarmPartitionState.systemState = AlarmStateEnum.ARMED_AWAY;
								}

								if (AlarmPartitionState.partitionArmedStay) {
									AlarmPartitionState.systemState = AlarmStateEnum.ARMED_STAY;
								}

								if (AlarmPartitionState.partitionArmedStay
										&& AlarmPartitionState.delayOff) {
									AlarmPartitionState.systemState = AlarmStateEnum.ARMED_INSTANT;
								}

								if (AlarmPartitionState.alarmSounding) {
									AlarmPartitionState.systemState = AlarmStateEnum.ALARM;
								}

								if (AlarmPartitionState.fireAlarm) {
									AlarmPartitionState.systemState = AlarmStateEnum.FIRE_ALARM;
								}

								if (AlarmPartitionState.lastSystemState != AlarmPartitionState.systemState) {
									AlarmPartitionState.lastTransitionDate = AlarmPartitionState.lastUpdated;
									AlarmPartitionState.stateChange = true;
								} else {
									AlarmPartitionState.stateChange = false;
								}
							}

							AlarmPartitionState.messageLine1 = segments[3]
									.substring(1, 17).trim();
							AlarmPartitionState.messageLine2 = segments[3]
									.substring(17, 32).trim();
							
							
							node.systemState[partitionNum] = AlarmPartitionState;	
							
							var sendMessage = false;
							if( this.report === "state" ) {
								if( AlarmPartitionState.stateChange  ) {
									sendMessage = true;
								}
							} else { 
								sendMessage = true;
                         	}

							if( sendMessage ) {
								msg.topic = "iot/evt/alarm/fmt/json";
								msg.payload = AlarmPartitionState;
								node.send(msg);
							}
							node.status({});
}
						});
	}
	RED.nodes.registerType("Ademco", Ademco);
	
	function getPartition( systemState, partitionNumber ) {
		var partitionState ={
				partitionNumber : 1,
				messageLine1 : "",
				messageLine2 : "",
				lastUpdated : null,
				systemState : AlarmStateEnum.NOT_READY,
				lastTransitionDate : null,
				lastSystemState : AlarmStateEnum.NOT_READY,
				panels : [],
				zoneFaults : [],
				partitionReady : false,
				partitionArmedAway : false,
				partitionArmedStay : false,
				backlight : false,
				programmingMode : false,
				beepCount : 0,
				zoneBypass : false,
				linePower : false,
				chimeEnabled : false,
				alarmOccurred : false,
				alarmSounding : false,
				batteryLow : false,
				delayOff : false,
				fireAlarm : false,
				zoneFaulted : false,
				perimeterOnly : false,
				stateChange : false
			};
  
		partitionState.partitionNumber = partitionNumber;
		
		if( systemState[partitionNumber] != null ) {
			partitionState = systemState[partitionNumber];
		}
	
		return partitionState;
	}

	function parsePanels(data) {
		var panels = [];

		var parsedMask = "11111111111111111111111111111111";
		var padMask = "00000000000000000000000000000000";
		var parsedEvent = data;

		if (parsedEvent !== undefined && parsedEvent.length > 12) {
			parsedMask = parseInt(parsedEvent.substring(3, 11), 16).toString(2);
		}

		var panelMaskBitmap = (padMask + parsedMask)
				.substring(parsedMask.length);

		for (var x = 0; x < panelMaskBitmap.length; x++) {
			if (panelMaskBitmap.substring(x, x + 1) == "1") {
				panels.push(x - 5);
			}
		}
		return panels;
	}
}
