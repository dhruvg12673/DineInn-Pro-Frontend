import React from 'react';

const MenuItemCard = ({ item, isAdmin = false, onEdit }) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transform hover:scale-105 transition-transform duration-300 flex flex-col">
      <div className="p-6 flex-grow">
        <h3 className="text-xl font-semibold text-gray-800">{item.name}</h3>
        <p className="text-gray-600 mt-2">{item.description}</p>
        <p className="text-lg font-bold text-teal-600 mt-4">${item.price}</p>
      </div>
      {isAdmin && (
        <div className="bg-gray-50 p-4 flex justify-end space-x-2">
          <button
            onClick={() => onEdit(item)}
            className="text-sm bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-1 px-3 rounded"
          >
            Edit
          </button>
          <button className="text-sm bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded">
            Delete
          </button>
        </div>
      )}
    </div>
  );
};

export default MenuItemCard; 