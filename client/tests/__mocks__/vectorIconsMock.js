import React from 'react';
import { Text } from 'react-native';

const Icon = (props) => {
  return <Text>{props.name || 'Icon'}</Text>;
};

export default Icon;
