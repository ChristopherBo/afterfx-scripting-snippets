//ahr_PrPresetsToAE.jsx v1.1
// Copyright (c) 2022 AHRevolvers. All rights reserved.
//
//This script should take a premiere preset and apply it onto a single selected layer.
//All plugin effects I have tested have worked, if you encounter any problem fx do let me know.
//
//WARNING: Keyframe support is limited- only linear keyframes
//
//Changelog:
// - supports linear keyframes
// - fixed a shitton of bugs
// - keyframes are now scaled down to reasonable amounts
// - ui implemented
// - non-keyframed properties convert properly
// - duplicate effect instances are now supported (up to 99 effect copies in a single preset)
// - now works with presets from Premiere 2022
//
//Legal stuff:
// Permission to use, copy, modify, and/or distribute this software for any
// purpose with or without fee is hereby granted, provided that the above
// copyright notice and this permission notice appear in all copies.
//
// This script is provided "as is," without warranty of any kind, expressed
// or implied. In no event shall the author be held liable for any damages
// arising in any way from the use of this script.

(function ahr_PrPresetsToAE() {

    var ahr_PrPresetsToAE = new Object();	// Store globals in an object
	ahr_PrPresetsToAE.scriptName = "Import Premiere Presets";
	ahr_PrPresetsToAE.scriptTitle = ahr_PrPresetsToAE.scriptName + " v1";
	
	// Check that a project exists
	if (app.project === null)
		return;
	
	//make sure there's an active comp
	var comp = app.project.activeItem;
    if (comp === null || !(comp instanceof CompItem)) {
		alert("You need to be working in a composition!");
		return;
	}
	
	// if a single layer isn't selected, nothing to do
	if (comp.selectedLayers.length !== 1) {
		alert("Select 1 single layer!");
		return;
	}
	var layer = comp.selectedLayers[0];

	//////////////////////////////////////////
    //MAIN UI
    //////////////////////////////////////////
    var mainWindow = new Window("palette", "AHR's Premiere Preset Importer v1", undefined);
    mainWindow.orientation = "column";

    //extra effect options
    var groupOptions = mainWindow.add("group", undefined, "groupOptions");
    groupOptions.orientation = "column";
    var groupPanel = groupOptions.add("panel", undefined, "Keyframe Application. Start at:");
	var playheadStart = groupPanel.add("radiobutton", undefined, "Playhead");
	playheadStart.value = true;
    var inPointStart = groupPanel.add("radiobutton", undefined, "Clip In Point");
    inPointStart.value = false;
    var outPointStart = groupPanel.add("radiobutton", undefined, "Clip Out Point");
    outPointStart.value = false;
	var spreadStart = groupPanel.add("radiobutton", undefined, "Spread out evenly over clip");
    spreadStart.value = false;

	//make buttons hide or make visible the keyframespread group
	inPointStart.onClick = function() {
		keyframeSpreadPanel.visible = true;
	}
	playheadStart.onClick = function() {
		keyframeSpreadPanel.visible = true;
	}
	outPointStart.onClick = function() {
		keyframeSpreadPanel.visible = true;
	}
	spreadStart.onClick = function() {
		keyframeSpreadPanel.visible = false;
	}

	//panel so i can turn visibility of this + bottom text on/off at the same time in 1 command
	var keyframeSpreadPanel = groupOptions.add("group", undefined, "KeyframeSpreadPanel");
	keyframeSpreadPanel.orientation = "column";
	keyframeSpreadPanel.visible = true;
	//actual group stuff
	var keyframeSpreadGroup = keyframeSpreadPanel.add("group", undefined, "KeyframeSpread");
	keyframeSpreadGroup.orientation = "row";
	keyframeSpreadGroup.visible = true;
	var keyframeSpreadText = keyframeSpreadGroup.add("statictext", undefined, "Keyframes spread across:");
	var keyframeSpread = keyframeSpreadGroup.add("edittext", undefined, 30);
	keyframeSpread.preferredSize.width = 30;
	keyframeSpread.preferredSize.height = 17;
	var keyframeSpreadFrameText = keyframeSpreadGroup.add("statictext", undefined, "frames");
	var keyframeSpreadWarning = keyframeSpreadPanel.add("statictext", undefined, "Note: Includes before and after starting point");

	var saveAsPreset = mainWindow.add("checkbox", undefined, "Save as Preset?");
	saveAsPreset.value = false;

    //setup button
    var groupTwo = mainWindow.add("group", undefined, "groupTwo");
    groupTwo.orientation = "row";
    var setupButton = groupTwo.add("button", undefined, "Import!");

    mainWindow.center();
    mainWindow.show();

	var textFile;
	var preset = {
		name: "",
		folderName: "",
		effectNames: [],
		effects: []

	};


    setupButton.onClick = function() {
        mainWindow.close();
		//init variables
		var min = -(keyframeSpread.text/2)/comp.frameRate;
		var max = (keyframeSpread.text/2)/comp.frameRate;
		//if spread start then make it as wide as the clip is
		if(spreadStart.value == true) {
			//no need to divide by comp framerate since we're already dealing with numbers of that scale
			min = -((layer.outPoint-layer.inPoint)/2);
			max = ((layer.outPoint-layer.inPoint)/2);
		}
		var keyframeTimes = [];
		var keyframeTimesLocs = [];
		var relocateCounter = 0;

		//////////////////////////////////////////
    	//FILE PARSING
    	//////////////////////////////////////////

		// Get and parse text file
		textFile = File.openDialog("Select your Premiere preset file:");
		//if the text file DNE fuck off
		if (textFile === null) { alert("Bad file!"); return; }

		//Problem: to iterate through the file, we can call line to read the next line.
		//However to actually get the data inside said line we have to call it again which reads
		//the next line, and i reference line multiple times within the while loop which
		//moves it forward a bunch

		//possible solution: in videocomponentparam just grab all the data until the end tag
		//then sort through that in particular instead of going tag by tag

		textFile.open("r");
		while (!textFile.eof) {
			var line = textFile.readln();
			var rawtokens = line.split(" ");
			//turn each token into a string and remove leading and trailing whitespace
			var tokens = rawtokens.map(function(s) { return s.toString().replace(/\s/g,"") });
			//skip first line
			//if premieredata version not 3 may have diff formatting
			if(tokens[0] == "<PremiereData" && tokens[1] != "Version=\"3\">") {
				alert("Warning: Preset version untested. May cause errors. Continuing...");
			}
			if (tokens[0] == "<BinTreeItem" && tokens[1] == "ObjectID=\"3\"") {
				//get preset folder name
				preset.folderName = findItem("Name", line)[1];
				//alert("Preset Folder Name is " + preset.folderName);
			} else if(tokens[0] == "</PremiereData>") {
				//if its the end of the preset break out of the loop
				break;
			} else if(tokens[0] == "<TreeItem" && tokens[1] == "ObjectID=\"5\"") {
				//get preset name
				preset.name = findItem("Name", line)[1];
				//alert("Preset name is " + preset.presetName);
			} else if(tokens[0] == "<FilterPreset") {
				//get effect 1 name
				var fxName = findItem("FilterMatchName", line)[1].replace("AE.", "").replace("&amp;", "&");

				//in the case there are multiple instances of the same effect in a preset,
				//we should rename it to effectName ahr_2, etc. when we go to actually apply
				//the effect we take it off.
				//this is just for when we go to apply the suboptions so we can keep it organized
				var revisedfxName;
				if(findEffect(preset, fxName) != null) {
					var i = 2;
					while(true) {
						revisedfxName = fxName + " ahr_" + parseFloat(i);
						if(findEffect(preset, revisedfxName) == null) {
							fxName = revisedfxName;
							break;
						}
						i++;
						if(i > 100) {
							alert("Error: Could not rename!");
							return;
						}
					}
				}
				preset.effectNames.push(fxName);
				var fx = {name: preset.effectNames[preset.effectNames.length - 1], suboptions: []};
				preset.effects.push(fx);
				//alert("Effect " + preset.effectNames.length.toString() + " Name is " + preset.effectNames[preset.effectNames.length - 1]);
			} else if(tokens[0] == "<VideoComponentParam") {
				//get all data from here until </VideoComponentParam>
				var suboptionData = [];
				var j = 0;
				while(line.split("\t")[1].split(" ")[0] != "</VideoComponentParam>") {
					line = textFile.readln();
					suboptionData[j] = line;
					j++;
					//alert("suboptiondata: " + line);
					if(j > 100) {
						alert("Couldn't find </VideoComponentParam>!");
						break;
					}
				}
				//alert("Suboption data completed.");
				//get current effect suboptions and set it as an object
				var upperBound = parseInt(findItemString("UpperBound", suboptionData)[1]);
				var lowerBound = parseInt(findItemString("LowerBound", suboptionData)[1]);
				var suboptionValue = findItemString("CurrentValue", suboptionData)[1];
				//if it's 0 it might actually be 1, ex: ae goes 1-3 and pr goes 0-2 for some reason
				if((upperBound - lowerBound) < 11 && suboptionValue == 0) {
					suboptionValue = 1;
				}
				//if its true/false set to 0/1 respectively
				else if(suboptionValue == "true") {suboptionValue = 1;}
				else if(suboptionValue == "false") {suboptionValue = 0;}
				//if it's an int that's mistakenly a string turn it to an int
				else if(suboptionValue == parseInt(suboptionValue)) {
					suboptionValue = parseInt(suboptionValue);
				//if its a float that's a string turn it into a float
				} else if(suboptionValue == parseFloat(suboptionValue)) {
					suboptionValue = parseFloat(suboptionValue);
				}

				//eval makes it a boolean
				var suboptionIsKeyframed = eval(findItemString("IsTimeVarying", suboptionData)[1]);

				var suboptionKeyframes = [];
				//groups of numbers separated by ;
				var rawKeyframes = findItemString("Keyframes", suboptionData)[1].split(";");
				for(var j=0; j < rawKeyframes.length; j++) {
					suboptionKeyframes.push(rawKeyframes[j].split(","));
				}
				//remove whitespace only entries
				suboptionKeyframes = suboptionKeyframes.filter(function(str) { return /\S/.test(str); });
				//only process keyframes further if it's actually keyframed
				if(suboptionIsKeyframed == true) {
					//clean keyframe data- if there's any absurd values reduce them to max/min we can allow
					for(var j=0; j < suboptionKeyframes.length; j++) {
						for(var k=0; k < suboptionKeyframes[j].length-1; k++) {
							//need to check that the internal value is unedited by conversion
							//or else this keeps creating NaN values by converting undefineds/nulls
							if(suboptionKeyframes[j][k] == parseInt(suboptionKeyframes[j][k])) {
								suboptionKeyframes[j][k] = parseInt(suboptionKeyframes[j][k]);
							} else if(suboptionKeyframes[j][k] == parseFloat(suboptionKeyframes[j][k])) {
								suboptionKeyframes[j][k] = parseFloat(suboptionKeyframes[j][k]);
							}
						}
						//add time of keyframe data to keyframe list
						keyframeTimes.push(suboptionKeyframes[j][0]);
						//add indices to relocate this keyframe when the time comes
						keyframeTimesLocs.push([preset.effects[preset.effects.length-1].name, null, j]);
						//check only the timestamp whether it's too big or not
						// if(suboptionKeyframes[j][0] > max) {
						// 	suboptionKeyframes[j][0] = max;
						// } else if(suboptionKeyframes[j][0] < min) {
						// 	suboptionKeyframes[j][0] = min;
						// }
					}
				}

				var suboptionName = findItemString("Name", suboptionData)[1];
				//alert(suboptionName);
				//some suboptions don't have names- we don't care about them
				if(suboptionName != "/Name" ) {
					//if its not keyframed take the value from the first keyframe
					if(!suboptionIsKeyframed) {
						//assign to object and add obj to preset obj
						var suboption = {name: suboptionName, isKeyframed: suboptionIsKeyframed, keyframes: suboptionKeyframes, startingValue: suboptionKeyframes[0][1]};
						preset.effects[preset.effects.length - 1].suboptions.push(suboption);
					} else {
						//assign to object and add obj to preset obj
						var suboption = {name: suboptionName, isKeyframed: suboptionIsKeyframed, keyframes: suboptionKeyframes, startingValue: suboptionValue};
						preset.effects[preset.effects.length - 1].suboptions.push(suboption);
						//for easier locating later when we scale down the keyframe values

						//this counter is initialized outside the while loop
						//because it needs to count throughout reading the file, not just per line
						//otherwise values constantly get overwritten
						for(relocateCounter; relocateCounter < keyframeTimesLocs.length; relocateCounter++) {
							//add names to relocate this keyframe when the time comes
							keyframeTimesLocs[relocateCounter][1] = suboption.name;
						}
					}
				}
			}
		}
		textFile.close();

		//////////////////////////////////////////
    	//KEYFRAME PROCESSING/COMPRESSION
    	//////////////////////////////////////////

		//before we can start adding stuff we need to sort more keyframe data
		//using the keyframeTimes list we made before we can now crunch that down into a more relative system
		var tempMax = 1;
		if(keyframeTimes.length > 0) {
			for(var i=0; i < keyframeTimes.length; i++) {
				//find out what's the largest value- abs() negates negations
				if(tempMax < Math.abs(keyframeTimes[i])) { tempMax = Math.abs(keyframeTimes[i]); }
			}
			//we're looking to scale down the absurd number set from
			//4233600000 per frame to 1/comp.frameRate per frame.
			//dividing by max scales it down to 1 per frame while
			//comp.frameRate ensures it's in frame format
			var compressionValue = (tempMax/(max*comp.frameRate))*comp.frameRate;

			//apply compression to all keyframes
			//we can't just apply to keyframeTimes since they aren't pointers, we need to get their source
			//which we stored the indexes to get to back up when we were parsing via keyframeTimesLocs
			//[0] = effect index, [1] = suboption index, [2] = keyframe group index
			for(var i=0; i < keyframeTimes.length; i++) {
				//making sure we don't attempt operations on non-values
				if(keyframeTimes[i] != undefined && keyframeTimes[i] != null) {
					findSuboption(findEffect(preset, keyframeTimesLocs[i][0]), keyframeTimesLocs[i][1]).keyframes[keyframeTimesLocs[i][2]][0] = keyframeTimes[i]/compressionValue;
				}
			}
		}

		//////////////////////////////////////////
    	//ADDING FX
    	//////////////////////////////////////////

		//start performing the operation
		app.beginUndoGroup(ahr_PrPresetsToAE.scriptName);

		//go thru each effect
		for(var i=0; i < preset.effects.length; i++) {
			//add the effect
			var effectData = preset.effects[i];
			//this is to remove the ahr_2 at the end of duplicate effects when actually adding them
			var effectName = effectData.name.replace(/ ahr_\d+/, "");
			var effect = layer.Effects.addProperty(effectName);
			//mod the effect
			for (var j=0; j < effectData.suboptions.length; j++) {
				//sanity checks before we can modify the effect to weed out the unmodifable ones
				if(effect(effectData.suboptions[j].name) != null && effect(effectData.suboptions[j].name) != undefined) {
					if(effect(effectData.suboptions[j].name).propertyValueType != 6412) { //uneditable/no value
						//if has keyframes then loop through them- only linear keyframes currently
						//also eval translates a string to a bool
						if(eval(effectData.suboptions[j].isKeyframed) == true) {
							for(var k=0; k <= effectData.suboptions[j].keyframes.length; k++) {
								//make sure it's not undefined or null
								if(effectData.suboptions[j].keyframes[k] != undefined && effectData.suboptions[j].keyframes[k][0] != null) {
									//setValueAtTime(time, value);
									try {
										if(playheadStart.value == true) { //add playhead time to existing time
											effect(effectData.suboptions[j].name).setValueAtTime(parseFloat(effectData.suboptions[j].keyframes[k][0])+app.project.activeItem.time, parseFloat(effectData.suboptions[j].keyframes[k][1]));
										} else if(inPointStart.value == true) { //add clip in point time to existing time
											effect(effectData.suboptions[j].name).setValueAtTime(parseFloat(effectData.suboptions[j].keyframes[k][0])+layer.inPoint, parseFloat(effectData.suboptions[j].keyframes[k][1]));
										} else if(outPointStart.value == true) { //add clip out point time to existing time
											effect(effectData.suboptions[j].name).setValueAtTime(parseFloat(effectData.suboptions[j].keyframes[k][0])+layer.outPoint, parseFloat(effectData.suboptions[j].keyframes[k][1]));	
										} else { //spread out start- add middle of clip time to existing time
											effect(effectData.suboptions[j].name).setValueAtTime(parseFloat(effectData.suboptions[j].keyframes[k][0]) + ((layer.outPoint-layer.inPoint)/2), parseFloat(effectData.suboptions[j].keyframes[k][1]));
										}
									} catch(error) {
										//pass fuck this
									}
								}
							}
						} else {
							//there's more bullshit data types like color pickers and arrays that i cba to deal with rn
							//TODO
							try {
								effect(effectData.suboptions[j].name).setValue(effectData.suboptions[j].startingValue);
							} catch(error) {
								//pass, if it doesn't work we probably didn't care about it in the first place
							}
						}
					}
				}
			}
		}

		//if the user wanted us to save the preset we have to select the fx we added and save as preset
		if(saveAsPreset.value == true) {
			//select all fx we added
			for(var i=0; i < preset.effects.length; i++) {
				//count through every layer from the last added to the first added since we added the last X fx
				layer.effect(preset.effects.length-i).selected = true;
			}

			//equivalent to top left animation > save animation preset
			app.executeCommand(3075);
		}
	}

	//searches for the line with a specific 0 token and returns that line, split into parts
	//MADE FOR FILE READS ONLY
	function findItem(tokenZero, line) {
		var i=0;
        while (true) {
            line = textFile.readln();
            tokens = line.replace(/</g, '>').split(">");
            //delete items in list that are only whitespace
            tokens = tokens.filter(function(str) { return /\S/.test(str); });
            if(tokens[0] == tokenZero) {
                return tokens;
            }
			if(i > 100) {
				alert("Error: Could not find " + tokenZero + "!");
				return;
			}
			i++;
        }
    }

    //searches for the line with a specific 0 token and returns that line, split into parts
	//MADE FOR STRINGS ONLY
    function findItemString(tokenZero, string) {
		var i=0;
        while (true) {
            line = string[i];
            tokens = line.replace(/</g, '>').split(">");
            //delete items in list that are only whitespace
            tokens = tokens.filter(function(str) { return /\S/.test(str); });
            if(tokens[0] == tokenZero) {
                return tokens;
            }
			if(i > 100) {
				alert("Error: Could not find " + tokenZero + "!");
				return;
			}
			i++;
        }
    }

	//searches for a specific effect in the custom preset object created earlier
	function findEffect(preset, name) {
		for(var i=0; i < preset.effects.length; i++) {
			if(preset.effects[i].name == name) {
				return preset.effects[i];
			}
		}
		//alert("Error: Could not find effect " + name + " in " + preset.name + "!");
		return null;
	}

	//searches the list of suboptions in the effect custom object
	function findSuboption(effect, name) {
		for(var i=0; i < effect.suboptions.length; i++) {
			if(effect.suboptions[i].name == name) {
				return effect.suboptions[i];
			}
		}
		alert("Error: Could not find suboption " + name + " in " + effect.name + "!");
		return null;
	}

	//searches for an effect on a layer based on it's name
	function findAppliedEffect(layer, name) {
		for(var i=1; i <= layer.effect.numProperties; i++) {
			if(layer.effect.property(i).name == name) {
				return layer.effect.property(i);
			}
		}
		return null;
	}


	//next functions are written by stibinator
    //source: https://github.com/stibinator/AEScripts/blob/master/Stibs%20AEScripts/(lib)/copyproperties-makekey.jsx
    //protected under gpl license
	function makeKeyWithAttributes(theProperty, keyAttributes, keyTime) {
		//turns theAttributes from getKeyAttributes into a new keyframe
		if (theProperty.canVaryOverTime) {
			try {
				theProperty.setValueAtTime(keyTime, keyAttributes.keyVal);
				var newKeyIndex = theProperty.nearestKeyIndex(keyTime); //I wish Adobe would just make a keyframe class
	
				if (keyAttributes.canInterp) {
					theProperty.setTemporalEaseAtKey(
						newKeyIndex,
						keyAttributes.keyInTemporalEase,
						keyAttributes.keyOutTemporalEase
					);
					//important to do this after setting the temporal ease, or it turns all keyframes into bezier interpolation
					theProperty.setInterpolationTypeAtKey(
						newKeyIndex,
						keyAttributes.keyInInterpolationType,
						keyAttributes.keyOutInterpolationType
					);
				}
	
				//theProperty.setInterpolationTypeAtKey(theAttributes.keyInInterpolationType-6412, theAttributes.keyOutInterpolationType-6412); //WTF Javascript?
				if (keyAttributes.isSpatial) {
					theProperty.setSpatialTangentsAtKey(
						newKeyIndex,
						keyAttributes.keyInSpatialTangent,
						keyAttributes.keyOutSpatialTangent
					);
				}
				return newKeyIndex;
			} catch (e) {
				writeln(e);
				return false;
			}
		} else {
			return false;
		}
	}

	function getKeyAttributes(theProperty, keyIndex) {
		//in lieu of a proper keyframe object this returns all the details of a keyframe, given a property and key index.
		var theAttributes = {};
		theAttributes.keyTime = theProperty.keyTime(keyIndex);
		theAttributes.keyVal = theProperty.keyValue(keyIndex);
		theAttributes.canInterp =
			theProperty.isInterpolationTypeValid(
				KeyframeInterpolationType.BEZIER
			) ||
			theProperty.isInterpolationTypeValid(KeyframeInterpolationType.HOLD) ||
			theProperty.isInterpolationTypeValid(KeyframeInterpolationType.LINEAR);
		if (theAttributes.canInterp) {
			theAttributes.keyInInterpolationType =
				theProperty.keyInInterpolationType(keyIndex);
			theAttributes.keyOutInterpolationType =
				theProperty.keyOutInterpolationType(keyIndex);
			if (theAttributes.keyInInterpolationType) {
				theAttributes.keyInTemporalEase =
					theProperty.keyInTemporalEase(keyIndex);
				theAttributes.keyOutTemporalEase =
					theProperty.keyOutTemporalEase(keyIndex);
			}
		}
		//ignore spatial tangents for things like masks
		theAttributes.isSpatial =
			theProperty.isSpatial &&
			(theProperty.propertyValueType == PropertyValueType.ThreeD_SPATIAL ||
				theProperty.propertyValueType == PropertyValueType.TwoD_SPATIAL);
	
		if (theAttributes.isSpatial) {
			theAttributes.keyInSpatialTangent =
				theProperty.keyInSpatialTangent(keyIndex);
			theAttributes.keyOutSpatialTangent =
				theProperty.keyOutSpatialTangent(keyIndex);
		}
		return theAttributes;
	}

	app.endUndoGroup();
})();