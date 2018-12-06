/****************************************************************************
	leaflet-polyline.js,

	(c) 2018, FCOO

	https://github.com/FCOO/leaflet-polyline
	https://github.com/FCOO

    Extend L.Polyline with options to draw "shadow" and "interactive"-zone

****************************************************************************/
(function ($, L, window, document, undefined) {
    "use strict";
//    var beforeAndAfter = function(methodName, method, reverseOrder, notForLayerGroup) {
    function beforeAndAfter(methodName, method, reverseOrder, notForLayerGroup) {
        method = method || L.Polyline.prototype[methodName];
        return function(){
            function applyToInteractiveLayerGroup(arg){
                if (this.interactiveLayerGroup && !notForLayerGroup)
                    this.interactiveLayerGroup[methodName].apply(this.interactiveLayerGroup, arg);
            }

            if (this.polylineList){
                var length = this.polylineList.length-1,
                    firstIndex = reverseOrder ? length : 0,
                    lastIndex  = reverseOrder ? 0 : length,
                    result, i;

                if (reverseOrder)
                    applyToInteractiveLayerGroup.call( this, arguments );

                 for (i=firstIndex; reverseOrder ? i >= lastIndex : i <= lastIndex; reverseOrder ? i-- : i++ )
                    if (i == thisIndex)
                        result = method.apply(this, arguments);
                    else
                        this.polylineList[i][methodName].apply(this.polylineList[i], arguments);

                if (!reverseOrder)
                    applyToInteractiveLayerGroup.call( this, arguments );

                return result;
            }
            else
                return method.apply(this, arguments);
        };
    }

    function applyOnInteractivePolyline( methodName ){
        return function( prototypeMethod ){
                   return function(){
                       return prototypeMethod.apply(this.interactivePolyline || this, arguments);
                   };
               }( L.Polyline.prototype[methodName] );
    }


    var defaultOptions = {
            weight         : 2,  //The width of the line
            colorName      : '', //Class-name to give the fill color
            fillColorName  : '', //Same as colorName
            borderColorName: '',  //Class-name to give the border color. "none" will hide the border
            LineColorName  : '',  //Same as borderColorName


            //fill       : false,  //True to add fill colored by fillColor or SOMETHING ELSE TODO
            border         : false,  //True to add a semi-transparent white border to the line
            transparent    : false,  //True to make the line semi-transparent
            hover          : false,  //True to show big-shadow and 0.9 opacuity for lpl-transparent when hover
            onlyShowOnHover: false,  //When true the polyline/polygon is only visible on hover and popup-open. Need {shadow: false, hover: true}

            shadow               : false,  //true to add big shadow to the line
            shadowWhenInteractive: false,  //When true a shadow is shown when the polyline is interactive
            shadowWhenPopupOpen  : false,  //When true a big-sdhadow is shown when the popup for the marker is open

            addInteractiveLayerGroup: false, //true to add this.interactiveLayerGroup to hold layers only visible when interactive is on
            onSetInteractive        : null,  //function( on ) called when interactive is set on or off

            //TODO zIndexWhenHover         : null,   //zIndex applied when the polyline/polygon is hover
            //TODO zIndexWhenPopupOpen     : null,   //zIndex applied when the a popup is open on the polyline/polygon

            className       : 'lpl-base',

            borderWidth     : 1, //Width of border
            shadowWidth     : 3, //Width of shadow
            interactiveWidth: 5, //Width of interactive area

        },

        shadowIndex      = 0,
        borderIndex      = 1,
        thisIndex        = 2,
        interactiveIndex = 3;

    L.Polyline.include({
        /*****************************************************
        initialize
        *****************************************************/
        initialize: function( initialize ){
            return function( latLngs, options ){
                var _this = this;
                function getOptions( className, interactive ){
                    return $.extend({}, _this.options, defaultOptions, {
                               className     : className,
                               addInteractive: false,
                               interactive   : interactive,
                            });
                }

                options = options || {};
                if (!options.addInteractive)
                    return initialize.call(this, latLngs, options );

                options.weight = options.weight || options.width || defaultOptions.weight;

                initialize.call(this, latLngs, options );

                this.currentOptions = {};

                //polylineList contains the up to four different polyline/polygon used to create the border, shadow and interactive zones
                this.polylineList = [null, null, null, null];

                var thisConstructor = this instanceof L.Polygon ? L.polygon : L.polyline;

                this.polylineList[borderIndex]      = thisConstructor( latLngs, getOptions('lpl-border',      false) );
                this.polylineList[shadowIndex]      = thisConstructor( latLngs, getOptions('lpl-shadow',      false) );
                this.polylineList[thisIndex]        = this;
                this.polylineList[interactiveIndex] = thisConstructor( latLngs, getOptions('lpl-interactive', true ) );

                this.interactivePolyline = this.polylineList[interactiveIndex]; //Easy access
                this.interactivePolyline._parentPolyline = this;

                if (this.options.addInteractiveLayerGroup)
                    this.interactiveLayerGroup = L.layerGroup();

                this.on( 'add', this.setStyle, this );
                this.on( 'remove', this.setInteractiveOff, this );

                this.interactivePolyline
                        .on( 'mouseover',    this._mouseover,    this )
                        .on( 'mouseout',     this._mouseout,     this )
                        .on( 'popupopen',    this._popupopen,    this )
                        .on( 'popupclose',   this._popupclose,   this );


                return this;
            };
        }(L.Polyline.prototype.initialize),


        /*****************************************************
        setStyle
        *****************************************************/
        setStyle: function(setStyle){
            return function( style ){
                function adjust(options){
                    options = $.extend({}, options || {});
                    options.weight = options.width || options.weight;
                    options.colorName = options.colorName || options.fillColorName || options.colorName;
                    options.borderColorName = options.borderColorName || options.lineColorName || options.borderColorName;
                    return options;
                }

                if (!this.options.addInteractive)
                    return setStyle.call(this, style );

                this.options = $.extend(true,  adjust(defaultOptions), adjust(this.options), adjust(style) );

                //Create the current options in a flat object
                var options = $.extend({},  this.options );

                //If there are options in options.polyline or options.LineString for polyline etc. => copy them into options.
                //This makes it possible to add options in geoJSON-layer with different options for polygons and lines
                $.each(this instanceof L.Polygon ? ['polygon', 'Polygon'] : ['polyline', 'Polyline', 'lineString', 'LineString'], function(index, name){
                    if (options[name])
                        $.extend(options, adjust(options[name]));
                });

                var saveAddInteractive = this.options.addInteractive;
                this.options.addInteractive = false;

                this.currentOptions = options;

                ///Set line-width of the differnet polyline
                this.polylineList[thisIndex].setStyle(       {weight: options.weight });
                this.polylineList[borderIndex].setStyle(     {weight: options.weight + 2*options.borderWidth     });
                this.polylineList[shadowIndex].setStyle(     {weight: options.weight + 2*options.shadowWidth     });
                this.polylineList[interactiveIndex].setStyle({weight: options.weight + 2*options.interactiveWidth});

                //Add class and colors to this and shadow
                this._addClass(thisIndex, options.className);
                this.setColor(options.colorName);
                this.setBorderColor(options.borderColorName);
                this._toggleClass(thisIndex, 'lpl-transparent', !!options.transparent);

                //Show or hide border
                this.setBorder( options.border );

                //Show or hide shadow
                this.setShadow( options.shadow );

                //Only show on hover
                this._toggleClass(null, 'lpl-only-show-on-hover', !!options.onlyShowOnHover);

                this.options.addInteractive = saveAddInteractive;

                this.options.interactive = options.interactive;

                //Check and set active-status if polyline is added to a map
                 if (this._map)
                    this.setInteractive(this.options.interactive);

                return this;
            };
        }(L.Polyline.prototype.setStyle),


        /*****************************************************
        bindTooltip(), bindPopup(), unbindPopup(), closePopup(),
        togglePopup(), isPopupOpen(), setPopupContent(),
        getPopup() from interactivePolyline (if any)
        *****************************************************/
        bindTooltip    : applyOnInteractivePolyline( 'bindTooltip'     ),
        bindPopup      : applyOnInteractivePolyline( 'bindPopup'       ),
        unbindPopup    : applyOnInteractivePolyline( 'unbindPopup'     ),
        closePopup     : applyOnInteractivePolyline( 'closePopup'      ),
        togglePopup    : applyOnInteractivePolyline( 'togglePopup'     ),
        isPopupOpen    : applyOnInteractivePolyline( 'isPopupOpen'     ),
        setPopupContent: applyOnInteractivePolyline( 'setPopupContent' ),
        getPopup       : applyOnInteractivePolyline( 'getPopup'        ),

        /*****************************************************
        Open popup inside polygon or on polyline
        *****************************************************/
        openPopup: function(openPopup){
            return function(layer, latlng){
                var _this = this._parentPolyline || this;

                //If not inside a filled polygon => adjust latlng to be on the line
                if (latlng && (!(_this instanceof L.Polygon) ||  !_this.currentColorName) )
                    latlng = L.GeometryUtil.closest(_this._map, _this, latlng);

                openPopup.call(this, layer, latlng);
            };
        }(L.Polyline.prototype.openPopup),

        /*****************************************************
        setColor( colorName )
        *****************************************************/
        setColor: function( colorName ){
            if (this.currentColorName)
                this._removeClass(this, 'lpl-'+this.currentColorName);
            if (colorName)
                this._addClass(this, 'lpl-'+colorName);

            this._toggleClass(interactiveIndex, 'lpl-fill', !!colorName);

            this.currentColorName = colorName;
        },

        /*****************************************************
        setBorderColor( borderColorName )
        setLineColor( lineColorName )
        *****************************************************/
        setBorderColor: function( borderColorName ){
            if (this.currentBorderColorName)
                this._removeClass(this, 'lpl-border-'+this.currentBorderColorName);
            if (borderColorName){
                this._addClass(this, 'lpl-border-'+borderColorName);
                if (this.polylineList && this.polylineList[shadowIndex])
                    this.polylineList[shadowIndex].setBorderColor(borderColorName);
            }
            this.currentBorderColorName = borderColorName;
        },
        setLineColor: function( lineColorName ){
            return this.setBorderColor( lineColorName );
        },

        /*****************************************************
        setBorder( show )
        Show or hide border
        *****************************************************/
        setBorder: function( show ){
            this._toggleClass(borderIndex, 'lpl-show', !!show);
        },

        /*****************************************************
        setBorder( show )
        Show or hide shadow
        *****************************************************/
        setShadow: function( show ){
            this._toggleClass(shadowIndex, 'lpl-show', !!show);
        },

        /*****************************************************
        _addClass, _removeClass, _toggleClass:
        Add, remove and toggle class from a polyline
        *****************************************************/
        _eachPolyline: function( onlyPolyline, methodName, arg ){
            var _this = this;
            if (onlyPolyline != null){
                if ($.isNumeric(onlyPolyline))
                    onlyPolyline = this.polylineList[onlyPolyline];
                if (onlyPolyline){
                    var $path = $(onlyPolyline._path);
                    $path[methodName].apply($path, arg);
                }
            }
            else
                $.each(this.polylineList, function( index, polyline ){
                   _this._eachPolyline( polyline, methodName, arg );
                });
        },

        _addClass: function( polyline, className ){
            this._eachPolyline( polyline, 'addClass', [className] );
        },

        _removeClass: function( polyline, className ){
            this._eachPolyline( polyline, 'removeClass', [className] );
        },

        _toggleClass: function( polyline, className, state ){

            this._eachPolyline( polyline, 'toggleClass', [className, state] );
        },

        /*****************************************************
        _mouseover and _mouseout: Highlight polyline
        *****************************************************/
        _mouseover: function(/* mouseEvent */){
             if (this.currentOptions.hover)
                 this._addClass(null, 'lpl-hover');
             if (this.currentOptions.onlyShowOnHover)
                 this._removeClass(null, 'lpl-only-show-on-hover');
        },

        _mouseout: function(/* mouseEvent */){
            if (this.currentOptions.hover)
                 this._removeClass(null, 'lpl-hover');
             if (this.currentOptions.onlyShowOnHover)
                 this._addClass(null, 'lpl-only-show-on-hover');
        },

        /*****************************************************
        _popupopen and _popupclose: Highlight polyline
        *****************************************************/
        _popupopen: function(){
            if (this.currentOptions.shadowWhenPopupOpen && !this.currentOptions.shadow)
                this._addClass(shadowIndex, 'lpl-show');
             this._addClass(null, 'lpl-popup-open' );
        },

        _popupclose: function(){
            if (this.currentOptions.shadowWhenPopupOpen && !this.currentOptions.shadow && !this.currentOptions.shadowWhenInteractive)
                this._removeClass(shadowIndex, 'lpl-show');
             this._removeClass(null, 'lpl-popup-open' );
        },

        /*****************************************************
        If polyline has addInteractive => All mouse-evnets on polyline get caught
        by interactivePolyline and fired on this on clostes point
        *****************************************************/
        onMouseEventsOnInteractivePolyline: function( fn, context, mouseEvent ){
            //If event has latLng (==MouseEvent) => Adjust mouseEvent to closest latlng on this
            if (mouseEvent.latlng){
                //If not inside a filled polygon => adjust latlng to be on the line
                if (!(this instanceof L.Polygon) ||  !this.currentColorName){
                    mouseEvent.latlng         = L.GeometryUtil.closest(this._map, this, mouseEvent.latlng);
                    mouseEvent.layerPoint     = this._map.latLngToLayerPoint( mouseEvent.latlng );
                    mouseEvent.containerPoint = this._map.latLngToContainerPoint( mouseEvent.latlng );
                }
            }
            fn.call(context || this, mouseEvent );
        },

        _on: function( _on ){
            return function(type, fn, context){
                if (this.interactivePolyline &&
                    ([
                        'click', 'dblclick',
                        'mousedown', 'mouseup', 'mouseover', 'mouseout', 'mousemove',
                        'contextmenu',
                        'popupopen', 'popupclose',
                        'tooltipopen', 'tooltipclose'
                    ].indexOf(type) != -1)
                   ){

                    //Create a function to re-direct the event from this.interactivePolyline to this with latLng corrected to closest to this
                    return _on.call(
                        this.interactivePolyline,
                        type,
                        $.proxy(this.onMouseEventsOnInteractivePolyline, this, fn, context),
                        this
                    );
                    }
                else
                    return _on.apply(this, arguments );
            };
        }(L.Polyline.prototype._on),


        /*****************************************************
        beforeSetInteractive, afterSetInteractive alled before
        and after the setting interactive on or off
        *****************************************************/
        beforeSetInteractive: function( /*on*/){
        },

        afterSetInteractive: function( /*on*/){
        },

        /*****************************************************
        setInteractive( on ) - set the polyline interactive on or off
        setInteractiveOn     - set the polyline interactive on
        setInteractiveOff    - set the polyline interactive off
        *****************************************************/
        setInteractive: function( on ){
            if (!this.options.addInteractive) return this;
            var originalIsInteractive = this.isInteractive;
            if (on === undefined)
                on = !this.isInteractive;

            this.isInteractive = !!on;

            if (originalIsInteractive !== this.isInteractive)
                this.beforeSetInteractive( this.isInteractive );

            //Toggle class "leaflet-interactive"
            this._toggleClass( thisIndex,        "leaflet-interactive",  this.isInteractive);
            this._toggleClass( interactiveIndex, "leaflet-interactive",  this.isInteractive, true);

            if (this.options.shadowWhenInteractive)
                this.setShadow( this.isInteractive );


            //Add or remove interactiveLayerGroup
            if (this.interactiveLayerGroup && this._map)
                this._map[on ? 'addLayer' : 'removeLayer'](this.interactiveLayerGroup);

            if (originalIsInteractive !== this.isInteractive){
                this.afterSetInteractive( this.isInteractive );
                if (this.options.onSetInteractive)
                    $.proxy(this.options.onSetInteractive, this.options.context || this)( this.isInteractive );
            }

            return this;
        },

        setInteractiveOn : function(){ return this.setInteractive( true  ); },
        setInteractiveOff: function(){ return this.setInteractive( false ); },



        /*****************************************************
        onAdd - Add Polyline, shadow- and inertactive LayerGroup
        *****************************************************/
        onAdd   : beforeAndAfter( 'addTo',      L.Polyline.prototype.onAdd    ),
        onRemove: beforeAndAfter( 'removeFrom', L.Polyline.prototype.onRemove ),

        /*****************************************************
        setLatLngs, bringToFront, bringToBack, remove,
        removeFrom, onAdd, onRemove:
        All called for all polylines
        *****************************************************/
        setLatLngs  : beforeAndAfter('setLatLngs'  , null, false, true),
        bringToFront: beforeAndAfter('bringToFront'                   ),
        bringToBack : beforeAndAfter('bringToBack' , null, true       ),

    });

}(jQuery, L, this, document));

