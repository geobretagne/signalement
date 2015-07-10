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
Ext.BLANK_IMAGE_URL = "lib/externals/ext/resources/images/default/s.gif"
Ext.namespace("Signalement");

Signalement.main = (function () {
    "use strict";
	var cluster = false;
    var extractUrlParams, loadConfigFailure, loadConfigSuccess;

    extractUrlParams = function () {
        var f = [],
            t, i, x;
        if (window.location.search.substring(1)) {
            t = decodeURI(window.location.search.substring(1)).split("&");
            i = 0;
            for (var i = 0; i < t.length; i++) {
                var x = t[i].split('=');
                f[x[0]] = x[1];
            }
        }
        return f;
    };

    loadConfigFailure = function (request) {
        alert("Erreur au chargement du fichier de config passé en paramètre");
    };

    // Chargement        
    loadConfigSuccess = function (request) {
        var urlParameters = extractUrlParams();
        var config = JSON.parse(request.responseText).config;
        var ogcproxy = config.ogcproxy.url;
        var helpurl = config.helpurl.url;
        var phplocation = config.phplocation.url;
        var enabledeletecontrol = config.deletecontrol.enable;
        OpenLayers.ProxyHost = ogcproxy;
        Proj4js.defs["EPSG:3857"] = "+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +no_defs";        
        Proj4js.defs["EPSG:2154"] = "+proj=lcc +lat_1=49 +lat_2=44 +lat_0=46.5 +lon_0=3 +x_0=700000 +y_0=6600000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs";
        Proj4js.defs["EPSG:4326"] = "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs";
	Proj4js.defs["EPSG:3948"] = "+proj=lcc +lat_1=47.25 +lat_2=48.75 +lat_0=48 +lon_0=3 +x_0=1700000 +y_0=7200000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs";
       	
		var today = new Date();        
        var beginDate = new Date(new Date().add(Date.MONTH, -12));        
        var wfsfilter = new OpenLayers.Filter.Comparison({
                type: OpenLayers.Filter.Comparison.BETWEEN,
                property: "date_saisie",
                lowerBoundary: OpenLayers.Date.toISOString(beginDate),
                upperBoundary: OpenLayers.Date.toISOString(today)
        });		
		var strategies = [new OpenLayers.Strategy.Fixed()];
		// cluster
		if (config.workinglayer.cluster === 'true') {
			cluster = true;
			var clusterStrategy = new OpenLayers.Strategy.Cluster({distance:45, threshold:5});
			strategies.push(clusterStrategy);
		}
        
        // Layer WFS-T des signalements    
        var WFSSignal = new OpenLayers.Layer.Vector(config.workinglayer.label, {
            strategies: strategies,
            filter: wfsfilter,
            protocol: new OpenLayers.Protocol.WFS({
                url: "https://www.cigalsace.org/geoserver/cigal_edit/wfs?",
                version: "1.1.0",
                featureType: "signalement_adresse",
                featurePrefix: "cigal_edit",
                srsName: "EPSG:3857",
                geometryName: "the_geom",
                extractAttributes: true,
                schema: "https://www.cigalsace.org/geoserver/cigal_edit/wfs?service=WFS&version=1.1.0&request=DescribeFeatureType&TypeName=signalement_adresse"
            })
        });		
		
        WFSSignal.tp = {
            name: config.workinglayer.label,
            url: config.workinglayer.wfsurl,
            desc: config.workinglayer.description,
            metadata: config.workinglayer.metadataurl
            
        };

        //Création de la carte  
        var map = Signalement.mainmap.create(config);
        //Ajout layer signalements
        map.addLayers([WFSSignal]);
        // Définition d'un contrôle zoomslider personnalisé
        var zSlider = new GeoExt.ZoomSlider({
            vertical: true,
            height: 110,
            x: 18,
            y: 85,
            //map: mapPanel,
            map: map,
            plugins: new GeoExt.ZoomSliderTip({
                template: '<div>Niveau de zoom: <b>{zoom}</b></div>'
            })
        });

        //Initialisation de la toolbar avec les 2 contrôles de navigation
        var toolbar = new Ext.Toolbar();
        toolbar.add([Signalement.toolbar.create(map, config)]);

        var mapPanelOptions = {
            title: "CIGAL - SIGN'ADRESSE - Gestion des signalements",
            region: "center",
            id: "myMapPanel",
            height: 400,
            width: 550,
            map: map,
            layers: map.layers,
            items: [zSlider],
            tbar: toolbar
        }

        // définition dynamique du baseLayer et de l'extent, et du zoom sur featureID
        //feature
		if (urlParameters['feature']) {
			var fi = urlParameters['feature'];
			
			//requete pour récupérer la géométrie du signalement fi
		var requetehttppost = new XMLHttpRequest();
		var url = "https://www.cigalsace.org/geoserver/cigal_edit/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=cigal_edit:signalement_adresse&outputFormat=application/json&srsName=EPSG:3857&FeatureId=" + fi;
		requetehttppost.open("GET", url, false);
		requetehttppost.setRequestHeader("Content-type", " application/json; charset=UTF-8");
		requetehttppost.send(null);
			
			var feat = JSON.parse(requetehttppost.responseText);
			mapPanelOptions.zoom = 17;
            mapPanelOptions.center = new OpenLayers.LonLat(feat.features[0].geometry.coordinates[0],feat.features[0].geometry.coordinates[1]);
		
			var bs = map.getLayersByName('Photo aérienne (CUS CAC M2A CIGAL)');
            map.setBaseLayer(bs[0]);
        }
        //baselayer
        if (urlParameters['baselayer']) {
            var bs = map.getLayersByName(urlParameters['baselayer']);
            if (bs.length > 0) {
                map.setBaseLayer(bs[0]);
            } else {
                alert("le baseLayer " + urlParameters['baselayer'] + "n'est pas valide");
            }
        }
        //Extent
        if (urlParameters['extent']) {
            var extent = urlParameters['extent'].split(",");            
            var bbox = extent.map(function (num) {
                return parseInt(num, 10)
            });            
            mapPanelOptions.extent = new OpenLayers.Bounds(bbox[0], bbox[1], bbox[2], bbox[3]);            
        }
        
        else if (!urlParameters['feature']) {
            mapPanelOptions.center = new OpenLayers.LonLat(826933.99050,6151040.54017);           
            mapPanelOptions.zoom = 8.5;
        }
        
        
        // Création du Panel carte avec la carte, les outils et les contrôles
        var mapPanel = new GeoExt.MapPanel(mapPanelOptions);

        // initialisations des différents modules
        var signalFormWindow = Signalement.signalement.create(map, mapPanel, toolbar, WFSSignal, true, phplocation,config.htmltexts[10],cluster);
        Signalement.geocoder.create(map, toolbar, config.geocode.service);
        var rssPanel = Signalement.rss.create(map, config.workinglayer.rssurl, config.htmltexts, toolbar);
        var downloadForm = Signalement.download.create(config.workinglayer);
        Signalement.help.create(helpurl,toolbar);
        var paramPanel = Signalement.parametrage.create();
        var layerPanel = Signalement.treelayer.create(map, config.workinglayer.label);
        var csvUploadForm = Signalement.importer.create(map, WFSSignal, phplocation);
        var workflowForm = Signalement.workflow.create(map, WFSSignal, phplocation);        
		var filterPanel = Signalement.remotefilter.create(map, WFSSignal, toolbar, -12); //taille de la barre de date

        //    Création du panel avancé
        var advancedPanel = new Ext.Panel({
            region: "east",
            title: "Outils",
            items: [layerPanel, filterPanel, rssPanel, paramPanel, csvUploadForm, workflowForm, downloadForm],
            width: 320,
            minWidth: 175,
            maxWidth: 400,
            layout: 'accordion',
            collapsible: true,
            collapsed: false,
            animCollapse: true,
            split: false
        });

        //Création du Panel principal
        var mainPanel = new Ext.Viewport({
            renderTo: "mainpanel",
            layout: "border",
            height: 400,
            width: 920,
            items: [mapPanel, advancedPanel]
        });
    };

    Ext.onReady(function () {
        Ext.QuickTips.init();
        OpenLayers.Request.GET({
            url: 'config.json',
            success: loadConfigSuccess,
            failure: loadConfigFailure
        });
    });

    return {
        showMsg: function (szTitle, szMsg) {
            Ext.example.msg(szTitle, szMsg, 'yes');
        }
    }

})();
