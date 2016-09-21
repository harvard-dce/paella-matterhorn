
paella.opencast = new (Class ({
    _me: undefined,
    _episode: undefined,
    _series: undefined,
    _acl: undefined,
    
    getUserInfo: function () {
        var self = this;
        var defer = new $.Deferred();
        
        if (self._me) {
            defer.resolve(self._me);
        } else {
            base.ajax.get({
                url: '/info/me.json'
            },
            function (data, contentType, code) {
                self._me = data;
                defer.resolve(data);
            },
            function (data, contentType, code) {
                defer.reject();
            });
        }
        return defer;
    },
    
    getEpisode: function () {
        var self = this;
        var defer = new $.Deferred();
        
        if (self._episode) {
            defer.resolve(self._episode);
        } else {
            var episodeId = paella.utils.parameters.get('id');
            base.ajax.get({
                url: '/search/episode.json', params: {
                    'id': episodeId
                }
            },
            function (data, contentType, code) {
                //#DCE auth result check
                var jsonData = data;
                if (typeof (jsonData) == "string") jsonData = JSON.parse(jsonData);
                // test if result is Harvard auth or episode data
                if (! self.isHarvardDceAuth(jsonData)) {
                    defer.reject();
                }
                // #DCE end auth check
                if (data[ 'search-results'].result) {
                    self._episode = data[ 'search-results'].result;
                    defer.resolve(self._episode);
                } else {
                    defer.reject();
                }
            },
            function (data, contentType, code) {
                defer.reject();
            });
        }
        return defer;
    },
    
    
    getSeries: function () {
        var self = this;
        return this.getEpisode().then(function (episode) {
            var defer = new $.Deferred();
            var serie = episode.mediapackage.series;
            if (serie != undefined) {
                base.ajax.get({
                    url: '/series/' + serie + '.json'
                },
                function (data, contentType, code) {
                    self._series = data;
                    defer.resolve(self._series);
                },
                function (data, contentType, code) {
                    defer.reject();
                });
            } else {
                defer.reject();
            }
            return defer;
        });
    },
    
    getACL: function () {
        var self = this;
        return this.getEpisode().then(function (episode) {
            var defer = new $.Deferred();
            var serie = episode.mediapackage.series;
            if (serie != undefined) {
                base.ajax.get({
                    url: '/series/' + serie + '/acl.json'
                },
                function (data, contentType, code) {
                    self._acl = data;
                    defer.resolve(self._acl);
                },
                function (data, contentType, code) {
                    defer.reject();
                });
            } else {
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
    }
    // #DCE(naomi): end of dce auth addition
    // ------------------------------------------------------------

}))();



// Patch to work with MH jetty server.
base.ajax.send = function (type, params, onSuccess, onFail) {
    this.assertParams(params);
    
    var ajaxObj = jQuery.ajax({
        url: params.url,
        data: params.params,
        cache: false,
        type: type
    });
    
    if (typeof (onSuccess) == 'function') {
        ajaxObj.done(function (data, textStatus, jqXHR) {
            var contentType = jqXHR.getResponseHeader('content-type');
            onSuccess(data, contentType, jqXHR.status, jqXHR.responseText);
        });
    }
    
    if (typeof (onFail) == 'function') {
        ajaxObj.fail(function (jqXHR, textStatus, error) {
            var data = jqXHR.responseText;
            var contentType = jqXHR.getResponseHeader('content-type');
            if ((jqXHR.status == 200) && (typeof (jqXHR.responseText) == 'string')) {
                try {
                    data = JSON.parse(jqXHR.responseText);
                }
                catch (e) {
                    onFail(textStatus + ' : ' + error, 'text/plain', jqXHR.status, jqXHR.responseText);
                }
                onSuccess(data, contentType, jqXHR.status, jqXHR.responseText);
            } else {
                onFail(textStatus + ' : ' + error, 'text/plain', jqXHR.status, jqXHR.responseText);
            }
        });
    }
};
