// VegastoAEMarkers.jsx
// By AHRevolvers
// Huge shoutout to fad for answering a question about the script, pool for testing the script for me
// and giving me a marker export from Vegas 14, prbo for testing the script, JustRexx for the marker
// export from Vegas 16, Reggie for the marker export from Vegas 18, and lsg for telling me that marker
//exports are determined by project settings and not Vegas versions, and the marker export from Vegas 19.
// check out my youtube at https://www.youtube.com/channel/UCq7vs_YdsEr9EVBcIgbRO1w

//Version: 1.5
//Changes: Removed the extra panel entirely, the script detects the marker export type now
//			- fixed bugs with how detectType detected the type the file was
//			- fixed bug in converthhmmss with parsing as am integer
//			- removed alert that only appeared when converting keyframes
// 			- fixed bug in converthhmmss with wrong token usage
//			- fixed for usage with hh:mm:ss,ms instead of only hh:mm:ss.ms with vegas 16


//Takes a default Vegas Marker Export file and adds those markers to the
//layer/comp of choice.
//Used with a lot of help from redefinery's MapTextFileToMarkers.jsx
// which can be found with the redfinery script set at
// https://www.dropbox.com/s/k37hgexfq4sa366/rd_scripts_20170108.zip?dl=0

(function MapVegasFileToMarkers() {

	var ahr_MapVegasFileToMarkers = new Object();	// Store globals in an object
	ahr_MapVegasFileToMarkers.scriptName = "Import Vegas Markers";
	ahr_MapVegasFileToMarkers.scriptTitle = ahr_MapVegasFileToMarkers.scriptName + " v1.4";
	
	// Check that a project exists
	if (app.project === null)
		return;
	
	// Get the current (active/frontmost) comp
	var comp = app.project.activeItem;
	
	if ((comp === null) || !(comp instanceof CompItem))
	{
		alert("You need to be working in a composition!");
		return;
	}
	
	// If a single layer isn't selected, nothing to do
	if (comp.selectedLayers.length !== 1)
	{
		alert("Select 1 single layer!");
		return;
	}

	var layer = comp.selectedLayers[0];
	
	// Get and parse text file
	var textFile = File.openDialog("Select your Vegas marker text file");
	if (textFile === null)
		return;
	
	var textLines = new Array();
	var i=0; //counting for the array
	textFile.open("r");
	while (!textFile.eof) {
		var line = textFile.readln();
		var tokens = line.split("\t");
		//skip first line
		if (tokens[i] == "Position") {
			var placeholder = 0;
		} else {
			textLines[textLines.length] = 0;
			textLines[i] = tokens[0].replace(",", "."); //timecode
			i++;
			textLines[i] = tokens[1]; //name
			i++;
		}
	}
	textFile.close();


	// Start performing the operation
	app.beginUndoGroup(ahr_MapVegasFileToMarkers.scriptName);

	//detects whether the user has imported a script that uses hh:mm:ss.ff or 
	//seconds.milliseconds.
	function detectType() {
		//window.close();
		//use the first marker, which is on the second line
		var regex = /^\d+:\d+:\d+.\d+$/; // adding / around content makes it a regex expression
		//looks for numbernumber:numbernumber:numbernumber.numbernumber
		if (regex.test(textLines[2])) { //checks to see if its hh:mm:ss:ff
			//alert("converting...")
			converthhmmss();
		}
		importMarkers();
	}

	//converts hh:mm:ss:ff to seconds.milliseconds
	function converthhmmss() {
		var j=0;
		for (j>i; j=j+2;) { //every line has two attributes; timecode(frames) and name.
			//convert for older versions from frames to time

			//if there's no more markers left stop converting
			if(textLines[j] == undefined) {
				break;
			}
			var tokens = textLines[j].split(/\:|\./);
			var numFrames = parseInt(tokens[3]);
			var numFrames = numFrames * comp.frameDuration;
			//add hours, minutes, frames to seconds
			textLines[j] = parseInt((tokens[0]*360)) + parseInt((tokens[1]*60)) + parseInt(tokens[2]) + numFrames;
		}
	}

	//works for svp 18
	function importMarkers() {
		var j=0;
		for (j>i; j=j+2;) { //every line has two attributes; timecode and name.
			var numFrames = textLines[j];
			//if there's no more markers left stop making markers
			if (numFrames == undefined) {
				break;
			}

			//if comment is null/undefined then make it ""
			if (textLines[j+1] == undefined || textLines[j+1] == null) {
				textLines[j+1] = "";
			} 

			var myMarker = new MarkerValue(textLines[j+1]);
			comp.selectedLayers[0].property("marker").setValueAtTime(numFrames, myMarker);
		}
	}

	//do the actual call to start running detecttype
	detectType();

	app.endUndoGroup();
})();