# [msmultiview.js](https://massbank.nig.ac.jp/help:msmultiview)

###### *MassBank MultiView JavaScript Plugin*

Msmultiview is a jQuery plugin for managing mass spectra in many ways. It works either online / offline in a browser. It is build on [jQuery](https://jquery.com/), [jQuery UI](https://jqueryui.com/) and [Highcharts](http://www.highcharts.com/) libraries.

### Main features

* Graphical representation of mass spectral data
* Manage (sort, delete, export...etc) chart list within multiple browser windows
* Zoom in and out of chart areas

## Installation

#### Set Page encoding to UTF-8

The source code contains non-ASCII characters and must be served with UTF-8 encoding, either via the `charset="utf-8"` attribute on the `script` tag or by adding `<meta charset="utf-8">` to the page top.

#### Add CSS and Javascript

To install plugin into your page, first include [jQuery](https://jquery.com/), [jQuery UI](https://jqueryui.com/) and [Highcharts](http://www.highcharts.com/) JS files.

``` html
// jQuery
<script src="https://ajax.googleapis.com/ajax/libs/jquery/1.12.2/jquery.min.js"></script>

// jQuery UI
<script src="https://ajax.googleapis.com/ajax/libs/jqueryui/1.11.4/jquery-ui.min.js"></script>

// Highcharts
<script src="https://code.highcharts.com/highcharts.js"></script>
<script src="https://code.highcharts.com/modules/exporting.js"></script>

// MassBank MultiView
<script src="js/msmultiview.js" type="text/javascript"></script>
```
#### Create the content

Make a container `<div>` and give it an identifier like an `ID` or a `Class`.

``` html
<div id="ms-multiview"></div>
```

#### Initialize the plugin

Using a jQuery selector initialize massbank msmultiview plugin.

``` html
<script type="text/javascript">
	/**
     *	Result object
     *	Keys:
     *
     *		// Compulsory key-value pairs.
     *		"id" 			-> Massbank id of chart | String Value. Ex: “KZ0a000005”
     *		"title"			-> Title of chart | String Value. Ex: “KZ0a000005”
     *		"max_y"			-> Chart upper limit | Float Value. Ex: 120.43
     *		"series_data"	-> Data series of chart | Two-dimensional Float Array. List of Pair of X and Y axis values. Ex: [[100.2, 10.78], [80.0, 50.0]…]
     *
     *		// Other custom key-value pairs as user needs.
     */
	mv.event.chart.load.success = function( response, status, xhr ) {
    	// TODO: implement data convertion code here.
    }
    
	$(window).load(function () {
		$( "#ms-multiview" ).msmultiview( /* parameters */ );
	});
</script>
```

For customization, visit the [Specifications](SPEC.md) page.<br/>
For code samples, visit [Samples](SAMPLE.md) page.

#### Building optimized sources

Run `npm install && npm run build` to run *webpack* and *uglify-js*. Concatenated and minified output is written to `./target/js`.

Browser Compatibility
-------

This plugin supports so-called “modern” browsers, which added support of the HTML5 such as IE 11, IE Edge, stable Chrome, Safari and stable Firefox.

License
-------

MassBank MultiView is free plugin, licensed under the creative commons CC-BY, Version 3.0.

Copyright
-------

MassBank MultiView plugin is copyrighted © 2016-present Massbank Developing Team at RIKEN CSRS.
