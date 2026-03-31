import React from 'react';
import MenuItemCard from './MenuItemCard';

const MenuCategorySection = ({ category, items, isAdmin = false, onEdit }) => {
  return (
    <section className="mb-8">
      <h2 className="text-2xl font-bold border-b-2 border-teal-500 pb-2 mb-4 text-gray-800">
        {category}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <MenuItemCard key={item.id} item={item} isAdmin={isAdmin} onEdit={onEdit} />
        ))}
      </div>
    </section>
  );
};

export default MenuCategorySection; 