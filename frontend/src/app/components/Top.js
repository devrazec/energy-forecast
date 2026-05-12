'use client';

import { useContext, useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GlobalContext } from '../context/GlobalContext';
import Image from 'next/image';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Popover from '@mui/material/Popover';
import Paper from '@mui/material/Paper';
import { usePathname } from 'next/navigation';


export default function Top() {
  const { darkMode, setDarkMode, mobileDevice, currentUrl, setCurrentUrl } = useContext(GlobalContext);
  const pathname = usePathname();

  useEffect(() => {
    setCurrentUrl(pathname);
  }, [pathname, setCurrentUrl]);

  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: '#00a76f1f',
        backdropFilter: 'blur(4px)',
        borderBottom: '1px solid', borderColor: 'divider',
      }}
    >
      <Toolbar>
        {mobileDevice ? (
          <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
            <Image src="/energy-forecast/logo1.png" alt="Logo" width={42} height={42} style={{ objectFit: 'contain' }} />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
            <Image src="/energy-forecast/logo.png" alt="Logo" width={140} height={60} style={{ objectFit: 'contain' }} />
          </Box>
        )}

        <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1 }}>
        </Box>

        <IconButton color="primary" onClick={() => setDarkMode(!darkMode)}>
          {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
        </IconButton>
      </Toolbar>
    </AppBar>
  );
}