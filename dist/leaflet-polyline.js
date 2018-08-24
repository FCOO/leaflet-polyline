/****************************************************************************
	leaflet-polyline.js,

	(c) 2018, FCOO

	https://github.com/FCOO/leaflet-polyline
	https://github.com/FCOO

    Extend L.Polyline with options to draw "shadow" and "interactive"-zone

****************************************************************************/
(function ($, L/*, window, document, undefined*/) {
    "use strict";
    var beforeAndAfter = function(methodName, method, reverseOrder) {
            method = method || L.Polyline.prototype[methodName];
            return function(){
                var firstLayerGroup = reverseOrder ? this.interactiveLayerGroup : this.shadowLayerGroup,
                    lastLayerGroup  = reverseOrder ? this.shadowLayerGroup : this.interactiveLayerGroup;

                if (firstLayerGroup)
                    firstLayerGroup[methodName].apply(firstLayerGroup, arguments);

                var result = method.apply(this, arguments);

                if (lastLayerGroup)
                    lastLayerGroup[methodName].apply(lastLayerGroup, arguments);
                return result;
            };
        };


    L.Polyline.include({
        /*****************************************************
        initialize
        *****************************************************/
        initialize: function( initialize ){
            return function( latLngs, options ){
                options = options || {};

                if (options.addInteractive)
                    options.interactive = true;

                initialize.call(this, latLngs, options );

                this.options = $.extend(true, {},
                    {
                        shadowStyle: {
                            width: 1,
                            color: 'white',
                            opacity: 0.5
                        },
/*
                        _interactiveStyle: {
                            width: 14,
                            color: 'yellow',
                            opacity: .5,
                        },
*/
                        interactiveStyle: {
                            width  : 4,
                            color  : 'transparent',
                            opacity: 1
                        },
                    },
                    this.options
                );

                function extendOptions( options, style, interactive ){
                    var result = $.extend({}, options);
                    return $.extend(result, {
                        weight : options.weight+2*style.width,
                        color  : style.color,
                        opacity: style.opacity,
                        addShadow: false,
                        addInteractive: false,
                        interactive: interactive,
                    });
                }

                if (this.options.addShadow){
                    this.shadowLayerGroup = L.layerGroup();
                    this.shadowPolyline = L.polyline(this.getLatLngs(), extendOptions(this.options, this.options.shadowStyle, false) );
                    this.shadowLayerGroup.addLayer(  this.shadowPolyline );
                }

                if (this.options.addInteractive){
                    this.interactiveLayerGroup = L.layerGroup();
                    this.interactivePolyline = L.polyline(this.getLatLngs(), extendOptions(this.options, this.options.interactiveStyle, true) );
                    this.interactiveLayerGroup.addLayer(  this.interactivePolyline );
                    this.on('add remove', this.setInteractiveOff, this );
                }
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
            return function(){
                bindTooltip.apply(this.interactivePolyline || this, arguments);
            };
        }(L.Polyline.prototype.bindTooltip),

        /*****************************************************
        If polyline has addInteractive => All mouse-evnets on polyline get caught
        by interactivePolyline and fired on this on clostes point
        *****************************************************/
        onMouseEventsOnInteractivePolyline: function( fn, context, mouseEvent ){
            //Adjust mouseEvent to closest latlng on this
            mouseEvent.latlng         = L.GeometryUtil.closest(this._map, this, mouseEvent.latlng);
            mouseEvent.layerPoint     = this._map.latLngToLayerPoint( mouseEvent.latlng );
            mouseEvent.containerPoint = this._map.latLngToContainerPoint( mouseEvent.latlng );

            fn.call(context || this, mouseEvent );
        },

        _on: function( _on ){
            return function(type, fn, context){
                if (this.interactivePolyline && (['click', 'dblclick', 'mousedown', 'mouseup', 'mouseover', 'mouseout', 'mousemove', 'contextmenu'].indexOf(type) != -1))
                    //Create a function to re-direct the event from this.interactivePolyline to this with latLng corrected to closest to this
                    return _on.call(
                        this.interactivePolyline,
                        type,
                        $.proxy(this.onMouseEventsOnInteractivePolyline, this, fn, context),
                        this
                    );
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
        },

        setInteractiveOn : function(){ this.setInteractive( true  ); },
        setInteractiveOff: function(){ this.setInteractive( false ); },

        /*****************************************************
        setLatLngs - also called for shadowPolyline and interactivePolyline
        *****************************************************/
        setLatLngs: function( setLatLngs ){
            return function(){
                setLatLngs.apply(this, arguments);
                if (this.shadowPolyline)
                    setLatLngs.apply(this.shadowPolyline, arguments);
                if (this.interactivePolyline)
                    setLatLngs.apply(this.interactivePolyline, arguments);
            };
        }(L.Polyline.prototype.setLatLngs ),

        /*****************************************************
        bringToFront, bringToBack, removeFrom:
        All called for shadowLayerGroup and interactiveLayerGroup
        *****************************************************/
        bringToFront: beforeAndAfter('bringToFront'),
        bringToBack : beforeAndAfter('bringToBack', null, true),
        removeFrom  : beforeAndAfter('removeFrom'),



    });

}(jQuery, L, this, document));

