/*
 * This file is subject to the terms and conditions defined in
 * file 'LICENSE.txt', which is part of this source code package.
 *
 * Author : Sohardh Chobera
 */

import * as React                           from 'react';
import {useEffect, useRef, useState}        from 'react';
import {getFullFaceDescription, loadModels} from './faceRecUtil';
import Webcam                               from 'react-webcam';

const WIDTH = 420;
const HEIGHT = 420;
const inputSize = 160;
const FACE_DESCRIPTOR_SIZE = 5;

export function FaceRecognition({}) {

  let webcam = useRef(null);
  const [detections, setDetections] = useState(null);
  const [descriptors, setDescriptors] = useState([]);
  const [match, setMatch] = useState(null);
  const [facingMode, setFacingMode] = useState(null);
  const [startedRec, setStartedRec] = useState(false);
  const [count, setCount] = useState(0);
  const [done, setDone] = useState(-1);
  const [recognitionInterval, setRecognitionInterval] = useState(null);
  const [deviceAvailable, setDeviceAvailable] = useState(-1);

  useEffect(() => {
    setInputDevice();
    return () => {
      setDeviceAvailable(-1);
      clearInterval(recognitionInterval);
    };
  }, []);

  useEffect(() => {
    if (count === FACE_DESCRIPTOR_SIZE) {
      clearInterval(recognitionInterval);
      setDone(1);
      localStorage.setItem('descriptors', JSON.stringify(descriptors));
    }
  }, [count]);
  const setInputDevice = () => {
    if (navigator.mediaDevices) {
      //added a comment
      navigator.mediaDevices.getUserMedia({audio: false, video: true}).
          then(async (devices) => {
            await loadModels();
            setFacingMode('user');
            setDeviceAvailable(1);
          }).
          catch(err => {
            setDeviceAvailable(0);
          });
    } else {
      setDeviceAvailable(0);
    }
  };

  const startCapture = async () => {
    setStartedRec(true);
    localStorage.removeItem('descriptors');
    setDone(0);
    setRecognitionInterval(setInterval(() => {
          capture();
          setCount(prevState => prevState + 1);
        }, 1500),
    );
  };
  const capture = async () => {
    if (!!webcam.current) {

      const fullDesc = await getFullFaceDescription(
          webcam.current.getScreenshot(), inputSize);

      if (!!fullDesc) {
        setDetections(fullDesc.map((fd) => fd.detection));
        setDescriptors(prevState => [
          ...prevState,  fullDesc.map((fd) => fd.descriptor),
        ]);

      }
    }
  };

  let videoConstraints = null;
  if (!!facingMode) {
    videoConstraints = {
      width: WIDTH,
      height: HEIGHT,
      facingMode: 'user',
    };
  }
  let drawBox = null;
  if (!!detections) {
    drawBox = detections.map((detection, i) => {
      let _H = detection.box.height;
      let _W = detection.box.width;
      let _X = detection.box._x;
      let _Y = detection.box._y;
      return (
          <div key={i}>
            <div
                style={{
                  position: 'absolute',
                  border: 'solid',
                  borderColor: 'blue',
                  height: _H,
                  width: _W,
                  transform: `translate(${_X}px,${_Y}px)`,
                }}
            >
              {!!match && !!match[i] ? (
                  <p
                      style={{
                        backgroundColor: 'blue',
                        border: 'solid',
                        borderColor: 'blue',
                        width: _W,
                        marginTop: 0,
                        color: '#fff',
                        transform: `translate(-3px,${_H}px)`,
                      }}
                  >
                    {match[i]._label}
                  </p>
              ) : null}
            </div>
          </div>
      );
    });
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
  return (
      <div
          className="Camera"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '5%',
          }}
      >
        <div
            style={{
              width: WIDTH,
              height: HEIGHT,
            }}
        >
          <div style={{position: 'relative', width: WIDTH, height: HEIGHT}}>
            {!!videoConstraints ? (
                <div style={{
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
                </div>
            ) : null}
            {!!drawBox ? drawBox : null}
          </div>
        </div>
        <div
            style={{display: 'flex', justifyContent: 'center', padding: '2%'}}
        >
          {done === 0 ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}>

                <div className="spinner-border text-primary" role="status">
                  <span className="sr-only">Loading...</span>
                </div>
                <p>
                  Please Stand Still. Recognising Face.
                </p>
              </div>
          ) : done === 1 ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}>

                <p>
                  Face Recognition Done!
                </p>
              </div>
          ) : null}
        </div>
        {!!videoConstraints && !startedRec ? (
            <div className={'d-flex justify-content-center'}>
              <button
                  disabled={count === FACE_DESCRIPTOR_SIZE}
                  onClick={() => {
                    startCapture();
                  }}
              >
                Start Recognising
              </button>
            </div>
        ) : null}
      </div>
  );
}