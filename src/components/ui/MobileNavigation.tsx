'use client';

import React, { useState, useEffect } from 'react';
import {
    Menu,
    X,
    Home,
    ShoppingCart,
    User,
    Search,
    Heart,
    Clock,
    MapPin,
    Phone
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface MobileNavigationProps {
    cartItemsCount?: number;
    onCartClick?: () => void;
    onSearchClick?: () => void;
    storeName?: string;
    storeId?: string;
    tableId?: string;
    isAuthenticated?: boolean;
    className?: string;
}

/**
 * Mobile-first navigation component with hamburger menu and bottom navigation
 */
export function MobileNavigation({
    cartItemsCount = 0,
    onCartClick,
    onSearchClick,
    storeName,
    storeId,
    tableId,
    isAuthenticated = false,
    className
}: MobileNavigationProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    // Handle scroll effect
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element;
            if (isMenuOpen && !target.closest('.mobile-menu')) {
                setIsMenuOpen(false);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [isMenuOpen]);

    // Prevent body scroll when menu is open
    useEffect(() => {
        if (isMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isMenuOpen]);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const handleCartClick = () => {
        onCartClick?.();
        setIsMenuOpen(false);
    };

    const handleSearchClick = () => {
        onSearchClick?.();
        setIsMenuOpen(false);
    };

    return (
        <>
            {/* Top Navigation Bar - Mobile */}
            <nav className={cn(
                'fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 transition-all duration-300',
                isScrolled && 'shadow-sm bg-white/95 backdrop-blur-sm',
                className
            )}>
                <div className="flex items-center justify-between h-14 px-4">
                    {/* Menu Button */}
                    <button
                        onClick={toggleMenu}
                        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors mobile-menu"
                        aria-label="Menu"
                    >
                        {isMenuOpen ? (
                            <X className="w-6 h-6" />
                        ) : (
                            <Menu className="w-6 h-6" />
                        )}
                    </button>

                    {/* Store Name */}
                    <div className="flex-1 text-center">
                        <Link
                            href={tableId ? `/${storeId}/${tableId}` : `/${storeId}`}
                            className="text-lg font-semibold text-gray-900 hover:text-amber-600 transition-colors"
                        >
                            {storeName || 'Menu'}
                        </Link>
                    </div>

                    {/* Cart Button */}
                    <button
                        onClick={handleCartClick}
                        className="relative p-2 text-gray-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        aria-label="Carrinho"
                    >
                        <ShoppingCart className="w-6 h-6" />
                        {cartItemsCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center">
                                {cartItemsCount > 99 ? '99+' : cartItemsCount}
                            </span>
                        )}
                    </button>
                </div>
            </nav>

            {/* Slide-out Menu */}
            <div className={cn(
                'fixed inset-0 z-40 transition-opacity duration-300 mobile-menu',
                isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
            )}>
                {/* Backdrop */}
                <div className="absolute inset-0 bg-black bg-opacity-50" />

                {/* Menu Panel */}
                <div className={cn(
                    'absolute left-0 top-0 h-full w-80 max-w-[85vw] bg-white shadow-xl transform transition-transform duration-300',
                    isMenuOpen ? 'translate-x-0' : '-translate-x-full'
                )}>
                    {/* Menu Header */}
                    <div className="flex items-center justify-between h-14 px-4 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
                        <button
                            onClick={toggleMenu}
                            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                            aria-label="Fechar menu"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Menu Content */}
                    <div className="flex flex-col h-full pt-4 pb-20">
                        {/* Context Info */}
                        {tableId && (
                            <div className="px-4 mb-6">
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-amber-600" />
                                        <span className="text-sm font-medium text-amber-800">
                                            {tableId.startsWith('mesa-')
                                                ? `Mesa ${tableId.replace('mesa-', '')}`
                                                : `Mesa ${tableId.slice(-4)}`
                                            }
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Navigation Links */}
                        <nav className="flex-1 px-4">
                            <ul className="space-y-2">
                                <li>
                                    <Link
                                        href={tableId ? `/${storeId}/${tableId}` : `/${storeId}`}
                                        className="flex items-center gap-3 px-3 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        <Home className="w-5 h-5" />
                                        <span>Início</span>
                                    </Link>
                                </li>

                                <li>
                                    <button
                                        onClick={handleSearchClick}
                                        className="flex items-center gap-3 px-3 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors w-full text-left"
                                    >
                                        <Search className="w-5 h-5" />
                                        <span>Buscar</span>
                                    </button>
                                </li>

                                <li>
                                    <button
                                        onClick={handleCartClick}
                                        className="flex items-center gap-3 px-3 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors w-full text-left"
                                    >
                                        <ShoppingCart className="w-5 h-5" />
                                        <span>Carrinho</span>
                                        {cartItemsCount > 0 && (
                                            <span className="ml-auto bg-amber-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center">
                                                {cartItemsCount > 99 ? '99+' : cartItemsCount}
                                            </span>
                                        )}
                                    </button>
                                </li>

                                {isAuthenticated && (
                                    <>
                                        <li>
                                            <Link
                                                href={`/${storeId}/profile`}
                                                className="flex items-center gap-3 px-3 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                                onClick={() => setIsMenuOpen(false)}
                                            >
                                                <User className="w-5 h-5" />
                                                <span>Perfil</span>
                                            </Link>
                                        </li>

                                        <li>
                                            <Link
                                                href={`/${storeId}/orders`}
                                                className="flex items-center gap-3 px-3 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                                onClick={() => setIsMenuOpen(false)}
                                            >
                                                <Clock className="w-5 h-5" />
                                                <span>Pedidos</span>
                                            </Link>
                                        </li>

                                        <li>
                                            <Link
                                                href={`/${storeId}/favorites`}
                                                className="flex items-center gap-3 px-3 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                                onClick={() => setIsMenuOpen(false)}
                                            >
                                                <Heart className="w-5 h-5" />
                                                <span>Favoritos</span>
                                            </Link>
                                        </li>
                                    </>
                                )}
                            </ul>
                        </nav>

                        {/* Contact Info */}
                        <div className="px-4 pt-4 border-t border-gray-200">
                            <div className="text-sm text-gray-600">
                                <p className="font-medium mb-2">Precisa de ajuda?</p>
                                <div className="flex items-center gap-2 mb-2">
                                    <Phone className="w-4 h-4" />
                                    <span>Chame o garçom</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Navigation - Mobile (Alternative) */}
            <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 md:hidden">
                <div className="flex items-center justify-around h-16 px-2">
                    <Link
                        href={tableId ? `/${storeId}/${tableId}` : `/${storeId}`}
                        className="flex flex-col items-center gap-1 p-2 text-gray-600 hover:text-amber-600 transition-colors"
                    >
                        <Home className="w-5 h-5" />
                        <span className="text-xs">Início</span>
                    </Link>

                    <button
                        onClick={handleSearchClick}
                        className="flex flex-col items-center gap-1 p-2 text-gray-600 hover:text-amber-600 transition-colors"
                    >
                        <Search className="w-5 h-5" />
                        <span className="text-xs">Buscar</span>
                    </button>

                    <button
                        onClick={handleCartClick}
                        className="relative flex flex-col items-center gap-1 p-2 text-gray-600 hover:text-amber-600 transition-colors"
                    >
                        <ShoppingCart className="w-5 h-5" />
                        <span className="text-xs">Carrinho</span>
                        {cartItemsCount > 0 && (
                            <span className="absolute -top-1 right-1 bg-amber-500 text-white text-xs font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center">
                                {cartItemsCount > 9 ? '9+' : cartItemsCount}
                            </span>
                        )}
                    </button>

                    {isAuthenticated && (
                        <Link
                            href={`/${storeId}/profile`}
                            className="flex flex-col items-center gap-1 p-2 text-gray-600 hover:text-amber-600 transition-colors"
                        >
                            <User className="w-5 h-5" />
                            <span className="text-xs">Perfil</span>
                        </Link>
                    )}
                </div>
            </div>
        </>
    );
}

/**
 * Mobile Search Overlay
 */
interface MobileSearchOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    onSearch: (term: string) => void;
    placeholder?: string;
}

export function MobileSearchOverlay({
    isOpen,
    onClose,
    onSearch,
    placeholder = "Buscar produtos..."
}: MobileSearchOverlayProps) {
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
            setSearchTerm('');
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        onSearch(searchTerm);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-white">
            {/* Header */}
            <div className="flex items-center gap-4 h-14 px-4 border-b border-gray-200">
                <button
                    onClick={onClose}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    aria-label="Voltar"
                >
                    <X className="w-5 h-5" />
                </button>

                <form onSubmit={handleSearch} className="flex-1">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder={placeholder}
                        className="w-full px-4 py-2 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        autoFocus
                    />
                </form>
            </div>

            {/* Search Results Area */}
            <div className="flex-1 p-4">
                {searchTerm ? (
                    <div className="text-center text-gray-500 mt-8">
                        <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>Digite para buscar produtos...</p>
                    </div>
                ) : (
                    <div className="text-center text-gray-500 mt-8">
                        <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>Digite algo para começar a busca</p>
                    </div>
                )}
            </div>
        </div>
    );
}