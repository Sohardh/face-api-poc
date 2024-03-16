/*
 * This file is subject to the terms and conditions defined in
 * file 'LICENSE.txt', which is part of this source code package.
 *
 * Author : Sohardh Chobera
 */

import * as React                    from 'react';
import {useEffect, useRef, useState} from 'react';
import {
  createMatcher,
  getFullFaceDescription,
  loadModels,
}                                    from './faceRecUtil';
import Webcam                        from 'react-webcam';

const WIDTH = 420;
const HEIGHT = 420;
const inputSize = 160;

export function FaceValidator({setLoading, setError, loading}) {

  const webcam = useRef(null);
  const [faceMatcher, setFaceMatcher] = useState(null);
  const [facingMode, setFacingMode] = useState(null);
  const [recognitionInterval, setRecognitionInterval] = useState(null);
  const [detections, setDetections] = useState(null);
  const [descriptors, setDescriptors] = useState([]);
  const [match, setMatch] = useState(null);
  const [done, setDone] = useState(-1);
  const [modal, setModal] = useState(false);
  const [deviceAvailable, setDeviceAvailable] = useState(-1);
  const [matching, setMatching] = useState(true);
  useEffect(() => {
    setInputDevice();
    return () => {
      clearInterval(recognitionInterval);
    };
  }, []);

  const setInputDevice = () => {
    if (navigator.mediaDevices) {
      navigator?.mediaDevices?.getUserMedia({audio: false, video: true}).
          then(async (devices) => {
            await loadModels();
            await faceMatcherSetter();
            setFacingMode('user');
            setDeviceAvailable(1);
          }).
          catch(err => {
            console.log(err);
            setDeviceAvailable(0);
          });
      startCapture();
    } else {
      setDeviceAvailable(0);
    }
  };
  const startCapture = () => {
    setDone(0);
    setRecognitionInterval(setInterval(() => {
      capture();
    }, 1500));
  };

  const faceMatcherSetter = async () => {
    let stored = JSON.parse(localStorage.getItem('descriptors'));
    stored = stored.map(obj => Object.values(obj[0])).
        filter(arr => arr.length > 0);
    let faceProfile = {descriptors: stored, name: ''};
    const matcher = await createMatcher(faceProfile);
    setFaceMatcher(matcher);
  };

  useEffect(() => {
    if (!!descriptors && !!faceMatcher) {
      if (descriptors.length === 0) {
        return;
      }

      let match = descriptors.map(
          (descriptor) => faceMatcher.findBestMatch(descriptor));
      setMatch(match);
      if (!match || match.length === 0) {
        setMatching(false);
        return;
      }

      const index = match.findIndex(el => !isNaN(el));
      if (match[0]?._label === 'unknown') {
        setMatching(false);
        return;
      }

      if (match[0] && !loading) {
        clearInterval(recognitionInterval);
        setMatching(true);
      }
    }
  }, [descriptors, loading]);

  const capture = async () => {
    if (!!webcam.current && !modal) {

      const fullDesc = await getFullFaceDescription(
          webcam.current.getScreenshot(), inputSize);
      if (!!fullDesc) {
        setDetections(fullDesc.map((fd) => fd.detection));
        setDescriptors(fullDesc.map((fd) => fd.descriptor));
      }
    }
  };

  let videoConstraints = null;
  if (!!facingMode) {
    videoConstraints = {
      width: WIDTH, height: HEIGHT, facingMode: facingMode,
    };
  }
  let drawBox = null;
  if (!!detections) {
    drawBox = detections.map((detection, i) => {
      let _H = detection.box.height;
      let _W = detection.box.width;
      let _X = detection.box._x;
      let _Y = detection.box._y;
      return (<div key={i}>
        <div
            style={{
              position: 'absolute',
              border: 'solid',
              borderColor: matching ? 'green' : 'red',
              height: _H,
              width: _W,
              transform: `translate(${_X}px,${_Y}px)`,
            }}
        >
          <div
              style={{
                backgroundColor: 'blue',
                border: 'solid',
                borderColor: matching ? 'green' : 'red',
                width: _W,
                marginTop: 0,
                color: '#fff',
                transform: `translate(-3px,${_H}px)`,
              }}
          >
            {matching ? (
                <p> I know this person :) </p>
            ) : <p> Who is this guy! :( </p>}
          </div>
        </div>
      </div>);
    });
  }
  if (deviceAvailable === -1) {
    return <div style={{
      textAlign: 'center',
      width: '100%',
      marginBottom: '1rem',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}>

        <div className="spinner-border text-primary" role="status">
          <span className="sr-only">Loading...</span>
        </div>
        <p>
          Looking for device.
        </p>
      </div>
    </div>;
  }
  if (deviceAvailable === 0) {
    return <div style={{
      textAlign: 'center',
      width: '100%',
      marginBottom: '1rem',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>
      <p>
        Either video device is not available or you haven't given permissions
        for the device access. <br/>
        Please check and try again.
      </p>
    </div>;
  }

  if (faceMatcher?.length === 0) {
    return <div style={{
      textAlign: 'center',
      width: '100%',
      marginBottom: '1rem',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>
      <p>
        There is no employee with facial information stored!
        <br/>
        Please go to employee panel and perform face recognition.
      </p>
    </div>;
  }

  return (<div
      className="Camera"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginTop: '2rem',
      }}
  >
    <div
        style={{
          width: WIDTH, height: HEIGHT,
        }}
    >
      <div style={{position: 'relative', width: WIDTH, height: HEIGHT}}>
        {!!videoConstraints ? (<div style={{
          position: 'absolute',
          padding: '0',
          overflow: 'hidden',
          margin: '0',
          height: HEIGHT,
          width: WIDTH,
        }}>
          <Webcam
              // style={{borderRadius: '50%'}}
              audio={false}
              width="100%"
              height="100%"
              ref={webcam}
              screenshotFormat="image/jpeg"
              videoConstraints={videoConstraints}
          />
        </div>) : null}
        {!!drawBox ? drawBox : null}
      </div>
    </div>
    <div
        style={{display: 'flex', justifyContent: 'center', padding: '2%'}}
    >
      {done === 0 ? (<div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}>

        <div className="spinner-border text-primary" role="status">
          <span className="sr-only">Loading...</span>
        </div>
        <p>
          Please Stand Still. Recognising Face.
        </p>
      </div>) : done === 1 ? (<div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}>
        <p>
          Face Recognition Done!
        </p>
      </div>) : null}
    </div>
  </div>);
}