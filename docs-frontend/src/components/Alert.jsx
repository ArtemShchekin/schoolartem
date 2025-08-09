import { Snackbar, Alert as MuiAlert } from '@mui/material';

export default function Alert({ open, message, severity, onClose }) {
  return (
    <Snackbar
      open={open}
      autoHideDuration={5000}
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
    >
      <MuiAlert 
        elevation={6} 
        variant="filled" 
        onClose={onClose} 
        severity={severity}
        sx={{ width: '100%' }}
      >
        {message}
      </MuiAlert>
    </Snackbar>
  );
}