import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography
} from '@mui/material';
import api from '../services/api';

const DocumentModal = ({ document: initialDoc, open, onClose, onSave, mode = 'create' }) => {
  const [form, setForm] = useState({
    code: '',
    subject: '',
    sender: '',
    receiver: '',
    message: '',
    status: 'Черновик'
  });
  const [errors, setErrors] = useState({});
  const [isSent, setIsSent] = useState(false);

  useEffect(() => {
    if (initialDoc) {
      setForm(initialDoc);
      setIsSent(initialDoc.status === 'Отправлен');
    } else {
      setForm({
        code: '',
        subject: '',
        sender: '',
        receiver: '',
        message: '',
        status: 'Черновик'
      });
      setIsSent(false);
    }
  }, [initialDoc]);

  const validateField = (name, value) => {
    switch (name) {
      case 'code':
        if (!value && value !== 0) return 'Не заполнено поле';
        if (value === 0) return 'Код не должен быть равен 0';
        if (value.toString().length > 10) return 'Макс. длина: 10 символов';
        return '';
      case 'subject':
        if (!value) return 'Не заполнено поле';
        if (value.length > 35) return 'Макс. длина: 35 символов';
        if (!/^[а-яА-ЯёЁ\s]+$/.test(value)) return 'Только кириллица';
        return '';
      case 'sender':
      case 'receiver':
        if (!value) return 'Не заполнено поле';
        if (value.length > 40) return 'Макс. длина: 40 символов';
        if (!/^[а-яА-ЯёЁ\s]+$/.test(value)) return 'Только кириллица';
        return '';
      case 'message':
        if (value.length > 500) return 'Макс. длина: 500 символов';
        return '';
      default:
        return '';
    }
  };

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    ['code', 'subject', 'sender', 'receiver'].forEach(field => {
      const error = validateField(field, form[field]);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (action) => {
    if (!validateForm()) return;

    try {
      let response;
      if (action === 'send') {
        response = await api.post(`/documents/${form.id}/send`);
      } else if (initialDoc) {
        response = await api.patch(`/documents/${form.id}`, {
          code: form.code,
          subject: form.subject,
          sender: form.sender,
          message: form.message
        });
      } else {
        response = await api.post('/documents', form);
      }
      
      onSave(response.data, !initialDoc);
      onClose();
    } catch (err) {
      if (err.response?.status === 409) {
        setErrors({ ...errors, code: 'Данный код уже используется в системе' });
      } else {
        const errorMessage = err.response?.data?.message || 'Произошла ошибка';
        alert(errorMessage);
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {mode === 'create' ? 'Создание документа' : 'Редактирование документа'}
      </DialogTitle>
      <DialogContent>
        <TextField
          name="code"
          label="Код"
          type="number"
          fullWidth
          margin="normal"
          value={form.code}
          onChange={handleChange}
          error={!!errors.code}
          helperText={errors.code}
          disabled={isSent || mode === 'edit'}
        />
        <TextField
          name="subject"
          label="Тема документа"
          fullWidth
          margin="normal"
          value={form.subject}
          onChange={handleChange}
          error={!!errors.subject}
          helperText={errors.subject}
          disabled={isSent}
        />
        <TextField
          name="sender"
          label="Отправитель"
          fullWidth
          margin="normal"
          value={form.sender}
          onChange={handleChange}
          error={!!errors.sender}
          helperText={errors.sender}
          disabled={isSent}
        />
        <TextField
          name="receiver"
          label="Получатель"
          fullWidth
          margin="normal"
          value={form.receiver}
          onChange={handleChange}
          error={!!errors.receiver}
          helperText={errors.receiver}
          disabled={mode === 'edit' || isSent}
        />
        <TextField
          name="message"
          label="Сообщение"
          fullWidth
          margin="normal"
          multiline
          rows={4}
          value={form.message}
          onChange={handleChange}
          error={!!errors.message}
          helperText={errors.message}
          disabled={isSent}
        />
        {isSent && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Документ отправлен и не может быть изменен
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Отмена</Button>
        {!isSent && (
          <>
            <Button onClick={() => handleSubmit('save')} color="primary">
              Сохранить
            </Button>
            <Button 
              onClick={() => handleSubmit('send')} 
              color="secondary" 
              variant="contained"
            >
              Отправить
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default DocumentModal;