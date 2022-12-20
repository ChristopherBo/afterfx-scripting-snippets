// ahr_frameBlenderv1.jsx
// Copyright (c) 2021 AHRevolvers. All rights reserved.
//
// Recursively adds frame blending or frame interpolation on every layer in a comp.
// Find more of these scripts on my channel https://www.youtube.com/c/AHRevolvers
//
// Legal stuff:
// Permission to use, copy, modify, and/or distribute this software for any
// purpose with or without fee is hereby granted, provided that the above
// copyright notice and this permission notice appear in all copies.
//
// This script is provided "as is," without warranty of any kind, expressed
// or implied. In no event shall the author be held liable for any damages
// arising in any way from the use of this script.

(function ahr_frameBlender() {

    var ahr_frameBlender = new Object();	// Store globals in an object
	ahr_frameBlender.scriptName = "frameBlender";
	ahr_frameBlender.scriptTitle = ahr_frameBlender.scriptName + "v1";

    // Check that a project exists
	if (app.project === null)
        return;

    app.beginUndoGroup(ahr_frameBlender.scriptName);
    
    //////////////////////////////////////////
    //MAIN UI
    //////////////////////////////////////////
    var mainWindow = new Window("palette", "AHRevolver's Frame Blending Enabler", undefined);
    mainWindow.orientation = "column";

    //comp selection
    var groupOne = mainWindow.add("group", undefined, "groupOne");
    groupOne.orientation = "column";
    var panelSelection = groupOne.add("panel", undefined, "Choose the comp you want to enable frame blending in:");
    var compList = panelSelection.add("dropdownlist", undefined, getAllCompNames());
    compList.size = [250, 25];
    compList.selection = 0;

    //choose interpolation to add
    var panelInterp = groupOne.add("panel", undefined, "Choose the method of interpolation you want to use:");
    var interpList = panelInterp.add("dropdownlist", undefined, ['None', 'Frame Blending', 'Pixel Motion']);
    interpList.size = [250, 25];
    interpList.selection = 1;

    //setup button
    var groupTwo = mainWindow.add("group", undefined, "groupTwo");
    groupTwo.orientation = "column";
    var setupButton = groupTwo.add("button", undefined, "Blend!");

    mainWindow.center();
    mainWindow.show();

    //gets all comp names in the project and returns them.
    function getAllCompNames() {
        var compNames = [];
        for(var i=1; i <= app.project.items.length; i++) {
            if(app.project.items[i] instanceof CompItem) {
                compNames.push(app.project.items[i].name);
            }
        }
        return compNames;
    }

    setupButton.onClick = function() {
        //find the comp
        var comp = findItemByName(compList.selection);
        var value;
        //convert from text to proper id
        switch (String(interpList.selection)) {
            case 'None': value = 4012; break;
            case 'Frame Blending': value = 4013; break;
            case 'Pixel Motion': value = 4014; break;
            //no default necessary since it has a default value and its a dropdown
        }
        app.executeCommand(2004); //Deselect All Layers
        recursiveFrameBlend(comp, value);
        app.executeCommand(2004); //Deselect All Layers
    }

    function recursiveFrameBlend(comp, value) {
        //make sure a comp exists and has layers on it
        if ((comp === null) || !(comp instanceof CompItem)) {
			// alert("This comp does not exist or is not a real comp!");
			return false;
		}

        //do the thing now
        for(var i=1; i < comp.layers.length+1; i++) {
            if(comp.layers[i] instanceof AVLayer) {
                comp.layers[i].frameBlendingType = value;
            } if(comp.layers[i].source instanceof CompItem) {
                recursiveFrameBlend(comp.layers[i].source, value);
            }
        }
    }

    //finds an item by its name
    //searchname: the item's name
    function findItemByName(searchName) {
        var projLength = app.project.items.length;
    
        for (var i = 1; i <= projLength; i++) {
            var nameProperty = app.project.item(i).name;
            if ( String(nameProperty) == String(searchName)) {
                return app.project.item(i);
            }
        }
        return null;
    }

    app.endUndoGroup();
})();