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
                var firstLayerGroup = reverseOrder ? this.interactiveLayerGroup : this.borderAndShadowLayerGroup,
                    lastLayerGroup  = reverseOrder ? this.borderAndShadowLayerGroup : this.interactiveLayerGroup;

                if (firstLayerGroup)
                    firstLayerGroup[methodName].apply(firstLayerGroup, arguments);

                var result = method.apply(this, arguments);

                if (lastLayerGroup)
                    lastLayerGroup[methodName].apply(lastLayerGroup, arguments);
                return result;
            };
        };

    var defaultOptions = {
            weight         : 2,  //The width of the line
          //color          : '', //The color
            colorName      : '', //Class-name to give the fill color
            fillColorName  : '', //Same as colorName
            borderColorName: '',  //Class-name to give the border color
            LineColorName  : '',  //Same as borderColorName


            //fill       : false,  //True to add fill colored by fillColor or SOMETHING ELSE TODO
            border     : false,  //True to add a semi-transparent white border to the line
            transparent: false,  //True to make the line semi-transparent
            hover      : false,  //True to show big-shadow and 0.9 opacuity for lpl-transparent when hover
            shadow     : false,  //true to add big shadow to the line
            shadowWhenPopupOpen     : false,  //When true a shadow is shown when the popup for the marker is open
            tooltipHideWhenPopupOpen: true, //false,  //True and tooltipPermanent: false => the tooltip is hidden when popup is displayed

            //TODO zIndexWhenHover         : null,   //zIndex applied when the polyline/polygon is hover
            //TODO zIndexWhenPopupOpen     : null,   //zIndex applied when the a popup is open on the polyline/polygon

            className       : 'lpl-base',

            borderWidth     : 1, //Width of border
            shadowWidth     : 3, //Width of shadow
            interactiveWidth: 5, //Width of interactive area

        };

    L.Polyline.include({
        /*****************************************************
        initialize
        *****************************************************/
        initialize: function( initialize ){
            return function( latLngs, options ){

                options = options || {};

                var isPolygon = this instanceof L.Polygon;

                //If there are options in options.polyline or options.LineString for polyline etc. => copy them into options.
                //This makes it possible to add options in geoJSON-layer with different options for polygons and lines
                $.each(isPolygon ? ['polygon', 'Polygon'] : ['polyline', 'Polyline', 'lineString', 'LineString'], function(index, name){
                    if (options[name])
                        options = $.extend({}, options[name]);
                });

                if (options.addInteractive)
                    options.interactive = true;

                options.weight = options.weight || options.width;
                options.colorName = options.colorName || options.fillColorName;
                options.borderColorName = options.borderColorName || options.lineColorName;

                options = $.extend({}, defaultOptions, options);

                options.className = options.className
                                    + (options.transparent     ? ' lpl-transparent' : '')
                                    + (options.colorName       ? ' lpl-'+options.colorName : '')
                                    + (options.borderColorName ? ' lpl-border-'+options.borderColorName : '');

                initialize.call(this, latLngs, options );

                this.polylineList = [];

                function extendOptions( width, className, interactive ){
                    var result = $.extend({}, defaultOptions);
                    return $.extend(result, {
                        weight        : options.weight + 2*width,
                        className     : className,
                        addInteractive: false,
                        border        : false,
                        transparent   : false,
                        hover         : false,
                        shadow        : false,
                        //fill          : false,
                        shadowWhenPopupOpen     : false,
                        tooltipHideWhenPopupOpen: false,
                        interactive   : interactive,
                    });
                }

                var thisConstructor = isPolygon  ? L.polygon : L.polyline,
                    polyline;

                if (this.options.border){
                     this.borderAndShadowLayerGroup = L.featureGroup();

                    polyline = thisConstructor(this.getLatLngs(), extendOptions(this.options.borderWidth, 'lpl-border', false) );
                     this.borderAndShadowLayerGroup.addLayer(  polyline );
                     this.polylineList.push( polyline );
                }

                if (this.options.shadow || this.options.hover || this.options.shadowWhenPopupOpen){
                    this.borderAndShadowLayerGroup = this.borderAndShadowLayerGroup || L.featureGroup();
                    this.shadowPolyline =
                        thisConstructor(
                            this.getLatLngs(),
                            extendOptions(
                                this.options.shadowWidth,
                                'lpl-shadow' + (this.options.shadow ? ' lpl-show' : '') +
                                    (this.options.borderColorName ? ' lpl-border-'+this.options.borderColorName : ''),
                                false
                            )
                        );
                     this.borderAndShadowLayerGroup.addLayer(  this.shadowPolyline );
                    this.polylineList.push( this.shadowPolyline );
                }

                if (this.options.addInteractive){
                    this.interactiveLayerGroup = L.featureGroup();
                    this.interactivePolyline =
                        thisConstructor(
                            this.getLatLngs(),
                            extendOptions(this.options.interactiveWidth, 'lpl-interactive' + (this.options.fill || this.options.colorName ? ' lpl-fill' : ''), true)
                         );
                      this.interactiveLayerGroup.addLayer(  this.interactivePolyline );

                    this.on( 'remove', this.setInteractiveOff, this );
                    if (options.interactive)
                        this.on( 'add', this.setInteractiveOn, this );
                    else
                        this.on( 'add', this.setInteractiveOff, this );

                    this.interactiveLayerGroup
                        .on( 'mouseover',  this._mouseover,  this )
                        .on( 'mouseout',   this._mouseout,   this )
                        .on( 'popupopen',  this._popupopen,  this )
                        .on( 'popupclose', this._popupclose, this );
                }

                if (options.colorName)
                    this.setColor(options.colorName);


                return this;
            };
        }(L.Polyline.prototype.initialize),


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
                bindTooltip.call(this.interactiveLayerGroup || this, content, options);
            };
        }(L.Polyline.prototype.bindTooltip),

        /*****************************************************
        Bind popup to interactivePolyline (if any)
        *****************************************************/
        bindPopup: function(bindPopup){
            return function(){
                bindPopup.apply(this.interactiveLayerGroup || this, arguments);
            };
        }(L.Polyline.prototype.bindPopup),

        /*****************************************************
        setColor( colorName )
        *****************************************************/
        setColor: function( colorName ){
            if (this.options.colorName)
                this._removeClass(this, 'lpl-'+this.options.colorName);

            this._addClass(this, 'lpl-'+colorName);
            if (this.shadowPolyline)
                this.shadowPolyline.setColor(colorName);

            this.options.colorName = colorName;
        },



        /*****************************************************
        _addClass and _removeClass: Add and remove class from a polyline
        *****************************************************/
        _addClass: function( polyline, className, remove){
            var _this = this;
            if (polyline)
                $(polyline._path)[remove ? 'removeClass' : 'addClass'](className);
            else {
                this._addClass( this, className, remove);
                $.each(this.polylineList, function( index, polyline ){
                   _this._addClass( polyline, className, remove);
                });
            }
        },

        _removeClass: function( polyline, className){
            this._addClass( polyline, className, true);
        },

        /*****************************************************
        _mouseover and _mouseup: Highlight polyline
        *****************************************************/
        _mouseover: function(/* mouseEvent */){
             if (this.options.hover)
                 this._addClass(null, 'lpl-hover');
        },

        _mouseout: function(/* mouseEvent */){
            if (this.options.hover)
                 this._removeClass(null, 'lpl-hover');
        },

        /*****************************************************
        _popupopen and _popupclose: Highlight polyline
        *****************************************************/
        _popupopen: function(){
            if (this.options.tooltipHideWhenPopupOpen && !this.options.tooltipPermanent && this.interactiveLayerGroup && this.interactiveLayerGroup.hideTooltip)
                this.interactiveLayerGroup.hideTooltip();
            if (this.options.shadowWhenPopupOpen && !this.options.shadow)
                this._addClass(this.shadowPolyline, 'lpl-show');
             if (this.options.transparent)
                 this._removeClass(null, 'lpl-transparent' );
        },

        _popupclose: function(){
            if (this.options.tooltipHideWhenPopupOpen && this.interactiveLayerGroup && this.interactiveLayerGroup.hideTooltip)
                this.interactiveLayerGroup.showTooltip();
            if (this.options.shadowWhenPopupOpen && !this.options.shadow)
                this._removeClass(this.shadowPolyline, 'lpl-show');
             if (this.options.transparent)
                 this._addClass(null, 'lpl-transparent' );
        },

        /*****************************************************
        If polyline has addInteractive => All mouse-evnets on polyline get caught
        by interactivePolyline and fired on this on clostes point
        *****************************************************/
        onMouseEventsOnInteractivePolyline: function( fn, context, mouseEvent ){
            //If event has latLng (==MouseEvent)
            if (mouseEvent.latlng){
                //Adjust mouseEvent to closest latlng on this
                mouseEvent.latlng         = L.GeometryUtil.closest(this._map, this, mouseEvent.latlng);
                mouseEvent.layerPoint     = this._map.latLngToLayerPoint( mouseEvent.latlng );
                mouseEvent.containerPoint = this._map.latLngToContainerPoint( mouseEvent.latlng );
            }
            fn.call(context || this, mouseEvent );
        },

        _on: function( _on ){
            return function(type, fn, context){
                if (!!this.interactivePolyline &&
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
            if (!this.interactivePolyline) return;
            if (on === undefined)
                on = !this.isInteractive;

            this.isInteractive = !!on;
             if (on)
                 this._map.addLayer(this.interactiveLayerGroup);
             else
                 this._map.removeLayer(this.interactiveLayerGroup);

            //Toggle class "leaflet-interactive"
            $(this._path).toggleClass( "leaflet-interactive",  this.isInteractive);

             if (this.interactivePolyline)
                 $(this.interactivePolyline._path).toggleClass( "leaflet-interactive",  this.isInteractive);

            this.onSetInteractive( this.isInteractive );
            return this;
        },

        setInteractiveOn : function(){ return this.setInteractive( true  ); },
        setInteractiveOff: function(){ return this.setInteractive( false ); },

        /*****************************************************
        setLatLngs - also called for shadowPolyline and interactivePolyline
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
        All called for borderAndShadowLayerGroup and interactiveLayerGroup
        *****************************************************/
        bringToFront: beforeAndAfter('bringToFront'),
        bringToBack : beforeAndAfter('bringToBack', null, true),
        removeFrom  : beforeAndAfter('removeFrom'),
    });

}(jQuery, L, this, document));

