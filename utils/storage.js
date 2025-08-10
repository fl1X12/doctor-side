// utils/storage.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTES_KEY_PREFIX = '@PatientNotes_';
const FOLDERS_KEY = '@Folders';
const SETTINGS_KEY = '@AppSettings';

const getNotesKey = (patientId) => `${NOTES_KEY_PREFIX}${patientId}`;

export default {
  // Note Management
  async saveNote(patientId, note) {
    try {
      const key = getNotesKey(patientId);
      const existingNotes = await this.getNotes(patientId);
      const noteIndex = existingNotes.findIndex(n => n.id === note.id);
      
      let updatedNotes;
      if (noteIndex > -1) {
        // Update existing note
        updatedNotes = [...existingNotes];
        updatedNotes[noteIndex] = note;
      } else {
        // Add new note
        updatedNotes = [...existingNotes, note];
      }
      
      await AsyncStorage.setItem(key, JSON.stringify(updatedNotes));
      return true;
    } catch (error) {
      console.error('Error saving note:', error);
      return false;
    }
  },

  async getNotes(patientId) {
    try {
      const key = getNotesKey(patientId);
      const notesJSON = await AsyncStorage.getItem(key);
      return notesJSON ? JSON.parse(notesJSON) : [];
    } catch (error) {
      console.error('Error loading notes:', error);
      return [];
    }
  },

  async getNote(patientId, noteId) {
    try {
      const notes = await this.getNotes(patientId);
      return notes.find(note => note.id === noteId);
    } catch (error) {
      console.error('Error getting note:', error);
      return null;
    }
  },

  async deleteNote(patientId, noteId) {
    try {
      const key = getNotesKey(patientId);
      const notes = await this.getNotes(patientId);
      const updatedNotes = notes.filter(note => note.id !== noteId);
      await AsyncStorage.setItem(key, JSON.stringify(updatedNotes));
      return true;
    } catch (error) {
      console.error('Error deleting note:', error);
      return false;
    }
  },

  // Folder Management
  async saveFolder(folder) {
    try {
      const folders = await this.getFolders();
      const folderIndex = folders.findIndex(f => f.id === folder.id);
      
      let updatedFolders;
      if (folderIndex > -1) {
        updatedFolders = [...folders];
        updatedFolders[folderIndex] = folder;
      } else {
        updatedFolders = [...folders, folder];
      }
      
      await AsyncStorage.setItem(FOLDERS_KEY, JSON.stringify(updatedFolders));
      return true;
    } catch (error) {
      console.error('Error saving folder:', error);
      return false;
    }
  },

  async getFolders() {
    try {
      const foldersJSON = await AsyncStorage.getItem(FOLDERS_KEY);
      return foldersJSON ? JSON.parse(foldersJSON) : [
        {
          id: 'default',
          name: 'General Notes',
          color: '#3498db',
          createdAt: new Date().toISOString()
        }
      ];
    } catch (error) {
      console.error('Error loading folders:', error);
      return [];
    }
  },

  async deleteFolder(folderId) {
    try {
      const folders = await this.getFolders();
      const updatedFolders = folders.filter(folder => folder.id !== folderId);
      
      // Reassign notes from deleted folder to default
      if (folderId !== 'default') {
        const allPatientKeys = await AsyncStorage.getAllKeys();
        const noteKeys = allPatientKeys.filter(key => key.startsWith(NOTES_KEY_PREFIX));
        
        for (const key of noteKeys) {
          const notes = JSON.parse(await AsyncStorage.getItem(key)) || [];
          const updatedNotes = notes.map(note => 
            note.folderId === folderId ? {...note, folderId: 'default'} : note
          );
          await AsyncStorage.setItem(key, JSON.stringify(updatedNotes));
        }
      }
      
      await AsyncStorage.setItem(FOLDERS_KEY, JSON.stringify(updatedFolders));
      return true;
    } catch (error) {
      console.error('Error deleting folder:', error);
      return false;
    }
  },

  // Settings Management
  async saveSettings(settings) {
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      return true;
    } catch (error) {
      console.error('Error saving settings:', error);
      return false;
    }
  },

  async getSettings() {
    try {
      const settingsJSON = await AsyncStorage.getItem(SETTINGS_KEY);
      return settingsJSON ? JSON.parse(settingsJSON) : {
        autoSave: true,
        defaultDrawingColor: '#000000',
        defaultTextSize: 16,
        recentPatients: []
      };
    } catch (error) {
      console.error('Error loading settings:', error);
      return {};
    }
  },

  // Patient Management
  async addRecentPatient(patient) {
    try {
      const settings = await this.getSettings();
      const existingIndex = settings.recentPatients.findIndex(p => p.id === patient.id);
      
      let updatedPatients;
      if (existingIndex > -1) {
        // Move to front if already exists
        updatedPatients = [
          patient,
          ...settings.recentPatients.filter(p => p.id !== patient.id)
        ];
      } else {
        // Add new and keep only last 5
        updatedPatients = [patient, ...settings.recentPatients].slice(0, 5);
      }
      
      return this.saveSettings({
        ...settings,
        recentPatients: updatedPatients
      });
    } catch (error) {
      console.error('Error adding recent patient:', error);
      return false;
    }
  },

  // Utility Methods
  async clearAllData() {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      await AsyncStorage.multiRemove(allKeys);
      return true;
    } catch (error) {
      console.error('Error clearing data:', error);
      return false;
    }
  },

  async getStorageSize() {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const sizes = await AsyncStorage.multiGet(allKeys);
      return sizes.reduce((total, [key, value]) => {
        return total + (value ? value.length : 0);
      }, 0);
    } catch (error) {
      console.error('Error calculating storage size:', error);
      return 0;
    }
  }
};