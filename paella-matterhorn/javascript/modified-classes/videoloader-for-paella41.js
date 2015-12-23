/*

Video data: paella.VideoLoader

Extend paella.VideoLoader and implement the loadVideo method:

*/


var MHVideoLoader = Class.create(paella.VideoLoader, {
  isStreaming:function(track) {
    return /rtmp:\/\//.test(track.url);
  },

  getStreamSource:function(track) {
    var res = new Array(0,0);
        if (track.video instanceof Object) {
        res = track.video.resolution.split('x');
        }

    var src = track.url;
    var urlSplit = /^(rtmp:\/\/[^\/]*\/[^\/]*)\/(.*)$/.exec(track.url);
    if (urlSplit != null) {
      var rtmp_server =  urlSplit[1];
      var rtmp_stream =  urlSplit[2];     
      src = {
        server: encodeURIComponent(rtmp_server),
        stream: encodeURIComponent(rtmp_stream)
      };
    }

    var source = {      
      src:  src,
      type: track.mimetype,
      res: {w:res[0], h:res[1]},
      isLiveStream: (track.live===true)
    };

    return source;
  },

  isSupportedStreamingTrack: function(track) {
    if (/^(rtmp:\/\/[^\/]*\/[^\/]*)\/(.*)$/.test(track.url) == true) {
      switch (track.mimetype) {
        case 'video/mp4':
        case 'video/ogg':
        case 'video/webm':
        case 'video/x-flv':
          return true;
        default:
          return false;
      }
    }
    return false;
  },


  loadVideo:function(videoId,onSuccess) {
    var i;
    var streams = {};
    var tracks = paella.matterhorn.episode.mediapackage.media.track;
    var attachments = paella.matterhorn.episode.mediapackage.attachments.attachment;
    if (!(tracks instanceof Array)) { tracks = [tracks]; }
    if (!(attachments instanceof Array)) { attachments = [attachments]; }
    this.frameList = {};


    // Read the tracks!!
    for (i=0;i<tracks.length;++i) {
      var currentTrack = tracks[i];
      var currentStream = streams[currentTrack.type];
      if (currentStream == undefined) { currentStream = { sources:{}, preview:'' }; }
      
      
      if (this.isStreaming(currentTrack)) {
        if (this.isSupportedStreamingTrack(currentTrack)) {
          if ( !(currentStream.sources['rtmp']) || !(currentStream.sources['rtmp'] instanceof Array)){
            currentStream.sources['rtmp'] = [];
          }
          currentStream.sources['rtmp'].push(this.getStreamSource(currentTrack));
        }
      }
      else{
        var videotype = null;
        switch (currentTrack.mimetype) {
          case 'video/mp4':
          case 'video/ogg':
          case 'video/webm':
            videotype = currentTrack.mimetype.split("/")[1];
            break;
          case 'video/x-flv':
            videotype = 'flv';
            break;
          default:
            paella.debug.log('MHVideoLoader: MimeType ('+currentTrack.mimetype+') not recognized!');
            break;
        }
        if (videotype){
          if ( !(currentStream.sources[videotype]) || !(currentStream.sources[videotype] instanceof Array)){
            currentStream.sources[videotype] = [];
          }       
          currentStream.sources[videotype].push(this.getStreamSource(currentTrack));
        }
      }

      streams[currentTrack.type] = currentStream;
    }
    
    var duration = parseInt(paella.matterhorn.episode.mediapackage.duration/1000);
    var presenter = streams["presenter/delivery"];
    var presentation = streams["presentation/delivery"];    
    var imageSource =   {type:"image/jpeg", frames:{}, count:0, duration: duration, res:{w:320, h:180}};
    var imageSourceHD = {type:"image/jpeg", frames:{}, count:0, duration: duration, res:{w:1280, h:720}};
    var blackboardSource = {type:"image/jpeg", frames:{}, count:0, duration: duration, res:{w:1280, h:720}};
    // Read the attachments
    for (i=0;i<attachments.length;++i) {
      var currentAttachment = attachments[i];

      if (currentAttachment !== undefined) {
        try {
          if (currentAttachment.type == "blackboard/image") {
            if (/time=T(\d+):(\d+):(\d+)/.test(currentAttachment.ref)) {
              time = parseInt(RegExp.$1)*60*60 + parseInt(RegExp.$2)*60 + parseInt(RegExp.$3);
              
              blackboardSource.frames["frame_"+time] = currentAttachment.url;
              blackboardSource.count = blackboardSource.count +1;                 
            }
          
          }
          else if (currentAttachment.type == "presentation/segment+preview+hires") {
            if (/time=T(\d+):(\d+):(\d+)/.test(currentAttachment.ref)) {
              time = parseInt(RegExp.$1)*60*60 + parseInt(RegExp.$2)*60 + parseInt(RegExp.$3);
              imageSourceHD.frames["frame_"+time] = currentAttachment.url;
              imageSourceHD.count = imageSourceHD.count +1;
                  
                  if (!(this.frameList[time])){
                      this.frameList[time] = {id:'frame_'+time, mimetype:currentAttachment.mimetype, time:time, url:currentAttachment.url, thumb:currentAttachment.url};                  
                  }
                  this.frameList[time].url = currentAttachment.url;
            }
          }
          else if (currentAttachment.type == "presentation/segment+preview") {
            if (/time=T(\d+):(\d+):(\d+)/.test(currentAttachment.ref)) {
              time = parseInt(RegExp.$1)*60*60 + parseInt(RegExp.$2)*60 + parseInt(RegExp.$3);
              imageSource.frames["frame_"+time] = currentAttachment.url;
              imageSource.count = imageSource.count +1;
              
                  if (!(this.frameList[time])){
                      this.frameList[time] = {id:'frame_'+time, mimetype:currentAttachment.mimetype, time:time, url:currentAttachment.url, thumb:currentAttachment.url};                  
                  }
                  this.frameList[time].thumb = currentAttachment.url;
            }
          }
          else if (currentAttachment.type == "presentation/player+preview") {
            presentation.preview = currentAttachment.url;
          }
          else if (currentAttachment.type == "presenter/player+preview") {
            presenter.preview = currentAttachment.url;
          }
        } 
        catch (err) {}
      }
    }

    // Set the image stream
    var imagesArray = [];
    if (imageSourceHD.count > 0) { imagesArray.push(imageSourceHD); }
    if (imageSource.count > 0) { imagesArray.push(imageSource); }
    if ( (imagesArray.length > 0) && (presentation != undefined) ){
      presentation.sources.image = imagesArray; 
    }
    
    // Set the blackboard images
    var blackboardArray = [];
    if (blackboardSource.count > 0) { blackboardArray.push(blackboardSource); }   
    if ( (blackboardArray.length > 0) && (presenter != undefined) ){
      presenter.sources.image = blackboardArray;
    }   
    
  
    if (presenter) { this.streams.push(presenter); }
    if (presentation) { this.streams.push(presentation); }

    // Get captions.
    var captionURL = getCaptionURL();
    if (captionURL) {
      loadCaptions(captionURL, concludeLoading);
    }
    else {
      // #DCE hack to force getAvailableLangs().length == undefined in captionsPlugin
      // see issue https://github.com/polimediaupv/paella/issues/177
      // "forEach" hack is to recover from a different captionsPlugin assumption
      // remove once issue117 is fixed.
      paella.captions.noAvailableCaptionsDceHack = {
          forEach: function() {return [];}
      };
      paella.captions.getAvailableLangs = function() {
          return paella.captions.noAvailableCaptionsDceHack;
      };
      // -- end #DCE issue117 hack --
      setTimeout(concludeLoading, 0);
    }

    // Like MHCaptionsDataDelegate#read, except it stops when it finds the url
    // and leaves loading the url up to other functions (like
    // paella.captions.Caption#initialize and reload).
    function getCaptionURL() {
      var catalogs = paella.matterhorn.episode.mediapackage.metadata.catalog;
      if (!(catalogs instanceof Array)) {
        catalogs = [catalogs];
      }
      
      var catalog = null;
    
      for (var i = 0; i < catalogs.length; ++i) {
        if (catalogs[i].type == 'captions/timedtext') {
          catalog = catalogs[i];
          break;
        }
      }
      if (catalog) {
        return catalog.url;
      }
    }

    // We get caption info from
    // paella.matterhorn.episode.mediapackage.metadata.catalog, which does 
    // not contain the params needed by the Caption constructor. So, we're
    // hardcoding it. Since we only support a single language, this is not
    // a problem, but when we support multiple languages or formats, we're
    // going to need to get this information from the media package or
    // elsewhere.
    function loadCaptions(url, done) {
      // Add to global instance of `captions`.
      paella.captions.addCaptions(new paella.captions.Caption(
        0, // Caption id
        'dfxp', // Format
        url,
        {
          code: 'en',
          txt: 'English'
        },
        done
      ));
    }

    function concludeLoading() {
      paella.initDelegate.initParams.videoLoader.loadStatus = true;
      onSuccess();
    }
  }
});
