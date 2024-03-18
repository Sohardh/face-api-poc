import './App.css';
import {FaceRecognition} from './FaceRecognition';
import {useState}        from 'react';
import {FaceValidator}   from './FaceValidator';

function App() {
  const [faceValidator, setFaceValidator] = useState(false);
  console.log(faceValidator)
  return (
      <div className="App">
        <button onClick={() => {
          setFaceValidator(prevState => !prevState);
        }}>
          {faceValidator ? 'Save Face' : 'Validate Face'}
        </button>

        {faceValidator ? <FaceValidator/> : <FaceRecognition/>}
      </div>
  );
}

export default App;
