'use strict';

/**
 * Msmultiview is a jQuery plugin which supports to manage and visualize mass spectral data in graphical ways. 
 * It works either the browser is in online or offline mode. It builds using jQuery, jQuery UI and Highcharts libraries.
 * 
 * Main features:
 *  - Graphical representation of mass spectral data
 *  - Manage (sort, delete, export...etc.) active window information with comparing other windows information
 *  - Zooming graphs areas
 * 
 * @version 1.1.0
 * @license MIT license
 * @author Riken MassBank Project
 * 
 */
		 
( function( $, window, document, undefined ) {
	
	/**
	 * @private
	 */
	var _mv = {
			
		/**
		 * Utility functions object
		 */
		util: {
			/**
			 * Returns a string-valued universal identifier
			 * @returns {String} A string-valued universal identifier
			 */
			getGUID: function() {
				
				var S4 = function() {
					return (Math.floor(Math.random() * 0x10000 /* 65536 */).toString(16));
				};

				return ("GUID-" + S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4()
						+ S4() + S4());
			},
			/**
			 * Append css rule text as new <style> tag into the <head> tag.
			 * @param {String} text - Text of CSS rules
			 */
			addCss: function( text ) {
				text = JSON.stringify( text ).replace(/"/g, "").replace(/,/g, ";");
				$( "<style>" ).prop( "type", "text/css" ).html( text ).appendTo( "head" );
			}
		},
		
		/**
		 * Multiview plugin object
		 */
		plugin: {
			/**
			 * validate plugin and environment
			 * @param {object} args - Arguments pass when plugin initialization
			 * @returns {boolean} True or False according to the validity of arguments
			 */
			validate: function( args ) {
				if ( args.length == 0 ) {
					// [ERROR] no arguments
					console.log( "[ERROR] no arguments" );
					return;
				} else if ( ! _mv.storage.isBrowserSupport() ) {
					// [ERROR] no localStorage support
					console.log( "[ERROR] no localStorage support" );
					return;
				} else {
					// [SUCCESS] MassBank multiview successfully loading...
					console.log( "[SUCCESS] successfully validated." );
					return true;
				}
			},
			/**
			 * Returns analyzed parameters for multiview plugin
			 * @param {object} args - Arguments pass when plugin initialization
			 * @returns {object} Analyzed parameters for multiview plugin
			 */
			getParams: function( args ) {
				var result = { "urls": [], "opts": null },
					_param = $.fn.msmultiview.defaults.param;
				
				function _updateDefaultsParam( param ) {
					$.fn.msmultiview.defaults.highcharts.yAxis.title.text 					= param.chart.yAxis.title.text;
					$.fn.msmultiview.defaults.highcharts.series[0].name 					= param.chart.xAxis.title.text;
					$.fn.msmultiview.defaults.highcharts.series[0].custom.maxmzmarker 		= param.chart.maxmzmarker;
					$.fn.msmultiview.defaults.highcharts.series[0].custom.intensitythreshold= param.chart.intensitythreshold;
				}
				
				_updateDefaultsParam( _param );
				
				// update options
				result[ "opts" ] = $.extend( true, {}, $.fn.msmultiview.defaults, {} );
				
				$.each( args, function( i, arg ) {
					if ( $.isPlainObject( arg ) ) {
						// generate custom Options
						if ( i > 0 ) {
							_param = $.extend( true, {}, $.fn.msmultiview.defaults.param, arg[ "param" ] );
							_updateDefaultsParam( _param );
							
							result[ "opts" ] = $.extend( true, {}, $.fn.msmultiview.defaults, arg );
						} else {
							console.log( "[ERROR] Invalid argument in initial position." );
						}
					}
				});
				
				$.each( args, function( i, arg ) {
					if ( ! $.isPlainObject( arg ) ) {
						// generate data URLs
						var arr =  $.isArray( arg ) ? arg : $.makeArray( arg );
						
						$.each( arr, function ( j, val ) {
							// argument is a string
							if ( val.indexOf( 'http://' ) === 0 || val.indexOf( 'https://' ) === 0 ) {
								// URL
								result[ "urls" ].push( val );
							} else {
								// string
								result[ "urls" ].push( result[ "opts" ][ "param" ][ "apiUrlPrefix" ] + val );
							}
						});
					}
				});
				
				return result;
			},
			/**
			 * Initiate multiview plugin
			 * @param {HTML} $root - HTML dom element of multiview plugin
			 * @param {object} params - Parameters for multiview plugin
			 */
			init: function( $root, params ) {
				var result = { "success": [], "failure": [] },
					_event = mv.event,
					_requests = [];
				
				mv.param.chart.options = params[ "opts" ];
				
				/* loader */
				$root.html( "<div class='loader-container'><div class='text'>Loading...</div><div class='loader'></div></div>" );
				
				var sb = [];
				sb.push( ".loader-container { text-align: center; }" );
				sb.push( ".loader-container .text { color: #f3f3f3; font-size: 2rem; }" );
				sb.push( ".loader-container .loader { margin: 2% auto; border: .2rem solid #f3f3f3; width: 60px; height: 60px; -webkit-animation: spin 2s linear infinite; animation: spin 2s linear infinite; }" );
				sb.push( "@-webkit-keyframes spin { 0% { -webkit-transform: rotate(0deg); } 100% { -webkit-transform: rotate(360deg); } }" );
				sb.push( "@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }" );
				_mv.util.addCss( sb.join("") );
				
				$.each( params[ "urls" ], function( index, _url ) {
					_requests.push(
						$.ajax({
							type: "GET",
							url: _url,
							async: false,
							dataType: 'jsonp',
							crossDomain: true,
							success: function( data, status, xhr ) {
								var _arr = _event.chart.load.success( data, status, xhr );
								if ( _arr && _arr.length > 0 ) {
									// URL contains only one spectrum data
									_arr[0][ "url" ] 	= _url;
									_arr[0][ "index" ] 	= index;
									result[ "success" ].push( _arr[0] );
								} else {
									result[ "failure" ].push( _url );
								}
							}
						})
					);
				});
				
				// after complete all the request
				$.when.apply(null, _requests).done(function() {
					// sort success results
					result[ "success" ].sort(function( a, b ) {
					    return parseInt( a.index ) - parseInt( b.index );
					});
					_mv.plugin.render( $root, result, mv.param.chart.options );
				});

			},
			/**
			 * Render the plugin into HTML element
			 * @param {HTML} $root - HTML element for render plugin
			 * @param {object} result - Result of chart data for plugin
			 * @param {object} options - Options for chart view
			 */
			render: function( $root, result, options ) {
				
				// remove loader
				$root.empty();
				
				// get plugin key
				var pluginKey = _mv.plugin.getKey( $root );
				
				// merge to local storage
				_mv.storage.merge( pluginKey, result[ "success" ] );
				
				// append window manager
				if ( options[ "windowsmanager" ][ "enabled" ] ) {
					_mv.windowsmanager.init( $root, result[ "failure" ] );
				}
				
				// append charts
				_mv.highcharts.render( $root, options[ "highcharts" ] );
				
				// initialize popup
				_mv.popup.init();
				
				// append charts zoomer
				if ( options[ "chartszoomer" ][ "enabled" ] ) {
					_mv.chartszoomer.render( $root );
				}
				
			},
			/**
			 * Displays plugin generation code in a popup window. 
			 * Window content differ according to the environment of plugin.
			 */
			code: function() {
				//
				_mv.popup.show();
				
				var $wrapper = _mv.popup.getWrapper();
				$wrapper.empty().show();
				var sb = [], id_sb = [];
				sb.push( "<p>The MultiView sample plugin</p>" );
				if ( window.location.origin.indexOf('https://massbank.nig.ac.jp') != -1 ) {
					// URL
					sb.push( "<p>Updated URL:</p>" );
					sb.push( "<code>" );
					$( ".current-window ul li" ).each( function() {
						id_sb.push( $(this).attr( "data-id" ) );
					});
					sb.push( window.location.href.replace(/(my_ids=)[^\&]+/, '$1' + id_sb.join(",")) );
					sb.push( "</code>" );
					sb.push( "<p>JavaScript code:</p>" );
					sb.push( "<code>" );
					sb.push( "&lt;script type='text/javascript'&gt;<br/>" );
					sb.push( "mv.event.chart.load.success = function( response, status, xhr ) {<br/>" );
					sb.push( "&emsp;&emsp;// TODO: data convertion code here.<br/>" );
					sb.push( "}" );
					sb.push( "<br/>&lt;/script&gt;" );
					sb.push( "</code>" );
				} else {
					// FILE
					sb.push( "<p>HTML code:</p>" );
					sb.push( "<code>" );
					sb.push( "&lt;div id='ms-multiview'&gt;&lt;/div&gt;" );
					sb.push( "</code>" );
					sb.push( "<p>JavaScript code:</p>" );
					sb.push( "<code>" );
					sb.push( "&lt;script type='text/javascript'&gt;<br/><br/>" );
					sb.push( "mv.event.chart.load.success = function( response, status, xhr ) {<br/>" );
					sb.push( "&emsp;&emsp;// TODO: data convertion code here.<br/>" );
					sb.push( "}<br/><br/>" );
					sb.push( "$( window ).load( function () {<br/>" );
					
					$( ".current-window ul li" ).each( function() {
						id_sb.push( "'" + $(this).attr( "data-url" ) + "'" );
					});
					
					sb.push( "&emsp;&emsp;$( '#ms-multiview' ).multiview( " + id_sb.join( ", " ) + " );" );
					sb.push( "<br/>});" );
					sb.push( "<br/><br/>&lt;/script&gt;" );
					sb.push( "</code>" );
				}
				$wrapper.html( sb.join( "" ) );
			},
			/**
			 * Returns the string-valued universal identifier of the HTML element
			 * @param {HTML} $root - HTML element of plugin initiated
			 * @returns {string} The string-valued universal identifier of the HTML element
			 */
			getKey: function( $root ) {
				// window identity
				if ( ! window[ "name" ].match(/^GUID-/) ) {
					window[ "name" ] = _mv.util.getGUID();
				}
				// plugin identity
				if ( ! $root.attr( "data-plugin-key" ) || $root.attr( "data-plugin-key" ).length === 0 ) {
					$root.attr( "data-plugin-key", window[ "name" ] );
				}
				
				return $root.attr( "data-plugin-key" );
			},
			/**
			 * Returns the HTML element of plugin initiated
			 * @param {string} key - The string-valued universal identifier of the HTML element
			 * @returns {HTML} HTML element of plugin initiated
			 */
			getRoot: function( key ) {
				return $( ".ms-multiview[data-plugin-key='" + key + "']" );
			}
		},
		
		/**
		 * window popup functions object
		 */
		popup: {
			
			init: function() {
				_mv.popup.html();
				_mv.popup.style();
			},
			
			show: function() {
				// get chart image container
				var $container = $( "#mv-popup-container" );
				$( "#mv-popup-container .wrapper" ).html( _mv.popup.param.text.loading );
				
				$( "#mb-overlay-shade" ).fadeTo(300, 0.6, function() {
		            var props = {
		                oLayWidth       : $container.width(),
		                scrTop          : $(window).scrollTop(),
		                viewPortWidth   : $(window).width()
		            };

		            var leftPos = ( props.viewPortWidth - props.oLayWidth ) / 2;

		            $container
		                .css({
		                    display : 'block',
		                    opacity : 0,
		                    top : '-=300',
		                    left : leftPos + 'px'
		                })
		                .animate({
		                    top : props.scrTop + 40,
		                    opacity : 1
		                }, 600);
		        });
			},
			
			html: function() {
				// get chart image container
				if ( $( "#mv-popup-container" ).length == 0 ) {
					var sb = [];
					sb.push( "<div id='mv-popup-container' class='overlay'>" );
					sb.push( "<div class='toolbar'>" );
					sb.push( "<a class='close btn' href='#'>close</a>" );
					sb.push( "</div>" );
					sb.push( "<div class='wrapper'>" + _mv.popup.param.text.loading + "</div>" );
					sb.push( "</div>" );
					$( "body" ).prepend( sb.join( "" ) );
				}
				
				// overlay shade
				if ( $( "#mb-overlay-shade" ).length == 0 ) {
					$( "body" ).prepend( "<div id='mb-overlay-shade'></div>" );
				}
				
				$( "#mb-overlay-shade, .overlay a" ).click( function(e) {
					_mv.popup.event.close();
					if ( $(this).attr( "href" ) == '#' ) e.preventDefault();
				});
			},
			
			style: function() {
				var sb = [];
		    	sb.push( "#mb-overlay-shade { display: none; position: fixed; left: 0; top: 0; width: 100%; height: 100%; z-index: 9999; background-color: #000; }" );
		    	sb.push( ".overlay { display: none; position: absolute; top: -1000px; left: 0; width: 670px; min-height: 200px; z-index: 10000; background-color: #FFF; border: 5px solid #CFCFCF; }" );
		    	sb.push( ".ie7 .overlay { height: 200px; }" );
		    	sb.push( ".overlay .wrapper { padding: 15px 30px 30px; font-size: 3rem; color: #828282; }" );
		    	sb.push( ".overlay .wrapper code { font-size: .875rem; color: #ccc; background: #1d1f21; display: block; padding: 15px; border-radius: 4px; line-height: 1.5; overflow: auto; }" );
		    	sb.push( ".overlay .wrapper p { font-size: 1.25rem; margin: 0.5rem; }" );
		    	sb.push( ".overlay .toolbar { padding: 8px; line-height: 1; text-align: right; overflow: hidden; }" );
		    	_mv.util.addCss( sb.join("") );
			},
			
			getWrapper: function() {
				return $( "#mv-popup-container .wrapper" );
			},
			
			event: {
				
				close: function() {
					$( ".overlay" ).animate({
			            top : '-=300',
			            opacity : 0
			        }, 400, function() {
			            $( "#mb-overlay-shade" ).fadeOut( 300 );
			            $(this).css( "display", "none" );
			            $(this).find( ".wrapper" ).html( "Loading..." );
			        });
				}
			
			},
			
			param: {
				
				text: {
					loading: "Loading..."
				}
			}
		},
		
		/**
		 * local storage functions
		 */
		storage: {
			isBrowserSupport: function() {
				return ( typeof(Storage) !== "undefined" );
			},
			isContains: function( obj, list ) {
				if ( list.length > 0 ) {
					for ( var i = 0; i < list.length; i++ ) {
						if ( list[i]["id"] == obj["id"] ) {
							return true;
						}
					}
				}
		        return false;
			},
			/**
			 * Retrieves a key from localStorage previously set
			 * @param {String} key - localStorage key
			 * @returns {Json} value of localStorage key
			 * @returns {null} in case of expired key or failure
			 */
			get: function( key ) {
				var now = Date.now();  //epoch time, lets deal only with integer
			    // set expiration for storage
			    var expiresIn = localStorage.getItem( key + '-expiresin' );
			    if ( expiresIn === undefined || expiresIn === null ) { expiresIn = 0; }
			    
			    if ( expiresIn < now ) {
			    	_mv.storage.remove( key );
			    	return null;
			    } else {
			    	try {
			    		return JSON.parse( localStorage.getItem( key ) );
			    	} catch ( e ) {
			    		console.log( '[ERROR] Reading key ['+ key + '] from localStorage: ' + JSON.stringify(e) );
			            return null;
			    	}
			    }
			},
			getAll: function() {
				var sb = [];
				for ( var i = 0; i < localStorage.length; i++ ) {
					var key = localStorage.key( i );
		            if ( key.match(/^GUID-/) && ! key.match(/-expiresin$/) ) {
		            	var _val = _mv.storage.get( key );
		            	if ( _val ) {
		            		sb.push({
		            			"key"	: key,
		            			"value"	: _val
		            		});
		            	}
		            }
				}
				return sb;
			},
			getInfoById: function( pluginKey, dataId ) {
				var _arr = _mv.storage.get( pluginKey );
				var result = null;
				if ( _arr ) {
					$( _arr ).each(function( i, _item ){
						if ( _item[ "id" ] == dataId ) {
							result = _item;
							return;
						}
					});
				}
				return result;
			},
			/**
			 * Writes a key into localStorage setting a expire time
			 * @param {String} key - localStorage key
			 * @param {String} value - localStorage value
			 * @param {Number} expires - number of seconds from now to expire the key
			 * @returns {boolean} telling if operation succeeded
			 */
			set: function( key, value, expires ) {
				if ( expires === undefined || expires === null ) {
			        expires = ( 5 * 60 );  // default: seconds for 5 minutes
			    } else {
			        expires = Math.abs(expires); //make sure it's positive
			    }
				var now = Date.now();  //millisecs since epoch time, lets deal only with integer
			    var schedule = now + expires * 1000; 
				try {
					if ( value ) {
						localStorage.setItem( key, JSON.stringify( value ) );
					}
					localStorage.setItem( key + '-expiresin', schedule );
				} catch ( e ) {
					console.log('[ERROR] setting key ['+ key + '] in localStorage: ' + JSON.stringify(e) );
			        return false;
				}
				return true;
			},
			merge: function( key, objects ) {
				var objs = this.get( key );
				if ( ! objs ) {
					objs = [];
				}
				
				
				var _arr = [];
				if ( $.isArray( objects ) ) {
					_arr = objects;
				} else {
					_arr.push( objects );
				}
				
				$.each( _arr, function( i, obj ) {
					if ( ! _mv.storage.isContains( obj, objs ) ) {
						objs.push( obj );
					}
				});
				
				this.set( key, objs );
			},
			reset: function( pluginKey, objs ) {
		    	_mv.storage.remove( pluginKey );
		    	_mv.storage.merge( pluginKey, objs );
		    },
		    /**
		     * Removes a key from localStorage and its sibling expiracy key
		     * @param {String} key - localStorage key to remove
		     * @Returns {Boolean} telling if operation succeeded
		     */
			remove: function( key ) {
				try {
					localStorage.removeItem( key );
					localStorage.removeItem( key + '-expiresin' );
				} catch(e) {
			        console.log( '[ERROR] removing key ['+ key + '] from localStorage: ' + JSON.stringify(e) );
			        return false;
			    }
			    return true;
			},
			clearWindowData: function( windowName ) {
				for ( var i = 0; i < localStorage.length; i++ ) {
					var key = localStorage.key( i );
		            if ( key.match(/^GUID-/) && key.startsWith( windowName ) ) {
		            	_mv.storage.remove( key );
		            }
				}
			},
			/**
		     * Keeping alive a key from localStorage and its sibling
		     * @param {String} key - localStorage key to refresh
		     * @Returns {Boolean} telling if operation succeeded
		     */
			refresh: function( key ) {
				return _mv.storage.set( key );
			}
		},
		
		/**
		 * window manager functions
		 */
		windowsmanager: {
			init: function( $root, failureUrls ) {
				var pluginKey = _mv.plugin.getKey( $root );
				// set styles
				_mv.windowsmanager.style();
				// get container DOM
				var $container = _mv.windowsmanager.html.container( $root );
				// render main content
				_mv.windowsmanager.html.init( $container );
				_mv.windowsmanager.event.init( $container, pluginKey );
				// render custom content
				_mv.windowsmanager.render( $root, failureUrls );
				
			},
			render: function( $root, failureUrls ) {
				var pluginKey = _mv.plugin.getKey( $root );
				var $container = _mv.windowsmanager.html.container( $root );
				
				_mv.windowsmanager.html.error( $container, failureUrls );
				_mv.windowsmanager.html.windows( $container, pluginKey );
				
				_mv.windowsmanager.event.render( $container );
				_mv.windowsmanager.event.toggleEquivalents();
			},
			html: {
				container: function( $root ) {
					// get window manager container
					var $container = $root.find( ".mv-windows-manager:first" );
					if ( $container.length == 0 ) {
						$container = $( "<div class='mv-windows-manager frame'></div>" );
						$container.appendTo( $root );
					}
					return $container;
				},
				init: function( $container ) {
					// remove old content
					$container.empty();
					
					// append accordion string
					var acc_sb = [];
					acc_sb.push( "<div class='accordion active'>Multiview Windows Manager</div>" );
					acc_sb.push( "<div class='panel show'></div>" );
					$container.append( acc_sb.join( "" ) );
					
					// get panel
					var $panel = $container.find( ".panel:first" );
					
					// append button container
					var ctrl_sb = [];
					ctrl_sb.push( "<div class='btn-container'>" );
			    	ctrl_sb.push( "<div style='float: left;'>This is a massbank Volatile:MultiView windows managing area.</div>" );
			    	ctrl_sb.push( "<div style='float: right;'>" );
			    	ctrl_sb.push( "<button class='btn-apply btn'>apply changes</button>" );
			    	ctrl_sb.push( "<button class='btn-code btn' style='margin-left: 5px;'>code</button>" );
			    	ctrl_sb.push( "</div>" );
			    	ctrl_sb.push( "<br clear='all'/>" );
			    	ctrl_sb.push( "</div>" );
			    	$panel.append( ctrl_sb.join( "" ) );
			    	
			    	var hdr_sb = [];
			    	hdr_sb.push( "<div class='hdr-container'>" );
			    	hdr_sb.push( "<div class='currentwin-hdr-container'>Current Window</div>" );
			    	hdr_sb.push( "<div class='otherwins-hdr-container'>Other Windows/Tabs</div>" );
			    	hdr_sb.push( "</div>" );
			    	$panel.append( hdr_sb.join( "" ) );
			    	
			    	// append windows manager
		    		var body_sb = [];
		    		body_sb.push( "<div class='windows-container'>" );
		    		body_sb.push( "<div class='left-windows-container'></div>" );
		    		body_sb.push( "<div class='right-windows-container'></div>" );
		    		body_sb.push( "</div>" );
		    		$panel.append( body_sb.join( "" ) );
				},
				error: function( $container, failureUrls ) {
					// append error string to panel
					if ( failureUrls && failureUrls.length > 0 ) {
						// get panel
						var $panel = $container.find( ".panel:first" );
						
						var err_sb = [];
						err_sb.push( "<div class='error-container'>" );
						$.each( failureUrls, function( i, url ) {
							err_sb.push( "<div class='error'>" );
							err_sb.push( "<span class='btn-close' onclick=\"this.parentElement.style.display='none';\">&times;</span>" );
							err_sb.push( "[ERROR URL] " + url );
							err_sb.push( "</div>" );
						});
						err_sb.push( "</div>" );
						$panel.append( err_sb.join( "" ) );
					}
				},
				windows: function( $container, pluginKey ) {
					var _mvcontainers = _mv.storage.getAll();
					// get panel
					var $panel 				= $container.find( ".panel:first" );
					var $rightWinContainer	= $panel.find( ".right-windows-container:first" ),
					$leftWinContainer	= $panel.find( ".left-windows-container:first" );
					
					$rightWinContainer.empty();
					$leftWinContainer.empty();
					
					if ( _mvcontainers.length > 0 ) {
						
						// append window information
						$.each( _mvcontainers, function( index, _mvcontainer ) {
							var 
								_pluginKey			= _mvcontainer[ "key" ],
								_massbankObjs		= _mvcontainer[ "value" ],
								_is_current_window	= ( pluginKey == _mvcontainer[ "key" ] ),
								win_sb = [];
							var _cssClz = ( _is_current_window ) ? "current-window" : "other-window";
							
							win_sb.push( "<div alt='" + _pluginKey + "' class='" + _cssClz + " win-info-container'>" );
							win_sb.push( "<div class='container-header'></div>" );
							win_sb.push( "<div class='container-body'>" );
							win_sb.push( "<ul>" );
							$.each( _massbankObjs, function( j, _massbankObj ) {
								var _index	= _massbankObj[ "index" ],
									_id		= _massbankObj[ "id" ],
									_url	= _massbankObj[ "url" ],
									_title	= _massbankObj[ "title" ];
								if ( _id ) {
									win_sb.push( "<li data-index='" + _index + "' data-id='" + _id + "' data-url='" + _url + "' data-plugin-key='" + _pluginKey + "'>" );
									win_sb.push( "<span class='massbank-title truncate tooltip' title='" + _title + "'>" + _title + "</span>" );
									win_sb.push( "<span class='nav-action remove' title='remove'></span>" );
									win_sb.push( "<span class='nav-action chart' title='show chart'></span>" );
									win_sb.push( "<span class='nav-action copy' title='add'></span>" );
									win_sb.push( "<span style='clear:both;'></span>" );
									win_sb.push( "</li>" );
								}
							});
							win_sb.push( "</ul>" );
							win_sb.push( "</div>" );
							win_sb.push( "</div>" );
							if ( _is_current_window ) {
								$leftWinContainer.append( win_sb.join( "" ) );
							} else {
								$rightWinContainer.append( win_sb.join( "" ) );
							}
						});
						
					}
				}
			},
			event: {
				init: function( $container, pluginKey ) {
					$( $container ).find( ".accordion" ).click(function(){
						$( this ).toggleClass( "active" );
						$( this ).next().toggleClass( "show" );
					});
					
			    	// make sortable
			    	$( $container.find( ".current-window ul" ) ).sortable();
			    	
			    	// click on apply button
//			    	$container.find( ".btn-apply:first" ).off( "click", "**" );
			    	$container.find( ".btn-apply:first" ).click(function(e) {
			    		if ( _mv.highcharts.param.chart.remain_count == 0 ) {
			    			var $root = _mv.plugin.getRoot( pluginKey );
			    			_mv.windowsmanager.event.update( pluginKey );
			    			_mv.highcharts.render( $root, mv.param.chart.options );
			    		} else {
			    			console.log( "[PENDING] waiting..." );
			    		}
			    	});
			    	$container.find( ".btn-code:first" ).click(function(e) {
			    		_mv.plugin.code();
			    	});
				},
				render: function( $container ) {
					// make sortable
			    	$( $container.find( ".current-window ul" ) ).sortable();
			    	
					// click on remove buttons
					$container.find( ".remove" ).click(function() {
						var $btn = $( this );
						var $li = $btn.closest( "li" );
						var massbank_id = $li.attr( "data-id" );
						
						// remove massbank id from current window
						$li.remove();
						
						// enable other massbnk ids
						_mv.windowsmanager.event.toggleEquivalents( massbank_id );
					});
					
					// copy to current window
					$container.find( ".copy" ).click(function() {
						var $li = $( this ).closest( "li" );
						var massbank_id = $li.attr( "data-id" );
						
						// add massbank id to current window
						$container.find( ".current-window ul" ).append( $li.clone(true) );
						
						// disable other massbnk ids
						_mv.windowsmanager.event.toggleEquivalents( massbank_id );
					});
					
					// chart image
					$container.find( ".chart" ).click(function() {
						var $li = $( this ).closest( "li" );
						var _pluginKey = $li.attr( "data-plugin-key" ),
							_id = $li.attr( "data-id" );
						_mv.highcharts.image.render( _pluginKey, _id, mv.param.chart.options );
					});
				},
				update: function( pluginKey ) {
			    	/* re-initialize local storage data */
					var $root = _mv.plugin.getRoot( pluginKey );
					
			    	var _objs = [];
			    	var $mblist = $root.find( ".win-info-container.current-window ul li" );
			    	if ( $mblist.length > 0 ) {
			    		
			    		_objs = $.map( $mblist, function(el) {
    						return _mv.storage.getInfoById( $(el).attr( "data-plugin-key" ), $(el).attr( "data-id" ) );
    					});
			    		
			    		_mv.storage.reset( pluginKey, _objs );
			    		_mv.windowsmanager.render( $root );
			    	} else {
			    		console.log( "[ERROR] No MassBank Id" );
			    	}
			    },
				toggleEquivalents: function( massbankId ) {
					if ( massbankId ) {
						$( ".win-info-container.other-window li[data-id='" + massbankId + "']" ).toggleClass( "equalid" );
			    	} else {
			    		$( ".win-info-container.other-window li" ).removeClass( "equalid" );
			    		$( ".win-info-container.current-window li" ).each(function() {
			    			$( ".win-info-container.other-window li[data-id='" + $( this ).attr( "data-id" ) + "']" ).addClass( "equalid" );
						});
			    	}
				}
			},
			style: function() {
				var sb = [];
				
				/* windows frame */
				sb.push( ".ms-multiview .frame { border: .1rem solid #eee; padding: .1rem; margin-bottom: .2rem; overflow: hidden; }" );
				
		    	sb.push( ".mv-windows-manager { font-family: 'Segoe UI', 'Open Sans', sans-serif, serif; font-size: 0.875rem; line-height: 1.1; font-weight: 400; }" );
		    	
		    	/* Style the buttons that are used to open and close the accordion panel */
		    	sb.push( ".mv-windows-manager .accordion { background-color: #eee; color: #444; cursor: pointer; padding: .626rem; text-align: left; border: none; outline: none; transition: 0.4s; font-size: 1.2rem; }" );
		    	
		    	sb.push( ".mv-windows-manager .accordion:after { content: '+'; font-size: 1rem; color: #777; float: right; margin-left: 5px; }" );
		    	
		    	/* Add a background color to the header if it is clicked on (add the .active class with JS), and when you move the mouse over it (hover) */
		    	sb.push( ".mv-windows-manager .accordion.active, .mv-windows-manager .accordion:hover { background-color: #ddd; }" );

		    	sb.push( ".mv-windows-manager .accordion.active:after { content: '-'; }" );
		    	
		    	/* Style the accordion panel. Note: hidden by default */
		    	sb.push( ".mv-windows-manager .panel { padding: 0 10px; background-color: white; display: none; }" );

		    	/* The "show" class is added to the accordion panel when the user clicks on one of the buttons. This will show the panel content */
		    	sb.push( ".mv-windows-manager .panel.show { display: block !important; }" );
		    	
		    	/* The error message box */
		    	sb.push( ".mv-windows-manager .error-container { /*color: #cc0000; border-color: #fac5c5; background-color: #fae3e3; font-size: 0.9em; margin: 1em 0; padding: 0.5em; word-wrap: break-word;*/ } " );
		    	sb.push( ".mv-windows-manager .error { padding: 10px; background-color: #f44336; color: white; margin: 5px 0; word-wrap: break-word; font-size: 0.925rem; }" );

		    	/* The close button */
		    	sb.push( ".mv-windows-manager .btn-close { margin-left: 5px; color: white; font-weight: bold; float: right; cursor: pointer; transition: 0.3s; }" );

		    	/* When moving the mouse over the close button */
		    	sb.push( ".mv-windows-manager .btn-close:hover { color: black; }" );
		    	
		    	sb.push( ".mv-windows-manager .windows-container { white-space: nowrap; padding-left: 250px; border: 1px solid #eee; position: relative; margin: 10px 0; height: 165px; }" );
		    	sb.push( ".mv-windows-manager .windows-container:after, .mv-windows-manager .hdr-container .otherwins-hdr-container:after { content: ''; visibility: hidden; display: block; height: 0; clear: both; }" );
		    	sb.push( ".mv-windows-manager .btn-container { margin-top: 10px; }" );
		    	sb.push( ".mv-windows-manager .hdr-container .currentwin-hdr-container { float: left; width: 250px; font-size: 1.25rem; padding-left: 5px; }" );
		    	sb.push( ".mv-windows-manager .hdr-container .otherwins-hdr-container { font-size: 1.25rem; }" );
		    	sb.push( ".mv-windows-manager .windows-container .right-windows-container { overflow-x: auto; overflow-y: hidden; height: 100%; }" ); 
		    	sb.push( ".mv-windows-manager .windows-container .win-info-container { display: inline-block; height: 100%; }" );
		    	sb.push( ".mv-windows-manager .windows-container .win-info-container.current-window .container-body { background: #eff; border-right: 1px solid #eee; }" );
		    	sb.push( ".mv-windows-manager .windows-container .win-info-container.other-window .container-body { border-right: 1px dashed #eee; }" );
		    	sb.push( ".mv-windows-manager .windows-container .win-info-container .container-body { overflow-y: auto; overflow-x: hidden; height: 100%; width: 250px; }" );
		    	sb.push( ".mv-windows-manager .windows-container .win-info-container.current-window { position: absolute; left: 0; height: 100%; }" );
		    	sb.push( ".mv-windows-manager .windows-container .win-info-container ul { list-style: none; list-style-type: none; margin: 0; padding: 5px 0 0 0; }" );
		    	sb.push( ".mv-windows-manager .windows-container .win-info-container ul li { border: 1px solid #eee; margin: 0 5px 5px 5px; padding: 5px; width: 215px; background: #FFF; }" );
		    	sb.push( ".mv-windows-manager .windows-container .win-info-container.current-window ul li { cursor: pointer; }" );
		    	sb.push( ".mv-windows-manager .windows-container .win-info-container li.equalid { background-color: #eaeaea; cursor: default; color: #bebebe; border-color: transparent; }" );
		    	sb.push( ".mv-windows-manager .windows-container .win-info-container li.equalid .nav-action { display: none; }" );
		    	sb.push( ".mv-windows-manager .windows-container .win-info-container .nav-action { display: inline-block; font-size: .825rem; cursor: pointer; margin-left: 2px; padding: 2px 5px; border: 1px solid #DDD; border-radius: 2px; }" );
		    	sb.push( ".mv-windows-manager .windows-container .win-info-container .nav-action:hover { background: #eee; }" );
		    	sb.push( ".mv-windows-manager .windows-container .win-info-container.current-window .nav-action.copy { display: none; }" );
		    	sb.push( ".mv-windows-manager .windows-container .win-info-container.other-window .nav-action.remove { display: none; }" );
		    	sb.push( ".mv-windows-manager .windows-container .win-info-container .nav-action.copy:before { content: '+'; }" );
		    	sb.push( ".mv-windows-manager .windows-container .win-info-container .nav-action.chart:before { content: 'chart'; }" );
		    	sb.push( ".mv-windows-manager .windows-container .win-info-container .nav-action.remove:before { content: 'x'; }" );
		    	
		    	sb.push( ".mv-windows-manager .truncate { width: 150px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: inline-block; }" );
		    	sb.push( ".mv-windows-manager .btn { background: #00af89; color: #fff; border: 1px solid #00af89; border-radius: 2px; text-shadow: 0 1px rgba(0,0,0,0.1); box-sizing: border-box; margin: 0; padding: .5em 1em; vertical-align: middle; font-weight: bold; cursor: pointer; }" );
		    	sb.push( ".mv-windows-manager .btn:HOVER { background-color: #008c6d; }" );
		    	
		    	_mv.util.addCss( sb.join("") );
			}
		},
		
		/**
		 * window manager functions
		 */
		chartszoomer: {
			
			render: function( $root ) {
				// get zoomer container
				var $container = $root.find( ".mv-zoomer-container:first" );
				if ( $container.length == 0 ) {
					$container = $( "<div class='mv-zoomer-container'></div>" );
					$container.appendTo( $root );
				}
				$container.empty();
				_mv.chartszoomer.style();
				_mv.chartszoomer.html( $container );
				_mv.chartszoomer.event.init( $container );
			},
			
			html: function( $container ) {
				var btn_sb = [];
				btn_sb.push( "<div class='btn-zoom-in btn' title='zoom in'>+</div>" );
				btn_sb.push( "<div class='btn-zoom-out btn' title='zoom out'>-</div>" );
				btn_sb.push( "<div class='btn-zoom-default btn' title='zoom default'>1:1</div>" );
				$container.append( btn_sb.join( "" ) );
			},
			
			style: function() {
				var sb = [];
				sb.push( ".mv-zoomer-container { opacity: .25; filter:alpha(opacity=25); position: fixed; top: 50%; left: 0; z-index: 1000; background: #EEE; border: 1px solid #CCC; padding: .25rem; }" );
				sb.push( ".mv-zoomer-container:hover { opacity: 1; filter:alpha(opacity=100); }" );
				
				sb.push( ".mv-zoomer-container .btn { background: #00af89; text-align: center; color: #fff; border: 1px solid #EEE; padding: .5em; vertical-align: middle; font-size: 1.5rem; font-weight: bold; cursor: pointer; margin: .2rem; }" );
				sb.push( ".mv-zoomer-container .btn:HOVER { background-color: #008c6d; }" );
				_mv.util.addCss( sb.join("") );
			},
			
			event: {
				
				init: function( $container ) {
					
					var _zoom = _mv.chartszoomer.param.zoom;
					
					$container.find( ".btn-zoom-in" ).click(function() {
						if ( _zoom.current > 0 ) {
							_zoom.current = _zoom.current - 1;
							$( ".mv-chart-container" ).css( "width", ( 100 / _zoom.current ) + "%" );
							_mv.highcharts.event.resize();
						}
					});
					
					$container.find( ".btn-zoom-out" ).click(function() {
						if ( _zoom.current <= 4 ) {
							_zoom.current = _zoom.current + 1;
							$( ".mv-chart-container" ).css( "width", ( 100 / _zoom.current ) + "%" );
							_mv.highcharts.event.resize();
						}
					});
					
					$container.find( ".btn-zoom-default" ).click(function() {
						if ( _zoom.current != 1 ) {
							_zoom.current = 1;
							$( ".mv-chart-container" ).css( "width", ( 100 / _zoom.current ) + "%" );
							_mv.highcharts.event.resize();
						}
					});
					
				}
			
			},
			
			/**
			 * private parameters
			 */
			param: {
				
				zoom: {
					min: 1,
					max: 5,
					current: 1
				}
			
			}
			
		},
		
		/**
		 * spectrum charts functions
		 */
		highcharts: {
			
			render: function( $root, options ) {
				// get charts container
				var $container = $root.find( ".mv-charts-container:first" );
				if ( $container.length == 0 ) {
					$container = $( "<div class='mv-charts-container'></div>" );
					$container.appendTo( $root );
				}
				$container.empty();
				
				var pluginKey = _mv.plugin.getKey( $root );
				
				_mv.highcharts.style();
				_mv.highcharts.html( $container, pluginKey, options );
			},
			
			html: function( $container, pluginKey, options ) {
				var _pluginCharts = _mv.storage.get( pluginKey );
				if ( _pluginCharts && _pluginCharts.length > 0 ) {
		    		$.each( _pluginCharts, function( index, _pluginChart ) {
		    			$( "<div class='mv-chart-container frame' alt='" + _pluginChart[ "id" ] + "'></div>" ).appendTo( $container );
		    			var opts = $.extend( true, {}, $.fn.msmultiview.defaults[ "highcharts" ], options );
		    			opts[ "title" ][ "text" ] = _pluginChart[ "title" ];
		    			_mv.highcharts.event.load( _pluginChart[ "id" ], opts, _pluginChart[ "series_data" ] );
		    		});
				}
			},
			
			style: function() {
				var sb = [];
				sb.push( ".mv-charts-container { display: inline; }" );
				sb.push( ".mv-charts-container .mv-chart-container { display: inline-block; box-sizing: border-box; width: 100%; }" );
		    	sb.push( ".highcharts-container .highcharts-tooltip table { font-size: .925em; }" );
		    	sb.push( ".highcharts-container .highcharts-tooltip table td { white-space: nowrap; }" );
		    	sb.push( ".highcharts-container .highcharts-data-labels tspan[style^='font-style:'] { visibility: hidden; }" );
		    	sb.push( ".highcharts-container.show-all-labels .highcharts-data-labels tspan[style^='font-style:'] { visibility: visible; }" );
		    	sb.push( ".highcharts-container .highcharts-data-labels text:last-child * { fill: red; font-size: 11px; }" );
		    	_mv.util.addCss( sb.join("") );
			},
			
			event: {
				
				load: function( id, options, series ) {
					// initialize chart
					$( ".mv-chart-container[alt='" + id + "']:first" ).highcharts( options );
					_mv.highcharts.param.chart.remain_count++;
					// load chart data
					var c = $( ".mv-chart-container[alt='" + id + "']:first" ).highcharts();
					c.showLoading( "loading..." );
					setTimeout(function() {
						c.series[0].setData(series);
						c.hideLoading();
						_mv.highcharts.param.chart.remain_count--;
					}, 250);
				},
				
				syncExtremes: function( e ) {
			    	var thisChart = this.chart;
					if ( e.trigger !== 'syncExtremes' ) {
						Highcharts.each( Highcharts.charts, function (chart) {
							if (chart && chart !== thisChart) {
								if (chart.xAxis[0].setExtremes) {
									chart.xAxis[0].setExtremes(e.min, e.max, undefined, false, { trigger: 'syncExtremes' });
									_mv.highcharts.event.renderLabel();
								}
							}
						});
					}

					try {
						mv.event.chart.afterSyncExtremes();
					} catch (err) {
						// function not exist
					}
			    },
			    
			    renderLabel: function() {
			    	$( '.highcharts-data-labels tspan[style^="font-style:"]' ).css( "font-style", "normal" );
			    },
			    
			    zoomOut: function() {
			    	Highcharts.each(Highcharts.charts, function(chart) {
						if (chart) {
							chart.zoomOut();
						}
					});

					try {
						mv.event.chart.afterZoomOut();
					} catch (err) {
						// function not exist
					}
			    },
			    
			    doubleClick: function() {
			    	if ( _mv.highcharts.clickDetected ) {
			    		_mv.highcharts.event.zoomOut();
			    		_mv.highcharts.clickDetected = false;
					} else {
						_mv.highcharts.clickDetected = true;
						setTimeout(function() {
							_mv.highcharts.clickDetected = false;
						}, 500);
					}
			    },
			    
			    resize : function() {
					var oWidth = $( ".mv-chart-container:first" ).width();
					var oheight = 400;
					var charts = Highcharts.charts;
					// resize highchart
					$.each( charts, function(index, chart) {
						chart.setSize(oWidth, oheight);
					});
				}
			
			},
			
			/**
			 * spectrum charts image functions
			 */
			image: {
				
				render: function( pluginKey, id, options ) {
					// get chart image container
					_mv.popup.show();
					
					var _pluginChart = _mv.storage.getInfoById( pluginKey, id );
					var opts = $.extend( true, {}, $.fn.msmultiview.defaults[ "highcharts" ], options );
	    			opts[ "title" ][ "text" ] = _pluginChart[ "title" ];
	    			opts.series[0][ "data" ] = _pluginChart[ "series_data" ];
	    			opts.plotOptions.series.dataLabels = {};
	    			
	    			var exportData = $.fn.msmultiview.defaults[ "highchartsImage" ][ "exportData" ];
	    			exportData[ "options" ] = JSON.stringify( opts );
	    			
					var $wrapper = _mv.popup.getWrapper();
					
					$.ajax({
	    				type : "post",
	    				url : $.fn.msmultiview.defaults[ "highchartsImage" ][ "exportUrl" ],
	    				data : exportData,
	    				success : function( data ) {
	    					// remove existing images
	    					$wrapper.empty().show();
	    					// append new image
	    					$( "<img>" )
	    						.attr( "src", $.fn.msmultiview.defaults[ "highchartsImage" ][ "exportUrl" ] + data )
	    						.appendTo( $wrapper );
	    				}
	    			});
				}
				
			},
			
			param: {
				
				chart: {
					remain_count: 0
				}
			
			}
		
		}
	};
	
	
	
	
	
	
	
	//////////////////////////PUBLIC INTERFACE - USER CUSTOMIZABLE FUNCTIONS /////////////////////////
	
	/**
	 * User customizable functions and parameters
	 * Exposed globally as `multiview` with `mv` as shortcut.
	 * 
	 * @namespace mv
	 * @alias multiview
	 * @public
	 */
	var mv = {
		/**
		 * Local parameters
		 */
		param: {
			/**
			 * Parameters regarding the chart
			 */
			chart: {}
		},
		/**
		 * Local events
		 * @memberOf mv
		 */
		event: {
			/**
			 * Events regarding the chart
			 * @memberOf mv.event
			 */
			chart: {
				/**
				 * Events regarding the chart load
				 * @memberOf mv.event.chart
				 */
				load: {
					/**
					 * Success callback from data loading ajax call
					 * @memberOf mv.event.chart.load
					 * @param {response} The data returned from the server
					 * @param {status} a string describing the status
					 * @param {xhr} XMLHttpRequest
					 * @returns {Object} Highcharts data source format
					 */
					success: function( response, status, xhr ) {
						if ( response["query"]["pages"]["-1"] ) {
							// in-valid MassBank ID
						} else {
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
					}
				},
				afterLoad: function( id ) {
					console.log( "[LOG] afterLoad... " + Date() + " [" + id + "]" );
				},
				afterSyncExtremes: function() {
					console.log( "[LOG] afterSyncExtremes..." );
				},
				afterZoomOut: function() {
					console.log( "[LOG] afterZoomOut..." );
				}
			}
		}
	};
	
	// Attach to window and globally alias
	window.mv = window.msmultiview = mv;
	
	//////////////////////////PUBLIC INTERFACE - MULTIVIEW /////////////////////////
	
	$.fn.msmultiview = function() {
		/* validate plugin and parameters */
		if ( ! _mv.plugin.validate( arguments ) ) {
			return;
		}
		
		var 
			/* plugin DOM element */
			$root = $( this ),
			/* plugin parameters */
			params = _mv.plugin.getParams( arguments );
		
		if ( $root.length > 1 ) {
			$root = $( $root[0] );
			console.log( "[WARNING] There are selectors. multiview plugin initialize only for a one selector." );
		}
		
		// add multiview plugin identity class
		$root.removeClass( "ms-multiview" ).addClass( "ms-multiview" );
		
		// initialize multiview plugin
		_mv.plugin.init( $root, params );
		
		/* set local storage in every 5 minutes */
		window.setInterval(function(){
			_mv.storage.refresh( window[ "name" ] );
		}, 5*1000); // call every 5 mins
		
		/* page close event */
		$( window ).unload(function() {
			_mv.storage.clearWindowData( window[ "name" ] );
			return;
		});
		
		/* page resize event */
		$( window ).resize(function() {
		   setTimeout( _mv.highcharts.event.resize, 100 );
		});
		
		/* page focus event */
		$( window ).focus(function() {
			var $root = _mv.plugin.getRoot( window[ "name" ] );
			_mv.windowsmanager.render( $root );
		});
	};
	
	////////////////////////// PUBLIC INTERFACE - MULTIVIEW OPTIONS /////////////////
	
	/**
	 * Below are available options and their default values for each MassBank Multiview plugin
	 * Override these at initialization with an 'option' object.
	 */
	$.fn.msmultiview.defaults = {
		/**
		 * Local parameters
		 */
		param: {
			/**
			 * Parameters regarding the chart
			 */
			chart: {
				yAxis: {
					title: {
						text: "rel-intensity"
					}
				},
				xAxis: {
					title: {
						text: "m/z"
					}
				},
				maxmzmarker: " ◀ ",
				intensitythreshold: 800
			},
			apiUrlPrefix: "https://massbank.nig.ac.jp/mediawiki/api.php?format=json&action=query&prop=revisions&rvprop=content&rvparse=1&titles="
		},
		/**
		 * Options regarding the window manager unit.
		 */
		windowsmanager: {
			enabled: true
		},
		/**
		 * Options regarding the chart zoomer unit.
		 */
		chartszoomer: {
			enabled: true
		},
		/**
		 * Options regarding the chart area generated by highcharts plugin.
		 */
		highcharts: {
			chart : {
				type : 'column',
				height : 400,
				spacingRight : 20,
				zoomType : 'x',
				resetZoomButton : {
					theme : {
						display : 'none'
					}
				},
				events : {
					load : function() {
						try {
							_mv.highcharts.event.renderLabel();
							mv.event.chart.afterLoad( $( this.container ).closest( ".mv-chart-container" ).attr( "alt" ) );
						} catch (err) {
							// function not exist
						}
					},
					click : function() {
						try {
							_mv.highcharts.event.doubleClick();
						} catch (err) {
							// function not exist
						}
					}
				}
			},
			credits : {
				enabled : false // remove the "Highcharts.com" text from the bottom of the chart
			},
			title : {
				text : '' // set chart title to 'Spectrum ID: [massbank id]'
			},
			rangeSelector : {
				selected : 1
			},
			xAxis : {
				crosshair : true,
				min : 0,
				minRange : 1,
				events : {
					setExtremes : _mv.highcharts.event.syncExtremes // self.syncExtremes
				}
			},
			yAxis : {
				max : 1250,
				min : 0,
				minRange : 1000, // peakResult.max_y,
				title : {
					text : "" // Y-Axis Label
				}
			},
			tooltip : {
				useHTML : true,
				formatter : function() {
					var _str = "<table><tr style='color:{0}'><td>{1}:</td><td><b>{2}</b></td></tr><tr><td>{3}:</td><td><b>{4}</b></td></tr></table>";
					return _str
						.replace('{0}', this.series.color)
						.replace('{1}', this.series.name)
						.replace('{2}', this.x)
						.replace('{3}', ( this.series.yAxis.axisTitle ) ? this.series.yAxis.axisTitle.textStr: "Value" )
						.replace('{4}', this.y);
				}
			},
			plotOptions : {
				cursor : 'pointer',
				allowPointSelect : true,
				series : {
					dataLabels : {
						enabled : true,
						useHTML : true,
						rotation : -90,
						y : -25,
						style : {
							fontWeight : 'normal',
							fontSize : '9px'
						},
						formatter : function() {
							// show the m/z value of the peak with more than 800 of intensity.
							var sb = [];
							var isMaxPrecursorMz = (this.x == this.series.data[this.series.data.length - 1].x);

							if ( isMaxPrecursorMz ) {
								sb.push("<b>" + this.series.options.custom.maxmzmarker + "</b>");
							}

							var _x = ( Math.round(this.x * 100) / 100 );
							if ( this.y >= this.series.options.custom.intensitythreshold ) {
								sb.push("<span>" + _x + "</span>");
							} else {
								sb.push("<i>" + _x + "</i>");
							}

							return sb.join("");
						}
					}
				}
			},
			series : [ {
				name : "", // X-Axis Label
				pointWidth : 1,
				custom: {
					maxmzmarker: "",
					intensitythreshold: 0
				},
				data : {}
			} ],
			exporting : {
				buttons : {
					btnToggleDataLabels : {
						text : "[toggle data labels]",
						onclick : function() {
							_mv.highcharts.event.renderLabel();
							$( this.container ).closest( ".highcharts-container" ).toggleClass( "show-all-labels" );
						}
					}
				},
				enabled : true // remove buttons (custom and standard)
			}
		},
		/**
		 * Options regarding the chart snapshot generated by highcharts plugin.
		 */
		highchartsImage: {
			exportUrl : "http://export.highcharts.com/",
			exportData : {
				options : null,
				type : 'image/png',
				async : true
			}
		}
	};
	
}( jQuery, window, document ) );