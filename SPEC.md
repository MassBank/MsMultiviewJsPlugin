MassBank MultiView JavaScript Plugin
=======

## Specification

This library entry point being the `msmultiview` method. It returns nothing but initalizes massbank multiview related all components.

Plugin Components:

* Multiview Windows Manager
* Chart Zoomer
* Massbank Spectrum Charts

## *.multiview(URL or Page [, Options])*

### `URL` or `Page` 
> Type: String, Multiple Strings or Array <br/>
> *Required*

Plugin requires at least one or more peak data response URL(s). Page name(s) only enough for WIKI pages of massbank.nig.ac.jp domained URL(s).

### `Options`
> Type: Object <br/>
> *Optional*

Below are all available options and their default values for each MassBank MultiView plugin. Override these at initialization with an options object.

Plugin is customizable under few main categories by accepting options.

#### `Options` customizable categories

Options grouped under many categories which helps to customize multiview plugin. All categories are optional.

``` html
var options = {
	/**
     * General Parameters. ** Optional
     */
    param: {
    	chart: { // chart related options },
        apiUrlPrefix: <URL>, // parent URL for data response
    },
    /**
     * Window Manager. ** Optional
     */
    windowsmanager: { // window manager related options },
    /**
     * Chart Zoomer. ** Optional
     */
    chartszoomer: { // chart zoomer related options },
    /**
     * Highcharts. ** Optional
     */
    highcharts: { // Highcharts related options },
    /**
     * Highcharts image. ** Optional
     */
    highchartsImage: { // Highcharts image related options }
}
```

#### `Options` -> General parameters

| Key | Value | Description |
| ------ | ----------- | -------- |
| apiUrlPrefix   | URL Prefix String | Parent URL for data response |
| chart.yaxis.label   | String | Title of y-axis |
| chart.xaxis.label   | String | Title of x-axis |
| chart.intensitythreshold   | Integer | Threshold value of y-axis. Upper values only shows when chart onload. |
| chart.height   | Integer | Height of chart view |

#### `Options` -> Window Manager

| Key | Value | Description |
| ------ | ----------- | -------- |
| enabled   | true/false | show or hide window manager element |

#### `Options` -> Charts Zoomer

| Key | Value | Description |
| ------ | ----------- | -------- |
| enabled   | true/false | show or hide chart zoomer element |

#### `Options` -> Highcharts

| Description |
| -------- |
| Refer the [Highcharts API Reference](http://api.highcharts.com/highcharts) |

#### `Options` -> Highcharts Image

| Description |
| -------- |
| Refer the [Highcharts API Reference](http://api.highcharts.com/highcharts) |

