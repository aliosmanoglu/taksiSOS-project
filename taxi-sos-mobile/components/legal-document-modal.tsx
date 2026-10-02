import React from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LegalDocument } from '../constants/legal-documents';

type LegalDocumentModalProps = {
  document: LegalDocument | null;
  onClose: () => void;
};

export function LegalDocumentModal({ document, onClose }: LegalDocumentModalProps) {
  return (
    <Modal visible={!!document} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title} numberOfLines={2}>{document?.title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialIcons name="close" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.body} contentContainerStyle={{ padding: 20, paddingBottom: 30 }}>
            <Text style={styles.bodyText}>{document?.body}</Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#1a1a1a', height: '85%', borderTopLeftRadius: 20, borderTopRightRadius: 20, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', padding: 20, paddingBottom: 12, borderBottomWidth: 1, borderColor: '#333' },
  title: { color: '#fff', fontSize: 17, fontWeight: 'bold', flex: 1, marginRight: 12 },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#2a2a2a', justifyContent: 'center', alignItems: 'center' },
  body: { flex: 1 },
  bodyText: { color: '#ccc', fontSize: 14, lineHeight: 22 },
});
