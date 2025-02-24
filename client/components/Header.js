import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function Header() {
    return (
        <View style={styles.header}>
            <Text style={styles.headerText}>Boiler Groups</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        width: '100%',
        height: 60,
        backgroundColor: 'black',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        top: 0,
    },
    headerText: {
        color: '#CEB888',
        fontSize: 30,
        fontWeight: 'bold',
    },
});
