//ahr_setUpStreams.jsx
//Version: v1
//
//This script will import everything for you and organize it!
//
//Changelog:
//  - Bugfixes:
//      - Fixed crashing on trying to import unsupported filetypes
//      - General bugfixes around importing streams 1 subfolder deep
//      - General bugfixes around importing streams 2 subfolders deep however project becomes a little messy
//      - Fixed Keylight keying the wrong color
//      - Fixed spaces and other symbols appearing as %20
//      - Fixed progress bar text not updating
//      - Doesn't duplicate effects on depthFX
//      - Formatted folder selection type as radio buttons so you can't click two different format types
//
//  - Quality of Life:
//      - Integrated the necessary AEQuery functions into this script
//      - Added support for almost all video formats and image sequences
//      - Support for any number of subdirectories
//      - Based comp settings on the median params of the entire folder, not just a random file in the folder
//      - Added a UI for adding custom depth effects to every comp that has a depth layer in it
//      - Added a bunch of catches for stability
//      - Added a progress bar
//      - Organized file structure in a similar way to how it was in file explorer
//      - Makes only 1 depthFX solid and distributes it across all comps to avoid clutter
//      - Supports 1 folder/scene organization almost completely (probably am missing some formats)
//      - When there's only 1 item in a folder a comp isn't created anymore
//      - If a subfolder has no items it gets deleted
//      - Overhauled depth layer detection for adding depthFX based on name detection from earlier
//      - Added support for organizing files by name instead of any folders (kinda shit)
//      - Add a "debug mode" so users can send me a detailed error message of what went wrong for easier debugging
//      - Add rgb depth support (via an external .ffx)

(function ahr_SetupStreams() {
    //alert("beginning of func")
    //first couple of functions from AEQuery which is handled under an MIT license.
    //get the full script here: https://github.com/aenhancers/aequery

    setDefault = function ( value, defaultVal ) {
        return typeof value == 'undefined' ? defaultVal : value;
    }

    function isPlainObject (obj) {
        // Not plain objects:
        // - Any object or value whose internal [[Class]] property is not "[object Object]"
        // - After Effects objects
        if ( obj === undefined || obj === null ) {
            return false;
        }
        if ( obj.toString() !== '[object Object]' ) {
            return false;
        }
    
        if ( obj.constructor &&
                !obj.constructor.prototype.hasOwnProperty( 'isPrototypeOf' ) ) {
            return false;
        }
    
        // If the function hasn't returned already, we're confident that
        // |obj| is a plain object, created by {} or constructed with new Object
        return true;
    };
    
    function extend() {
        var options, name, src, copy, copyIsArray, clone,
            target = setDefault( arguments[0], {}),
            i = 1,
            length = arguments.length,
            deep = false;
    
        // Handle a deep copy situation
        if ( typeof target === 'boolean' ) {
            deep = target;
    
            // Skip the boolean and the target
            target = setDefault( arguments[i], {});
            i++;
        }
    
        // Handle case when target is a string or something (possible in deep copy)
        if ( typeof target !== 'object' && !target instanceof Function ) {
            target = {};
        }
    
        // Extend itself if only one argument is passed
        if ( i === length ) {
            target = this;
            i--;
        }
    
        for ( ; i < length; i++ ) {
            // Only deal with non-null/undefined values
            if ( ( options = arguments[i] ) !== null ) {
                // Extend the base object
                for ( name in options ) {
                    // Skip modified prototype props
                    if ( !options.hasOwnProperty( name ) ) {
                        continue;
                    }
    
                    src = target[name];
                    copy = options[name];
    
                    // Prevent never-ending loop
                    if ( target === copy ) {
                        continue;
                    }
    
                    // Recurse if we're merging plain objects or arrays
                    if ( deep && copy && (isPlainObject( copy ) ||
                        ( copyIsArray = copy instanceof Array ) ) ) {
                        // eslint-disable-next-line
                        if ( copyIsArray ) {
                            copyIsArray = false;
                            clone = src && src instanceof Array ? src : [];
                        } else {
                            clone = src && isPlainObject( src ) ? src : {};
                        }
    
                        // Never move original objects, clone them
                        target[name] = extend( deep, clone, copy );
    
                    // Don't bring in undefined values
                    } else if ( copy !== undefined ) {
                        target[name] = copy;
                    }
                }
            }
        }
    
        // Return the modified object
        return target;
    };
    
    function normalizeCollection( collection ) {
        // Because collection objects have a range [1...length], which is not ideal.
        // This returns an array with all objects in the collection.
        var ret = Array.prototype.slice.call( collection, 1 );
        var len = collection.length;
    
        // Because the last object is at index Collection.length and slice only goes up to
        // length - 1, we have to push the last object to the return value
        if ( len !== 0 ) {
            ret.push( collection[len] );
        }
        return arrayEx( ret );
    };
    
    function getItemsDeep( folder, returnArrayEx ) {
        var item,
            items = [],
            len = folder.items.length;
    
        for ( var i = 1; i <= len; i++ ) {
            item = folder.items[i];
            if ( item instanceof FolderItem ) {
                // Add all items in subfolder to the `items` array.
                items.push.apply(items, getItemsDeep(item, false));
            }
            items.push( item );
        }
    
        // Skip converting to arrayEx when function is called by it self.
        if ( returnArrayEx === false ) {
            return items;
        }
        return arrayEx( items );
    };
    
    function getItems(folder, deep) {
        // If no arguments are given, just return all items in project.
        if (folder === undefined) {
            return normalizeCollection(app.project.items);
        }
    
        deep = setDefault(deep, true);
        folder = getFolder(folder);
        if ( folder === null ) {
            return arrayEx();
        }
    
        if (deep) {
            return getItemsDeep(folder);
        }
    
        return normalizeCollection(folder.items);
    };

    function getFolder (folderPath) {
        if(folderPath instanceof FolderItem) {
            return folderPath;
        }

        var folder = folderPath instanceof Folder ? folderPath : new Folder( folderPath );

		if ( !folder.exists ) return null;

		return folder;
    };
    
    function getFiles (folderPath, filter) {
        filter = setDefault( filter, '' );
        var folder = getFolder(folderPath),
            files;
    
        files = folder.getFiles( filter );
    
        if ( files === null || files.length === 0 ) return null;
    
        return arrayEx(files);
    };
    
    function arrayEx (arr) {
        arr = setDefault( arr, [] );
    
        if ( arr._init ) return arr;
    
        arr._init = true;
    
        extend( arr, arrayEx );
        return arr;
    };

    var ahr_SetupStreams = new Object();	// Store globals in an object
	ahr_SetupStreams.scriptName = "Setup Streams";
	ahr_SetupStreams.scriptTitle = ahr_SetupStreams.scriptName + "v1";
	
	// Check that a project exists
	if (app.project === null)
		return;
    
    //first things first: get the folder from the user
    //from https://github.com/NTProductions/reading-files-script/blob/master/File%20Reader.jsx
    //////////////////////////////////////////
    //MAIN UI
    //////////////////////////////////////////
    var mainWindow = new Window("palette", "AHRevolver's Streams Setup v1", undefined);
    mainWindow.orientation = "column";

    //folder selection
    var groupOne = mainWindow.add("group", undefined, "groupOne");
    groupOne.orientation = "row";
    var fileLocBox = groupOne.add("edittext", undefined, "Selected Folder Location");
    fileLocBox.size = [150, 20];
    var getFileButton = groupOne.add("button", undefined, "Folder...");
    getFileButton.helpTip = "Select a folder with your video layers";

    //depth effect prompt and listbox
    //help from: https://github.com/NTProductions/scriptui-listbox/blob/main/ScriptUI%20Listbox.jsx
    var groupThree = mainWindow.add("group", undefined, "groupThree");
    groupThree.orientation = "column";
    var depthPanel = groupThree.add("panel", undefined, "(Optional) Select the depth effect(s) you want to use.");
    //var depthText = groupThree.add("statictext", undefined, "(Optional) Select the depth effect(s) you want to use.");
    var listBox = depthPanel.add("listbox", undefined, []);
    listBox.selection = 0;
    listBox.size = [200, 60];

    //effect dropdown button
    var effectList = depthPanel.add("dropdownlist", undefined, getAllEffectNames());
    effectList.size = [250, 25];
    effectList.selection = 0;

    //adding and removing depth effects buttons
    var groupButtons = depthPanel.add("group", undefined, "groupButtons");
    groupButtons.orientation = "row";
    var addButton = groupButtons.add("button", undefined, "+");
    addButton.size = [25, 25];
    var minusButton = groupButtons.add("button", undefined, "-");
    minusButton.size = [25, 25];
    var counter = 0;

    //extra effect options
    var groupOptions = mainWindow.add("group", undefined, "groupOptions");
    groupOptions.orientation = "column";
    var groupPanel = groupOptions.add("panel", undefined, "File Organization");
    var folderOrganization = groupPanel.add("radiobutton", undefined, "1 shot per folder (recommended)");
    folderOrganization.value = true;
    var semiFolderOrganization = groupPanel.add("radiobutton", undefined, "1 scene per folder");
    semiFolderOrganization.value = false;
    var fileOrganization = groupPanel.add("radiobutton", undefined, "Detect frags by name");
    fileOrganization.value = false;
    var rgbDepth = groupOptions.add("checkbox", undefined, "RGB Depth");
    rgbDepth.value = false;
    var debug = groupOptions.add("checkbox", undefined, "Debug Program");
    debug.value = false;


    //setup button
    var groupTwo = mainWindow.add("group", undefined, "groupTwo");
    groupTwo.orientation = "row";
    var setupButton = groupTwo.add("button", undefined, "Set up!");

    mainWindow.center();
    mainWindow.show();

    addButton.onClick = function () {
        //if effect hasn't been added already
        if(myIndexOf(listBox.items, effectList.selection) == -1) {
            counter++;
            //params: what we want to add, what is going to be inside of that item
            //source: https://www.youtube.com/watch?v=uWKvKQ9pVuI&ab_channel=NTProductions
            listBox.add("Item", String(effectList.selection));
            listBox.selected = effectList.selected;
            if(counter > 2) {
                listBox.size = [200, 10+(counter*25)];
            }
        }
    }

    minusButton.onClick = function() {
        if(listBox.items != null) {
            counter--;
            if(listBox.selection != null | listBox.selection != undefined) {
                listBox.remove(listBox.selection);
            } else {
                listBox.remove(listBox.items[listBox.items.length-1]);
            }
            if(counter < 3) {
                listBox.size = [200, 60];
            }
        } 
    }

    var check;
    var debugFile;

    getFileButton.onClick = function() {
        file = Folder.selectDialog("Open a folder", "Acceptable Types: Folder");
        fileLocBox.text = file.fsName;
        check = 1;
    }

    setupButton.onClick = function() {
        mainWindow.close();
        //if debug is true make a debug.txt file in the same dir as the script
        if(debug.value == true) {
            var scriptFolderPath = File($.fileName).path;
            debugFile = new File(scriptFolderPath + encodeURI("/log.txt"));
            //if dont have write access alert and close
            try {
                writeFile(debugFile, "Debug session started." + "\n");
            } catch(error) {
                alert("Error: Enable Preferences > Scripting & Expressions > Allow Scripts to Write Files and Access Network");
                return null;
            }   
        }

        //////////////////////////////////////////
        //PROGRESS BAR UI
        //////////////////////////////////////////
        writeFile(debugFile, "Setting up progress bar..." + "\n");

        var progressWindow = new Window("palette", "Progress Bar", undefined);
        //var progressGroup = progressWindow.add("group", undefined, "progressWindow");
        var progressBar = progressWindow.add("progressbar", undefined, "");
        progressBar.minValue = 0;
        progressBar.maxValue = 100;
        var progressText = progressWindow.add("statictext", [20, 20, 200, 35], "Detecting files...");
        progressWindow.center();
        progressWindow.show();
        progressBar.value = 1
        progressWindow.update();

        writeFile(debugFile, "Progress bar complete." + "\n");
        
        //lets start importing files, but first we need to get them
        //if user didn't select a directory make them
        if(check == 0) {
            alert("Please select a file");
            return false;
        }
        //alert("Beginning to setup...")
        app.beginUndoGroup(ahr_SetupStreams.scriptName);
        var rootFolder = fileLocBox.text;
        //alert("rootFolder: " + rootFolder);

        try {
            var files = getFiles(rootFolder);
        } catch(error) {
            alert("Error! No files or folders in folder selected!");
            return false;
        }
        
        //if there are subdirectories in the directory lets use a recursive approach
        //for folder by folder; otherwise we can just mass import everything at the same time

        //check to see if there are any folders
        //alert("checking to see if there are folders...");
        
        var foldersExist = 0;
        var filesExist = 0;
        for(var i=0; i < files.length; i++) {
            if (files[i] instanceof Folder) {
                foldersExist = foldersExist + 1;
            } else if (files[i] instanceof File) {
                filesExist = filesExist + 1;
            }
        }

        writeFile(debugFile, "Files found in root folder:" + filesExist + "\n");
        writeFile(debugFile, "Folders found in root folder:" + foldersExist + "\n");
        writeFile(debugFile, "Importing folders..." + "\n");
        //alert("folders: " + foldersExist + "\nfiles: " + filesExist);
        //alert("files.length: " + files.length);
        
        //////////////////////////////////////////
        //IMPORTING FILES AND FOLDERS
        //////////////////////////////////////////
        
        var allFiles = [];
        //import all folders and subdirectories
        progressBar.value = 5;
        progressText.text = "Importing files and folders...";
        progressWindow.update();

        //folder way
        if(folderOrganization.value == true || fileOrganization.value == true || semiFolderOrganization.value == true) {
            //strat: make sure there are folders, then import all folders recursively
            //fileOrganzation is incorporated in importFolder- folders wont be made there
            if (foldersExist != 0) {
                // alert("importing folders...");
                // for every folder import the clips and put them in an ae folder
                try {
                    recursiveImportFolders(files, rootFolder);
                } catch(error) {
                    alert("Error: Could not import folders!");
                    writeFile(debugFile, "Error: Could not import folders!");
                    return false;
                }
                //alert("imported folders!");
            } else {
                try {
                    //import the file
                    importFolder(rootFolder);
                } catch(error) {
                    alert("Error: Could not import rootFolder's subfiles!");
                    writeFile(debugFile, "Error: Could not import rootFolder's subfiles!");
                    return false;
                }
            }
            writeFile(debugFile, "Imported all folders." + "\n");
        }
        if(fileOrganization.value == true) {
            var items = [];
            for(var i=1; i < app.project.items.length+1; i++) {
                items.push(app.project.items[i]);
            }
            splitFolder(app.project, items, undefined);
            
        }
        if(semiFolderOrganization.value == true) {
            //if 1 frag per folder divide each into subfolders
            var files = getItems();
            var type = undefined;
            for(var i=1; i < files.length+1; i++) {
                if (files[i] instanceof FolderItem && files[i].name != "Comps" && files[i].name != "Solids") {
                    //make sure the folder has files first
                    //if it doesnt dont do anything 
                    //try {
                    var subFiles = getItems(files[i]);
                    type = splitFolder(files[i], subFiles, type);
                    //} catch(error) {
                        //alert("Error! No files or folders in folder selected!");
                    //}
                }
            }
        }
        if(folderOrganization.value != true && fileOrganization.value != true && semiFolderOrganization.value != true) {
            alert("Error! Didn't choose an import type! Returning...");
            writeFile(debugFile, "Error: Didn't choose an import type! Closing...\n");
            return false;   
        }

        writeFile(debugFile, "Deleting folders with no items in them...\n");
        //delete folders with nothing in them
        var folders = getItems();
        for(var i=0; i < folders.length; i++) { 
            if(folders[i] instanceof FolderItem) {
                if(folders[i].numItems == 0) {
                    folders[i].remove();
                }
            }
        }
        writeFile(debugFile, "Finished deleting empty folders.\n");

        //////////////////////////////////////////
        //MEDIAN PARAMS AND MAIN COMP CREATION
        //////////////////////////////////////////
        writeFile(debugFile, "Getting median params of all items...\n");

        progressBar.value = 50;
        progressText.text = "Creating and Organizing Comps...";
        progressWindow.update();
        //We'll be storing all our comps in this folder
        var compFolder = app.project.items.addFolder("Comps");
        //placeholder comps for the solids to go into
        var placeholderComp = app.project.items.addComp("placeholderComp", 1920, 1080, 1, 1, 24);
        //grab all files in the PROJECT
        folders = getItems();

        //create the main comp using metadata from an example video
        var finalComp;
        var exampleFile;
        var pixelAspect;
        var duration;
        var frameRate;
        var realFile;
        var realPixelAspect;
        var realDuration;
        var realFrameRate;
        for(var i=0; i < folders.length; i++) { 
            if(folders[i] instanceof FolderItem) {
                var params = medianParams(app.project.items, true);
                if (params != null || params != undefined) {
                    exampleFile = params[0];
                    pixelAspect = params[1];
                    duration = params[2];
                    frameRate = params[3];
                    if(exampleFile != null && exampleFile != undefined) {
                        realFile = exampleFile;
                        realPixelAspect = pixelAspect;
                        realDuration = duration;
                        realFrameRate = frameRate;
                    }
                }
            }
        }
        writeFile(debugFile, "Median params obtained.\nCreating main comp...\n");
        finalComp = app.project.items.addComp("Main", realFile.width, realFile.height, realPixelAspect, realDuration, 24); //24 fps
        writeFile(debugFile, "Main comp created.\n");
        //////////////////////////////////////////
        //CREATE AND ORGANIZE COMPS
        //////////////////////////////////////////

        progressBar.value = 60;
        progressText.text = "Creating and Organizing Comps...";
        progressWindow.update();
        writeFile(debugFile, "Creating and Organizing Comps...\n");
        
        //Make and organize comps per folder (except for comps folder)
        for(var i=1; i < folders.length+1; i++) {
            if (folders[i] instanceof FolderItem && folders[i].name != "Comps" && folders[i].name != "Solids") {
                //make sure the folder has files first
                var subfilesExist = false;
                for (var j=1; j < folders[i].items.length+1; j++) {
                    if (folders[i].items[j] instanceof FootageItem) {
                        subfilesExist = true;
                    }
                }
                if(subfilesExist == true) {
                    //make sure that the folder isnt directly related to root if
                    //semiFolderOrg is on
                    if(semiFolderOrganization.value == true && folders[i].parentFolder.name != "Root" || semiFolderOrganization.value == false) {
                        writeFile(debugFile, "Creating comp: " + folders[i].name + ".\n");
                        var comp = createComp(folders[i], compFolder);
                        if ((comp != null || comp != undefined) && comp instanceof CompItem) {
                            writeFile(debugFile, "\tFilling comp: " + folders[i].name + ".\n");
                            fillComp(comp, folders[i]);
                            writeFile(debugFile, "\tOrganizing comp: " + folders[i].name + ".\n");
                            organizeComp(comp);
                            finalComp.layers.add(comp);
                            writeFile(debugFile, "Completed comp: " + folders[i].name + ".\n");
                        } else if(folders[i].name == "Solids") {
                            var i=0; //we dont care if its the solids folder
                        } else if(comp == null || comp == undefined) {
                            //only should be called if null or undef; false means it shouldnt be alerted
                            alert("Comp " + folders[i].name + " could not be created!");
                            writeFile(debugFile, "Comp " + folders[i].name + "could not be created!\n");
                        }
                    } else if (folders[i].parentFolder.name == "Root") {
                        var files = getItems(folders[i]);
                        if(files.length < 2) {
                            //if 1 file dump it in the main comp
                            //if no files do nothing
                            if(files.length == 1) {
                                var items = app.project.items;
                                for(var j=1; j < items.length; j++) {
                                    if(items[j].name == "Main" && items[j] instanceof CompItem) {
                                        items[j].layers.add(files[0]);
                                    }
                                }
                            }
                        }
                    }
                    //probably should note that files with no files will not alert here
                }
            }
        }

        //////////////////////////////////////////
        //REMOVE PLACEHOLDER ITEMS
        //////////////////////////////////////////

        //remove placeholder solids from making comps
        //refesh folders to see placeholders in it
        folders = getItems();

        progressBar.value = 90;
        progressText.text = "Removing temp items...";
        progressWindow.update();

        writeFile(debugFile, "Removing placeholder items.\n");
        //iterate thru to find solids and remove them
        try{
            for(var i=0; i < folders.length; i++) {
                if (folders[i].mainSource instanceof SolidSource && folders[i].name == "PLACEHOLDER") {
                    folders[i].remove();
                } else if (folders[i] instanceof CompItem && folders[i].name == "placeholderComp") {
                    folders[i].remove();
                }
            }
        } catch(error) {
            alert("Could not remove placeholder item(s). Continuing...");
            writeFile(debugFile, "Error: Could not remove placeholder items.\n");
        }

        //////////////////////////////////////////
        //ADD DEPTH FX
        //////////////////////////////////////////

        progressBar.value = 95;
        progressText.text = "Adding depth fx...";
        progressWindow.update();

        writeFile(debugFile, "Adding depthfx...\n");

        //refesh folders to not get invalids from deleted items
        folders = getItems();

        var depthfx = null; //consistent solid we're going to use

        //add depth effects to each comp as asked for
        for(var i=0; i < folders.length; i++) {
            //if the folder is a comp and not named main
            if (folders[i] instanceof CompItem && folders[i].name != "Main") {
                try {
                    writeFile(debugFile, "Adding depthfx for comp " + folders[i].name + ".\n");
                    depthfx = addDepthFX(folders[i], depthfx);
                    writeFile(debugFile, "Depthfx added to comp " + folders[i].name + ".\n");
                } catch(error) {
                    //if I can't access folders[i] should still output an error message
                    try {
                        writeFile(debugFile, "Error: Could not add depth effects on " + String(folders[i].name) + ". Continuing...\n");
                        alert("Error: Could not add depth effects on " + folders[i].name + "! Continuing...");
                    } catch(error) {
                        writeFile(debugFile, "Error: Could not add depthfx and can't access folder index. Continuing...\n");
                        alert("Error: Could not add depth effects and can't access folder index. Continuing...")
                    }
                }
            }
        }
        writeFile(debugFile, "Finished adding depthfx.\n");

        //////////////////////////////////////////
        //REMOVE PLACEHOLDER COMP FROM DEPTHFX PLACEMENT
        //////////////////////////////////////////

        //remove placeholder solids from making comps
        //refesh folders to see placeholders in it
        folders = getItems();

        progressBar.value = 98;
        progressText.text = "Removing depthfx temp items...";
        progressWindow.update();
        writeFile(debugFile, "Removing depthfx temp items...\n");

        //iterate thru to find solids and remove them
        try{
            for(var i=0; i < folders.length; i++) {
                if (folders[i] instanceof CompItem && folders[i].name == "PLACEHOLDER DEPTHFX") {
                    folders[i].remove();
                    i=folders.length+1;
                }
            }
        } catch(error) {
            alert("Could not remove placeholder comp from depth effect placement. Continuing...");
            writeFile(debugFile, "Error: Could not remove placeholder comp from depthfx placement.\n");
        }
        writeFile(debugFile, "Depthfx temp items removed.\n");
        writeFile(debugFile, "Program completed.\n");

    }

    //write to files.
    //sauce: https://community.adobe.com/t5/after-effects-discussions/create-a-txt-file-in-extendscript/td-p/9645024
    function writeFile(fileObj, fileContent, encoding) {
        if(debug.value != true) {
            return false;
        }
        encoding = encoding || "utf-8"; //if none use utf-8, standard for web
        //if its not a file create a new file
        fileObj = (fileObj instanceof File) ? fileObj : new File(fileObj);
        //if the parent folder DNE and can't create it throw error
        var parentFolder = fileObj.parent;
        if (!parentFolder.exists && !parentFolder.create())
            throw new Error("Cannot create file in path " + fileObj.fsName);
        //write in file
        fileObj.encoding = encoding;
        fileObj.open("a"); //append, w is write but that also deletes everything else in the file
        fileObj.write(fileContent);
        fileObj.close();
        return fileObj;
    }

    //array.indexOf(x) implementation for ye olde js3
    //sauce: https://www.aenhancers.com/viewtopic.php?t=1522
    function myIndexOf(array, x) {
        for(var i=0; i < array.length; i++) {
            if(String(array[i]) == String(x)) {
                return i;
            }
        }
        return -1;
    }

    //gets all of the effect names and returns them in an array
    //source: https://www.youtube.com/watch?v=Or1z-J8KOlM&ab_channel=NTProductions
    function getAllEffectNames() {
        var names = [];
        var effects = app.effects;
        for(var i=0; i < effects.length; i++) {
            names.push(effects[i].displayName);
        }
        return names;
    }

    //gets the effect property from it's name
    function getEffectFromName(name) {
        var effects = app.effects;
        for(var i=0; i < effects.length; i++) {
            //encapsulated in String because they aren't string primitives
            if(String(name) == String(effects[i].displayName)) {
                //they matched
                return effects[i];
            }
        }
        return null; //couldnt find the effect somehow
    }

    //imports a singular (file directory) folder and it's contents.
    //takes input param of the parent folder.
    function importFolder(targetFolder, parentFolderr) {
        writeFile(debugFile, "Importing folder " + String(targetFolder) + " with a potential parent folder of " + String(parentFolderr) + "\n");
        //create the folder in the comp
        //grab the folder's name by itself so we can name the ae folder properly
        //alert("importing " + parentFolder + "...");
        var folder;
        var files;
        try {
            //folder items have .name as an attribute; filepaths need to be split
            if(targetFolder != undefined && targetFolder != null && targetFolder.name != undefined && targetFolder.name != null) {
                folder = targetFolder.name;
                files = getFiles(targetFolder.fullName);
            } else {
                //split it on directory
                if (targetFolder.indexOf("/") !== -1) {
                    folder = targetFolder.split("/")[targetFolder.split("/").length-1];
                } else {
                    folder = targetFolder.split("\\")[targetFolder.split("\\").length-1];
                }
                files = getFiles(targetFolder);
            }
            folder = decodeURI(folder);
            folder = folder.replace(/%20/g, " ");
        } catch (error) { //if the parentFolder doesnt exist
            alert("Folder attempted does not exist!");
                writeFile(debugFile, "importFolder: Folder attempted does not exist." + "\n");
            return null;
        }
            
            //create the folder
            //TODO: if folder exists alert user and rename to folderName (script)
        if(fileOrganization.value == false) {
            var folderTarget = app.project.items.addFolder(folder);
        }
        //alert("Created " + folder + "!");

        if(files == null) { //if there are no files in the folder dont iterate
            return false, [];
        }

        //alert("files length: " + files.length);
        var subfoldersExist = false;
        var subfolders = [];

        //import the files into the folder
        allowedFilesArray = ['crm', 'mxf', '3gp', '3g2', 'amc', 'swf', 'flv', 'f4v', 'gif', 
                            'm2ts', 'm4v', 'mxf', 'mpg', 'mpe', 'mpa', 'mpv', 'mod', 'mpg', 
                            'm2p', 'm2v', 'm2p', 'm2a', 'm2t', 'mp4', 'm4v', 'omf', 'mov', 
                            'avi', 'wmv', 'wma', 'mxf', 'mp4', 'aac', 'm4a', 'aif', 'aiff', 
                            'mp3', 'mpeg', 'mpg', 'mpa', 'mpe', 'wav'];
        allowedSequenceArray = ['ai', 'eps', 'ps', 'pdf', 'psd', 'bmp', 'rle', 'dib', 
                                'tif', 'crw', 'nef', 'raf', 'orf', 'mrw', 'dcr', 'mos', 
                                'raw', 'pef', 'srf', 'dng', 'x3f', 'cr2', 'erf', 'cin', 
                                'dpx', 'gif', 'rla', 'rpf', 'img', 'ei', 'iff', 'tdi', 
                                'heif', 'exr', 'pcx', 'jpg', 'png', 'hdr', 'rgbe', 'xyze', 
                                'sgi', 'bw', 'pic', 'tga', 'icb', 'vst'];
        for(var i=0; i < files.length; i++) {
            //new RegExp(worldArray.join('|')).test(comp.layer(i).name.split(".")[0])
            if (files[i] instanceof File && new RegExp(allowedFilesArray.join('|')).test(files[i].name.split(".")[files[i].name.split(".").length-1])) {
                //check for video/audio - if it's a file and is one of the accepted video/audio formats
                var newFile = app.project.importFile(new ImportOptions(files[i]));
                //alert("newfile " + newFile.name + " fps=" + newFile.frameRate);
                if(fileOrganization.value == false) {
                    newFile.parentFolder = folderTarget;
                }
                newFile.selected = false;

                //aeq.importFile(files[i], folderTarget);
            } else if (files[i] instanceof File && new RegExp("\\d{4,}").test(files[i].name.split(".")[0]) && new RegExp(allowedSequenceArray.join('|')).test(files[i].name.split(".")[files[i].name.split(".").length])) {
                //check for sequence- if it's a file, has 4 numbers in the filename, and is one of the accepted image sequence file formats
                var sequenceStartFile = searcher.exec(files[i].name);
                if (sequenceStartFile) {
                    try {
                        //alert("Importing as sequence: " + files[i].name);
                        var importOptions = new ImportOptions(files[i]);
                        importOptions.sequence = true;
                        if(fileOrganization.value == false) {
                            importSafeWithError(importOptions, folderTarget);
                        } else {
                            importSafeWithError(importOptions);
                        }
                    } catch (error) {
                        alert("ERROR: File at " + files[i] + " could not import!");
                        writeFile(debugFile, "Could not import file: " + String(files[i].name) + "\n");
                    }
                } else {
                    //alert("Importing: " + files[i].name);
                    try {
                        var importOptions = new ImportOptions(files[i]);
                        if(fileOrganization.value == false) {
                            importSafeWithError(importOptions, folderTarget);
                        } else {
                            importSafeWithError(importOptions);
                        }
                    } catch (error) {
                        // ignore errors. if the file didn't import by here it will never import
                    }
                }
            } else if (files[i] instanceof Folder) {
                subfoldersExist = true;
                subfolders.push(files[i]);
            }
        }

        //parent folder
        if(parentFolderr != null && parentFolderr != undefined) {
            if(!(parentFolderr instanceof FolderItem)) {
                if(typeof parentFolderr == 'string' || parentFolderr instanceof Folder) {
                    if (typeof parentFolderr == 'string') {
                        parentFolderr = parentFolderr.split("/")[parentFolderr.split("/").length-1];
                    } else if (parentFolderr instanceof Folder) {
                        parentFolderr = parentFolderr.name;
                    }
                    parentFolderr = decodeURI(parentFolderr);
                    parentFolderr = parentFolderr.replace(/%20/g, " ");
                    var tfiles = app.project.items;
                    //grab parentFolderr via iteration
                    for(var k=1; k < tfiles.length+1; k++) {
                        if(tfiles[k].name == parentFolderr) {
                            parentFolderr = tfiles[k];
                            k = tfiles.length + 1; //end the loop
                        }
                    }
                }
            }
            //if the process didn't work just abort
            if(parentFolderr instanceof FolderItem) {
                //make sure the parentFolderr doesnt contain streams
                var requirements = 0;
                for(var k=1; k < parentFolderr.items.length+1; k++) {
                    if(parentFolderr.items[k] instanceof FootageItem) {
                        requirements++;
                        k = parentFolderr.items.length + 1;
                    }
                }
                if(requirements <= 1) {
                    folderTarget.parentFolder = parentFolderr;
                }
            }
        }
        writeFile(debugFile, "Imported folder " + String(targetFolder) + ". Subfolders Exist: " + subfoldersExist + "\n");
        return subfoldersExist, subfolders;
    }

    //recursively imports folders from the files given (aka the base folder)
    //in your hard drive
    //files = files to be imported
    //parentFolder = parent folder of the files
    //rootFolder = parent folder of parent folder
    //fileImport = if true import everything to the base project
    function recursiveImportFolders(files, parentFolder, rootFolder) {
        var subfoldersExist = false;
        var subfolders = null;
        var localImported = false;
        //parse thru and figure out if need to do a local import first
        for(var j=0; j < files.length && localImported == false; j++) {
            if (localImported == false && files[j] instanceof File) {
                importFolder(parentFolder, rootFolder);
                localImported = true;
            }
        }
        //import folders if they exist
        for(var j=0; j < files.length; j++) {
            //alert("loop number: " + j + " file: ");
            if (files[j] instanceof Folder) {
                var subfoldersExist1, subfolders1 = importFolder(String(files[j]), parentFolder);
                //alert("this is a folder");
                if(subfolders1 != null && subfolders1 != undefined && subfolders1 != '') {
                    for(var i=0; i < subfolders1.length; i++) {
                        recursiveImportFolders(getFiles(subfolders1[i]), subfolders1[i], files[j]);
                    }
                }
            }
        }
        return subfoldersExist, subfolders;
    }

    //takes input of a rootFolder and a list of items
    //detects what items belongs with what and subdivides the folder
    //by creating subfolders
    //type = if this func was called before
    function splitFolder(rootFolder, items, type) {
        //if theres 0 or 1 items just return
        if(items.length < 2) {
            return null;
        }

        var splitBy, regex = identify(items, type, false);

        //fragshow- only povs
        //if(cines == 0 && depth == 0 && pov > 0) {
            //don't add folders/comps at all- why are you running this script?
        if(splitBy == "powgNamesCount") {
            alert("Detected file organization for " + rootFolder.name + ": pov1, pov1d, w1, w1d, etc.");
            splitFolderSingle(regex, items, rootFolder);
        } else if(splitBy == "dash_Count") {
            alert("Detected file organization for " + rootFolder.name + ": swift-nameofthing-depth, swift-nameofthing-world, etc.");
            splitFolderSingle(regex, items, rootFolder);
        } else if(splitBy == "rexNamesCount") {
            alert("Detected file organization for " + rootFolder.name + ": 1, 1d, 2, 2d, etc.");
            splitFolderSingle(regex, items, rootFolder);
        } else if(splitBy == "roobenNamesCount") {
            alert("Detected file organization for " + rootFolder.name + ": 1-D, 1-M, 1-N, 2-D, 2-M, 2-G, etc.");
            splitFolderSingle(regex, items, rootFolder);
        } else { //elusive
            alert("Detected file organization for " + rootFolder.name + ": pov depth, cine world, cine depth, cine2 world, etc.");
            splitFolderSingle(regex, items, rootFolder);
        }

        return splitBy;
    }

    function identify(items, type, depthRegexBool) {
        //identify item groups
        //items = files
        //type = if an existing type should be used
        //depthRegexBool = bool if regex should be full expression or not include the depth/matte bit
        //dictionary of "namingscheme":count
        var groupNames = {};
        //naming types
        var passNames = [/^depth/, /depth$/, /^gs/, /gs$/, /^matte/, /matte$/];
        var passRegex = new RegExp(passNames.join('|'));
        
        var depthRegex = [/^depth/, /depth$/, /d$/];
        var depthRegex = new RegExp(depthRegex.join('|'));

        var passNamesCount = 0; 
        var powgNamesCount = 0; //pov1d, pov1, cine1d, cine2, cine2d
        var dash_Count=0; //swift-nameofthing-depth, swift-nameofthing, nameofthing-depth, nameofthing-normal
        var dash_List = []; //contains base names of dashes- swift-nameofthing-, nameofthing-, etc
        var rexNamesCount = 0; //1, 1d, 2, 2d- no differentiation betw/ pov and cines
        var roobenNamesCount = 0; //1-D, 1-M, 1-M
        var elusiveNamesCount = 0; //pov depth, cine world, cine depth, cine2 world, etc
        var comparisonList = ["powgNamesCount", "dash_Count", "rexNamesCount", "roobenNamesCount", "elusiveNamesCount"];
        var comparisonRegex = [/[a-zA-Z0-9]+[0-9]/, /[a-zA-Z0-9]+(-|_){1}[a-zA-Z 0-9]+/, /\d/, /\d*-/, /(pov|cine\d*)/];

        //if func was already called before (type != null) skip straight to folder subdiv
        if (type != null && type != undefined) {
            alert("Using preexisting count " + type);
            splitFolderSingle(comparisonRegex[myIndexOf(comparisonList, type)], items, rootFolder);
            return type;
        }

        //general stats
        var depth = 0;
        var cines = 0;
        var pov = 0;
        var j;
        try {
            if(items[0] != null && items[0] != undefined) {
                //if this crashes items[0] DNE
                j = 0;
            } else {
                j = 1;
            }
        }
        catch(error) {
            j = 1;
        }
        for(j; j < items.length; j++) {
            //id what type the footage is labeled
            if (items[j] instanceof FootageItem) {
                if(passRegex.test(items[j].name.split(".")[0])) {
                    passNamesCount++;
                    //figure out which token is the correct to count
                    //via grabbing the largest token
                    var tokens = items[j].name.split(".")[0].split(passRegex)
                    var greatest = "s";
                    for(var i=0; i < tokens.length; i++) {
                        if(tokens[i].length > greatest.length) {
                            greatest = tokens[i];
                        }
                    }
                    //if groupname of greatest hasn't been created make it,
                    //otherwise increment it 
                    if (!groupNames[greatest]) {
                        groupNames[greatest] = 1;
                    } else {
                        groupNames[greatest]++;
                    }
                } if(new RegExp(/[a-zA-Z0-9]+[0-9]d*/).test(items[j].name.split(".")[0])) {
                    powgNamesCount++;
                } if(new RegExp(/[a-zA-Z- _]+[-,_]{1}(depth|world)$/).test(items[j].name.split(".")[0])) {
                    dash_Count++;
                } if(new RegExp(/\d+[d,n,g,m,v]/).test(items[j].name.split(".")[0]) && items[j].name.split(".")[0].length <= ((items[j].name.split(".")[0] || '').match(/\d/g) || []).length+1) {
                    //since its 1d, 1n, etc match only if is 1 char longer than the # of digits it has
                    rexNamesCount++;
                } if(new RegExp(/\d+-[D,M,G,W,V]/).test(items[j].name.split(".")[0])) {
                    roobenNamesCount++;
                } if(new RegExp(/(pov|cine\d*) (depth|world|viewmodel|matte|greenscreen)/).test(items[j].name.split(".")[0])) {
                    elusiveNamesCount++;
                } 
                //id if its pov/cine/depth/etc if possible
                if(passRegex.test(items[j].name)) {
                    depth++;
                }
                //id if its a pov
                if(new RegExp("pov").test(items[j].name)) {
                    pov++;
                }
                //id if its a cine (probably won't work)
                if(new RegExp("cine").test(items[j].name)) {
                    cines++;
                }
            }
        }
        
        if(depthRegexBool == false) {
            if(powgNamesCount > dash_Count && powgNamesCount > rexNamesCount && 
                powgNamesCount > roobenNamesCount && powgNamesCount > elusiveNamesCount) {
                return "powgNamesCount", /[a-zA-Z0-9]+[0-9]/;
            } else if(dash_Count > rexNamesCount && dash_Count > roobenNamesCount && dash_Count > elusiveNamesCount) {
                return "dash_Count", /(?!depth)[a-zA-Z- _]+[-,_]/;
            } else if(rexNamesCount > roobenNamesCount && rexNamesCount > elusiveNamesCount) {
                return "rexNamesCount", /\d/;
            } else if(roobenNamesCount > elusiveNamesCount) {
                return "roobenNamesCount", /\d*-/;
            } else { //elusive
                return "elusiveNamesCount", /(pov|cine\d*)/;
            }
        } else {
            if(powgNamesCount > dash_Count && powgNamesCount > rexNamesCount && 
                powgNamesCount > roobenNamesCount && powgNamesCount > elusiveNamesCount) {
                return "powgNamesCount", /[a-zA-Z0-9]+[0-9]d+/;
            } else if(dash_Count > rexNamesCount && dash_Count > roobenNamesCount && dash_Count > elusiveNamesCount) {
                return "dash_Count", /[a-zA-Z- _]+[-,_]{1}depth+$/;
            } else if(rexNamesCount > roobenNamesCount && rexNamesCount > elusiveNamesCount) {
                return "rexNamesCount", /\d+[d]+/;
            } else if(roobenNamesCount > elusiveNamesCount) {
                return "roobenNamesCount", /\d+-[D]+/;
            } else { //elusive
                return "elusiveNamesCount", /(pov|cine\d*) depth+/;
            }
        }
        
    }

    //splits all files into subfolders via regex
    //then returns all of the filename groupings used and all the folder names
    function splitFolderSingle(regex, items, rootFolder) {
        var fileNameList = [];
        var folderList = [];
        
        for(var i=0; i < items.length; i++) {
            if(items[i] instanceof FootageItem) {
                fileName = items[i].name.match(regex); //grab the first bit - pov1, c1, etc
                //if a filename DNE create a folder and slap the file in there
                if (myIndexOf(fileNameList, fileName) == -1) {
                    fileNameList.push(fileName);
                    var folder = app.project.items.addFolder(fileName);
                    folder.name = String(fileName);
                    if(rootFolder != app.project) { //cant parent folders to proj because they already are default
                        folder.parentFolder = rootFolder;
                    }
                    folderList.push(folder);
                    items[i].parentFolder = folder;
                } else {
                    //else just set the parent folder to one that already exists
                    items[i].parentFolder = folderList[myIndexOf(fileNameList, fileName)];
                }
            }
        }
        return fileNameList, folderList;
    }

    //splitFolderSingle but for dashCount only
    function splitFolderDash(items, rootFolder, list) {
        var baseNameList = [];
        var folderList = [];

        for(var i=0; i < items.length; i++) {
            if(items[i] instanceof FootageItem) {
                baseName = items[i].name.match(/(?!depth)[a-zA-Z- _]+[-,_]/);
                var folder = app.project.items.addFolder(baseName);
            }
        }
    }

    //recursively grabs all items in the project
    function getItemsAll(rootFolder) {
        if(rootFolder == null || rootFolder == undefined) {
            rootFolder = app.project.rootFolder;
        }
        var items = getItems(rootFolder);
        for(var i=0; i < items.length; i++) {
            if(items[i] instanceof FolderItem) {
                items.push(getItemsAll(items[i]))
            }
        }
        return items;
    }

    //get all files in the folder and each of its subfolders
    function getFilesRecursive(folder) {
        var
            files = getFiles(folder),
            fileArray = [],
            folder;
    
        for (var i = 0; i < files.length; i++) {
            file = files[i];
            if (file instanceof File) {
                fileArray.push(file);
            } else if (file instanceof Folder) {
                fileArray = fileArray.concat(getFilesRecursive(file));
            }
        }
        return fileArray;
    }

    //given an array of files gives back the median params in the form of a solid
    //used to create comps
    //all = all items in the project, aka app.project.items
    function medianParams(files, all) {
        //if there's nothing to parse just return
        if(files == undefined || files == null) {
            return null;
        }
        if(files.length < 2) {
            return false;
        }
        //collect variables
        var height = [];
        var width = [];
        var frameRate = [];
        var pixelAspect = [];
        var duration = [];
        var realFiles = 0;
        var i;
        if(all == true) {
            i = 1;
        } else {
            i = 0;
        }
        for(i;i < files.length; i++) {
            if (files[i] instanceof FootageItem && files[i].height != 0 && files[i].width != 0 && files[i].frameRate != 0) {
                //if a piece of footage is not an img sequence and not audio
                height.push(files[i].height);
                width.push(files[i].width);
                frameRate.push(files[i].frameRate);
                pixelAspect.push(files[i].pixelAspect);
                duration.push(files[i].duration);
                realFiles = realFiles + 1;
            }
            if(files[i].mainSource instanceof SolidSource && files[i].name == "PLACEHOLDER") {
                //this means the folder/collection of files is from the auto created Solids folder
                //SolidSource = item is a Solid
                return null
            }
        }
        //get median now
        //default values for fallback
        var nameReal = "PLACEHOLDER";
        var colorReal = "#000000";
        var heightReal = 1080;
        var widthReal = 1920;
        var frameRateReal = 30;
        var pixelAspectReal = 1.0;
        var durationReal = 5;
        //if there's only 1 usable file just set params to it
        if(realFiles == 1) {
            heightReal = height[0];
            widthReal = width[0];
            frameRateReal = frameRate[0];
            pixelAspectReal = pixelAspect[0];
            durationReal = duration[0];
        } else if(realFiles > 1) {
            heightReal = height[Math.round(height.length / 2)];
            widthReal = width[Math.round(width.length / 2)];
            frameRateReal = frameRate[Math.round(frameRate.length / 2)];
            pixelAspectReal = pixelAspect[Math.round(pixelAspect.length / 2)];
            durationReal = duration[Math.round(duration.length / 2)];
        } else if(realFiles == 0) {
            alert("medianParams: No items in this collection! Falling back...");
        }
        
        //make the solid
        var solid = app.project.item(findItemIndexByName("placeholderComp")).layers.addSolid([0, 0, 0],nameReal,widthReal,heightReal,pixelAspectReal,durationReal);
        return [solid, pixelAspectReal, durationReal, frameRateReal];

    }

    //creates a comp and throws all the assets in of
    //the given folder. not recursive.
    //creates it using first file's res, fps, and folders name
    function createComp(rootFolder, compFolder) {
        var exampleFile = null;
        //this gets the already imported files in the project
        var files = getItems(rootFolder);
        var fileArray = [];
        for(var i=0; i < files.length; i++) {
            if(files[i] instanceof FootageItem) {
                fileArray.push(files[i]);
            }
            if(files[i].mainSource instanceof SolidSource && files[i].name == "PLACEHOLDER") {
                //this would mean its a part of the solid folder
                return null;
            }
            if(files[i].name == "Comps") {
                return null;
            }
        }
        files = fileArray;

        //get an example file to base comp settings off of
        var params = medianParams(files, false);
        var exampleFile = params[0];
        var pixelAspect = params[1];
        var duration = params[2];
        var frameRate = params[3];

        //if there is no suitable example file use standard comp aspects
        if (exampleFile == undefined || exampleFile == null) {
            alert("No files in selected folder " + rootFolder.name + "! Falling back on defaults...");
            var comp = app.project.items.addComp(rootFolder.name, 1920, 1080, 1.0, 5, 24);
        } else {
            var comp = app.project.items.addComp(rootFolder.name, exampleFile.width, exampleFile.height, pixelAspect, duration, frameRate);
        }
        comp.parentFolder = compFolder;

        //delete solids made by medianParams
        for(var i=1; i < app.project.items.length+1; i++) {
            if(app.project.items[i].name == "PLACEHOLDER") {
                app.project.items[i].remove();
            }
        }

        return comp;
    }

    //fills the given comp with files from the given folder.
    function fillComp(comp, rootFolder) {
        var files = getItems(rootFolder);
        for(var i=0; i < files.length; i++) {
            if (files[i] instanceof FootageItem) {
                comp.layers.add(files[i]);
            }
        }
    }

    //organizes a comp based on conventional streams naming schemes.
    function organizeComp(comp) {
        //make sure a comp exists and has layers on it
		if ((comp === null) || !(comp instanceof CompItem)) {
			alert("This comp does not exist or is not a real comp!");
			return;
		}
		// if (comp.selectedLayers.length === 0) {
		// 	alert("This comp has no layers to organize!");
		// 	return;
		// }

        //target and identify what layers need specific modifications from their names
        var world = null;
        var depth = null;
        var players = null;
        var particles = null;
        var viewmodel = null;
        
        var worldArray = ['world', 'base', 'env'];
        var depthArray = ['depth', 'dof', 'zdepth'];
        var playersArray = ['matte', 'players', 'gs', 'greenscreen'];
        var particlesArray = ['particles', 'particular'];
        var viewmodelArray = ['gun', 'viewmodel', 'view', 'weapons'];

        //loop through files, if a filename matches
        //a given name for a stream layer assign to the
        //corresponding variable
        //filter from https://stackoverflow.com/questions/37896484/multiple-conditions-for-javascript-includes-method/37896529
        for(var i=1; i < comp.numLayers+1; i++) {
            if(new RegExp(worldArray.join('|')).test(comp.layer(i).name.split(".")[0])) {
                world = comp.layer(i);
            } else if (new RegExp(depthArray.join('|')).test(comp.layer(i).name.split(".")[0])) {
                depth = comp.layer(i);
            } else if (new RegExp(playersArray.join('|')).test(comp.layer(i).name.split(".")[0])) {
                players = comp.layer(i);
            } else if (new RegExp(viewmodelArray.join('|')).test(comp.layer(i).name.split(".")[0])) {
                viewmodel = comp.layer(i);
            } else if (new RegExp(particlesArray.join('|')).test(comp.layer(i).name.split(".")[0])) {
                particles = comp.layer(i);
            }
        }

        //if targeted layers exist, modify them
        //helpful guide: https://ae-scripting.docsforadobe.dev/layers/layer/#layer-enabled
        //if world exists slap it on the bottom
        if (world != null && world != undefined) {
            world.moveAfter(comp.layers[comp.layers.length]);
        }
        //if depth exists disable visibility and put it on top
        if (depth != null && depth != undefined) {
            var tl_maths = true;
            //if the depth is rgb and they have tl_maths convert it for them
            if (rgbDepth.value == true) {
                if (typeof app.findMenuCommandId(tl_maths) == "number") {
                    //apply preset -- needs preset to be in the same folder as the preset
                    depth.applyPreset(File("./Presets/rgbdepth.ffx"));
                } else {
                    tl_maths = false;
                }
            }
            if (tl_maths == false) {
                alert("Error! tl_maths (free plugin) is required for rgb depth conversion! Continuing...");
            }
            depth.Effects.addProperty("Levels");
            depth.enabled = false;
            if(depth != comp.layers[1]) {
                depth.moveBefore(comp.layers[1]);
            }
        }
        //if players exists add greenscreen and put it second to top
        if (players != null && players != undefined) {
            addKeylight(players);
            if (depth != null) {
                players.moveAfter(depth);
            } else {
                players.moveBefore(comp.layers[1]);
            }
        }
        //if viewmodel exists add greenscreen and put it second to top
        if (viewmodel != null && viewmodel != undefined) {
            addKeylight(viewmodel);
            if(players != null) {
                viewmodel.moveBefore(players);
            } else if (depth != null) {
                viewmodel.moveAfter(depth);
            } else {
                viewmodel.moveBefore(comp.layers[1]);
            }
        }
        //if particles exists slap keylight on it
        if (particles != null && particles != undefined) {
            addKeylight(particles);
            if(viewmodel != null) {
                particles.moveBefore(viewmodel);
            } else if(players != null) {
                particles.moveBefore(players);
            } else if (depth != null) {
                particles.moveAfter(depth);
            } else {
                particles.moveBefore(comp.layers[1]);
            }
        }
    }

    function addKeylight(layer) {
        layer.Effects.addProperty("Keylight (1.2)");
        layer.Effects("Keylight (1.2)")("Clip Black").setValue(28);
        layer.Effects("Keylight (1.2)")("Screen Colour").setValue([0, 0.85, 0, 1]);
    }

    function findItemIndexByName(searchName) {
        var projLength = app.project.items.length;
        var index = null;
    
        for (var i = 1; i <= projLength; i++) {
            var nameProperty = app.project.item(i).name;
            if ( nameProperty == searchName) {
                index = i;
                break;
            }
        }
        return index;
    }

    //adds depthfx to a comp if a user wanted depthfx
    function addDepthFX(comp, depthfx) {
        //if there aren't any depth fx don't add any
        if(listBox.items.length == 0 || comp.layers.length == 0) {
            return null;
        }
        //get depth layer to copy settings; if it doesnt exist
        //we shouldnt be doing depthFX on this comp anyways,
        //so return null
        var depth = null;
        var items = [];
        for(var i=1; i < comp.layers.length+1; i++) {
            if(comp.layers[i] instanceof FootageItem) {
                items.push(comp.layers[i]);
            }
        }
        var splitBy, regex = identify(app.project.items, undefined, true);
        regex = String(regex).split("/").join("\""); //remove /s with "s so regex array can be combined properly
        regexArray = [regex, "depth", "dof", "zdepth"];
        for(var i=1; i < comp.layers.length+1; i++) {
            if(new RegExp(regexArray.join('|')).test(comp.layers[i].name) == true) {
                depth = comp.layers[i];
                i = comp.layers.length+1;
            }
            // old method- relied on simple/unhelpful test
            // new method relies on testing many names
            // if(new RegExp("depth").test(comp.layers[i].name) == true) {
        }
        //if depth didnt exist dont do anything
        if(depth == null) {
            return depthfx;
        }

        var gamercomp;

        if (depthfx == null || depthfx == undefined) {
            //if depthfx dne create a solid and then turn it into an adj layer
            gamercomp = app.project.items.addComp("PLACEHOLDER DEPTHFX", comp.width, comp.height, comp.pixelAspect, comp.duration, comp.frameRate);
            depthfx = gamercomp.layers.addSolid([0, 0, 0],"depthFX",depth.width,depth.height,1,comp.duration);
        } else {
            gamercomp = depthfx;
        }

        depthfx = gamercomp.layer(1);
        //if depthfx is already a thing add it to comp as first layer
        gamercomp.layer(1).copyToComp(comp);
        //grab depthfx as a layer in the comp not as an item in the proj
        for(var i=1; i < comp.layers.length+1; i++) {
            if(comp.layers[i].name == "depthFX") { // && comp.layers[i].adjustmentLayer == true
                depthfx = comp.layers[i];
                i = comp.layers.length+2; //break out of loop
                //alert("Depthfx found in current comp " + comp + "!");
            }// else {
                //alert("Comp item:" + comp.layers[i].name + " was not an adjustment layer!");
            //}
        }
        // if (depthfx == gamercomp.layer(1)) {
        //     alert("Didn't find the depthfx layer in comp " + comp.name + "!");
        // }

        depthfx.parent = depth;
        depthfx.adjustmentLayer = true; //turns solid into adj layer
        for(var i=0; i < listBox.items.length; i++) {
            depthfx("Effects").addProperty(listBox.items[i]);
            //todo: customize effects we know how to
            if(listBox.items[i].displayName == "FL Depth of Field") {
                depthfx("FL Depth of Field")("depth layer").setValue(depth);
                depthfx("FL Depth of Field")("select depth").setValue([960, 960]);
            } else if(listBox.items[i].displayName == "BCC+Depth of Field") {
                depthfx("BCC+Depth of Field")("Depth").setValue("Input");
                depthfx("BCC+Depth of Field")("Input").setValue(depth);
                depthfx("BCC+Depth of Field")("Blur - Horizontal").setValue(10);
            }
        }

        if(gamercomp instanceof CompItem) {
            if (depthfx.containingComp == comp) {
                //put depthfx above depth
                depthfx.moveBefore(depth);
                depthfx.outPoint = comp.duration;
            }
        } else {
            gamercomp.moveBefore(depth);
        }

        return gamercomp;
    }

    app.endUndoGroup();
})();