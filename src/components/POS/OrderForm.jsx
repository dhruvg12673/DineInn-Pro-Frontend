import React from 'react';

const mockMenu = [
    {
      category: 'Appetizers',
      items: [
        { id: 1, name: 'Bruschetta', price: '8.99' },
        { id: 2, name: 'Calamari', price: '12.50' },
      ],
    },
    {
      category: 'Main Courses',
      items: [
        { id: 3, name: 'Spaghetti Carbonara', price: '15.00' },
        { id: 4, name: 'Margherita Pizza', price: '14.00' },
      ],
    },
  ];

const OrderForm = ({ onAddToOrder }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Menu</h2>
      <div className="space-y-6">
        {mockMenu.map(category => (
          <div key={category.category}>
            <h3 className="text-xl font-semibold border-b-2 border-teal-500 pb-2 mb-4">{category.category}</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {category.items.map(item => (
                <button
                  key={item.id}
                  onClick={() => onAddToOrder(item)}
                  className="bg-gray-200 hover:bg-teal-200 p-4 rounded-lg text-center"
                >
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-sm text-gray-600">${item.price}</p>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderForm; 