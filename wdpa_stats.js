
//Initialise map
var pixel_ratio = parseInt(window.devicePixelRatio) || 1;
var max_zoom = 16;
var tile_size = 512;
var map = L.map('map', {
}).setView([-7, 38], 6);



var WorldImagery = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
 attribution: ''
});
var light  =  L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
	attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
	subdomains: 'abcd',
	maxZoom: 19
}).addTo(map);


//
// var url = 'http://edo.jrc.ec.europa.eu/gdo/php/wms.php?version=1.1.1&service=WMS&SRS=EPSG:900913';
// var rdi=L.tileLayer.wms(url, {
// 		layers: 'grid_1dd_rdri',
// 		transparent: true,
// 		format: 'image/png',
// 		opacity:'1',
// 		zIndex: 33
// 	}).addTo(map);

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

// WDPA HIGLIGHTED LAYER
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
 var popupContent = '<center><h5>'+wdpa_name+'</h5></center>';
 var popup = L.popup()
			 .setLatLng([latlng.lat, latlng.lng])
			 .setContent(popupContent)
			 .openOn(map);
		$( "#wdpa_plot_1995" ).show();
		$( "#wdpa_plot_2015" ).show();
		$( "#sankey_basic" ).show();
		$( "#wdpa_plot_1995_title" ).show();
		$( "#wdpa_plot_2015_title" ).show();
		$( "#sankey_basic_title" ).show();

// Land Cover Change (1995-2015)
	var base_url_services = 'https://dopa-services.jrc.ec.europa.eu/services/d6dopa'
	var url_wdpaid_lcc = base_url_services+'/landcover/get_wdpa_lcc_esa?format=json&wdpaid=' + wdpaid;
  $.ajax({
	      url: url_wdpaid_lcc,
	      dataType: 'json',
	      success: function(d) {
				          if (d.metadata.recordCount == 0) {
				             jQuery('#sankey_basic').html('<p>No Data</p>');
				          } else {
							             var lc1_1995;
							             var lc2_2015;
							             var area;
							             var obj_array_lcc = [];

							              $(d.records).each(function(i, data) {
							                       lc1_1995=data.lc1_1995;
							                       lc2_2015=data.lc2_2015;
							                       area=data.area;
							                       obj_array_lcc.push([data.lc1_1995,data.lc2_2015,data.area]);
							              });
									   google.charts.load('current', {'packages':['sankey']});
									 	 google.charts.setOnLoadCallback(drawChart);
									   function drawChart() {
									   var data = new google.visualization.DataTable();
									   data.addColumn('string', 'From');
									   data.addColumn('string', 'To');
									   data.addColumn('number', 'Area (km2)');
									   data.addRows(obj_array_lcc);
									   var colors = ['#538135', '#bf8f00', '#c45911', '#2f5496','#bf8f00','#538135', '#c45911', '#2f5496' ];
									   var options = {
									     width: 410,
									     height: 300,
									     sankey: {
									        node: {
									          colors: colors,
									          interactivity: true,
									          labelPadding: 2,
									          width: 5,
									          nodePadding: 10
									        },
									        link: {colorMode: 'gradient', colors: colors }
									      }
									   };

										if (obj_array_lcc[0][2] == 0.00001 && obj_array_lcc[1][2] == 0.00001 && obj_array_lcc[2][2] == 0.00001 && obj_array_lcc[3][2] == 0.00001 && obj_array_lcc[4][2] == 0.00001 && obj_array_lcc[5][2] == 0.00001 ) {
										  jQuery('#lcc_div').html('<br><p align="center!important">No Land Cover Change occurred in this WDPA </p><hr><br><br>');
										}else{
										  var chart = new google.visualization.Sankey(document.getElementById('sankey_basic'));
										  chart.draw(data, options);
										}
									}
							}
				},
});

// Land Cover 1995
 $('#wdpa_plot_1995').highcharts({
	 chart: {type:'bar', height: 300,
	 backgroundColor:'rgba(255, 255, 255, 0)',
	 legend: {enabled: false}
   },
	 title: {text: null},
	 subtitle: {text: null},
	 credits: {
			 enabled: false,
			 text: '© DOPA Services',
			 href: 'http://dopa.jrc.ec.europa.eu/en/services'
	 },
		xAxis: {
			categories: [wdpa_name]
	 },
	 yAxis: {
				 title: { text: null },
				 labels: {overflow: 'justify'}
	 },
	 series:[{
						name: 'Cultivated / managed land',
						color: '#d07a41',
						data: [Math.floor((Math.random() * 10) + 1)*rep_area ]
					},{
						name: 'Mosaic natural / managed land',
						color: '#cca533',
						data: [Math.floor((Math.random() * 10) + 1)*rep_area  ]
					},{
						name: 'Natural / semi-natural land',
						color: '#759a5d',
						data: [Math.floor((Math.random() * 10) + 1)*rep_area ]
					},{
						name: 'Water / snow and ice',
						color: '#5976ab',
						data: [Math.floor((Math.random() * 10) + 1)*rep_area  ]
					}
				]
 });

 // Land Cover 2015
 $('#wdpa_plot_2015').highcharts({
	 chart: {type:'bar', height: 300,
	 backgroundColor:'rgba(255, 255, 255, 0)',
	 legend: {enabled: false}
	 },
	 title: {text: null},
	 subtitle: {text: null},
	 credits: {
			 enabled: false,
			 text: '© DOPA Services',
			 href: 'http://dopa.jrc.ec.europa.eu/en/services'
	 },
		xAxis: {
			categories: [wdpa_name]
	 },
	 yAxis: {
				 title: { text: null },
				 labels: {overflow: 'justify'}
	 },
	 series:[{
						name: 'Cultivated / managed land',
						color: '#d07a41',
						data: [Math.floor((Math.random() * 10) + 1)*rep_area ]
					},{
						name: 'Mosaic natural / managed land',
						color: '#cca533',
						data: [Math.floor((Math.random() * 10) + 1)*rep_area  ]
					},{
						name: 'Natural / semi-natural land',
						color: '#759a5d',
						data: [Math.floor((Math.random() * 10) + 1)*rep_area ]
					},{
						name: 'Water / snow and ice',
						color: '#5976ab',
						data: [Math.floor((Math.random() * 10) + 1)*rep_area  ]
					}
				]
 });

}

// HIDE CHARTS WHEN CLOSING POPUP
map.on('popupclose', function (){
	$( "#wdpa_plot_1995" ).hide();
	$( "#wdpa_plot_2015" ).hide();
	$( "#sankey_basic" ).hide();
	$( "#wdpa_plot_1995_title" ).hide();
	$( "#wdpa_plot_2015_title" ).hide();
	$( "#sankey_basic_title" ).hide();
});

//Available Layers
var baseMaps = {"White" : light, "WorldImagery":WorldImagery};
var overlayMaps = {'wdpa': wdpa};

//Add Layer Control
layerControl = L.control.layers(baseMaps, overlayMaps, null,  {position: 'topleft'}).addTo(map);
