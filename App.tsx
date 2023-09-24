/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useEffect, useState, useRef } from 'react';

import {
  StyleSheet,
  useColorScheme,
  View,
  Text,
  Button,
  useWindowDimensions,
  Image,
  TextInput,
  TouchableOpacity
} from 'react-native';

import {
  Colors,
} from 'react-native/Libraries/NewAppScreen';

import {Camera, useCameraDevices} from "react-native-vision-camera";

import ImageResizer from '@bam.tech/react-native-image-resizer';
import base64 from 'react-native-base64'

import Toast from 'react-native-toast-message';

import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import { faCamera } from '@fortawesome/free-solid-svg-icons/faCamera'
import { faPortrait } from '@fortawesome/free-solid-svg-icons/faPortrait'
import { faFont } from '@fortawesome/free-solid-svg-icons/faFont'
import { faPrint } from '@fortawesome/free-solid-svg-icons/faPrint'


function App(): JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

  const [res,setResp] = useState("");
  const camera = useRef<Camera>(null);
  const [photoTaken,setPhotoTaken] = useState(false);
  const [photo, setPhoto] = useState<any>(null);
  const [text,setText] = useState("");
  const [photoE,setPhotoE] = useState(false);
  

  useEffect(() => {
    fetch("http://172.17.29.82:3000").then(r => r.text()).then(res => {
      setResp(res);
    });

    const checkGetPerms = async () => {
      const cameraPermission = await Camera.getCameraPermissionStatus();
      console.log("cameraaaa", cameraPermission);
      if(cameraPermission == "not-determined"){
        const cameraPermission = await Camera.getCameraPermissionStatus();
      }
    };

    checkGetPerms();

    return () => {};

  }, []);

  const devices = useCameraDevices("wide-angle-camera");
  let device;
  if(devices){
    device = devices.back;
    console.log("camera thereeeeee");
  }

  const {height, width} = useWindowDimensions();

  const takePhoto = async () => {
    const photo = await camera.current?.takePhoto();
    if(photo){
      console.log(photo.width,photo.height,photo.path);
      ImageResizer.createResizedImage(
        photo.path,
        768,
        768,
        "JPEG",
        100,
        90,
        undefined,
        undefined,
        {
          mode: "cover",
          onlyScaleDown: true
        }
      ).then((response) => {
          console.log(response);
          setPhoto(response);
          setPhotoTaken(true);
  
        })
        .catch((err) => {
          console.log(err);
          // Oops, something went wrong. Check that the filename is correct and
          // inspect err to get more details.
        });

    }
  }

  const genImage = async () => {

    if(!text.length){
      return;
    }

    let key = "49d4612795f75352cd4a7c51f46f43ae2f4b73d6c67947d39e7503fc3b7c0827b1539d267493ca0473f0a4bfc34c9336";


    const form = new FormData();
    console.log(photo);
    form.append('image_file', {uri: photo.uri, name: 'image.jpg', type: 'image/jpeg'});
    form.append('prompt', text);
    console.log("sending request");

    Toast.show({
      type: "info",
      text1: "Reimagining..."
    });

    fetch('https://clipdrop-api.co/replace-background/v1', {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data',
        'x-api-key': key,
      },
      body: form,
    })
      .then(response => {
        console.log(response);
        return response.arrayBuffer()
      })
      .then(buffer => {
        const binaryString = Array.from(new Uint8Array(buffer), byte => String.fromCharCode(byte)).join("");
        const theImage = base64.encode(binaryString);
        setPhotoE(true);
        setPhoto({
          ...photo,
          path: theImage
        });
        Toast.hide();
      })
      .catch(e => {
        Toast.show({
          type: "error",
          text1: "There was an error...",
          autoHide: true,
          visibilityTime: 2000
        });
        console.log(e);
      }); 

  }

  const printImage = async () => {

    if(!photoE)
      return;

    const resp = await fetch("http://172.17.29.82:3000/upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image: photo.path,
        test: "adasdfafd"
      })
    });

    if(!resp){
      Toast.show({
        type: "error",
        text1: "There was an error...",
        autoHide: true,
        visibilityTime: 2000
      });
    }

    //console.log(resp);
  };

  const genWholeImg = async () => {
    if(!text.length){
      return;
    }

    Toast.show({
      type: "info",
      text1: "Generating..."
    })
    const resp = await fetch("http://172.17.29.82:3000/segmind", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: text
      })
    });
    Toast.hide();
    console.log(resp.status);
    if(resp.status != 200){
      Toast.show({
        type: "error",
        text1: "There was an error...",
        autoHide: true,
        visibilityTime: 2000
      });
      return;
    }

    const buffer = await resp.arrayBuffer();
    const binaryString = Array.from(new Uint8Array(buffer), byte => String.fromCharCode(byte)).join("");
    const theImage = base64.encode(binaryString);
    setPhotoE(true);
    setPhoto({
      ...photo,
      path: theImage
    });
    console.log(resp);

  };

  if(photo && photo.path){
    
    return (<>
      <View style={{
        height: height,
        width: width,
        flex: 1,
        alignItems: "center"
        
      }}>

        <TextInput
          style={{
            width: width - 30,
            height: 40,
            marginTop: 20,
            marginBottom: 10,
            borderWidth: 1,
            padding: 10,
          }}
          onChangeText={(text) => {
            setText(text);
          }}
          value={text}
          placeholder="Enter prompt"
        />

        <Image
          style={{
          
          }}
          source={{uri: photoE ? `data:image/png;base64,${photo.path}` : `file://${photo.path}`,width: (height - 180) * 9/16, height: (height - 180)}}
        />
        
        
        <View
          style={{
            display: "flex",
            flexDirection: "row",
            width: width,
            justifyContent: "space-around",
            columnGap: 10,
            marginTop: 20
          }}
        >

          <TouchableOpacity style={{
            borderWidth: 1,
            borderColor: 'rgba(0,0,0,0.2)',
            alignItems: 'center',
            justifyContent: 'center',
            width: 60,
            height: 60,
            backgroundColor: 'red',
            borderRadius: 10,
          }}
            onPress={() => {
              genImage();
            }}
          >
            <FontAwesomeIcon color='white' size={30} icon={faPortrait} />
          </TouchableOpacity>

          <TouchableOpacity style={{
            borderWidth: 1,
            borderColor: 'rgba(0,0,0,0.2)',
            alignItems: 'center',
            justifyContent: 'center',
            width: 60,
            height: 60,
            backgroundColor: 'grey',
            borderRadius: 10,
          }}
            onPress={() => {
              genWholeImg();
            }}
          >
            <FontAwesomeIcon color='white' size={30} icon={faFont} />
          </TouchableOpacity>

          {
            photoE 
            ? <TouchableOpacity style={{
              borderWidth: 1,
              borderColor: 'rgba(0,0,0,0.2)',
              alignItems: 'center',
              justifyContent: 'center',
              width: 60,
              height: 60,
              backgroundColor: 'blue',
              borderRadius: 10,
            }}
              onPress={() => {
                printImage();
              }}
            >
              <FontAwesomeIcon color='white' size={30} icon={faPrint} />
            </TouchableOpacity>
            :<></>
          }
        </View> 

      </View>
      <Toast></Toast>
    </>);
  }

  return (
       <> 
        {
            device
              ? <Camera
                style={StyleSheet.absoluteFill}
                device={device}
                isActive={true}
                photo={true}
                ref={camera}
              />
              : <></>
          }

          <TouchableOpacity style={{
            position: "absolute",
            bottom: 100,
            left: width / 2 - 50,
            borderWidth:1,
            borderColor:'rgba(0,0,0,0.2)',
            alignItems:'center',
            justifyContent:'center',
            width:100,
            height:100,
            backgroundColor:'#fff',
            borderRadius:50,
          }}
          onPress={() => {
            takePhoto();
          }}
          >
            <FontAwesomeIcon size={40} icon={ faCamera } />
          </TouchableOpacity>
      </>
   
  );
}


export default App;
