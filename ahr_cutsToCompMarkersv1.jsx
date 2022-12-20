//ahr_cutsToCompMarkersv1.jsx
// Copyright (c) 2022 AHRevolvers. All rights reserved.
//
// This script will add comp markers to in points of layers.
// Requested by Issues.
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
app.beginUndoGroup("cutsToCompMarkers");
var comp = app.project.activeItem; //current/active comp
for(var i=1; i <= comp.layers.length; i++) {
    var layer = comp.layer(i);
    var compMarker = new MarkerValue("");
    compMarker.duration = 0;
    comp.markerProperty.setValueAtTime(layer.inPoint, compMarker);
}
app.endUndoGroup();