// ahr_deNumbererv1.1.jsx
// Copyright (c) 2021 AHRevolvers (Chris Bo). All rights reserved.
//
// Removes numbers that you get by duplicating layers in a comp.
// Requested by RoobeN.
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

(function ahr_deNumberer() {

    var ahr_deNumberer = new Object();	// Store globals in an object
	ahr_deNumberer.scriptName = "DeNumberer";
	ahr_deNumberer.scriptTitle = ahr_deNumberer.scriptName + "v1.1";

    // Check that a project exists
	if (app.project === null)
        return;

    app.beginUndoGroup(ahr_deNumberer.scriptName);
    
    var items = app.project.items //all items in proj
    for(var i=1; i < items.length+1; i++) {
        if (items[i] instanceof CompItem) { //only do things to items in comps
            for(var j=1; j < items[i].layers.length+1; j++) { //loop thru the comp
                var layer = items[i].layers[j];
                //check to see if the item is a duplicate
                if(new RegExp(/ \d+/).test(layer.name)) {
                    //if its name doesnt = its source/project panel name rename
                    if(layer.source.name != layer.name) {
                        layer.name = layer.name.replace(/ \d+/, ""); //do the thing
                    }
                }
            }
        }
    }

    app.endUndoGroup();
})();