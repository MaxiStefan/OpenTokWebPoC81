/* global OT */

(function closure() {
  const apiKey = "46796514";
  const sessionId = "2_MX40Njc5NjUxNH5-MTYxMTc1NTkyOTM4MX5MbmtsQU1tMUxUclZnOWdFalM5SXljTS9-UH4";
  const token = "T1==cGFydG5lcl9pZD00Njc5NjUxNCZzaWc9YmIwNzViOGViZDc1NjJiYmE4Y2QzNjM4Mzg0ZjA1MDc0ZTRiZjYxODpzZXNzaW9uX2lkPTJfTVg0ME5qYzVOalV4Tkg1LU1UWXhNVGMxTlRreU9UTTRNWDVNYm10c1FVMXRNVXhVY2xabk9XZEZhbE01U1hsalRTOS1VSDQmY3JlYXRlX3RpbWU9MTYxMTc1Nzk5OCZub25jZT0wLjQxODc0MTE5NDg3Mzk1NDU2JnJvbGU9cHVibGlzaGVyJmV4cGlyZV90aW1lPTE2MTQzNDk5OTcmaW5pdGlhbF9sYXlvdXRfY2xhc3NfbGlzdD0=";

  const audioSelector = document.querySelector('#audio-source-select');
  const videoSelector = document.querySelector('#video-source-select');
  const publishBtn = document.querySelector('#publish-btn');
  const cycleVideoBtn = document.querySelector('#cycle-video-btn');
  let publisher;  
  const session = OT.initSession(apiKey, sessionId);


  // Get the list of devices and populate the drop down lists
  function populateDeviceSources(selector, kind) {
    OT.getDevices((err, devices) => {
      if (err) {
        alert('getDevices error ' + err.message);
        return;
      }
      publishBtn.disabled = false;
      let index = 0;
      selector.innerHTML = devices.reduce((innerHTML, device) => {
        if (device.kind === kind) {
          index += 1;
          return `${innerHTML}<option value="${device.deviceId}">${device.label || device.kind + index}</option>`;
        }
        return innerHTML;
      }, '');
    });
  }
  publishBtn.disabled = true;
  // We request access to Microphones and Cameras so we can get the labels
  OT.getUserMedia().then((stream) => {
    populateDeviceSources(audioSelector, 'audioInput');
    populateDeviceSources(videoSelector, 'videoInput');
    // Stop the tracks so that we stop using this camera and microphone
    // If you don't do this then cycleVideo does not work on some Android devices
    stream.getTracks().forEach(track => track.stop());
  });

  // Start publishing when you click the publish button
  publishBtn.addEventListener('click', () => {
    if(publisher != null){
      session.unpublish(publisher);
      publisher.destroy();
    }

    // Start publishing with the selected devices
    publisher = OT.initPublisher('publisher', {
      audioSource: audioSelector.value,
      videoSource: videoSelector.value
    }, (err) => {
      if (err) {
        alert('Publish error ' + err.message);
      } else {
        setupDeviceSwitching();
        // setupAudioLevelMeter();
      }
    });
    
    session.connect(token, function callback(error) {
      if (error) {
        handleError(error);
      } else {
        // If the connection is successful, publish the publisher to the session
        session.publish(publisher, handleError);
      }
    });
  });

  // Allow you to switch to different cameras and microphones using
  // setAudioSource and cycleVideo
  function setupDeviceSwitching() {
    // audioSelector.disabled = false;

    // When the audio selector changes we update the audio source
    audioSelector.addEventListener('change', () => {
      // audioSelector.disabled = true;
      publisher.setAudioSource(event.target.value).then(() => {
        // audioSelector.disabled = false;
      }).catch((err) => {
        alert(`setAudioSource failed: ${err.message}`);
        // audioSelector.disabled = false;
      });
    });

    // When the cycleVideo button is clicked we call cycleVideo
    // cycleVideoBtn.addEventListener('click', () => {
    //   cycleVideoBtn.disabled = true;
    //   publisher.cycleVideo().then(({ deviceId }) => {
    //     videoSelector.value = deviceId;
    //     cycleVideoBtn.disabled = false;
    //   }).catch((err) => {
    //     alert('cycleVideo error ' + err.message);
    //     cycleVideoBtn.disabled = false;
    //   });
    // });
    // cycleVideoBtn.style.display = 'inline-block';
  }

  // function setupAudioLevelMeter() {
  //   const audioLevel = document.querySelector('#audio-meter');
  //   const meter = document.querySelector('#audio-meter meter');
  //   audioLevel.style.display = 'block';
  //   let movingAvg = null;
  //   publisher.on('audioLevelUpdated', (event) => {
  //     if (movingAvg === null || movingAvg <= event.audioLevel) {
  //       movingAvg = event.audioLevel;
  //     } else {
  //       movingAvg = 0.7 * movingAvg + 0.3 * event.audioLevel;
  //     }

  //     // 1.5 scaling to map the -30 - 0 dBm range to [0,1]
  //     var logLevel = (Math.log(movingAvg) / Math.LN10) / 1.5 + 1;
  //     logLevel = Math.min(Math.max(logLevel, 0), 1);
  //     meter.value = logLevel;
  //   });
  // }

    // Subscribe to a newly created stream
  session.on('streamCreated', function(event) {
    session.subscribe(event.stream, 'subscriber', {
      insertMode: 'append',
      width: '100%',
      height: '100%'
    }, handleError);
  });
  
  session.on('sessionDisconnected', function sessionDisconnected(event) {
    console.log('You were disconnected from the session.', event.reason);
  });

  function handleError(error) {
    if (error) {
      console.error(error);
    }
  }

})();
