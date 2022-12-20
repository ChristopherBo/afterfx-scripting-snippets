//ahr_keyframeCollapser.jsx v1.1
// Copyright (c) 2022 AHRevolvers. All rights reserved.
//
// This script will collapse selected keyframes so there is no gap between them.
//
//Changelog:
//  - fixed a bug where accidentally selecting non-keyframed properties crashed the script
//  - fixed a bug where selecting only 1 keyframe on a property crashed the script
//
//Legal stuff:
// Permission to use, copy, modify, and/or distribute this software for any
// purpose with or without fee is hereby granted, provided that the above
// copyright notice and this permission notice appear in all copies.
//
// This script is provided "as is," without warranty of any kind, expressed
// or implied. In no event shall the author be held liable for any damages
// arising in any way from the use of this script.
//
(function ahr_collapseKeyframes(thisObj) {
    var ahr_collapseKeyframes = new Object();	// Store globals in an object
	ahr_collapseKeyframes.scriptName = "ahr_collapseKeyframes";
	ahr_collapseKeyframes.scriptTitle = ahr_collapseKeyframes.scriptName + "v1.1";
    
        //base checks before starting
        // Check that a project exists
        if (app.project === null) {
            alert("Project does not exist!");
            return false;
        }

        // Check that an active comp exists
        if (app.project.activeItem === null) {
            alert("There is no active comp!");
            return false;
        }

        // Check that there's a selected property
        if (app.project.activeItem.selectedProperties.length == 0) {
            alert("There is no selected properties!");
        }
        
        app.beginUndoGroup("Collapse Keyframes Script");

        //initalize important variables
        var properties = app.project.activeItem.selectedProperties; //selected properties
        var compfps = app.project.activeItem.frameRate;
        var prop;
        var keys;

        //we can't just read then modify per property because it deselects the selected keys
        //we need to read and save all the selected keys then go modify them
        
        //read time
        //would've used lists here but they dont always mantain order so dicts it is
        var selectedKeys = {};
        var selectedProps = {};
        for(var i=0; i < properties.length; i++) {
            //get the current prop and respective keys
            prop = properties[i];
            //do a deep copy of the keys so it doesn't get modified when keys get added/removed
            keys = [];
            for(var j=0; j < prop.selectedKeys.length; j++) {
                keys[j] = prop.selectedKeys[j];
            }
            //add to respective dicts
            selectedProps[i] = prop;
            selectedKeys[i] = keys;
        }

        //write/mod time
        //for each property if there are multiple rows of keyframes selected
        for(var i=0; i < properties.length; i++) {
            prop = selectedProps[i];
            keys = selectedKeys[i];
            if(keys[1] == undefined || keys[1] == null) {
                //there's 0 or 1 keys selected for this property, so do nothing
            } else {
                var firstKeyframeTime = prop.keyTime(keys[0]);
                var frameCounter = 1;
                //loop through all the keys in the specific property
                for(var j=keys[1]; j <= keys[keys.length-1]; j++) {
                    //you can't "move" a key, you can only make a new one and delete the old ones
                    //get key time before moving it
                    var keyAttributes = getKeyAttributes(prop, j);
                    //delete original keyframe
                    prop.removeKey(j);
                    //makeKeyAtTime(prop, keyAttributes, firstKeyframeTime+((frameCounter)/compfps));
                    makeKeyWithAttributes(prop, keyAttributes, firstKeyframeTime+((frameCounter)/compfps));
                    frameCounter++;
                }
            }
            
        }
        app.endUndoGroup();

    //next functions are written by stibinator
    //source: https://github.com/stibinator/AEScripts/blob/master/Stibs%20AEScripts/(lib)/copyproperties-makekey.jsx
    //protected under gpl license
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
    
        if (theAttributes.isSpatial) {
            theAttributes.keyInSpatialTangent =
                theProperty.keyInSpatialTangent(keyIndex);
            theAttributes.keyOutSpatialTangent =
                theProperty.keyOutSpatialTangent(keyIndex);
        }
        return theAttributes;
    }
    
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
                return false;
            }
        } else {
            return false;
        }
    }
})(this);