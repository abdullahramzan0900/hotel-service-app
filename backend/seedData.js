import bcrypt from 'bcryptjs';
import MenuItem from './models/MenuItem.js';
import AdminUser from './models/AdminUser.js';

// Safe to call every time the server starts - it only creates data
// if the relevant collection is empty, so it never duplicates or
// overwrites anything on later restarts.
export async function autoSeed() {
  // --- Admin user ---
  const adminCount = await AdminUser.countDocuments();
  if (adminCount === 0) {
    const passwordHash = await bcrypt.hash(process.env.ADMIN_DEFAULT_PASSWORD || 'admin123', 10);
    await AdminUser.create({
      username: process.env.ADMIN_DEFAULT_USERNAME || 'admin',
      passwordHash,
      role: 'admin'
    });
    console.log(`[seed] Created admin user: ${process.env.ADMIN_DEFAULT_USERNAME || 'admin'} / ${process.env.ADMIN_DEFAULT_PASSWORD || 'admin123'}`);
  }

  // --- Rooms ---
  // Intentionally NOT auto-created. Staff add real rooms one by one from the
  // admin dashboard's Rooms page - each gets its own permanent QR token at
  // that point. See routes/admin.js POST /rooms and DELETE /rooms/:id.

  // --- Menu items (from the hotel's actual printed menu) ---
  const menuCount = await MenuItem.countDocuments();
  if (menuCount === 0) {
    const items = [
      // Starters / Menu
      {
        name: 'Vegetable Samosa (2 pcs)',
        description: 'Mediterranean filo pastry parcels filled with spiced potatoes & green peas. (V)',
        price: 4.99,
        category: 'Starters'
      },
      {
        name: 'Fish & Chips',
        description: 'Fresh cod fish marinated in a perfect blend of spices & lemon, coated with a light batter & crispy fried. Served with fries. (G)(SV)(D)(F)',
        price: 9.99,
        category: 'Starters'
      },

      // Pizza
      { name: 'Vegetarian Pizza', description: '12" pizza served with a soft drink.', price: 9.99, category: 'Pizza' },
      { name: 'BBQ Chicken Tikka Pizza', description: '12" pizza served with a soft drink.', price: 9.99, category: 'Pizza' },
      { name: 'Margarita Pizza', description: '12" pizza served with a soft drink.', price: 9.99, category: 'Pizza' },
      { name: 'Spicy Beef Pizza', description: '12" pizza served with a soft drink.', price: 9.99, category: 'Pizza' },
      { name: 'Meat Feast Pizza', description: '12" pizza served with a soft drink.', price: 9.99, category: 'Pizza' },

      // Kids Meal
      { name: 'Chicken Nuggets', description: '', price: 3.99, category: 'Kids Meal' },
      { name: 'Fish Fingers', description: '', price: 3.99, category: 'Kids Meal' },
      { name: 'Fries', description: '', price: 2.99, category: 'Kids Meal' },
      { name: 'Kids Meal', description: 'Fries, nuggets & choice of soft drink.', price: 6.99, category: 'Kids Meal' },

      // Soft Drinks
      { name: 'Coke', description: '', price: 1.5, category: 'Soft Drinks' },
      { name: '7up', description: '', price: 1.5, category: 'Soft Drinks' },
      { name: 'Diet Coke', description: '', price: 1.5, category: 'Soft Drinks' },
      { name: 'Water', description: '', price: 1.5, category: 'Soft Drinks' },

      // Chicken Dishes (Meal Deal: chicken or veg dish with rice, nan & drink - £12.00)
      {
        name: 'Chicken Jalfrezi',
        description: 'A delicious dish that incorporates capsicum/bell peppers with onions, tomatoes and boneless chicken cubes in a spicy and aromatic gravy.',
        price: 9.99,
        category: 'Chicken Dishes'
      },
      {
        name: 'Balti Chicken',
        description: 'Chicken cooked in an exotic collection of fresh spices and herbs. Balti sauce is based on garlic and onions, with turmeric and garam masala.',
        price: 9.99,
        category: 'Chicken Dishes'
      },
      {
        name: 'Butter Chicken',
        description: 'Chicken pieces simmered to succulence in a mild gravy, enriched with butter (makhni), cream & aromatically spiced with cardamom and cinnamon. (D)',
        price: 9.99,
        category: 'Chicken Dishes'
      },
      {
        name: 'Chicken Korma',
        description: 'This luscious Mughlai dish contains boneless chicken pieces braised with curd, cream, nuts and spices to produce a thick sauce full of flavours. (D)(N)',
        price: 9.99,
        category: 'Chicken Dishes'
      },
      {
        name: 'Chicken Tikka Masala',
        description: 'Chicken breast pieces marinated in yoghurt, herbs and spices, barbecued and then cooked in karahi curry. (D)',
        price: 10.99,
        category: 'Chicken Dishes'
      },

      // Vegetarian Dishes
      {
        name: 'Tarka Daal',
        description: 'Traditional yellow lentil flavoured with crisply fried garlic & onion (the tarka), tempered with asafoetida & cumin. (V)',
        price: 6.99,
        category: 'Vegetarian Dishes'
      },

      // Complimentary Sides (choose any two with meal deal)
      { name: 'Plain Rice', description: '', price: 2.99, category: 'Sides' },
      { name: 'Nan Bread', description: '', price: 1.5, category: 'Sides' },
      { name: 'Garlic Nan', description: '', price: 1.99, category: 'Sides' }
    ];
    await MenuItem.insertMany(items.map((i) => ({ ...i, imageUrl: '', available: true })));
    console.log(`[seed] Created ${items.length} menu items.`);
  }
}
