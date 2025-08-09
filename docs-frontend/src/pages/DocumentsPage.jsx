import { useState, useEffect, useCallback } from 'react';
import { 
  Button, 
  CircularProgress, 
  Box,
  Typography,
  IconButton
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import DocumentList from '../components/DocumentList';
import DocumentModal from './DocumentModal';
import Alert from '../components/Alert';
import api from '../services/api';

const headCells = [
  { id: 'number', label: '№', sortable: false },
  { id: 'code', label: 'Код', sortable: true },
  { id: 'subject', label: 'Тема документа', sortable: true },
  { id: 'sender', label: 'Отправитель', sortable: true },
  { id: 'receiver', label: 'Получатель', sortable: true },
  { id: 'status', label: 'Статус', sortable: true },
  { id: 'actions', label: 'Действия', sortable: false }
];

export default function DocumentsPage({ userRole = 'manager' }) {
  const [state, setState] = useState({
    documents: [],
    loading: true,
    isModalOpen: false,
    currentDoc: null,
    alert: { open: false, message: '', severity: 'success' },
    selectedDoc: null,
    mode: 'create'
  });

  const canEdit = userRole === 'administrator';
  const canDelete = userRole === 'administrator';

  const fetchDocuments = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      const res = await api.get('/documents');
      setState(prev => ({ 
        ...prev, 
        documents: res.data,
        loading: false 
      }));
    } catch (err) {
      showAlert('Ошибка загрузки документов', 'error');
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  const handleDelete = useCallback(async (id) => {
    try {
      await api.delete(`/documents/${id}`);
      await fetchDocuments();
      showAlert('Документ удален', 'success');
    } catch (err) {
      showAlert(err.response?.data?.message || 'Ошибка удаления', 'error');
    }
  }, [fetchDocuments]);

  const showAlert = useCallback((message, severity) => {
    setState(prev => ({ 
      ...prev, 
      alert: { open: true, message, severity } 
    }));
    setTimeout(() => {
      setState(prev => ({ ...prev, alert: { ...prev.alert, open: false } }));
    }, 5000);
  }, []);

  const handleRowClick = (doc) => {
    setState(prev => ({ 
      ...prev, 
      selectedDoc: doc.id === prev.selectedDoc ? null : doc.id 
    }));
  };

  const handleRowDoubleClick = (doc) => {
    if (doc.status === 'Отправлен') {
      showAlert('Отправленные документы нельзя редактировать', 'info');
      return;
    }
    setState(prev => ({ 
      ...prev, 
      currentDoc: doc,
      isModalOpen: true,
      mode: 'edit'
    }));
  };

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  return (
    <Box sx={{ padding: 3, maxWidth: 1200, margin: '0 auto' }}>
      {canEdit && (
        <Button 
          variant="contained" 
          startIcon={<Add />}
          onClick={() => setState(prev => ({ 
            ...prev, 
            isModalOpen: true, 
            currentDoc: null,
            mode: 'create'
          }))}
          sx={{ mb: 3 }}
        >
          Создать документ
        </Button>
      )}

      {state.loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress size={60} />
        </Box>
      ) : state.documents.length === 0 ? (
        <Typography variant="h6" sx={{ textAlign: 'center', mt: 4, color: 'text.secondary' }}>
          Нет документов для отображения
        </Typography>
      ) : (
        <>
          <DocumentList 
            headCells={headCells}
            documents={state.documents.map((doc, index) => ({ 
              ...doc, 
              number: index + 1,
              actions: state.selectedDoc === doc.id && doc.status === 'Черновик' && canDelete ? (
                <IconButton 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(doc.id);
                  }}
                  color="error"
                >
                  <Delete />
                </IconButton>
              ) : null
            }))}
            onRowClick={handleRowClick}
            onRowDoubleClick={handleRowDoubleClick}
          />
        </>
      )}

      <DocumentModal
        document={state.currentDoc}
        open={state.isModalOpen}
        onClose={() => setState(prev => ({ ...prev, isModalOpen: false }))}
        onSave={(newDoc, isNew) => {
          showAlert(
            isNew ? 'Документ создан' : 
            newDoc.status === 'Отправлен' ? 'Документ отправлен' : 'Документ обновлен', 
            'success'
          );
          fetchDocuments();
        }}
        mode={state.mode}
      />

      <Alert 
        open={state.alert.open}
        message={state.alert.message}
        severity={state.alert.severity}
        onClose={() => setState(prev => ({ ...prev, alert: { ...prev.alert, open: false }}))}
      />
    </Box>
  );
}