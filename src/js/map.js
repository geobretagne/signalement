Ext.namespace("Signalement");

Signalement.mainmap = (function () {

    /*
     * Private
     */

    /**
     * Property: map
     * {OpenLayers.Map} The map instance.
     */
    var map = null;
    
    var config = null;   
    
   

    return {
        /*
         * Public
         */


        /**
         * APIMethod: create
         * 
         * APIMethod: create         
         * Parameters:
         * m - {OpenLayers.Map} The map instance.
         */

        create: function (mapconfig) {
            config = mapconfig;
            
            var mp = new OpenLayers.Control.MousePosition();
            mp.displayProjection = new OpenLayers.Projection("EPSG:2154");
              //D�finition des options � appliquer � la carte principale et � la carte
              //de localisation
              var options = {
                    projection: new OpenLayers.Projection("EPSG:2154"),
                displayProjection: new OpenLayers.Projection("EPSG:2154"),
                    units: 'm',
                maxExtent: new OpenLayers.Bounds(-357823.2365, 6037008.6939,
                                                         2146865.3059, 8541697.2363),
                numZoomLevels: 21,
                    maxResolution: 156543.0339                   
            };
            
             var tmsLayers = new Array();
                  var layerscount = config.baselayers.length;
                  for (var i=0; i<layerscount; i++){    
                    var tmsLayer = new OpenLayers.Layer.TMS(
                          config.baselayers[i].baselayer.label,
                          config.baselayers[i].baselayer.url,
                          {layername: config.baselayers[i].baselayer.layername,      
                            type: config.baselayers[i].baselayer.type,
                            tileOrigin: new OpenLayers.LonLat(-357823.2365, 6037008.6939),
                            attribution:  config.baselayers[i].baselayer.attributiontext +"  <a href='" +
                            config.baselayers[i].baselayer.attributionurl +"'>" +
                            config.baselayers[i].baselayer.attributionurl +"</a>"
                          }
                      );
                      
                      tmsLayer.tp = {name:config.baselayers[i].baselayer.label,
                                    url:config.baselayers[i].baselayer.url,
                                    desc:config.baselayers[i].baselayer.description,
                                    metadata: config.baselayers[i].baselayer.metadataurl
                                    };
                    tmsLayers[i]=tmsLayer;  
                  }
                  
                  //Configuration des couches wms
                  var wmsLayers = new Array();
                  var wmscount = config.wmslayers.length;
                  for (var i=0; i<wmscount; i++){    
                    var wmsLayer = new OpenLayers.Layer.WMS(
                      config.wmslayers[i].wmslayer.label,
                            config.wmslayers[i].wmslayer.url,
                            {layers: config.wmslayers[i].wmslayer.layer,        
                      transparent: true,
                             version: "1.3.0",      
                      styles: config.wmslayers[i].wmslayer.style},
                      {isBaseLayer: (config.wmslayers[i].wmslayer.baselayer == true)}
                          
                    );
                    wmsLayer.setVisibility(config.wmslayers[i].wmslayer.visible == true);
                    
                    wmsLayer.tp = {name:config.wmslayers[i].wmslayer.label,
                                    url:config.wmslayers[i].wmslayer.url,
                                    desc:config.wmslayers[i].wmslayer.description,
                                    metadata: config.wmslayers[i].wmslayer.metadataurl,
                                    metadata2: config.wmslayers[i].wmslayer.metadataurl2
                                    };
                    wmsLayers[i]=wmsLayer;  
                  }
                  
             //Cr�ation de la carte principale        
              map = new OpenLayers.Map({
                projection: new OpenLayers.Projection("EPSG:2154"),
                displayProjection: new OpenLayers.Projection("EPSG:2154"),
                units: "m",    
                numZoomLevels: 21,
                maxResolution: 156543.0339,    
                //maxExtent: new OpenLayers.Bounds(-357823.2365, 6037008.6939, 2146865.3059, 8541697.2363),
                maxExtent: new OpenLayers.Bounds(87574.882180659,6695398.0773958,411056.38582558,6920428.688627),
                allOverlays: false,
                theme: null,
                controls:   [
                      new OpenLayers.Control.Navigation({dragPanOptions: {enableKinetic: true}}),
                      new OpenLayers.Control.PanPanel(),
                      new OpenLayers.Control.ZoomPanel(),         
                      mp,                      
                      new OpenLayers.Control.Attribution(),
                      new OpenLayers.Control.OverviewMap({mapOptions: options},{layers: tmsLayer[0]})
                      ]
              });
              
              

              
              
              
              //  Ajout des layers � la carte principale
              map.addLayers(tmsLayers);
              map.addLayers(wmsLayers);
            
      
            return map;
        },
         getMapProperties: function () {
            if (map) {
                var url = "http://" + window.location.host + window.location.pathname + "?";
                
                var params = "extent=" + map.getExtent() + "&baselayer=" + encodeURIComponent(map.baseLayer.name);//+"&zoom=" + map.getZoom();
                
                return url + params;
            }
         
         },
         
         getMap: function () {
            if (map) {               
                return map;
            }
         
         }
    }
})();