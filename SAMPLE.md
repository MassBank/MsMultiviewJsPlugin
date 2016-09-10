# [msmultiview.js](https://massbank.nig.ac.jp/help:msmultiview)

###### *MassBank MultiView JavaScript Plugin*

## Samples

**Sample 01**: Using massbank.nig.ac.jp server wiki pages.

``` html
<html>
<head>
	<meta charset="utf-8">
    /**
     * Dependant Javascripts. jQuery, jQuery UI, Highcharts and MultiView JS files.
     */
    // jQuery
    <script type="text/javascript" src="https://ajax.googleapis.com/ajax/libs/jquery/1.12.2/jquery.min.js"></script>
    // jQuery UI
	<script type="text/javascript" src="https://code.jquery.com/ui/1.11.4/jquery-ui.js"></script>
	// Highcharts
	<script type="text/javascript" src="https://code.highcharts.com/highcharts.js"></script>
	<script type="text/javascript" src="https://code.highcharts.com/modules/exporting.js"></script>
	// MassBank MultiView
	<script src="js/msmultiview.js" type="text/javascript"></script>
    
    <script type="text/javascript">
        $(window).load(function () {
            $("#ms-multiview").msmultiview( "Spectrum:BSU1000004", "Spectrum:CA0a000112" );
        });
    </script>
</head>
<body>
	<div id="ms-multiview"></div>
</body>
</html>
```

**Sample 02**: Using massbank.nig.ac.jp server wiki API full paths.

``` html
<html>
<head>
	<meta charset="utf-8"> 
    /**
     * Dependant Javascripts. jQuery, jQuery UI, Highcharts and MultiView JS files.
     */
    <script type="text/javascript">
        $(window).load(function () {
            $("#ms-multiview").msmultiview( "https://massbank.nig.ac.jp/mediawiki/api.php?format=json&action=query&prop=revisions&rvprop=content&rvparse=1&titles=Spectrum:BSU1000004", "https://massbank.nig.ac.jp/mediawiki/api.php?format=json&action=query&prop=revisions&rvprop=content&rvparse=1&titles=Spectrum:CA0a000112" );
        });
    </script>
</head>
<body>
	<div id="ms-multiview"></div>
</body>
</html>
```

**sample 03**: Using massbank.nig.ac.jp server search API.

``` html
<html>
<head>
	<meta charset="utf-8"> 
    /**
     * Dependant Javascripts. jQuery, jQuery UI, Highcharts and MultiView JS files.
     */
    <script type="text/javascript">
    
    	mv.event.chart.load.success = function( response, status, xhr ) {
			var result = [];
			$.each( response["data"], function( massbankId, peaks ) {
				// chart data
				var seriesData = [];

				$.each( peaks, function( index, peak ) {
					var peak_mz = parseFloat( peak["mz"] );
					var peak_inte = parseFloat( peak["rel-intensity"] );

					seriesData.push( [peak_mz, peak_inte] );
				});

				result.push({
					"id" 	: massbankId,
					"title" : massbankId,
					"max_y" : 999,
					"series_data" : seriesData
				});
			});
			return result;
		}
        
        $(window).load(function () {
            $("#ms-multiview").msmultiview( "https://massbank.nig.ac.jp/api/peak/list?ids=CA000129", "https://massbank.nig.ac.jp/api/peak/list?ids=CA000130" );
        });
        
    </script>
</head>
<body>
	<div id="mb-multiview"></div>
</body>
</html>
```

**sample 04**: Using different response APIs as Data URLs.

``` html
<html>
<head>
	<meta charset="utf-8"> 
    /**
     * Dependant Javascripts. jQuery, jQuery UI, Highcharts and MultiView JS files.
     */
    <script type="text/javascript">
    
    	mv.event.chart.load.success = function( response, status, xhr ) {
			/* handling Search API response */
            if ( response["success"] ) {
            	return _convertVer1HttpResponseToChartData(response);

			/* handling WIKI API response */
			} else if ( response["query"] ) {
				return _convertVer2HttpResponseToChartData(response);

			} else {
				return;
				// failure response
			}
		}
         
        function _convertVer1HttpResponseToChartData( response ) {
           var result = [];
           $.each( response["data"], function( massbank_id, peaks ) {
              // chart data
              var series_data = [];

              $.each( peaks, function( index, peak ) {
                 var peak_mz = parseFloat( peak["mz"] );
                 var peak_inte = parseFloat( peak["rel-intensity"] );

                 /* fill chart axis */
                 series_data.push( [peak_mz, peak_inte] );
              });

              result.push({
				"id" 	: massbank_id,
				"title" : massbank_id,
				"max_y" : 999,
				"series_data" : series_data
              });
           });
           return result;
        }

        function _convertVer2HttpResponseToChartData( response ) {
        	// valid MassBank ID
			var result = [];
			/* filter mass spectrum data from response */
			$.each( response["query"]["pages"], function( k, v ) {
				// chart data
				var series_data = [], pubchem_url, id = v["title"], title = v["title"];
				
				$.each( v["revisions"][0], function( key, val ){
					var lines = val.split("\n");
					var _is_peak_line = false;
					for (var i = 0, len = lines.length; i < len; i++) {
						var line = lines[i];
						if ( line.indexOf( "inchikey" ) > -1 ) {
							pubchem_url = (/<img[^>]+src="(https:\/\/[^">]+)"/g).exec(line)[1];
						}
						if ( _is_peak_line ) {
							line = $.trim( line );
							var arr = line.split( " " );
							if ($.isNumeric(arr[0]) && $.isNumeric(arr[2])) {
								var peak_mz = parseFloat(arr[0]); // mz
								var peak_inte = parseFloat(arr[2]); // rel-intensity
								
								/* fill chart axis */
								series_data.push([peak_mz, peak_inte]);
							}
						}
						if ( line.indexOf("PK$PEAK") == 0 ) {
							_is_peak_line = true;
						}
					}
				});
				
				result.push({
					"id" 	: id,
					"title" : title,
					"max_y" : 999,
					"pubchem_url" : pubchem_url,
					"series_data" : series_data
				});
				
			});
			return result;
        }
        
        $(window).load(function () {
            $("#ms-multiview").msmultiview( "https://massbank.nig.ac.jp/api/peak/list?ids=CA000129", "https://massbank.nig.ac.jp/mediawiki/api.php?format=json&action=query&prop=revisions&rvprop=content&rvparse=1&titles=Spectrum:BSU1000004" );
        });
        
    </script>
</head>
<body>
	<div id="ms-multiview"></div>
</body>
</html>
```