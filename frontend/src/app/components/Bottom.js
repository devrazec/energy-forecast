'use client';

import { useRef, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { GlobalContext } from '../context/GlobalContext';
import Paper from '@mui/material/Paper';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import IconButton from '@mui/material/IconButton';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import HomeIcon from '@mui/icons-material/Home';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import LocationOnIcon from '@mui/icons-material/LocationOn';

const navItems = [
    { text: 'Home', icon: <HomeIcon />, href: '/' },
    { text: 'All Cities', icon: <LocationCityIcon />, href: '/pages/AllCities' },
    { text: 'All Days', icon: <CalendarMonthIcon />, href: '/pages/AllDays' },
    { text: 'All Prices', icon: <AttachMoneyIcon />, href: '/pages/AllPrices' },
    { text: 'Daily', icon: <TrendingUpIcon />, href: '/pages/Daily' },
    { text: 'Lisbon', icon: <LocationOnIcon />, href: '/pages/Lisbon' },
    { text: 'Porto', icon: <LocationOnIcon />, href: '/pages/Porto' },
];

export default function Bottom() {
  const { currentUrl } = useContext(GlobalContext);
  const router = useRouter();
  const scrollRef = useRef(null);
  
  // Extract only the last part of the URL
  const getLastSegment = (url) => {
    if (url === '/') return '/';
    const segments = url.split('/').filter(Boolean);
    return segments[segments.length - 1];
  };
  
  const currentSegment = getLastSegment(currentUrl);
  
  const activeIndex = navItems.findIndex(({ href }) => {
    const hrefSegment = href === '/' ? '/' : href.split('/').filter(Boolean).pop();
    return hrefSegment === currentSegment;
  });

  const scroll = (dir) => {
    scrollRef.current?.scrollBy({ left: dir * 150, behavior: 'smooth' });
  };

  return (
    <Paper
      sx={{
        display: { xs: 'flex', md: 'none' },
        alignItems: 'center',
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
      elevation={3}
    >
      <IconButton size="small" onClick={() => scroll(-1)} sx={{ flexShrink: 0 }}>
        <ChevronLeftIcon />
      </IconButton>

      <div ref={scrollRef} style={{ flex: 1, overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <BottomNavigation
          showLabels
          value={activeIndex}
          onChange={(_, newValue) => router.push(navItems[newValue].href)}
          sx={{ width: `${navItems.length * 80}px`, '&::-webkit-scrollbar': { display: 'none' } }}
        >
          {navItems.map(({ text, icon }) => (
            <BottomNavigationAction
              key={text}
              label={text}
              icon={icon}
              sx={{
                minWidth: 72,
                flexShrink: 0,
                '&.Mui-selected': {
                  backgroundColor: '#008bc133',
                  color: '#008bc1',
                  '& .MuiSvgIcon-root': { color: '#008bc1' },
                },
              }}
            />
          ))}
        </BottomNavigation>
      </div>

      <IconButton size="small" onClick={() => scroll(1)} sx={{ flexShrink: 0 }}>
        <ChevronRightIcon />
      </IconButton>
    </Paper>
  );
}
