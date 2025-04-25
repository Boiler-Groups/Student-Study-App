import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Image } from 'react-native';
import { createAvatar } from '@dicebear/core';
import { micah } from '@dicebear/collection';

export default function AvatarModal({ visible, onClose, onSave, initialConfig }) {
  const [seed, setSeed] = useState(initialConfig?.seed || Math.random().toString(36).substring(7));
  const [backgroundColor, setBackgroundColor] = useState(initialConfig?.backgroundColor || 'ffd5dc');
  const [eyes, setEyes] = useState(initialConfig?.eyes || 'smiling');
  const [mouth, setMouth] = useState(initialConfig?.mouth || 'smile');
  const [glasses, setGlasses] = useState(initialConfig?.glasses || 'round');
  const [hair, setHair] = useState(initialConfig?.hair || 'full');
  const [hairColor, setHairColor] = useState(initialConfig?.hairColor || '000000');
  const [skinColor, setSkinColor] = useState(initialConfig?.skinColor || 'f9c9b6');
  const [shirtColor, setShirtColor] = useState(initialConfig?.shirtColor || '9287ff');

  const backgroundColorOptions = ['b6e3f4', 'c0aede', 'd1d4f9', 'ffd5dc', 'ffdfbf', 'ffffff'];
  const eyesOptions = ['eyes', 'round', 'smiling', 'smilingShadow'];
  const mouthOptions = ['smile', 'laughing', 'pucker', 'smirk', 'surprised', 'sad', 'frown', 'nervous'];
  const glassesOptions = ['none', 'round', 'square'];
  const hairOptions = ['full', 'dannyPhantom', 'dougFunny', 'fonze', 'mrClean', 'mrT', 'pixie', 'turban'];
  const hairColorOptions = ['000000', '77311d', 'ac6651', 'f4d150', 'fc909f', '6bd9e9', '9287ff', 'ffdfbf',  'ffffff', 'ff5e5b', 'ffeba4'];
  const skinColorOptions = ['f9c9b6', 'ac6651', '77311d', 'd1a37d', 'c68642', 'e0ac69', 'fcd7b8', 'eab38f'];
  const shirtColorOptions = ['000000', 'ffedef', '77311d', 'f9c9b6', 'ac6651', 'd2eff3', 'e0ddff', 'f4d150', 'fc909f', '6bd9e9', '9287ff', 'ffffff', 'ffeba4'];

  const next = (index, list) => (index + 1) % list.length;

  const avatarSvg = createAvatar(micah, {
    seed,
    backgroundColor: [backgroundColor],
    eyes: [eyes],
    mouth: [mouth],
    glasses: [glasses],
    hair: [hair],
    hairColor: [hairColor],
    baseColor: [skinColor],
    shirtColor: [shirtColor],
  }).toString();

  const dataUri = `data:image/svg+xml;utf8,${avatarSvg}`;

  const randomize = () => {
    setSeed(Math.random().toString(36).substring(7));
    setEyes(eyesOptions[Math.floor(Math.random() * eyesOptions.length)]);
    setMouth(mouthOptions[Math.floor(Math.random() * mouthOptions.length)]);
    setGlasses(glassesOptions[Math.floor(Math.random() * glassesOptions.length)]);
    setHair(hairOptions[Math.floor(Math.random() * hairOptions.length)]);
    setHairColor(hairColorOptions[Math.floor(Math.random() * hairColorOptions.length)]);
    setBackgroundColor(backgroundColorOptions[Math.floor(Math.random() * backgroundColorOptions.length)]);
    setSkinColor(skinColorOptions[Math.floor(Math.random() * skinColorOptions.length)]);
    setShirtColor(shirtColorOptions[Math.floor(Math.random() * shirtColorOptions.length)]);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Customize Your Avatar</Text>
          <Image
            source={{ uri: dataUri }}
            style={{ width: 120, height: 120, borderRadius: 60, marginBottom: 20 }}
          />

<TouchableOpacity style={styles.featureButton} onPress={() =>
  setEyes(prev => eyesOptions[next(eyesOptions.indexOf(prev), eyesOptions)])
}>
  <Text style={styles.featureText}>Eyes</Text>
</TouchableOpacity>

<TouchableOpacity style={styles.featureButton} onPress={() =>
  setMouth(prev => mouthOptions[next(mouthOptions.indexOf(prev), mouthOptions)])
}>
  <Text style={styles.featureText}>Mouth</Text>
</TouchableOpacity>

<TouchableOpacity style={styles.featureButton} onPress={() =>
  setGlasses(prev => glassesOptions[next(glassesOptions.indexOf(prev), glassesOptions)])
}>
  <Text style={styles.featureText}>Glasses</Text>
</TouchableOpacity>

<TouchableOpacity style={styles.featureButton} onPress={() =>
  setHair(prev => hairOptions[next(hairOptions.indexOf(prev), hairOptions)])
}>
  <Text style={styles.featureText}>Hair</Text>
</TouchableOpacity>

<TouchableOpacity style={styles.featureButton} onPress={() =>
  setHairColor(prev => hairColorOptions[next(hairColorOptions.indexOf(prev), hairColorOptions)])
}>
  <Text style={styles.featureText}>Hair Color</Text>
</TouchableOpacity>

<TouchableOpacity style={styles.featureButton} onPress={() =>
  setSkinColor(prev => skinColorOptions[next(skinColorOptions.indexOf(prev), skinColorOptions)])
}>
  <Text style={styles.featureText}>Skin Color</Text>
</TouchableOpacity>

<TouchableOpacity style={styles.featureButton} onPress={() =>
  setShirtColor(prev => shirtColorOptions[next(shirtColorOptions.indexOf(prev), shirtColorOptions)])
}>
  <Text style={styles.featureText}>Shirt Color</Text>
</TouchableOpacity>

<TouchableOpacity style={styles.featureButton} onPress={() =>
  setBackgroundColor(prev => backgroundColorOptions[next(backgroundColorOptions.indexOf(prev), backgroundColorOptions)])
}>
  <Text style={styles.featureText}>Background</Text>
</TouchableOpacity>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.button} onPress={randomize}>
              <Text style={styles.buttonText}>Randomize</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={() => {
                onSave({ seed, backgroundColor, eyes, mouth, glasses, hair, hairColor, skinColor, shirtColor });
                onClose();
              }}
            >
              <Text style={styles.buttonText}>Save</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onClose}>
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)'
  },
  container: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    width: 320,
    alignItems: 'center'
  },
  title: {
    fontWeight: 'bold', fontSize: 18, marginBottom: 10
  },
  featureButton: {
    backgroundColor: '#f2f2f2',
    padding: 10,
    marginVertical: 5,
    borderRadius: 6,
    width: '100%',
    alignItems: 'center'
  },
  featureText: {
    fontWeight: '500',
    color: '#333'
  },
  buttonRow: {
    flexDirection: 'row', marginTop: 20, justifyContent: 'space-around', width: '100%'
  },
  button: {
    backgroundColor: '#007AFF', padding: 10, borderRadius: 6, margin: 5, flex: 1, alignItems: 'center'
  },
  saveButton: {
    backgroundColor: '#34C759'
  },
  cancelButton: {
    backgroundColor: '#FF3B30', marginTop: 10, width: '100%', alignItems: 'center', padding: 10, borderRadius: 6
  },
  buttonText: {
    color: 'white'
  }
});