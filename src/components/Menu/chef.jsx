import React, { useState, useEffect } from 'react';
import { Search, Clock, User, MapPin } from 'lucide-react';

const ChefOrderDashboard = () => {
  const [orders, setOrders] = useState([
    {
      id: 1,
      tableNumber: 'T3',
      waiterName: 'Ethan',
      items: [
        { name: 'Chicken Salad', quantity: 2 },
        { name: 'Veggie Burger', quantity: 1 },
        { name: 'Fries', quantity: 3 }
      ],
      placedTime: new Date(Date.now() - 45 * 60000), // 45 minutes ago
      status: 'pending',
      acceptedTime: null,
      servedTime: null
    },
    {
      id: 2,
      tableNumber: 'Guest',
      waiterName: null,
      items: [
        { name: 'Pasta Carbonara', quantity: 1 },
        { name: 'Iced Tea', quantity: 2 }
      ],
      placedTime: new Date(Date.now() - 20 * 60000), // 20 minutes ago
      status: 'accepted',
      acceptedTime: new Date(Date.now() - 15 * 60000),
      servedTime: null
    },
    {
      id: 3,
      tableNumber: 'T7',
      waiterName: 'Olivia',
      items: [
        { name: 'Grilled Salmon', quantity: 1 },
        { name: 'Caesar Salad', quantity: 1 },
        { name: 'Garlic Bread', quantity: 2 }
      ],
      placedTime: new Date(Date.now() - 35 * 60000), // 35 minutes ago
      status: 'preparing',
      acceptedTime: new Date(Date.now() - 30 * 60000),
      servedTime: null
    },
    {
      id: 4,
      tableNumber: 'T12',
      waiterName: 'Marcus',
      items: [
        { name: 'Margherita Pizza', quantity: 1 },
        { name: 'Soft Drink', quantity: 2 }
      ],
      placedTime: new Date(Date.now() - 90 * 60000), // 90 minutes ago
      status: 'served',
      acceptedTime: new Date(Date.now() - 85 * 60000),
      servedTime: new Date(Date.now() - 10 * 60000)
    }
  ]);

  const [filters, setFilters] = useState({
    status: 'all',
    table: '',
    waiter: '',
    search: ''
  });

  const [timers, setTimers] = useState({});

  useEffect(() => {
    const interval = setInterval(() => {
      setTimers(prev => {
        const newTimers = {};
        orders.forEach(order => {
          if (order.status === 'accepted' || order.status === 'preparing') {
            const startTime = order.acceptedTime || order.placedTime;
            const elapsed = Math.floor((Date.now() - startTime.getTime()) / 1000);
            newTimers[order.id] = elapsed;
          }
        });
        return newTimers;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [orders]);

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'accepted': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'preparing': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'served': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'accepted': return 'Accepted';
      case 'preparing': return 'Preparing';
      case 'served': return 'Prepared & Served';
      default: return status;
    }
  };

  const updateOrderStatus = (orderId, newStatus) => {
    setOrders(prevOrders => 
      prevOrders.map(order => {
        if (order.id === orderId) {
          const updatedOrder = { ...order, status: newStatus };
          
          if (newStatus === 'accepted' && !order.acceptedTime) {
            updatedOrder.acceptedTime = new Date();
          } else if (newStatus === 'served') {
            updatedOrder.servedTime = new Date();
          }
          
          return updatedOrder;
        }
        return order;
      })
    );
  };

  const filteredOrders = orders.filter(order => {
    if (filters.status !== 'all' && order.status !== filters.status) return false;
    if (filters.table && !order.tableNumber.toLowerCase().includes(filters.table.toLowerCase())) return false;
    if (filters.waiter && (!order.waiterName || !order.waiterName.toLowerCase().includes(filters.waiter.toLowerCase()))) return false;
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      const matchesItems = order.items.some(item => item.name.toLowerCase().includes(searchTerm));
      const matchesTable = order.tableNumber.toLowerCase().includes(searchTerm);
      const matchesWaiter = order.waiterName && order.waiterName.toLowerCase().includes(searchTerm);
      if (!matchesItems && !matchesTable && !matchesWaiter) return false;
    }
    return true;
  });

  const sortedOrders = filteredOrders.sort((a, b) => b.placedTime - a.placedTime);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            🧾 Kitchen Order Dashboard
          </h1>
          <p className="text-gray-600">Manage and track restaurant orders in real-time</p>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="lg:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search orders, items, table..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              />
            </div>

            {/* Status Filter */}
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="preparing">Preparing</option>
              <option value="served">Served</option>
            </select>

            {/* Table Filter */}
            <input
              type="text"
              placeholder="Filter by table"
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filters.table}
              onChange={(e) => setFilters(prev => ({ ...prev, table: e.target.value }))}
            />

            {/* Waiter Filter */}
            <input
              type="text"
              placeholder="Filter by waiter"
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filters.waiter}
              onChange={(e) => setFilters(prev => ({ ...prev, waiter: e.target.value }))}
            />
          </div>
        </div>

        {/* Orders Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {sortedOrders.map(order => (
            <div key={order.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              {/* Order Header */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="font-semibold text-lg text-gray-900">
                      {order.tableNumber === 'Guest' ? 'Guest Order' : `Table ${order.tableNumber}`}
                    </span>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                    {getStatusText(order.status)}
                  </span>
                </div>
                
                {order.waiterName && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User className="w-4 h-4" />
                    <span>Waiter: {order.waiterName}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                  <Clock className="w-4 h-4" />
                  <span>Placed: {formatTime(order.placedTime)}</span>
                </div>

                {/* Timer for active orders */}
                {(order.status === 'accepted' || order.status === 'preparing') && timers[order.id] && (
                  <div className="flex items-center gap-2 text-sm font-medium text-blue-600 mt-2 bg-blue-50 px-2 py-1 rounded">
                    <Clock className="w-4 h-4" />
                    <span>Prep Time: {formatTimer(timers[order.id])}</span>
                  </div>
                )}
              </div>

              {/* Order Items */}
              <div className="p-4">
                <h4 className="font-medium text-gray-900 mb-3">Order Items:</h4>
                <ul className="space-y-2 mb-4">
                  {order.items.map((item, index) => (
                    <li key={index} className="flex justify-between items-center text-sm">
                      <span className="text-gray-700">{item.name}</span>
                      <span className="font-medium text-gray-900 bg-gray-100 px-2 py-1 rounded">
                        ×{item.quantity}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* Action Buttons */}
                <div className="flex gap-2 flex-wrap">
                  {order.status === 'pending' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'accepted')}
                      className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                      Accept Order
                    </button>
                  )}
                  
                  {order.status === 'accepted' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'preparing')}
                      className="flex-1 bg-yellow-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-yellow-700 transition-colors"
                    >
                      Mark Preparing
                    </button>
                  )}
                  
                  {order.status === 'preparing' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'served')}
                      className="flex-1 bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                    >
                      Mark Prepared & Served
                    </button>
                  )}

                  {order.status === 'served' && order.servedTime && (
                    <div className="w-full text-center text-sm text-green-600 font-medium bg-green-50 py-2 rounded-lg">
                      ✓ Served at {formatTime(order.servedTime)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {sortedOrders.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🧾</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-600">Try adjusting your filters or search terms</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChefOrderDashboard;