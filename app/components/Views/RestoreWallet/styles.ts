/* eslint-disable import/prefer-default-export */
import { StyleSheet } from 'react-native';
import { Colors } from '../../../util/theme/models';

export const createStyles = (colors: Colors) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      paddingHorizontal: 25,
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      marginVertical: 14,
    },
    images: {
      alignItems: 'center',
    },
    description: {
      textAlign: 'center',
    },
    actionButtonWrapper: {
      width: '100%',
    },
    actionButton: {
      marginVertical: 10,
    },
  });
