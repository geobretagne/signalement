Ext.namespace("Signalement");

Signalement.geocoder = (function () {

    /*
     * Private
     */

    /**
     * Property: map
     * {OpenLayers.Map} The map instance.
     */
    var map = null;

    var geocodeService = null;

    var toolbar = null;

    var markers = null;

    var infogeocoder = null;

    var loctext = null;

    var logogeocode = null;

    var geocodeCombo = null;



    // GEOCODAGE  IGN
    var codeAddressIGN = function (value) {
        markers.clearMarkers();
        var address = value.split(",");
      var apiKey = "";
        if (address.length <= 2) {
            var countryCode ="ALL";
            var freeFormAddress = "";
            var openLSMaxResponses = 1;
          switch (window.location.host){
            case "dev.geobretagne.fr":
              apiKey = "x1uy9hv7ojndca8335mhgv38";
              break;
            case "test.geobretagne.fr":
              apiKey = "xsjb3kmbejbpxp04tysclyrc";
              break;
            case "geobretagne.fr":
              apiKey = "01gwgg3by2fpaxwxrfgvynqw";
              break;      
          }
            //var apiKey = "x1uy9hv7ojndca8335mhgv38"; // dev-geobretagne.fr
            //var apiKey = "01gwgg3by2fpaxwxrfgvynqw"; // geobretagne.fr
            //var apiKey = "xsjb3kmbejbpxp04tysclyrc"; // test.geobretagne.fr  
            //var apiKey = "tyujsdxmzox31ituc2uw0qwl"; // geoportail
            //var apiKey = "e7ahlktjm9cdexiaazosg6bw"; // localhost
            //var openLSGeocodeUrl = "http://gpp3-wxs.ign.fr/" + apiKey + "/geoportail/ols?";
            var openLSGeocodeUrl = "http://geobretagne.fr/openls?";
            
            if (address[0] && address[1]) {
                countryCode="StreetAddress";
                freeFormAddress = address[0] + ' ' + address[1];                
            } else {
                countryCode="PositionOfInterest";
                freeFormAddress = address[0];                
            }            
            var postOls = [
                        '<?xml version="1.0" encoding="UTF-8"?>\n',
                        '<XLS xmlns:xls="http://www.opengis.net/xls" ',
                        'xmlns:gml="http://www.opengis.net/gml" ',
                        'xmlns="http://www.opengis.net/xls" ',
                        'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ',
                        'version="1.2" ',
                        'xsi:schemaLocation="http://www.opengis.net/xls http://schemas.opengis.net/ols/1.2/olsAll.xsd">\n',
                        '<RequestHeader/>\n',
                        '<Request maximumResponses="',
                        openLSMaxResponses,
                        '" requestID="1" version="1.2" methodName="LocationUtilityService">\n',
                        '<GeocodeRequest returnFreeForm="false">\n',
                        '<Address countryCode="',
                        countryCode,
                        '">\n',
                        '<freeFormAddress>',
                        freeFormAddress,
                        '</freeFormAddress>\n',
                        '</Address>\n',
                        '</GeocodeRequest>\n',
                        '</Request>\n',
                        '</XLS>'].join("");
                
            var request = OpenLayers.Request.issue({
                method: 'POST',
                headers: {
                    "Content-Type": "text/xml"                  
                },
                url: openLSGeocodeUrl,
                data: postOls,
                failure: getLocationFailure,
                success: getIGNSuccess
            });
        } else {
            Signalement.main.showMsg("Localisation IGN", "Le texte entré n'est pas valide. Il faut une seule virgule dans l'expression. La virgule sert à séparer la rue de la commune");
        }
    };

    var getIGNSuccess = function (response) {
            var resultMessage = "";
            var format = new OpenLayers.Format.XML();
            var doc = format.read(response.responseText);
            var results = format.getElementsByTagNameNS(doc,"*","GeocodedAddress");
            if (results.length>0) {
                var position = format.getElementsByTagNameNS(results[0],"*","pos")[0];
                var loc = (position.textContent) ? position.textContent.split(" ") : position.nodeTypedValue.split(" ");                
                var matchType = results[0].getElementsByTagName("GeocodeMatchCode")[0].getAttribute("matchType");
                var zoom = 15;
                switch (matchType) {
                    case "City": zoom = 15; break;
                    case "Street": zoom = 17; break;
                    case "Street enhanced": zoom = 18; break;
                    case "Street number": zoom = 18; break;
                }
               var accuracy = results[0].getElementsByTagName("GeocodeMatchCode")[0].getAttribute("accuracy");
               resultMessage += " - Pertinence : " + accuracy * 100 + "%";
              
              showLocationResult(resultMessage, loc[1], loc[0], zoom);

              
            }
            else {
                Signalement.main.showMsg("La géolocalisation a échoué", "aucun résultat");
            }
      
    
    };

    //GEOCODAGE NOMINATIM

    var codeAddressNominatim = function (value) {
        markers.clearMarkers();
        var address = value + ', France';
        var request = OpenLayers.Request.issue({
            method: 'GET',
            params: {
                q: address,
                format: 'json'
            },
            url: 'http://nominatim.openstreetmap.org/search.php?',
            failure: getLocationFailure,
            success: getNominatimSuccess
        });
    };
    //GEOCODAGE GOOGLE

    var codeAddressGoogle = function (value) {
        markers.clearMarkers();
        var address = value + ', France';
        var request = OpenLayers.Request.issue({
            method: 'GET',
            params: {
                address: address,
                sensor: false
            },
            url: 'http://maps.googleapis.com/maps/api/geocode/json?',
            failure: getLocationFailure,
            success: getGoogleSuccess
        });
    };

    var getNominatimSuccess = function (response) {
        var obj = JSON.parse(response.responseText);
        if (obj.length > 0) {
            var nominatimResult = obj[0];
            var msg = nominatimResult.display_name;
            showLocationResult(msg, nominatimResult.lon, nominatimResult.lat, 17);
        } else {
            Signalement.main.showMsg("Localisation Nominatim", "Aucun résultat trouvé.");
        }
    };

    var getGoogleSuccess = function (response) {
        var obj = JSON.parse(response.responseText);
        if (obj.status == 'OK') {
            var googleResult = obj.results[0].geometry.location;
            var msg = obj.results[0].formatted_address;
            showLocationResult(msg, googleResult.lng, googleResult.lat, 17);
        } else {
            Signalement.main.showMsg("Localisation Google", "Aucun résultat trouvé.");
        }

    };
    // COMMON GEOCODAGE

    var codeAddress = function (service, value) {
        switch (service) {
        case "ign":
            codeAddressIGN(value);
            break;
        case "google":
            codeAddressGoogle(value);
            break;
        case "nominatim":
            codeAddressNominatim(value);
            break;
        }
    };

    var getGeocodeImage = function (service) {
        var src = "";
        switch (service) {
        case "ign":
            src = "src/img/geoportail.gif";
            break;
        case "google":
            src = "src/img/google.png";
            break;
        case "nominatim":
            src = "src/img/nominatim.gif";
            break;
        }
        return src;
    };

    var showLocationResult = function (msg, lon, lat, zoom) {
        infogeocoder = {
            formatted_address: msg
        };
        var ptResult = new OpenLayers.LonLat(lon, lat).transform(new OpenLayers.Projection("EPSG:4326"), new OpenLayers.Projection("EPSG:3857"));
        var size = new OpenLayers.Size(20, 34);
        var offset = new OpenLayers.Pixel(-(size.w / 2), - size.h);
        var icon = new OpenLayers.Icon('src/img/googlemarker.png', size, offset);
        markers.addMarker(new OpenLayers.Marker(ptResult, icon));
        map.setCenter(ptResult, zoom);
        showInformation();

    };

    var getLocationFailure = function (response) {
        OpenLayers.Console.log("Erreur Géocodage", response.responseText);
    };

    var showInformation = function () {
        Signalement.main.showMsg('localisation', infogeocoder.formatted_address);

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

        create: function (m, tb, s) {
            map = m;
            toolbar = tb;
            geocodeService = s;
            // Création d'une couche marker destinée à afficher le résultat du geocoder Google
            // Création d'un listener sur l'événement "mouseover" du Layer marker pour afficher un tooltip
            //comprenant le résultat du géocodage
            markers = new OpenLayers.Layer.Markers("Repères de localisation", {
                displayInLayerSwitcher: false
            });
            map.addLayers([markers]);
            loctext = new Ext.form.TextField({
                emptyText: 'ex. janvier, rennes',
                id: 'loctext',
                width: 300,
                listeners: {
                    specialkey: function (f, e) {
                        if (f.getValue() && e.getKey() == e.ENTER) {
                            codeAddress(geocodeService, f.getValue());
                        }
                    }
                }

            });

            logogeocode = new Ext.Component({
                autoEl: {
                    tag: 'img',
                    src: getGeocodeImage(geocodeService)
                }
            });

            var geocodeServiceData = [
                ['ign', 'BD Adresse IGN', 'geoportail.gif'],
                ['nominatim', 'OpenStreetMap', 'nominatim.gif'],
                ['google', 'Google Maps', 'google.png']
            ];

            var geocodeServiceStore = new Ext.data.SimpleStore({
                fields: ['value', 'text', 'img'],
                data: geocodeServiceData
            });
            geocodeCombo = new Ext.form.ComboBox({
                id: 'geocodecombo',
                //listWidth: 65,
                width: 105,
                fieldLabel: '',
                store: geocodeServiceStore,
                valueField: 'value',
                displayField: 'text',
                editable: false,
                mode: 'local',
                triggerAction: 'all'
            });

            geocodeCombo.on('select', function (f, v) {
                geocodeService = v.data.value;
                logogeocode.el.dom.src = "src/img/" + v.data.img;
            });
            geocodeCombo.setValue(geocodeService);

            toolbar.addItem("->");
            toolbar.addItem(logogeocode);
            toolbar.addItem(new Ext.Toolbar.Spacer());
            toolbar.addItem(geocodeCombo);
            toolbar.addItem(loctext);
            toolbar.addItem({
                text: "Localiser",
                tooltip: "Localiser",
                handler: function () {
                    codeAddress(geocodeService, loctext.getValue());
                }
            });
            toolbar.addItem(new Ext.Toolbar.Separator());
        }

    }
})();