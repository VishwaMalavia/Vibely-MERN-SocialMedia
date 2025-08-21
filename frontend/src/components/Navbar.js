import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { getCurrentUser, getProfilePicUrl } from '../utils/profileUtils';
import { getCurrentTheme, toggleTheme } from '../utils/themeUtils';
import './Navbar.css';
import SearchSlider from './SearchSlider';

const Navbar = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [notificationCount, setNotificationCount] = useState(0);
    const [isMobile, setIsMobile] = useState(false);
    const navigate = useNavigate();

    const [user, setUser] = useState(getCurrentUser());
    const [currentTheme, setCurrentTheme] = useState(getCurrentTheme());
    const searchRef = useRef();
    const [showSearchSlider, setShowSearchSlider] = useState(false);
    const [activeNav, setActiveNav] = useState('');

    const location = useLocation();
    const isMessagesPage = location.pathname.startsWith('/messages');
    const sidebarIconsOnly = isMessagesPage;
    const isSearchSliderOpen = showSearchSlider;

    // Check if device is mobile/tablet
    useEffect(() => {
        const checkIsMobile = () => {
            setIsMobile(window.innerWidth <= 1024);
        };
        
        checkIsMobile();
        window.addEventListener('resize', checkIsMobile);
        
        return () => window.removeEventListener('resize', checkIsMobile);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowSearchResults(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        const handleProfileUpdate = (event) => {
            setUser(event.detail.user);
        };
        window.addEventListener('profileUpdated', handleProfileUpdate);
        return () => {
            window.removeEventListener('profileUpdated', handleProfileUpdate);
        };
    }, []);

    useEffect(() => {
        const fetchNotificationCount = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/notifications', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    },
                });
                const data = await response.json();
                if (data.success) {
                    const unreadCount = data.notifications.filter(n => !n.isRead).length;
                    setNotificationCount(unreadCount);
                }
            } catch (error) {
                console.error('Error fetching notification count:', error);
            }
        };
        fetchNotificationCount();
    }, []);

    useEffect(() => {
        if (!isMobile && sidebarIconsOnly) {
            document.body.classList.add('sidebar-icons-only');
        } else {
            document.body.classList.remove('sidebar-icons-only');
        }
    }, [sidebarIconsOnly, isMobile]);

    useEffect(() => {
        if (isSearchSliderOpen) {
            document.body.classList.add('search-slider-open');
        } else {
            document.body.classList.remove('search-slider-open');
        }
    }, [isSearchSliderOpen]);

    const handleSearch = async (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        if (query.length > 2) {
            try {
                const response = await fetch(`http://localhost:5000/api/users/search?q=${query}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    },
                });
                const data = await response.json();
                if (data.success) {
                    setSearchResults(data.users);
                    setShowSearchResults(true);
                }
            } catch (error) {
                console.error('Search error:', error);
            }
        } else {
            setShowSearchResults(false);
            setSearchResults([]);
        }
    };

    const handleSearchOpen = () => {
        if (showSearchSlider) {
            handleSearchClose();
        } else {
            setShowSearchSlider(true);
            setActiveNav('search');
        }
    };
    const handleSearchClose = () => {
        setShowSearchSlider(false);
        // Only clear activeNav if it was 'search'
        if (activeNav === 'search') setActiveNav('');
    };
    const handleNavClick = (nav) => {
        setActiveNav(nav);
        setShowSearchSlider(false); // Close search slider if another nav is clicked
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const handleThemeToggle = () => {
        const newTheme = toggleTheme();
        setCurrentTheme(newTheme);
    };

    // Mobile navbar component
    const MobileNavbar = () => (
        <>
            {/* Top Header */}
            <div className="mobile-top-header">
                <div className="mobile-header-left">
                    <Link to="/home" className="mobile-brand">
                        <span className="brand-vibely">Vibely</span>
                    </Link>
                </div>
                <div className="mobile-header-right">
                    <Link to="/messages" className="mobile-messages-btn">
                        <i className="fas fa-envelope"></i>
                    </Link>
                </div>
            </div>

            {/* Bottom Navigation */}
            <MobileBottomNav
                user={user}
                activeNav={activeNav}
                handleNavClick={handleNavClick}
                showSearchSlider={showSearchSlider}
                handleSearchOpen={handleSearchOpen}
                notificationCount={notificationCount}
            />
        </>
    );

    // Desktop navbar component
    const DesktopNavbar = () => (
        <nav className={`sidebar-navbar${sidebarIconsOnly ? ' sidebar-icons-only' : ''}`}>
            <div className="sidebar-navbar-container">
                <div className="sidebar-navbar-brand">
                    <Link to="/home" className="navbar-brand">
                        {sidebarIconsOnly ? (
                            <img src="/iconLogo1.png" alt="Logo" style={{ width: 64, height: 64 }} />
                        ) : (
                            <span className="brand-vibely">Vibely</span>
                        )}
                    </Link>
                </div>
                <div className="sidebar-nav-links">
                    <Link to="/home" className={`nav-link${activeNav === 'home' ? ' active' : ''}`} onClick={() => handleNavClick('home')}>
                        <i className="fas fa-home"></i><span>Home</span>
                    </Link>
                    <Link to="/create-post" className={`nav-link${activeNav === 'create-post' ? ' active' : ''}`} onClick={() => handleNavClick('create-post')}>
                        <i className="fas fa-plus"></i><span>Create Post</span>
                    </Link>
                    <button className={`nav-link search-btn${activeNav === 'search' && showSearchSlider ? ' active' : ''}`} onClick={handleSearchOpen} title="Search">
                        <i className="fas fa-search"></i><span>Search</span>
                    </button>
                    <Link to="/notifications" className={`nav-link notification-link${activeNav === 'notifications' ? ' active' : ''}`} onClick={() => handleNavClick('notifications')}>
                        <i className="fas fa-bell"></i><span>Notifications</span>
                        {notificationCount > 0 && (
                            <span className="notification-badge">{notificationCount}</span>
                        )}
                    </Link>
                    <Link to="/messages" className={`nav-link${activeNav === 'messages' ? ' active' : ''}`} onClick={() => handleNavClick('messages')}>
                        <i className="fas fa-envelope"></i><span>Messages</span>
                    </Link>
                    <Link to="/bookmarks" className={`nav-link${activeNav === 'bookmarks' ? ' active' : ''}`} onClick={() => handleNavClick('bookmarks')}>
                        <i className="fas fa-bookmark"></i><span>Bookmarks</span>
                    </Link>
                    <Link to="/archive" className={`nav-link${activeNav === 'archive' ? ' active' : ''}`} onClick={() => handleNavClick('archive')}>
                        <i className="fas fa-archive"></i><span>Archive</span>
                    </Link>
                    {/* <Link to="/settings" className={`nav-link${activeNav === 'settings' ? ' active' : ''}`} onClick={() => handleNavClick('settings')}>
                        <i className="fas fa-cog"></i><span>Settings</span>
                    </Link> */}

                </div>
                <div className="sidebar-profile-dropdown">
                    <img
                        src={user.profilePic}
                        alt="Profile"
                        className="profile-pic"
                    />
                    <div className="dropdown-content">
                        <Link to={`/profile/${user.username}`}>My Account</Link>
                        <button onClick={handleThemeToggle} className="theme-toggle-dropdown">
                            <span className={`theme-toggle-slider-dropdown${currentTheme === 'dark' ? ' dark' : ''}`}>
                                <span className="theme-toggle-thumb-dropdown">
                                    {currentTheme === 'dark' ? '🌙' : '☀️'}
                                </span>
                            </span>
                        </button>
                        <button onClick={handleLogout} className="logout-btn">
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );

    return (
        <>
            {isMobile ? <MobileNavbar /> : <DesktopNavbar />}
            {showSearchSlider && (
                <SearchSlider onClose={handleSearchClose} isMobile={isMobile} />
            )}
        </>
    );
};

export const MobileBottomNav = ({ user, activeNav, handleNavClick, showSearchSlider, handleSearchOpen, notificationCount }) => {
    if (!user) return null; // Don't render if no user

    return (
        <div className="mobile-bottom-nav">
            <Link to="/home" className={`mobile-nav-item${activeNav === 'home' ? ' active' : ''}`} onClick={() => handleNavClick('home')}>
                <i className="fas fa-home"></i>
                <span>Home</span>
            </Link>
            
            <button className={`mobile-nav-item${activeNav === 'search' && showSearchSlider ? ' active' : ''}`} onClick={handleSearchOpen}>
                <i className="fas fa-search"></i>
                <span>Search</span>
            </button>
            
            <Link to="/create-post" className={`mobile-nav-item${activeNav === 'create-post' ? ' active' : ''}`} onClick={() => handleNavClick('create-post')}>
                <i className="fas fa-plus"></i>
                <span>Create</span>
            </Link>
            
            <Link to="/notifications" className={`mobile-nav-item${activeNav === 'notifications' ? ' active' : ''}`} onClick={() => handleNavClick('notifications')}>
                <i className="fas fa-bell"></i>
                <span>Notifications</span>
                {notificationCount > 0 && (
                    <span className="mobile-notification-badge">{notificationCount}</span>
                )}
            </Link>
            
            <Link to={`/profile/${user.username}`} className={`mobile-nav-item${activeNav === 'profile' ? ' active' : ''}`} onClick={() => handleNavClick('profile')}>
                <img src={user.profilePic} alt="Profile" className="mobile-profile-pic" />
                <span>Profile</span>
            </Link>
        </div>
    );
};

export default Navbar;
