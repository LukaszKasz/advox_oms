import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ordersAPI } from '../api';

function OrdersPage({ titleKey = 'sidebar.orders' }) {
    const { t } = useTranslation();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedOrderId, setExpandedOrderId] = useState(null);
    const [orderDetails, setOrderDetails] = useState({});
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, orderId: null });
    const [sortConfig, setSortConfig] = useState({ key: 'date_add', direction: 'desc' });
    const [statusDrafts, setStatusDrafts] = useState({});
    const [savingStatusId, setSavingStatusId] = useState(null);
    const [filters, setFilters] = useState({
        id: '',
        source: '',
        reference: '',
        id_customer: '',
        total_paid: '',
        payment: '',
        status: '',
        date_add: '',
    });

    const statusOptions = [
        { value: 'Nowe', label: t('orders.statusNew') },
        { value: 'W realizacji', label: t('orders.statusInProgress') },
        { value: 'Wysłane', label: t('orders.statusShipped') },
    ];

    const isNumericLike = (value) => {
        if (value === null || value === undefined) return false;
        if (typeof value === 'number') return Number.isFinite(value);
        if (typeof value !== 'string') return false;
        const normalized = value.trim().replace(',', '.');
        return normalized !== '' && !Number.isNaN(Number(normalized));
    };

    const formatAmount = (value) => {
        const numeric = Number(value);
        if (!Number.isFinite(numeric)) return value;
        return numeric.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const normalizeValue = (value) => String(value ?? '').trim().toLowerCase();

    const parseSortableValue = (key, value) => {
        if (key === 'total_paid') {
            const numeric = Number(String(value ?? '').replace(',', '.'));
            return Number.isFinite(numeric) ? numeric : Number.NEGATIVE_INFINITY;
        }

        if (key === 'date_add') {
            const timestamp = Date.parse(value);
            return Number.isNaN(timestamp) ? Number.NEGATIVE_INFINITY : timestamp;
        }

        const normalized = normalizeValue(value);
        if (isNumericLike(normalized)) {
            return Number(normalized.replace(',', '.'));
        }

        return normalized;
    };

    const handleSort = (key) => {
        setSortConfig((current) => (
            current.key === key
                ? { key, direction: current.direction === 'asc' ? 'desc' : 'asc' }
                : { key, direction: 'asc' }
        ));
    };

    const handleFilterChange = (key, value) => {
        setFilters((current) => ({
            ...current,
            [key]: value,
        }));
    };

    const visibleOrders = useMemo(() => {
        const filteredOrders = orders.filter((order) => (
            Object.entries(filters).every(([key, filterValue]) => {
                if (!filterValue.trim()) return true;
                return normalizeValue(order[key]).includes(filterValue.trim().toLowerCase());
            })
        ));

        return [...filteredOrders].sort((left, right) => {
            const leftValue = parseSortableValue(sortConfig.key, left[sortConfig.key]);
            const rightValue = parseSortableValue(sortConfig.key, right[sortConfig.key]);

            if (leftValue === rightValue) return 0;

            const comparison = leftValue > rightValue ? 1 : -1;
            return sortConfig.direction === 'asc' ? comparison : -comparison;
        });
    }, [filters, orders, sortConfig]);

    const columns = [
        { key: 'id', label: t('orders.colId') },
        { key: 'source', label: t('orders.colSource') },
        { key: 'reference', label: t('orders.colReference') },
        { key: 'id_customer', label: t('orders.colCustomerId') },
        { key: 'total_paid', label: t('orders.colTotalPaid'), align: 'right' },
        { key: 'payment', label: t('orders.colPayment') },
        { key: 'status', label: t('orders.colStatus') },
        { key: 'date_add', label: t('orders.colDate') },
    ];

    const getSortIndicator = (key) => {
        if (sortConfig.key !== key) return '↕';
        return sortConfig.direction === 'asc' ? '↑' : '↓';
    };

    const handleContextMenu = (e, orderId) => {
        e.preventDefault();
        setContextMenu({
            visible: true,
            x: e.pageX,
            y: e.pageY,
            orderId: orderId
        });
    };

    const handlePrintShippingLabel = (orderId) => {
        console.log(`Printing shipping label for order: ${orderId}`);
        alert(`Rozpoczęto drukowanie etykiety transportowej dla zamówienia: ${orderId}`);
    };

    const handleAddOrderToNexo = (orderId) => {
        console.log(`Adding order to Nexo: ${orderId}`);
        alert(`Rozpoczęto dodawanie zamówienia do Nexo: ${orderId}`);
    };

    const handlePrintPicklist = (orderId) => {
        console.log(`Printing picklist for order: ${orderId}`);
        alert(`Rozpoczęto drukowanie picklisty dla zamówienia: ${orderId}`);
    };

    const handleIssueInvoice = (orderId) => {
        console.log(`Issuing invoice for order: ${orderId}`);
        alert(`Rozpoczęto wystawianie faktury dla zamówienia: ${orderId}`);
    };

    const handleStatusDraftChange = (orderId, value) => {
        setStatusDrafts((current) => ({
            ...current,
            [orderId]: value,
        }));
    };

    const saveOrderStatus = async (orderId, nextStatusValue = statusDrafts[orderId] ?? '') => {
        const nextStatus = nextStatusValue.trim();
        const currentOrder = orders.find((order) => order.id === orderId);
        const currentStatus = (currentOrder?.status ?? '').trim();

        if (nextStatus === currentStatus) return;

        setSavingStatusId(orderId);
        try {
            const updated = await ordersAPI.updateOrderStatus(orderId, nextStatus);
            setOrders((current) => current.map((order) => (
                order.id === orderId
                    ? { ...order, status: updated.status }
                    : order
            )));
            setStatusDrafts((current) => ({
                ...current,
                [orderId]: updated.status,
            }));
            setError(null);
        } catch (err) {
            setError(err.message || 'Failed to save order status');
        } finally {
            setSavingStatusId(null);
        }
    };

    const handleStatusChange = async (orderId, value) => {
        handleStatusDraftChange(orderId, value);
        await saveOrderStatus(orderId, value);
    };

    useEffect(() => {
        const handleClick = () => {
            if (contextMenu.visible) {
                setContextMenu({ ...contextMenu, visible: false });
            }
        };
        document.addEventListener('click', handleClick);
        return () => {
            document.removeEventListener('click', handleClick);
        };
    }, [contextMenu.visible]);

    const handleRowClick = async (orderId) => {
        if (expandedOrderId === orderId) {
            setExpandedOrderId(null);
            return;
        }

        setExpandedOrderId(orderId);

        if (!orderDetails[orderId]) {
            setDetailsLoading(true);
            try {
                const details = await ordersAPI.getOrderDetails(orderId);
                setOrderDetails(prev => ({
                    ...prev,
                    [orderId]: details
                }));
            } catch (err) {
                console.error("Failed to fetch details:", err);
            } finally {
                setDetailsLoading(false);
            }
        }
    };

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                setLoading(true);
                const data = await ordersAPI.getOrders(10);
                setOrders(data);
                setStatusDrafts(Object.fromEntries(data.map((order) => [order.id, order.status ?? ''])));
                setError(null);
            } catch (err) {
                setError(err.message || 'Failed to fetch orders');
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, []);

    return (
        <div className="max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold text-slate-800 mb-6">
                {t(titleKey)}
            </h1>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                    {error}
                </div>
            )}

            <div className="card">
                {loading ? (
                    <div className="flex justify-center items-center h-32">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    </div>
                ) : orders.length === 0 ? (
                    <p className="text-slate-500">{t('orders.empty')}</p>
                ) : visibleOrders.length === 0 ? (
                    <p className="text-slate-500">{t('orders.noMatches')}</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b">
                                <tr>
                                    {columns.map((column) => (
                                        <th key={column.key} className={`px-4 py-3 align-top ${column.align === 'right' ? 'text-right' : ''}`}>
                                            <button
                                                type="button"
                                                className={`flex w-full items-center gap-2 font-semibold tracking-wide ${column.align === 'right' ? 'justify-end' : 'justify-between'}`}
                                                onClick={() => handleSort(column.key)}
                                            >
                                                <span>{column.label}</span>
                                                <span className="text-slate-400">{getSortIndicator(column.key)}</span>
                                            </button>
                                            <input
                                                type="text"
                                                value={filters[column.key]}
                                                onClick={(e) => e.stopPropagation()}
                                                onChange={(e) => handleFilterChange(column.key, e.target.value)}
                                                placeholder={t('orders.filterPlaceholder')}
                                                className="mt-2 w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-[11px] font-normal normal-case text-slate-700 shadow-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                                            />
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {visibleOrders.map((order) => (
                                    <React.Fragment key={order.id}>
                                        <tr
                                            className="bg-white border-b hover:bg-slate-50 cursor-pointer"
                                            onClick={() => handleRowClick(order.id)}
                                            onContextMenu={(e) => handleContextMenu(e, order.id)}
                                        >
                                            <td className="px-6 py-4 font-medium" style={{ whiteSpace: 'nowrap' }}>{order.id}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${order.source === 'Baselinker' ? 'bg-indigo-100 text-indigo-800' :
                                                        order.source === 'WooCommerce' ? 'bg-purple-100 text-purple-800' :
                                                            order.source === 'Shopify' ? 'bg-emerald-100 text-emerald-800' :
                                                                order.source === 'Magento' ? 'bg-orange-100 text-orange-800' :
                                                                    order.source === 'Nexo' ? 'bg-cyan-100 text-cyan-800' :
                                                            'bg-pink-100 text-pink-800'
                                                    }`}>
                                                    {order.source}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">{order.reference}</td>
                                            <td className={`px-6 py-4 ${isNumericLike(order.id_customer) ? 'text-right tabular-nums' : ''}`}>{order.id_customer}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right tabular-nums">
                                                {formatAmount(order.total_paid)}
                                            </td>
                                            <td className="px-6 py-4">{order.payment}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <select
                                                        value={statusDrafts[order.id] ?? ''}
                                                        onClick={(e) => e.stopPropagation()}
                                                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                                        className="w-40 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 shadow-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                                                    >
                                                        <option value="">{t('orders.statusPlaceholder')}</option>
                                                        {statusOptions.map((option) => (
                                                            <option key={option.value} value={option.value}>
                                                                {option.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    {savingStatusId === order.id && (
                                                        <span className="text-[11px] text-slate-500">{t('orders.statusSaving')}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">{order.date_add}</td>
                                        </tr>
                                        {expandedOrderId === order.id && (
                                            <tr className="bg-slate-50 border-b">
                                                <td colSpan="8" className="px-6 py-4 pb-6">
                                                    {detailsLoading && !orderDetails[order.id] ? (
                                                        <div className="flex items-center text-sm text-slate-500">
                                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 mr-2"></div>
                                                            {t('orders.detailsLoading')}
                                                        </div>
                                                    ) : orderDetails[order.id] && orderDetails[order.id].length > 0 ? (
                                                        <div className="pl-6 border-l-2 border-primary-500 my-2">
                                                            <table className="w-full text-sm text-left bg-white rounded-lg shadow-sm border border-slate-200">
                                                                <thead className="text-xs text-slate-600 bg-slate-100 border-b">
                                                                    <tr>
                                                                        <th className="px-4 py-2">ID</th>
                                                                        <th className="px-4 py-2">{t('orders.detailsProductName')}</th>
                                                                        <th className="px-4 py-2 text-right">{t('orders.detailsQuantity')}</th>
                                                                        <th className="px-4 py-2 text-right">{t('orders.detailsPrice')} (Netto)</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {orderDetails[order.id].map((item) => (
                                                                        <tr key={item.id} className="border-b last:border-b-0 hover:bg-slate-50">
                                                                            <td className="px-4 py-2">{item.product_id}</td>
                                                                            <td className="px-4 py-2 font-medium">{item.product_name}</td>
                                                                            <td className="px-4 py-2 text-right tabular-nums">{item.product_quantity}</td>
                                                                            <td className="px-4 py-2 tracking-wide font-mono whitespace-nowrap text-right tabular-nums">
                                                                                {formatAmount(item.product_price)}
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    ) : (
                                                        <div className="text-sm text-slate-500 italic pl-6">
                                                            Brak szczegółów zamówienia.
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {contextMenu.visible && (
                <div
                    className="absolute z-50 bg-white border border-slate-200 shadow-lg rounded-md py-1 min-w-[200px]"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                >
                    <button
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-primary-600 transition-colors flex items-center"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleAddOrderToNexo(contextMenu.orderId);
                            setContextMenu({ ...contextMenu, visible: false });
                        }}
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        {t('orders.addToNexo')}
                    </button>
                    <button
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-primary-600 transition-colors flex items-center"
                        onClick={(e) => {
                            e.stopPropagation();
                            handlePrintPicklist(contextMenu.orderId);
                            setContextMenu({ ...contextMenu, visible: false });
                        }}
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5h6m-6 4h6m-7 4h8m-9 4h10M7 3h10a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z" /></svg>
                        {t('orders.printPicklist')}
                    </button>
                    <button
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-primary-600 transition-colors flex items-center"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleIssueInvoice(contextMenu.orderId);
                            setContextMenu({ ...contextMenu, visible: false });
                        }}
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6M7 4h7l5 5v11a2 2 0 01-2 2H7a2 2 0 01-2-2V6a2 2 0 012-2z" /></svg>
                        {t('orders.issueInvoice')}
                    </button>
                    <button
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-primary-600 transition-colors flex items-center"
                        onClick={(e) => {
                            e.stopPropagation();
                            handlePrintShippingLabel(contextMenu.orderId);
                            setContextMenu({ ...contextMenu, visible: false });
                        }}
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                        {t('orders.createAndPrintShippingLabel')}
                    </button>
                    {/* Tutaj w przyszłości można dołożyć więcej opcji klikając prawym przyciskiem myszy */}
                </div>
            )}
        </div>
    );
}

export default OrdersPage;
