/****************************************************************************
	leaflet-polyline.js,

	(c) 2018, FCOO

	https://github.com/FCOO/leaflet-polyline
	https://github.com/FCOO

    Extend L.Polyline with options to draw "shadow" and "interactive"-zone

****************************************************************************/
(function ($, L, window, document, undefined) {
    "use strict";
    var beforeAndAfter = function(methodName, method, reverseOrder) {
            method = method || L.Polyline.prototype[methodName];
            return function(){
                if (this.polylineList){
                    var length = this.polylineList.length-1,
                        firstIndex = reverseOrder ? length : 0,
                        lastIndex  = reverseOrder ? 0 : length,
                        result, i;
                     for (i=firstIndex; reverseOrder ? i >= lastIndex : i <= lastIndex; reverseOrder ? i-- : i++ ){
                        if (i == thisIndex)
                            result = method.apply(this, arguments);
                        else
                            this.polylineList[i][methodName].apply(this.polylineList[i], arguments);
                    }
                    return result;
                }
                else
                    return method.apply(this, arguments);
            };
        };

    var defaultOptions = {
            weight         : 2,  //The width of the line
          //color          : '', //The color
            colorName      : '', //Class-name to give the fill color
            fillColorName  : '', //Same as colorName
            borderColorName: '',  //Class-name to give the border color. "none" will hide the border
            LineColorName  : '',  //Same as borderColorName


            //fill       : false,  //True to add fill colored by fillColor or SOMETHING ELSE TODO
            border         : false,  //True to add a semi-transparent white border to the line
            transparent    : false,  //True to make the line semi-transparent
            hover          : false,  //True to show big-shadow and 0.9 opacuity for lpl-transparent when hover
            onlyShowOnHover: false, //When true the polyline/polygon is only visible on hover and popup-open. Need {shadow: false, hover: true}
            shadow         : false,  //true to add big shadow to the line
            shadowWhenPopupOpen     : false,  //When true a shadow is shown when the popup for the marker is open
            tooltipHideWhenPopupOpen: false,  //True and tooltipPermanent: false => the tooltip is hidden when popup is displayed


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

        function getOptions( className, interactive ){
            return $.extend({}, defaultOptions, {
                weight: 10, color: 'red',
                       className     : className,
                       addInteractive: false,
                       interactive   : interactive,
                   });
        }


    L.Polyline.include({
        /*****************************************************
        _getPolyOptions
        Returna copy of the current options to be used
        Depends on the class og this
        *****************************************************/
        _getPolyOptions: function(){
            var result = $.extend({}, this.options);

            //If there are options in options.polyline or options.LineString for polyline etc. => copy them into options.
            //This makes it possible to add options in geoJSON-layer with different options for polygons and lines
            $.each(this instanceof L.Polygon ? ['polygon', 'Polygon'] : ['polyline', 'Polyline', 'lineString', 'LineString'], function(index, name){
               if (result[name])
                   $.extend(result, result[name]);
            });
            return $.extend({}, defaultOptions, result);
        },

        /*****************************************************
        initialize
        *****************************************************/
        initialize: function( initialize ){
            return function( latLngs, options ){
                options = options || {};
                if (!options.addInteractive)
                    return initialize.call(this, latLngs, options );

                options.interactive = true;
                options.className = 'lpl-base';

                initialize.call(this, latLngs, options );

                this.currentOptions = {};

                //polylineList contains the up to four differnet polyline/polygon used to create the border, shadow and interactive zones
                this.polylineList = [null, null, null, null];

                var thisConstructor = this instanceof L.Polygon ? L.polygon : L.polyline;

                this.polylineList[borderIndex]      = thisConstructor( latLngs, getOptions('lpl-border',      false) );
                this.polylineList[shadowIndex]      = thisConstructor( latLngs, getOptions('lpl-shadow',      false) );
                this.polylineList[thisIndex]        = this;
                this.polylineList[interactiveIndex] = thisConstructor( latLngs, getOptions('lpl-interactive', true ) );
                this.interactivePolyline = this.polylineList[interactiveIndex]; //Easy access

                this.interactivePolyline._parentPolyline = this;


                this.on( 'remove', this.setInteractiveOff, this );
                if (options.interactive)
                    this.on( 'add', this.setInteractiveOn, this );
                else
                    this.on( 'add', this.setInteractiveOff, this );

                this.on( 'add', this.setStyle, this );

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
                if (!this.options.addInteractive)
                    return setStyle.call(this, style );

                $.extend( this.options, style || {});

                var options = this.currentOptions = this._getPolyOptions(),
                    saveAddInteractive = this.options.addInteractive;
                this.options.addInteractive = false;

                options.weight = options.width || options.weight;
                options.colorName = options.colorName || options.fillColorName;
                options.borderColorName = options.borderColorName || options.lineColorName;

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
                this._toggleClass(borderIndex, 'lpl-show', !!options.border);

                //Show or hide shadow
                this._toggleClass(shadowIndex, 'lpl-show', !!options.shadow);

                //Only show on hover
                this._toggleClass(null, 'lpl-only-show-on-hover', !!options.onlyShowOnHover);

                this.options.addInteractive = saveAddInteractive;
                return this;
            };
        }(L.Polyline.prototype.setStyle),

        /*****************************************************
        onAdd - Add Polyline, shadow- and inertactive LayerGroup
        *****************************************************/
        onAdd: beforeAndAfter( 'addTo', L.Polyline.prototype.onAdd ),

        /*****************************************************
        Bind tooltip to interactivePolyline (if any)
        *****************************************************/
        bindTooltip: function(bindTooltip){
            return function(content, options){
                options = options || {};
                //Force sticky:true if not given
                if (options.sticky === undefined)
                    options.sticky = true;
                bindTooltip.call(this.interactivePolyline || this, content, options);
            };
        }(L.Polyline.prototype.bindTooltip),

        /*****************************************************
        Bind popup to interactivePolyline (if any)
        *****************************************************/
        bindPopup: function(bindPopup){
            return function(){
                bindPopup.apply(this.interactivePolyline || this, arguments);
            };
        }(L.Polyline.prototype.bindPopup),


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

            if (this.interactivePolyline)
                this._toggleClass(this.interactivePolyline, 'lpl-fill', !!colorName);

            this.currentColorName = colorName;
        },

        /*****************************************************
        setBorderColor( borderColorName )
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

        _addClass: function( polyline, className){
            this._eachPolyline( polyline, 'addClass', [className] );
        },

        _removeClass: function( polyline, className){
            this._eachPolyline( polyline, 'removeClass', [className] );
        },

        _toggleClass: function( polyline, className, state){
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
            if (this.currentOptions.tooltipHideWhenPopupOpen && !this.currentOptions.tooltipPermanent && this.interactivePolyline && this.interactivePolyline.hideTooltip)
                this.interactivePolyline.hideTooltip();
            if (this.currentOptions.shadowWhenPopupOpen && !this.currentOptions.shadow)
                this._addClass(shadowIndex, 'lpl-show');
             this._addClass(null, 'lpl-popup-open' );
        },

        _popupclose: function(){
            if (this.currentOptions.tooltipHideWhenPopupOpen && this.interactivePolyline && this.interactivePolyline.hideTooltip)
                this.interactivePolyline.showTooltip();
            if (this.currentOptions.shadowWhenPopupOpen && !this.currentOptions.shadow)
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
        onSetInteractive
        *****************************************************/
        onSetInteractive: function( /*on*/){
        },

        /*****************************************************
        setInteractive( on ) - set the polyline interactive on or off
        setInteractiveOn     - set the polyline interactive on
        setInteractiveOff    - set the polyline interactive off
        *****************************************************/
        setInteractive: function( on ){
            if (!this.options.addInteractive) return this;

            if (on === undefined)
                on = !this.isInteractive;

            this.isInteractive = !!on;
              if (on)
                  this._map.addLayer(this.polylineList[interactiveIndex]);
              else
                  this._map.removeLayer(this.polylineList[interactiveIndex]);


            //Toggle class "leaflet-interactive"
            this._toggleClass( thisIndex, "leaflet-interactive",  this.isInteractive);
            this._toggleClass( interactiveIndex, "leaflet-interactive",  this.isInteractive);

            this.onSetInteractive( this.isInteractive );
            return this;
        },

        setInteractiveOn : function(){ return this.setInteractive( true  ); },
        setInteractiveOff: function(){ return this.setInteractive( false ); },

        /*****************************************************
        setLatLngs - also called for shadow-polyline and interactive-polyline
        *****************************************************/
        setLatLngs: function( setLatLngs ){
            return function(){
                setLatLngs.apply(this, arguments);
                $.each( this.polylineList, function( index, polyline ){
                    setLatLngs.apply(polyline, arguments);
                });
            };
        }(L.Polyline.prototype.setLatLngs ),

        /*****************************************************
        bringToFront, bringToBack, removeFrom:
        All called for borderAndShadowLayerGroup and interactivePolyline
        *****************************************************/
        bringToFront: beforeAndAfter('bringToFront'),
        bringToBack : beforeAndAfter('bringToBack', null, true),
        removeFrom  : beforeAndAfter('removeFrom'),
    });

}(jQuery, L, this, document));

