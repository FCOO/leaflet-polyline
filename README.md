# leaflet-polyline


## Description
Extend `L.Polyline` with options to draw "shadow" and "interactive"-zone

## Installation
### bower
`bower install https://github.com/FCOO/leaflet-polyline.git --save`

## Usage
	var myPolyline = L.polyline(<LatLng[]> latlngs, <Polyline options> options?)

The `options` are extended with `addInteractive <boolean>` 
If `options.addInteractive: true` a "shadow"-line is added around the polyline and a "interactive"-zone is added around the line and shadow

Default options for the shadow and interactive lines are

	{
    	shadowStyle: {
        	width: 1,
            color: 'white',
            opacity: 0.5
        },
		interactiveStyle: {
        	width  : 4,
            color  : 'transparent',
            opacity: 1
        },

	 
### Methods
New methods are added to `L.Polyline`

        .setInteractive( on ); 	//Set the polyline interactive on or off
        .setInteractiveOn();	//Set the polyline interactive on
        .setInteractiveOff();	//Set the polyline interactive off


## Copyright and License
This plugin is licensed under the [MIT license](https://github.com/FCOO/leaflet-polyline/LICENSE).

Copyright (c) 2018 [FCOO](https://github.com/FCOO)

## Contact information

Niels Holt nho@fcoo.dk