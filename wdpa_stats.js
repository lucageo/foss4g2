
//Initialise map
var pixel_ratio = parseInt(window.devicePixelRatio) || 1;
var max_zoom = 16;
var tile_size = 512;
var map = L.map('map', {
}).setView([-7, 38], 6);



var WorldImagery = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
 attribution: ''
});
var light  = L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_nolabels/{z}/{x}/{y}.png', {
  subdomains: 'abcd',
  opacity: 1,
  attribution: '',
  maxZoom: 19
}).addTo(map);





var url = 'http://edo.jrc.ec.europa.eu/gdo/php/wms.php?version=1.1.1&service=WMS&SRS=EPSG:900913';
var rdi=L.tileLayer.wms(url, {
		layers: 'grid_1dd_rdri',
		transparent: true,
		format: 'image/png',
		opacity:'1',
		zIndex: 33
	}).addTo(map);

	// wdpa layer
	var url = 'https://lrm-maps.jrc.ec.europa.eu/geoserver/dopa_explorer_2/wms';
	var wdpa=L.tileLayer.wms(url, {
			layers: 'dopa_explorer_2:wdpa_foss4g',
			transparent: true,
			format: 'image/png',
			opacity:'1',
			zIndex: 33
		}).addTo(map);


// on click function
map.on('click', function(e) {
	 if (map.hasLayer(wdpa)) {
		var latlng= e.latlng;
		var url = getFeatureInfoUrl(
										map,
										wdpa,
										e.latlng,
										{
												'info_format': 'text/javascript',  //it allows us to get a jsonp
												'propertyName': ' wdpa_name,wdpaid,rep_area',
												'query_layers': 'dopa_explorer_2:wdpa_foss4g',
												'format_options':'callback:getJson'
										}
								);
			 $.ajax({
							 jsonp: false,
							 url: url,
							 dataType: 'jsonp',
							 jsonpCallback: 'getJson',
							 success: handleJson_featureRequest
						 });
					function handleJson_featureRequest(data)
					{
						 if (typeof data.features[0]!=='undefined')
								 {
										var prop=data.features[0].properties;
										var filter="wdpaid='"+prop['wdpaid']+"'";
										wdpa_hi.setParams({CQL_FILTER:filter});
										hi_highcharts_wdpa(prop,latlng);
							}
							else {}
						}
				 }
				 else {
			 }
});



	// get feature info function
	function getFeatureInfoUrl(map, layer, latlng, params) {

	    var point = map.latLngToContainerPoint(latlng, map.getZoom()),
	        size = map.getSize(),
	        bounds = map.getBounds(),
	        sw = bounds.getSouthWest(),
	        ne = bounds.getNorthEast();

	    var defaultParams = {
	        request: 'GetFeatureInfo',
	        service: 'WMS',
	        srs: 'EPSG:4326',
	        styles: '',
	        version: layer._wmsVersion,
	        format: layer.options.format,
	        bbox: bounds.toBBoxString(),
	        height: size.y,
	        width: size.x,
	        layers: layer.options.layers,
	        info_format: 'text/javascript'
	    };

	    params = L.Util.extend(defaultParams, params || {});
	    params[params.version === '1.3.0' ? 'i' : 'x'] = point.x;
	    params[params.version === '1.3.0' ? 'j' : 'y'] = point.y;
	    return layer._url + L.Util.getParamString(params, layer._url, true);
	}

// wdpa HIGLIGHTED
	var url = 'https://lrm-maps.jrc.ec.europa.eu/geoserver/dopa_explorer_2/wms';
	var wdpa_hi=L.tileLayer.wms(url, {
		  layers: 'dopa_explorer_2:wdpa_foss4g',
			transparent: true,
			format: 'image/png',
			opacity:'1',
			styles: 'polygon',
			zIndex: 44
	 }).addTo(map);
wdpa_hi.setParams({CQL_FILTER:"wdpaid LIKE ''"});

	 function hi_highcharts_wdpa(info,latlng){
		 var wdpa_name=info['wdpa_name'];
		 var wdpaid=info['wdpaid'];
		 var rep_area=info['rep_area'];

		//	 $('#ecoregion_info_tab').show().html('<table style="width:100%"><tr><th>Area Protected 2014 (%)</th><th>Area Protected 2016 (%)</th> <th>Area Protected 2018 (%)</th></tr><tr><td>'+parseFloat(Math.round(protection_2014*100)/100)+'</td><td>'+parseFloat(Math.round(protection_2016*100)/100)+'</td><td>'+parseFloat(Math.round(protection_2018*100)/100)+'</td></tr></table>');
			//	$('#ecoregion_info_name').show().html('<h3>'+name+'</h3>');
			var popupContent = '<center><h5>'+wdpa_name+'</h5></center>';
			var popup = L.popup()
					 .setLatLng([latlng.lat, latlng.lng])
					 .setContent(popupContent)
					 .openOn(map);

	 } //end of function hi_highcharts_pa

map.on('popupclose', function (){ //map is the name of map you gave to your leaflet map
	$( "#wdpa_plot_1995" ).hide();
	$( "#wdpa_plot_2015" ).hide();
});






//Available Layers
var baseMaps = {"White" : light, "WorldImagery":WorldImagery};
var overlayMaps = {'wdpa': wdpa};

//Add Layer Control
layerControl = L.control.layers(baseMaps, overlayMaps, null,  {position: 'bottomleft'}).addTo(map);
