import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { Plus, Trash2, MoveHorizontal as MoreHorizontal } from 'lucide-react-native';

export default function TableEditor({ tables, onTablesUpdate }) {
  const [selectedTable, setSelectedTable] = useState(null);

  const createNewTable = () => {
    const newTable = {
      id: Date.now().toString(),
      title: 'New Table',
      rows: [
        ['Header 1', 'Header 2', 'Header 3'],
        ['Row 1 Col 1', 'Row 1 Col 2', 'Row 1 Col 3'],
        ['Row 2 Col 1', 'Row 2 Col 2', 'Row 2 Col 3'],
      ],
      createdAt: new Date().toISOString(),
    };
    
    onTablesUpdate([...tables, newTable]);
    setSelectedTable(newTable.id);
  };

  const updateTable = (tableId, updatedTable) => {
    const updatedTables = tables.map(table => 
      table.id === tableId ? { ...table, ...updatedTable } : table
    );
    onTablesUpdate(updatedTables);
  };

  const deleteTable = (tableId) => {
    Alert.alert(
      'Delete Table',
      'Are you sure you want to delete this table?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const updatedTables = tables.filter(table => table.id !== tableId);
            onTablesUpdate(updatedTables);
            if (selectedTable === tableId) {
              setSelectedTable(null);
            }
          }
        }
      ]
    );
  };

  const addRow = (tableId) => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;
    
    const newRow = new Array(table.rows[0].length).fill('');
    const updatedRows = [...table.rows, newRow];
    updateTable(tableId, { rows: updatedRows });
  };

  const addColumn = (tableId) => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;
    
    const updatedRows = table.rows.map(row => [...row, '']);
    updateTable(tableId, { rows: updatedRows });
  };

  const removeRow = (tableId, rowIndex) => {
    const table = tables.find(t => t.id === tableId);
    if (!table || table.rows.length <= 1) return;
    
    const updatedRows = table.rows.filter((_, index) => index !== rowIndex);
    updateTable(tableId, { rows: updatedRows });
  };

  const removeColumn = (tableId, colIndex) => {
    const table = tables.find(t => t.id === tableId);
    if (!table || table.rows[0].length <= 1) return;
    
    const updatedRows = table.rows.map(row => 
      row.filter((_, index) => index !== colIndex)
    );
    updateTable(tableId, { rows: updatedRows });
  };

  const updateCell = (tableId, rowIndex, colIndex, value) => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;
    
    const updatedRows = table.rows.map((row, rIndex) =>
      rIndex === rowIndex 
        ? row.map((cell, cIndex) => cIndex === colIndex ? value : cell)
        : row
    );
    updateTable(tableId, { rows: updatedRows });
  };

  const renderTableEditor = (table) => (
    <View key={table.id} style={styles.tableContainer}>
      <View style={styles.tableHeader}>
        <TextInput
          style={styles.tableTitleInput}
          value={table.title}
          onChangeText={(title) => updateTable(table.id, { title })}
          placeholder="Table title"
        />
        <View style={styles.tableActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => addRow(table.id)}
          >
            <Text style={styles.actionButtonText}>+Row</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => addColumn(table.id)}
          >
            <Text style={styles.actionButtonText}>+Col</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteActionButton]}
            onPress={() => deleteTable(table.id)}
          >
            <Trash2 size={14} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.table}>
          {table.rows.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.tableRow}>
              {row.map((cell, colIndex) => (
                <View key={colIndex} style={styles.tableCellContainer}>
                  <TextInput
                    style={[
                      styles.tableCell,
                      rowIndex === 0 && styles.headerCell
                    ]}
                    value={cell}
                    onChangeText={(value) => updateCell(table.id, rowIndex, colIndex, value)}
                    placeholder={`Cell ${rowIndex + 1}-${colIndex + 1}`}
                    multiline
                  />
                  {colIndex === row.length - 1 && row.length > 1 && (
                    <TouchableOpacity
                      style={styles.removeColumnButton}
                      onPress={() => removeColumn(table.id, colIndex)}
                    >
                      <Text style={styles.removeButtonText}>×</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              {table.rows.length > 1 && (
                <TouchableOpacity
                  style={styles.removeRowButton}
                  onPress={() => removeRow(table.id, rowIndex)}
                >
                  <Text style={styles.removeButtonText}>×</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <TouchableOpacity style={styles.createButton} onPress={createNewTable}>
          <Plus size={18} color="#007AFF" />
          <Text style={styles.createButtonText}>New Table</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.tablesContainer} showsVerticalScrollIndicator={false}>
        {tables.length === 0 ? (
          <View style={styles.emptyState}>
            <MoreHorizontal size={64} color="#C7C7CC" />
            <Text style={styles.emptyStateTitle}>No Tables Added</Text>
            <Text style={styles.emptyStateText}>
              Create your first table to organize information in rows and columns
            </Text>
          </View>
        ) : (
          <View style={styles.tablesList}>
            {tables.map(renderTableEditor)}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  toolbar: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f2f2f7',
    borderRadius: 20,
    gap: 6,
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
  },
  tablesContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
  tablesList: {
    padding: 20,
    gap: 24,
  },
  tableContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tableTitleInput: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    flex: 1,
    marginRight: 16,
  },
  tableActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  deleteActionButton: {
    paddingHorizontal: 8,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#007AFF',
  },
  table: {
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
    position: 'relative',
  },
  tableCellContainer: {
    position: 'relative',
  },
  tableCell: {
    width: 120,
    minHeight: 40,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRightWidth: 1,
    borderRightColor: '#e1e5e9',
    fontSize: 14,
    color: '#000',
    textAlignVertical: 'top',
  },
  headerCell: {
    backgroundColor: '#f8f9fa',
    fontWeight: '600',
  },
  removeColumnButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeRowButton: {
    position: 'absolute',
    top: 10,
    right: -20,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});