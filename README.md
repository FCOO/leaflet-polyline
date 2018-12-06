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
            colorName      : '', //Class-name to give the fill color
            fillColorName  : '', //Same as colorName
            borderColorName: '',  //Class-name to give the border color. "none" will hide the border
            LineColorName  : '',  //Same as borderColorName

            border         : false,  //True to add a semi-transparent white border to the line
            transparent    : false,  //True to make the line semi-transparent
            hover          : false,  //True to show big-shadow and 0.9 opacuity for lpl-transparent when hover
            onlyShowOnHover: false,  //When true the polyline/polygon is only visible on hover and popup-open. Need {shadow: false, hover: true}

            shadow               : false,  //true to add big shadow to the line
            shadowWhenInteractive: false,  //When true a shadow is shown when the polyline is interactive
            shadowWhenPopupOpen  : false,  //When true a big-sdhadow is shown when the popup for the marker is open

            addInteractiveLayerGroup: false, //true to add this.interactiveLayerGroup to hold layers only visible when interactive is on
            onSetInteractive        : null,  //function( on ) called when interactive is set on or off

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

Internal methods called before and after the interactive is set on or off
To be overwritten in descending classes

        .beforeSetInteractive: function( on )
        .afterSetInteractive : function( on )



## Copyright and License
This plugin is licensed under the [MIT license](https://github.com/FCOO/leaflet-polyline/LICENSE).

Copyright (c) 2018 [FCOO](https://github.com/FCOO)

## Contact information

Niels Holt nho@fcoo.dk