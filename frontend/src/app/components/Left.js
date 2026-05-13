'use client';

import Link from 'next/link';
import { useContext } from 'react';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Toolbar from '@mui/material/Toolbar';
import Divider from '@mui/material/Divider';
import { GlobalContext } from '../context/GlobalContext';
import HomeIcon from '@mui/icons-material/Home';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import LocationOnIcon from '@mui/icons-material/LocationOn';

const DRAWER_WIDTH = 240;

const mainNavItems = [
    { text: 'Home', icon: <HomeIcon />, href: '/' },
    { text: 'All Cities', icon: <LocationCityIcon />, href: '/pages/AllCities' },
    { text: 'All Days', icon: <CalendarMonthIcon />, href: '/pages/AllDays' },
    { text: 'All Prices', icon: <AttachMoneyIcon />, href: '/pages/AllPrices' },
    { text: 'Daily', icon: <TrendingUpIcon />, href: '/pages/Daily' },
    { text: 'Lisbon', icon: <LocationOnIcon />, href: '/pages/Lisbon' },
    { text: 'Porto', icon: <LocationOnIcon />, href: '/pages/Porto' },
];

export default function Left() {

    const { currentUrl } = useContext(GlobalContext);
    
    // Extract only the last part of the URL
    const getLastSegment = (url) => {
        if (url === '/') return '/';
        const segments = url.split('/').filter(Boolean);
        return segments[segments.length - 1];
    };
    
    const currentSegment = getLastSegment(currentUrl);

    return (
        <Drawer
            variant="permanent"
            sx={{
                display: { xs: 'none', md: 'block' },
                width: DRAWER_WIDTH,
                flexShrink: 0,
                '& .MuiDrawer-paper': {
                    width: DRAWER_WIDTH,
                    boxSizing: 'border-box',
                },
            }}
        >
            <Toolbar />
            <List>
                {mainNavItems.map(({ text, icon, href }) => {
                    const hrefSegment = href === '/' ? '/' : href.split('/').filter(Boolean).pop();
                    const isSelected = currentSegment === hrefSegment;
                    return (
                    <ListItem key={text} disablePadding>
                        <ListItemButton
                            component={Link}
                            href={href}
                            sx={{
                                backgroundColor: isSelected ? '#008bc1' : 'transparent',
                                color: isSelected ? '#fff' : 'inherit',
                                '& .MuiListItemIcon-root': {
                                    color: isSelected ? '#fff' : 'inherit',
                                },
                                '&:hover': {
                                    backgroundColor: isSelected ? '#006a94' : 'rgba(0, 139, 193, 0.1)',
                                },
                                transition: 'all 0.2s ease',
                            }}
                        >
                            <ListItemIcon>{icon}</ListItemIcon>
                            <ListItemText primary={text} />
                        </ListItemButton>
                    </ListItem>
                    );
                })}
            </List>
            
        </Drawer>
    );
}
