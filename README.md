# leaflet-polyline


## Description
Extend `L.Polyline` and `L.Polygon` with options to draw "shadow" and "interactive"-zone

## Installation
### bower
`bower install https://github.com/FCOO/leaflet-polyline.git --save`

## Usage
	var myPolyline = L.polyline(<LatLng[]> latlngs, <Polyline options> options?)

The `options` are extended with `addInteractive <boolean>` 
If `options.addInteractive: true` a "shadow"-line is added around the polyline and a "interactive"-zone is added around the line and shadow

Default options for the shadow and interactive lines are

            weight         : 2,  //The width of the line
            width          : '', //Same as weight
            colorName      : '', //Class-name to give the fill color
            fillColorName  : '', //Same as colorName
            borderColorName: '',  //Class-name to give the border color. "none" will hide the border
            LineColorName  : '',  //Same as borderColorName
            border         : false,  //True to add a semi-transparent white border to the line
            transparent    : false,  //True to make the line semi-transparent
            hover          : false,  //True to show big-shadow and 0.9 opacuity for lpl-transparent when hover
            onlyShowOnHover: false, //When true the polyline/polygon is only visible on hover and popup-open. Need {shadow: false, hover: true}
            shadow         : false,  //true to add big shadow to the line
            shadowWhenPopupOpen     : false,  //When true a shadow is shown when the popup for the marker is open
            tooltipHideWhenPopupOpen: false,  //True and tooltipPermanent: false => the tooltip is hidden when popup is displayed

            //TODO zIndexWhenHover         : null,   //zIndex applied when the polyline/polygon is hover
            //TODO zIndexWhenPopupOpen     : null,   //zIndex applied when the a popup is open on the polyline/polygon

            borderWidth     : 1, //Width of border
            shadowWidth     : 3, //Width of shadow
            interactiveWidth: 5, //Width of interactive area

The new options can also be set in 
`options.polygon` or `options.Polygon` for `L.Polygon`, 
and in
`options.polyline`, `options.Polyline`, `options.lineString`, or `optionsLineString` for `L.Polyline`
 
Used eq. in `L.GeoJSON` to set different options for lines and polygons

 
### Methods
New methods are added to `L.Polyline` and `L.Polygon`

        .setInteractive( on ); 	//Set the polyline interactive on or off
        .setInteractiveOn();	//Set the polyline interactive on
        .setInteractiveOff();	//Set the polyline interactive off


## Copyright and License
This plugin is licensed under the [MIT license](https://github.com/FCOO/leaflet-polyline/LICENSE).

Copyright (c) 2018 [FCOO](https://github.com/FCOO)

## Contact information

Niels Holt nho@fcoo.dk