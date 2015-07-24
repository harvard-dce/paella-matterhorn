Paella Player for Matterhorn
============================
This is the Paella player for matterhorn bundle.

![Paella Player Logo](https://raw.githubusercontent.com/polimediaupv/paella-matterhorn/master/doc/images/paella_mh.png)

Paella Player
=============
The Paella (pronounce “paeja”) Player is a HTML5 multistream video player capable of playing multiple audio & video streams synchronously and supporting a number of user plugins. It is specially designed for lecture recordings, like Matterhorn Lectures or Polimedia pills.

By using Paella students can view both the lecture hall and the teacher's screen, get info about the lecture (slides, OCR, series videos, footprints) and interact with the lecture (views, comments). Teachers can also soft edit the lecture to set the start and end point or make breaks in the recording. 

If you want to use Paella player, but does not have a Matterhorn installation, you can use the [standalone](https://github.com/polimediaupv/paella) version of paella.

Main characteristics
====================
- Multi stream video player
- Based in HTML5 and Javascript
- Resize position/size of video windows while playing
- Play/Pause/30 seconds back controls
- Jump anywhere in the video keeping both tracks in sync
- Jump by clicking on the slide list
- High quality slides while seeking
- Can handle progressive download, pseudostreaming and RTMP streaming servers
- Support of .flv and .mp4 files
- Easily change the relative position of presenter and presentation windows
- Native Fullscreen version
- Embeddable
- “Publish to” buttons for Facebook and Twitter
- Captions support
- Comments (experimental)
- Easy skinning
- Easy install
- Soft Editing features: Trimming and breaks
- Support of Chrome, Firefox, Safari and Internet Explorer 9 an 10 browsers
- Compatible with Opencast Matterhorn 1.4

Development
===========

If you want to run paella-matterhorn locally without deploying it as a jar within matterhorn (and matterhorn.dce.harvard.edu is currently OK), run:

    make run-test-server

This will create a server that will serve local copies of files under `build/` and will serve a canned `episode.json` and `me.json`, but will proxy everything else (like series information) to matterhorn.dce.harvard.edu.

Build and Install
=================

To build Paella Player for Matterhorn, please read the [documentation](doc/README.md).
