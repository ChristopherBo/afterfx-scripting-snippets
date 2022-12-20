//ahr_propCopy.jsx v1.1
// Copyright (c) 2022 AHRevolvers. All rights reserved.
//
// This script will copy an effect's (selected) properties and copy them to
// other instances of the effect in all comps/a specific comp.
// Requested by Extersio.
// Find more of these scripts on my channel https://www.youtube.com/c/AHRevolvers
//
//Changelog:
// - fixed bug where certain types of layers would throw an error when asked for their effects.
//
//Legal stuff:
// Permission to use, copy, modify, and/or distribute this software for any
// purpose with or without fee is hereby granted, provided that the above
// copyright notice and this permission notice appear in all copies.
//
// This script is provided "as is," without warranty of any kind, expressed
// or implied. In no event shall the author be held liable for any damages
// arising in any way from the use of this script.

(function ahr_propCopy() {

    //////////////////////////////////////////
    //MAIN UI
    //////////////////////////////////////////
    var mainWindow = new Window("palette", "AHRevolver's Effect Property Copier", undefined);
    mainWindow.orientation = "column";
    var groupOne = mainWindow.add("group", undefined, "groupOne");
    groupOne.orientation = "column";

    //choose which props to take
    var panelProps = groupOne.add("panel", undefined, "Copy:");
    var propList = panelProps.add("dropdownlist", undefined, ['Selected Properties', 'Selected Effect\'s Properties', 'Selected Layer\'s Effect Properties']);
    propList.size = [250, 25];
    propList.selection = 0;

    //comp selection
    var panelSelection = groupOne.add("panel", undefined, "Copy to:");
    var selectionList = panelSelection.add("dropdownlist", undefined, ['Current Comp', 'Current Comp and Precomps', 'All Comps', 'Specific Comp']);
    selectionList.size = [250, 25];
    selectionList.selection = 0;

    //specific comp selectiom
    var panelComps = groupOne.add("panel", undefined, "Select the specific comp:");
    var compList = panelComps.add("dropdownlist", undefined, getAllCompNames());
    compList.size = [250, 25];
    compList.selection = 0;
    panelComps.visible = false;

    //view panelComps only when specific comp
    selectionList.onChange = function() {
        if(String(selectionList.selection) == "Specific Comp") {
            panelComps.visible = true;
        } else {
            panelComps.visible = false;
        }
    }

    //setup button
    var groupTwo = mainWindow.add("group", undefined, "groupTwo");
    groupTwo.orientation = "column";
    var setupButton = groupTwo.add("button", undefined, "Go!");

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
        //checks
        //make sure there's 1 selected active layer
        if(app.project.activeItem.selectedLayers.length != 1) {
            alert("Error: You must select 1 layer!");
            return false;
        } else if(app.project.activeItem == undefined || app.project.activeItem == null) {
            //make sure the comp exists
            alert("Error: You must be in an active comp!");
            return false;
        } 

        app.beginUndoGroup("Prop Copy Script");

        //init stuff
        var comp = app.project.activeItem;
        var layer = comp.selectedLayers[0];
        //locate fx and props for use later
        var fx = [];
        var props = [];
        var fxIndex = 0;
        var propsIndex = 0;
        switch (String(propList.selection)) {
            case 'Selected Properties': //selected properties (ez)
                for(var i=0; i<layer.selectedProperties.length; i++) {
                    if(layer.selectedProperties[i] instanceof PropertyGroup) {
                        fx[fxIndex] = layer.selectedProperties[i];
                        fxIndex++;
                    } else if(layer.selectedProperties[i] instanceof Property) {
                        props[propsIndex] = layer.selectedProperties[i];
                        propsIndex++;
                    }
                }
            break; case 'Selected Effect\'s Properties': //all selected fx
                for(var i=0; i<layer.selectedProperties.length; i++) {
                    if(layer.selectedProperties[i] instanceof PropertyGroup) {
                        fx[fxIndex] = layer.selectedProperties[i];
                        fxIndex++;
                    }
                }
                //get all props
                props = discoverEffects(fx);
                
            break; case 'Selected Layer\'s Effect Properties': //all fx on selected layer
                //can't iterate over fx on a layer so we have to try indices until it breaks
                var thing = true;
                var i=1;
                while(thing) {
                    try {
                        fx[fxIndex] = layer.Effects(i);
                        fxIndex++; i++;
                    } catch(error) {
                        thing = false; //leave while loop
                    }
                }
                //get all props
                props = discoverEffects(fx);
            //no default necessary since it has a default value and its a dropdown
            //however for future reference a default would be written as:
            //default:
                //do thing
            //break;
        }

        //go do the actual thing now
        switch (String(selectionList.selection)) {
            case 'Current Comp': propCopier(comp, fx, props); break;
            case 'Current Comp and Precomps': propCopier(comp, fx, props, true); break;
            case 'All Comps': ultimatePropCopier(fx, props); break;
            case 'Specific Comp': propCopier(findItemByName(String(compList.selection)), fx, props); break;
            //no default necessary since it has a default value and its a dropdown
        }
        app.executeCommand(2004); //Deselect All Layers

        app.endUndoGroup();
    }

    //discovers properties in an effect
    //and adds them to a list (props) and returns them
    //array items are smaller arrays that contain
    //[pathToGetToProp, prop]
    //only goes 1 dropdown in since i havent seen fx with 2 dropdowns before and im lazy
    function discoverEffects(fx) {
        var props = [];
        var propsIndex = 0;
        for(var i=0; i<fx.length; i++) {
            if(fx[i] instanceof PropertyGroup) { //check in every effect
                try {
                    var j = 1;
                    while(true) { //cant get length bc we're iterating via a function not over an array
                        //compositing options is this shitass feature every effect has to mask it and lower opacity
                        //it has way too many dropdowns for me to care about and ive never legitimately used it before
                        if(fx[i](j) instanceof PropertyGroup && fx[i](j).name != "Compositing Options") { //check in every effect dropdown
                            var k = 1;
                            try {
                                while(true) {
                                    try {
                                        props[propsIndex] = fx[i](j)(k);
                                        k++; propsIndex++;
                                    } catch(error) {
                                        break;
                                    }
                                }
                            } catch(error) {
                                //pass, if it fails thats fine
                            }
                        } else { //if they're not a dropdown add the property itself to the list
                            try {
                                props[propsIndex] = fx[i](j);
                                j++; propsIndex++;
                            } catch(error) {
                                break;
                            }
                        }
                    }
                } catch(error) {
                    //pass, if it fails thats fine
                }
            } else if(prop[i] instanceof Property) {
                props[propsIndex] = [prefix, fx[i]];
                propsIndex++;
            }
        }
        return props;
    }

    //recursively discovers properties in an effect propertygroup (aka a dropdown)
    //helper function to discoverEffects()
    function discoverSubEffects(prop, prefix) {
        if(prefix == undefined || prefix == null ) {prefix == "";}
        var subprops = [];
        var propsIndex = 0;
        for(var i=0; i<prop.length; i++) {
            if(prop[i] instanceof PropertyGroup) {
                var subsubprops = discoverSubEffects(prop[i]);
                for(var j=0; j<subsubprops.length;j++) {
                    props[propsIndex] = subsubprops[j];
                    propsIndex++;
                }
            } else if(prop[i] instanceof Property) {
                subprops[propsIndex] = [prefix, layer.selectedProperties[i]];
                propsIndex++;
            }
        }
        return subprops;
    }

    //on finding the same effect as fx in any layer of a comp, replaces
    //the values of all props with the ones in props.
    //if recursive loops through all precomps infinitely.
    function propCopier(comp, fx, props, recursive) {
        if(recursive == null || recursive == undefined) { recursive == false }
        for(var j=1; j<=comp.layers.length; j++) { //loop thru every comp in project
            for(var l=0; l<fx.length; l++) {
                try {
                    if(comp.layers[j].effect(fx[l].name) != undefined) {
                        for(var k=0; k<props.length;k++) { //apply all selected properties
                            try {
                                comp.layers[j].effect(fx[l].name)(props[k].name).setValue(props[k].value);
                            } catch (error) {
                                //pass
                            }
                        }
                        k=0;
                    }
                } catch(e) {
                    //pass. sometimes if undefined the if statement dies
                }
            }
            if(recursive == true && comp.layers[j].source instanceof CompItem) {
                propCopier(comp.layers[j].source, fx, props, true);
            }
        }
    }

    //on finding the same effect as fx in any layer of ANY comp, replaces
    //the values of all props with the ones in props.
    function ultimatePropCopier(fx, props) {
        //brute force recursion over everything
        for(var i=1; i<=app.project.items.length; i++) {
            if(app.project.items[i] instanceof CompItem) {
                propCopier(app.project.items[i], fx, props);
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
})();