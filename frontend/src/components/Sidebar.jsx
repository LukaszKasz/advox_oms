import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authAPI, nexoAPI, tokenManager } from '../api';
import { GOODS_STORAGE_KEY } from './GoodsPage';

function Sidebar({ collapsed, onToggle }) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [goodsLoading, setGoodsLoading] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const loadUser = async () => {
            try {
                const user = await authAPI.getCurrentUser();
                setIsAdmin(Boolean(user?.is_admin));
            } catch {
                setIsAdmin(false);
            }
        };

        if (tokenManager.isAuthenticated()) {
            loadUser();
        }
    }, []);

    const handleLogout = () => {
        tokenManager.removeToken();
        navigate('/login');
    };

    const handleGoodsClick = async () => {
        if (goodsLoading) return;

        setGoodsLoading(true);
        try {
            const sessionResponse = await nexoAPI.getSession();
            const activeSession = sessionResponse?.success && sessionResponse?.data?.isLoggedIn
                ? sessionResponse.data
                : null;

            const result = activeSession
                ? { success: true, data: activeSession }
                : await nexoAPI.login('Szef firmy', 'robocze');
            const goodsResponse = await nexoAPI.getGoods();

            if (!goodsResponse?.success) {
                throw new Error(goodsResponse?.error || goodsResponse?.message || t('sidebar.goodsFetchError'));
            }

            const goods = Array.isArray(goodsResponse?.data) ? goodsResponse.data : [];
            const payload = {
                goods,
                session: result?.data || null,
            };
            sessionStorage.setItem(GOODS_STORAGE_KEY, JSON.stringify(payload));
            navigate('/goods', { state: { payload } });
        } catch (error) {
            const message = error?.response?.data?.message
                || error?.response?.data?.error
                || error?.message
                || error?.response?.data?.detail
                || t('sidebar.goodsLoginError');
            window.alert(message);
        } finally {
            setGoodsLoading(false);
        }
    };

    const navLinkClass = ({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group
        ${isActive
            ? 'bg-primary-600 text-white shadow-md'
            : 'text-slate-300 hover:bg-slate-700/60 hover:text-white'}`;

    return (
        <aside
            className={`fixed top-0 left-0 h-screen bg-slate-900 flex flex-col z-50 transition-all duration-300 shadow-xl
                ${collapsed ? 'w-[72px]' : 'w-64'}`}
        >
            {/* Header */}
            <div className="flex items-center justify-between h-16 px-4 border-b border-slate-700/50">
                {!collapsed && (
                    <span className="text-lg font-bold text-white tracking-wide">
                        Advox OMS
                    </span>
                )}
                <button
                    onClick={onToggle}
                    className={`p-2 rounded-lg text-slate-400 hover:bg-slate-700/60 hover:text-white transition-colors ${collapsed ? 'mx-auto' : ''}`}
                    aria-label="Toggle sidebar"
                >
                    <svg className={`w-5 h-5 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                    </svg>
                </button>
            </div>

            {/* Top navigation */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                <NavLink to="/orders-to-ship" className={navLinkClass} title={t('sidebar.orders')}>
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                    {!collapsed && <span className="whitespace-nowrap">{t('sidebar.orders')}</span>}
                </NavLink>

                <NavLink to="/orders-shipping" className={navLinkClass} title={t('sidebar.ordersShipping')}>
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                    {!collapsed && <span className="whitespace-nowrap">{t('sidebar.ordersShipping')}</span>}
                </NavLink>

                <NavLink to="/orders-delivered" className={navLinkClass} title={t('sidebar.ordersDelivered')}>
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                    {!collapsed && <span className="whitespace-nowrap">{t('sidebar.ordersDelivered')}</span>}
                </NavLink>

                <button
                    type="button"
                    onClick={handleGoodsClick}
                    disabled={goodsLoading}
                    title={t('sidebar.goods')}
                    className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-slate-300 transition-all duration-200 hover:bg-slate-700/60 hover:text-white disabled:cursor-wait disabled:opacity-60"
                >
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V7a2 2 0 00-2-2h-3V3H9v2H6a2 2 0 00-2 2v6m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0H4m4 4h.01M12 17h.01M16 17h.01" />
                    </svg>
                    {!collapsed && (
                        <span className="whitespace-nowrap">
                            {goodsLoading ? t('sidebar.goodsLoggingIn') : t('sidebar.goods')}
                        </span>
                    )}
                </button>

                <NavLink to="/settings" className={navLinkClass} title={t('sidebar.settings')}>
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {!collapsed && <span className="whitespace-nowrap">{t('sidebar.settings')}</span>}
                </NavLink>

                {isAdmin && (
                    <NavLink to="/users" className={navLinkClass} title={t('sidebar.users')}>
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5V9H2v11h5m10 0v-2a4 4 0 00-4-4H11a4 4 0 00-4 4v2m10 0H7m8-11a2 2 0 11-4 0 2 2 0 014 0zm-6 0a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        {!collapsed && <span className="whitespace-nowrap">{t('sidebar.users')}</span>}
                    </NavLink>
                )}
            </nav>

            {/* Bottom - Logout */}
            <div className="px-3 py-4 border-t border-slate-700/50">
                <button
                    onClick={handleLogout}
                    title={t('sidebar.logout')}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg w-full text-slate-300 hover:bg-red-500/20 hover:text-red-400 transition-all duration-200"
                >
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    {!collapsed && <span className="whitespace-nowrap">{t('sidebar.logout')}</span>}
                </button>
            </div>
        </aside>
    );
}

export default Sidebar;
