
paella.opencast = new (Class ({
	_me: undefined,
	_episode: undefined,
	_series: undefined,
	_acl: undefined,
	
	getUserInfo:function() {
		var self = this;
		var defer = new $.Deferred();
	
		if (self._me) {
			defer.resolve(self._me);
		}
		else {
			base.ajax.get({url:'/info/me.json'},
				function(data,contentType,code) {
					self._me = data;
					defer.resolve(data);
				},
				function(data,contentType,code) { defer.reject(); }
			);
		}	
		return defer;
	},
	
	getEpisode: function() {
		var self = this;
		var defer = new $.Deferred();		

		if (self._episode) {
			defer.resolve(self._episode);
		}
		else {
			var episodeId = paella.utils.parameters.get('id');
			base.ajax.get({url:'/search/episode.json', params:{'id': episodeId}},
				function(data, contentType, code) {
					//#DCE auth result check
					var jsonData = data;
					if (typeof (jsonData) == "string") jsonData = JSON.parse(jsonData);
					// test if result is Harvard auth or episode data
					if (! self.isHarvardDceAuth(jsonData)) {
						defer.reject();
					}
					// #DCE end auth check
					if (data['search-results'].result) {
						self._episode = data['search-results'].result;
						defer.resolve(self._episode);		
					}
					else {
						defer.reject();						
					}
				},
				function(data, contentType, code) {
					defer.reject();
				}
			);
		}		
		return defer;		
	},
	
	
	getSeries: function() {
		var self = this;
		return this.getEpisode()
		.then(function(episode) {			
			var defer = new $.Deferred();
			var serie = episode.mediapackage.series;
			if (serie != undefined) {	
					// #DCE use search/series instead of series endpoint directly
					self.searchSeriesToSeriesSeries(serie,
					function(data,contentType,code) {
						self._series = data;
						defer.resolve(self._series);
					},
					function(data, contentType, code) {
						defer.reject();
					}
				);
			}
			else {
				defer.reject();
			}
			return defer;
		});		
	},

	getACL: function() {
		var self = this;
		return this.getEpisode()
		.then(function(episode) {			
			var defer = new $.Deferred();
			var serie = episode.mediapackage.series;
			if (serie != undefined) {			
				base.ajax.get({url:'/series/'+serie+'/acl.json'},
					function(data,contentType,code) {
						self._acl = data;
						defer.resolve(self._acl);
					},
					function(data,contentType,code) {
						defer.reject();									
					}
				);						
			}
			else {
				defer.reject();
			}
			return defer;
		});		
	},
	
    // ------------------------------------------------------------
    // #DCE(naomi): start of dce auth addition
    isHarvardDceAuth: function (jsonData) {
        
        // check that search-results are ok
        var resultsAvailable = (jsonData !== undefined) &&
        (jsonData[ 'search-results'] !== undefined) &&
        (jsonData[ 'search-results'].total !== undefined);
        
        // if search-results not ok, maybe auth-results?
        if (resultsAvailable === false) {
            var authResultsAvailable = (jsonData !== undefined) &&
            (jsonData[ 'dce-auth-results'] !== undefined) &&
            (jsonData[ 'dce-auth-results'].dceReturnStatus !== undefined);
            
            // auth-results not present, some other error
            if (authResultsAvailable === false) {
                paella.debug.log("Seach failed, response:  " + jsonData);
                
                var message = "Cannot access specified video; authorization failed (" + jsonData + ")";
                paella.messageBox.showError(message);
                $(document).trigger(paella.events.error, {
                    error: message
                });
                return false;
            }
            
            // auth-results present, dealing with auth errors
            var authResult = jsonData[ 'dce-auth-results'];
            var returnStatus = authResult.dceReturnStatus;
            if (("401" == returnStatus || "403" == returnStatus) && authResult.dceLocation) {
                window.location.replace(authResult.dceLocation);
            } else {
                paella.messageBox.showError(authResult.dceErrorMessage);
                $(document).trigger(paella.events.error, {
                    error: authResult.dceErrorMessage
                });
            }
            return false;
        } else {
            return true;
        }
    },
    // #DCE(naomi): end of dce auth addition
    // ------------------------------------------------------------
    // #DCE(gregLogan): start of get resourceId for usertracking "logging helper code"
    setHarvardDCEresourceId: function (jsonData) {
        //TODO: This is assuming we only have one result... (greg's comment)
        var result = data[ 'search-results'].result;
        if (result != undefined) {
            if (result.dcIsPartOf != undefined) {
                offeringId = result.dcIsPartOf.toString();
            }
            if (result.dcType != undefined) {
                type = data[ 'search-results'].result.dcType.toString();
            }
        }
        if (offeringId && type) {
            paella.opencast.resourceId = (offeringId.length >= 11 ? "/" + offeringId.substring(0, 4) +
            "/" + offeringId.substring(4, 6) + "/" + offeringId.substring(6, 11) + "/": "") + type;
        } else {
            paella.opencast.resourceId = "";
        }
    },
    // #DCE(greg): end of usertracking param set helper
    // ------------------------------------------------------------
    // ------------------------------------------------------------
    // #DCE(karen): START, get search/series and tranform result into series/series format
    // This tranforms the series data into the expected upstream series format
    searchSeriesToSeriesSeries: function (serie, onSuccess, onError) {
        base.ajax.get({
            url: '/search/series.json',
            params: {
                'id': serie
            }
        },
        function (data, contentType, code) {
            var jsonData = data;
            try {
                if (typeof (jsonData) == "string") jsonData = JSON.parse(jsonData);
            }
            catch (e) {
                showLoadErrorMessage(paella.dictionary.translate("Unable to parse series id") + "\"" + serie + "\" data: " + data);
                if (typeof (onError) == 'function') {
                    onError();
                }
                return;
            }
            // #DCE verify that results returned at least one series
            var totalItems = parseInt(jsonData[ 'search-results'].total);
            if (totalItems === 0) {
                showLoadErrorMessage(paella.dictionary.translate("No series found for series id") + ": \"" + serie + "\"");
                if (typeof (onError) == 'function') {
                    onError();
                }
                return;
            } else {
                var dcObject = {
                };
                var seriesResult = jsonData[ 'search-results'].result;
                for (var key in seriesResult) {
                    // trim out "dc" and lower case first letter
                    var keyTrimmed = key.replace(/^dc/, '');
                    keyTrimmed = keyTrimmed.charAt(0).toLowerCase() + keyTrimmed.slice(1);
                    dcObject[keyTrimmed] =[ {
                        "value": seriesResult[key]
                    }];
                }
                if (typeof (onSuccess) == 'function') {
                    onSuccess(dcObject);
                }
            }
        });
    },
    // #DCE(karen): END transform series format
    // ------------------------------------------------------------
    //#DCE start show not found error
    showLoadErrorMessage: function (message) {
        paella.messageBox.showError(message);
        $(document).trigger(paella.events.error, {
            error: message
        });
    }
    //#DCE end show not found error
    // -----------------------------------------------------------
	
}))();
	


// Patch to work with MH jetty server. 
base.ajax.send = function(type,params,onSuccess,onFail) {
	this.assertParams(params);

	var ajaxObj = jQuery.ajax({
		url:params.url,
		data:params.params,
		cache:false,
		type:type
	});
	
	if (typeof(onSuccess)=='function') {
		ajaxObj.done(function(data,textStatus,jqXHR) {
			var contentType = jqXHR.getResponseHeader('content-type');
			onSuccess(data,contentType,jqXHR.status,jqXHR.responseText);
		});
	}
	
	if (typeof(onFail)=='function') {
		ajaxObj.fail(function(jqXHR,textStatus,error) {
			var data = jqXHR.responseText;
			var contentType = jqXHR.getResponseHeader('content-type');
			if ( (jqXHR.status == 200) && (typeof(jqXHR.responseText)=='string') ) {
				try {
					data = JSON.parse(jqXHR.responseText);
				}
				catch (e) {
					onFail(textStatus + ' : ' + error,'text/plain',jqXHR.status,jqXHR.responseText);
				}
				onSuccess(data,contentType,jqXHR.status,jqXHR.responseText);
			}
			else{
				onFail(textStatus + ' : ' + error,'text/plain',jqXHR.status,jqXHR.responseText);
			}		
		});
	}
};


