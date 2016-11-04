
function loadOpencastPaella(containerId) {
	return paella.opencast.getEpisode()
	.then(
		function(episode) {
			var converter = new OpencastToPaellaConverter();
			var data = converter.convertToDataJson(episode);
			if (data.streams.length < 1) {
				paella.messageBox.showError("Error loading video! No streams found");
			}
			paella.load(containerId, {data:data});
		},
		function(){
			var oacl = new OpencastAccessControl();		
			oacl.userData().then(function(user){
				if (user.isAnonymous) {
					window.location.href = oacl.getAuthenticationUrl();
				}
				else {
					paella.messageBox.showError("Error loading video " + paella.utils.parameters.get('id'));
				}
			});
		}
	);
}

// #DCE toggle presenter & presenation option when ios (bypass paella5 exclusion of presentation video)
function loadOpencastPaellaDCE(containerId) {
	return paella.opencast.getEpisode()
	.then(
		function(episode) {
			var converter = new OpencastToPaellaConverter();
			var data = converter.convertToDataJson(episode);
			if (data.streams.length < 1) {
				paella.messageBox.showError("Error loading video! No streams found");
			}
			paella.dce = paella.dce || {};
			paella.dce.sources = data.streams;
			// Hide the slave stream from paella if ios, will be used in singleVideoToggle
			if (base.userAgent.system.iOS) {
				data.streams = [];
				data.streams[0] = paella.dce.sources[0];
			}
			paella.load(containerId, {data:data});
		},
		function(jsonData){
			// #DCE start specific DCE auth handling, formally in isHarvardDceAuth() (MATT-2212)
			if (jsonData && jsonData[ 'dce-auth-results']) {
				paella.opencast.isHarvardDceAuthRedirect(jsonData)
				base.log.debug("Successfully performed DCE auth redirect");
			// #DCE end specific DCE auth handling
			} else {
				paella.messageBox.showError("Unable to load video " + paella.utils.parameters.get('id'));
			}
		}
	);
}

