Class ('paella.plugins.InfoPlugin', paella.ButtonPlugin,{
  _classHandoutKey: 'Class Handout',
  _classHandouts: [],
  _privacyPolicyLink: 'https://www.extension.harvard.edu/privacy-policy',
  getAlignment: function () { return 'right'; },
  getSubclass: function () { return "showInfoPluginButton"; },
  getIndex: function () { return 501; },
  getMinWindowSize: function () { return 300; },
  getName: function () { return "edu.harvard.dce.paella.infoPlugin"; },
  checkEnabled: function (onSuccess) { onSuccess(true); },
  getDefaultToolTip: function () {
    return paella.dictionary.translate("Information");
  },
  getButtonType:function() { return paella.ButtonPlugin.type.popUpButton; },

  buildContent: function (domElement) {
    var thisClass = this;

    var popUp = jQuery('<div id="dce-info-popup"></div>');
    var buttonActions =[ 'About player', 'Report a problem', 'System status', 'Privacy policy', 'Feedback', thisClass._classHandoutKey, 'All Course Videos'];

    popUp.append(thisClass.getItemTitle());
    buttonActions.forEach(function(item){
      if (thisClass.checkItemEnabled(item)) {
        popUp.append(thisClass.getItemButton(item));
      }
    });
    jQuery(domElement).append(popUp);
  },

  getItemTitle: function () {
    var mpInfo = paella.matterhorn.episode.mediapackage;
    var titleDiv = mpInfo.title ? '<span>' + mpInfo.title + '</span>' : '';
    var seriesTitleDiv = mpInfo.seriestitle ? '<span>' + mpInfo.seriestitle + '</span>' : '';
    var elem = jQuery('<div />');
    elem.attr({'class': 'infoPubTitle'}).html(seriesTitleDiv + titleDiv);
    return elem;
  },

  getItemButton: function (buttonAction) {
    var thisClass = this;
    var elem = jQuery('<div />');
    elem.attr({'class': 'infoItemButton'}).text(buttonAction);
    elem.click(function (event) {
      thisClass.onItemClick(buttonAction);
    });
    return elem;
  },

  onItemClick: function (buttonAction) {
    switch (buttonAction) {
      case ('About player'):
        var param = paella.player.isLiveStream() ? "show=live" : "show=vod";
        if ((typeof paella.plugins.timedCommentsHeatmapPlugin != "undefined") && paella.plugins.timedCommentsHeatmapPlugin.isEnabled) { 
          param = param + "&timedcomments";
        }
        window.open('watchAbout.html?' + param);
        break;
      case ('Privacy policy'):
        window.open(this._privacyPolicyLink);
        break;
      case ('Report a problem'):
        var paramsP = 'ref=' + this.getVideoUrl() + '&server=MH';
        if (paella.matterhorn && paella.matterhorn.episode) {
          paramsP += paella.matterhorn.episode.dcIsPartOf ? '&offeringId=' + paella.matterhorn.episode.dcIsPartOf : '';
          paramsP += paella.matterhorn.episode.dcType ? '&typeNum=' + paella.matterhorn.episode.dcType : '';
          paramsP += paella.matterhorn.episode.dcContributor ? '&ps=' + paella.matterhorn.episode.dcContributor : '';
          paramsP += paella.matterhorn.episode.dcCreated ? '&cDate=' + paella.matterhorn.episode.dcCreated : '';
          paramsP += paella.matterhorn.episode.dcSpatial ? '&cAgent=' + paella.matterhorn.episode.dcSpatial : '';
        }
        window.open('https://cm.dce.harvard.edu/forms/report.shtml?' + paramsP);
        break;
      case ('System status'):
        window.open('http://status.dce.harvard.edu');
        break;
      case ('Feedback'):
        var params = 'ref=' + this.getVideoUrl() + '&server=MH';
        if (paella.matterhorn && paella.matterhorn.episode) {
          params += paella.matterhorn.episode.dcIsPartOf ? '&offeringId=' + paella.matterhorn.episode.dcIsPartOf : '';
          params += paella.matterhorn.episode.dcType ? '&typeNum=' + paella.matterhorn.episode.dcType : '';
          params += paella.matterhorn.episode.dcContributor ? '&ps=' + paella.matterhorn.episode.dcContributor : '';
          params += paella.matterhorn.episode.dcCreated ? '&cDate=' + paella.matterhorn.episode.dcCreated : '';
          params += paella.matterhorn.episode.dcSpatial ? '&cAgent=' + paella.matterhorn.episode.dcSpatial : '';
        }
        window.open('https://cm.dce.harvard.edu/forms/feedback.shtml?' + params);
        break;
      case ('All Course Videos'):
        if (paella.matterhorn && paella.matterhorn.episode && paella.matterhorn.episode.dcIsPartOf){
          var seriesId = paella.matterhorn.episode.dcIsPartOf;
          // MATT-1373 reference combined pub list page when series looks like the DCE <academicYear><term><crn>
          if (seriesId.toString().match('^[0-9]{11}$')) {
            var academicYear = seriesId.toString().slice(0,4);
            var academicTerm = seriesId.toString().slice(4,6);
            var courseCrn = seriesId.toString().slice(6,11);
            location.href = '../ui/index.html#/' + academicYear + '/' + academicTerm + '/' + courseCrn;
          } else {
             // For an unknown series signature, reference the old 1.4x MH only, pub list page
             location.href = '../ui/publicationListing.shtml?seriesId=' + seriesId;
          }
        } 
        else {
          message = 'No other lectures found.';
          paella.messageBox.showMessage(message);
        }
        break;
      case (this._classHandoutKey):
        // Only one handout enabled
        if (this._classHandouts.length > 0) {
          window.open(this._classHandouts[0].url);
        }
        break;
    }
    paella.events.trigger(paella.events.hidePopUp, {
      identifier: this.getName()
    });
  },

  getVideoUrl: function () {
    return document.location.href;
  },

  checkItemEnabled: function(item) {
    if (item === this._classHandoutKey) {
       var isenabled = this.checkClassHandouts();
       return isenabled;
     }  else {
       return true;
     }
  },

  checkClassHandouts: function () {
   // retrieve any attached handouts (type "attachment/notes")
   var attachments = paella.matterhorn.episode.mediapackage.attachments.attachment;
   if (!(attachments instanceof Array)) {
     attachments =[attachments];
   }
   // Checking for multiple handouts, but only enabling one
   for (var i = 0; i < attachments.length;++ i) {
     var attachment = attachments[i];
     if (attachment !== undefined) {
       if (attachment.type == "attachment/notes") {
         this._classHandouts.push(attachment);
       }
     }
    }
    var isenabled = (this._classHandouts.length > 0 );
		return isenabled;
  }

});

paella.plugins.infoPlugin = new paella.plugins.InfoPlugin();
