import { AppBar, Toolbar, Button, Typography } from '@mui/material';

export default function Navbar({ onLogout }) {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Docs Manager
        </Typography>
        <Button color="inherit" onClick={onLogout}>
          Выйти
        </Button>
      </Toolbar>
    </AppBar>
  );
}