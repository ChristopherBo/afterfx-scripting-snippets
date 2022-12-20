//ahr_hotswap.jsx
// Copyright (c) 2022 AHRevolvers. All rights reserved.
//
// This script will take the layer under the currently selected layer, select it
// and open it's effect controls.
// Requested by Extersio.
// Find more of these scripts on my channel https://www.youtube.com/c/AHRevolvers
//
//Legal stuff:
// Permission to use, copy, modify, and/or distribute this software for any
// purpose with or without fee is hereby granted, provided that the above
// copyright notice and this permission notice appear in all copies.
//
// This script is provided "as is," without warranty of any kind, expressed
// or implied. In no event shall the author be held liable for any damages
// arising in any way from the use of this script.

//checks
//make sure there's 1 selected active layer
if(app.project.activeItem.selectedLayers.length != 1) {
    alert("Error: You must select 1 layer!");
} else if(app.project.activeItem == undefined || app.project.activeItem == null) {
    //make sure the comp exists
    alert("Error: You must be in an active comp!");
} else {
    //actual stuff
    //grab selected layer and layer under it
    var comp = app.project.activeItem;
    var selectedLayer = app.project.activeItem.selectedLayers[0];
    var layerUnder = comp.layer(selectedLayer.index+1);
    //make sure layerUnder is usable
    if(layerUnder == null || layerUnder == undefined) {
        alert("Error: There must be a layer under the selected layer to move!");
    } else {
        //move layer under it above it
        selectedLayer.moveAfter(layerUnder);

        //select layer above it
        selectedLayer.selected = false;
        layerUnder.selected = true;

        //switch to effect control panel
        app.executeCommand(app.findMenuCommandId("Effect Controls"));
    }
}
