/*
 * 
 * This file is part of signalement
 *
 * signalement is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with signalement.  If not, see <http://www.gnu.org/licenses/>.
 */
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

    var _addWMTSLayer = function (l) {    
      OpenLayers.Request.GET({
                        url: l.url,
                        params: {
                            SERVICE: "WMTS",
                            VERSION: "1.0.0",
                            REQUEST: "GetCapabilities"
                    },
                    success: function(request) {
                        var format = new OpenLayers.Format.WMTSCapabilities();
                        var doc = request.responseXML;
                        if (!doc || !doc.documentElement) {
                            doc = request.responseText;
                        }
                        var capabilities = format.read(doc);
                        var wmtsLayer = format.createLayer(capabilities, {
                            name: l.label,
                            layer: l.layername,                            
                            matrixSet: l.matrixset,
                            style: l.style,                            
                            format: l.format,
                            opacity: 1,
                            transitionEffect: 'resize',
                            isBaseLayer: true,
                            attribution:  l.attributiontext +"  <a href='" +l.attributionurl +"'>" +l.attributionurl +"</a>"
                            }
                        );
                        wmtsLayer.tp = {name:l.label,
                                    url:l.url,
                                    desc:l.description,
                                    metadata: l.metadataurl
                        };
                        //hack for geoportail proxy
                        wmtsLayer.setUrl(l.url);                        
                        map.addLayer(wmtsLayer);                        
                        }
                    });      

    };
	
	_noServiceVersionGetUrl = function (bounds) {
		bounds=this.adjustBounds(bounds);
		var res=this.map.getResolution();
		var x=Math.round((bounds.left-this.tileOrigin.lon)/(res*this.tileSize.w));
		var y=Math.round((bounds.bottom-this.tileOrigin.lat)/(res*this.tileSize.h));
		var z=this.serverResolutions!=null?OpenLayers.Util.indexOf(this.serverResolutions,res):this.map.getZoom()+this.zoomOffset;	
		if (this.serviceVersion==="null") {
			var path=this.layername+"/"+z+"/"+x+"/"+y+"."+this.type;
		} else {
			var path=this.serviceVersion+"/"+this.layername+"/"+z+"/"+x+"/"+y+"."+this.type;
		}
		var url=this.url;
		if(OpenLayers.Util.isArray(url)){
			url=this.selectUrl(path,url);
		}
		return url+path;
	};
	
	var _addTMSLayer = function (l) {
		var tmsLayer = new OpenLayers.Layer.TMS(
			l.label,
			l.url,
			{	layername: l.layername,
				type: l.format,
				tileOrigin: new OpenLayers.LonLat(l.tileorigin.split(",")[0],l.tileorigin.split(",")[1]),
				serviceVersion: l.serviceversion,
                isBaseLayer : true,
				maxResolution: parseFloat(l.maxresolution),
				getURL: _noServiceVersionGetUrl
			}
		);
        tmsLayer.tp = {name:l.label,
                    url:l.url,
                    desc:l.description,
                    metadata: l.metadataurl
        };
		map.addLayer(tmsLayer);
	};
    
    var _addOSMLayer = function (l) {
		var osmLayer = new OpenLayers.Layer.OSM(l.label,
            l.url,
            {attribution:  l.attributiontext +"  <a href='" +l.attributionurl +"'>" +l.attributionurl +"</a>",
                isBaseLayer: true                            
            }
        );  
        osmLayer.tp = {name:l.label,
                    url:l.url,
                    desc:l.description,
                    metadata: l.metadataurl
        };        
		map.addLayer(osmLayer);
	};
    
   

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
            OpenLayers.DOTS_PER_INCH = 90.71428571428572;
            var mp = new OpenLayers.Control.MousePosition();
            mp.displayProjection = new OpenLayers.Projection("EPSG:3857");
              //Définition des options à appliquer à la carte principale et à la carte
              //de localisation
              var options = {
                    projection: new OpenLayers.Projection("EPSG:3857"),
                displayProjection: new OpenLayers.Projection("EPSG:3857"),
                    units: 'm',                
                numZoomLevels: 21,
                maxResolution: 156543.0339                   
            };
            
            //Création de la carte principale        
              map = new OpenLayers.Map({
                projection: new OpenLayers.Projection("EPSG:3857"),
                displayProjection: new OpenLayers.Projection("EPSG:3857"),
                units: "m",    
                numZoomLevels: 21,
                maxResolution: 156543.0339,               
                maxExtent: new OpenLayers.Bounds(-1364427.9521313,5662455.0545776,978825.58665287,6738688.412683),
                allOverlays: false,
                theme: null,                
                controls:   [
                      new OpenLayers.Control.Navigation({dragPanOptions: {enableKinetic: true}}),
                      new OpenLayers.Control.PanPanel(),
                      new OpenLayers.Control.ZoomPanel(),         
                      mp,                      
                      new OpenLayers.Control.Attribution(),
                      new OpenLayers.Control.OverviewMap({mapOptions: options},{layers: new OpenLayers.Layer.OSM()})
                      ]
              });
            map.addLayer(new OpenLayers.Layer.OSM());   
                       
             //var wmtsLayers = new Array();
                  var layerscount = config.baselayers.length;
					  for (var i=0; i<layerscount; i++){
						var bl = config.baselayers[i].baselayer;
						switch(config.baselayers[i].baselayer.type)
						{
							case "wmts":
								_addWMTSLayer(bl); 
								break;
							case "tms":
								_addTMSLayer(bl);
								break;
                            case "osm":
								_addOSMLayer(bl);
								break;
						}
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
                        version: config.wmslayers[i].wmslayer.version,                                                
                      styles: config.wmslayers[i].wmslayer.style},
                      {isBaseLayer: (config.wmslayers[i].wmslayer.baselayer == true),
                      singleTile: config.wmslayers[i].wmslayer.singletile}
                          
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
              
              //  Ajout des layersà� la carte principale
              
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