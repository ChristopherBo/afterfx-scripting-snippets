//ahr_VegasPresetstoAE.jsx
//Version: BETA v1.2 UNSTABLE
//
//
//This script should:
// - Take a Vegas preset and import it onto a single selected layer.
//
//WARNING: This only works for presets made of 1 sapphire effect OR twixtor. Use anything else at your own risk.
//
//Changelog:
//	- Added support for effects that have multiple number values
//	  in one effect, ie s_blurmocurves

(function ahr_SetupStreams() {

    var ahr_VegasPresetstoAE = new Object();	// Store globals in an object
	ahr_VegasPresetstoAE.scriptName = "Import Vegas Presets";
	ahr_VegasPresetstoAE.scriptTitle = ahr_VegasPresetstoAE.scriptName + " v1.2";
	
	// Check that a project exists
	if (app.project === null)
		return;
	
	// Get the current (active/frontmost) comp
	var comp = app.project.activeItem;

    // if ((comp === null) || !(comp instanceof CompItem))
	// {
	// 	alert("You need to be working in a composition!");
	// 	return;
	// }
	
	// If a single layer isn't selected, nothing to do
	if (comp.selectedLayers.length !== 1)
	{
		alert("Select 1 single layer!");
		return;
	}

	var layer = comp.selectedLayers[0];
	
	// Get and parse text file
	var textFile = File.openDialog("Select your Vegas preset file");
	if (textFile === null)
		return;

    var effectName = null;
    var presetName = null;
	
	var textLines = new Array();
	var i=0; //counting for the array
	textFile.open("r");
	while (!textFile.eof) {
		var line = textFile.readln();
		var tokens = line.split(" ");
		//skip first line
		if (tokens[0] == "<?xml") {
			var placeholder = 0;
		} else if(tokens[0] == "</OfxPreset>") {
			//if its the end of the preset break out of the loop
			break;
		} else if(tokens[0].split(">")[0] == "<OfxPlugin" || tokens[0].split(">")[0] == "<OfxPluginVersion") {
			//this is just the name repeated again or version number; disregard
			var placeholder = 0;
		} else if(tokens[0] == "<OfxPreset") {
            //grab the effect
            effectName = detectEffect(tokens[1]);
			presetName = line.split("\"")[5];
        } else {
			textLines[textLines.length] = 0;
            //name of effect suboption
			textLines[i] = line.split("\"")[1];
			i++;
            //effect amount
			textLines[i] = line.split("<OfxParamValue>")[1].split("<")[0];
			i++;
		}
	}
	textFile.close();


	// Start performing the operation
	app.beginUndoGroup(ahr_VegasPresetstoAE.scriptName);

    //creates the effect, initializes things
    var effect = layer.Effects.addProperty(effectName);
    effect.name = presetName;
    modifyEffect(effect);

    //detects the plugin
    function detectEffect(token) {
        var name = token.split("\"")[1];
		var effectName = null;
        var regexSapphire = /com.genarts.sapphire/
		var regexTwixtor = /com.revisionfx/
        if(regexSapphire.test(name)) {
            var tokens = name.split(".");
            effectName = tokens[tokens.length-1];
        } else if(regexTwixtor.test(name)) {
			var tokens = name.split(".");
			if(tokens[tokens.length-1] == "TwixtorPRO") {
				effectName = "Twixtor Pro";
			} else {
				effectName = tokens[tokens.length - 1];
			}
		}
		return effectName;
    }

    //modify the effect with the specific things
    function modifyEffect(effect) {
        var j=0;
		var ignoreSuboptions = ["version", "version2", "Enable GPU", "DisplayLayer",
								"TimeRetimeMethod", ];
		var swapIn = ["Auto Trans", "imagePrep", "drawGeom", "speed", "Motion Vectors", 
					 "Input: Frame Rate", "Main_BG Sensitivity", "plentyMemory"];
		var swapOut = ["autotrans_keyframe_state", "ImagePrep", "DrawGeom", "Speed", "TrackingQuality",
						"Frame", "MotionSensitivity", "CacheOpticalFlow"];
		for (j>i; j=j+2;) { //every line has two attributes; effect suboption and amount.
			var effectSuboption = textLines[j];
			//if there's no more suboptions left stop editing effect
			if (textLines[j] == undefined) {
				alert("Effect " + effectName + " finished.");
				break;
			} else if(new RegExp(ignoreSuboptions.join("|")).test(textLines[j])) {
				continue; //if its one of these options it doesn't exist/can't be changed in ae.
			} else {
				if(new RegExp(swapOut.join("|")).test(effectSuboption)) {
					//different name; grab index of og and swap with better version
					var index = swapOut.indexOf(effectSuboption);
					effectSuboption = swapIn[index];
					if(index == 1)  { textLines[j+1]++; } //if imgprep incerement by 1, i hate this
				}
				//if it's a boolean its counted as a floating point value 
				//(effect("whatever").propertyValueType) returns 6417, which is
				//a floating point value
				if (textLines[j+1] == "true") {
					textLines[j+1] = 1.0;
				} else if (textLines[j+1] == "false") {
					textLines[j+1] = 0.0;
				} else if (textLines[j+1].toString().indexOf(" ") != -1) {
					//convert arrays/multiple numbers into an array
					tokens = textLines[j+1].split(" ");
					amt = [];
					for(var k=0; k < tokens.length; k++) {
						amt.push(tokens[k]);
					}
					textLines[j+1] = amt;
				}
				effect(effectSuboption).setValue(textLines[j+1]);
			}
			
		}
	}

})();