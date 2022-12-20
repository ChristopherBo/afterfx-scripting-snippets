//ahr_precomp.jsx
// Copyright (c) 2022 AHRevolvers. All rights reserved.
//
// This script will precomp all selected layers.
// Requested by wiw.
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
app.beginUndoGroup("Precomper Script");

var layers = app.project.activeItem.selectedLayers;
var comp = app.project.activeItem;
var inPoint = 0;
var outPoint = 0;
var startTime;
for(var i=0; i < layers.length; i++) {
	inPoint = layers[i].inPoint;
    outPoint = layers[i].outPoint;
	startTime = layers[i].startTime;
	layerIndex = layers[i].index;
    var precomp = comp.layers.precompose([layers[i].index], layers[i].name, false);
	var precompLayer = comp.layers[layerIndex];
	precomp.duration = outPoint - startTime;
	precomp.layers[1].outPoint = outPoint - startTime;
	precomp.layers[1].inPoint = inPoint - startTime;
	precomp.layers[1].startTime = -inPoint + startTime;
	precomp.layers[1].timeRemapEnabled = true;
	precomp.duration = outPoint - inPoint;
	precompLayer.timeRemapEnabled = true;
	precompLayer.inPoint = inPoint;
	precompLayer.outPoint = outPoint;
	precompLayer.timeRemap.setValueAtTime(inPoint, 0);
    precompLayer.timeRemap.setValueAtTime(outPoint, precomp.duration);
}
app.endUndoGroup();