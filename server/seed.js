import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/industrial_core';

// ── Import Models ──
import Product from './models/Product.js';
import User from './models/User.js';
import Coupon from './models/Coupon.js';

const sampleProducts = [
  {
    name: 'Executive Office Table',
    sku: 'JE-OT-001',
    category: 'Office Tables',
    price: 12999,
    originalPrice: 15999,
    image: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=600',
    description: 'Premium executive office table with sturdy steel frame, spacious drawer unit, and elegant wood-finish laminate top. Perfect for corporate offices.',
    stock: 35,
    tags: ['office', 'table', 'executive', 'desk', 'corporate'],
    rating: 4.5,
    numReviews: 12,
    views: 340,
    purchaseCount: 89,
    isFeatured: true,
    specifications: new Map([
      ['Material', 'Engineered Wood + Steel Frame'],
      ['Dimensions', '150cm × 75cm × 75cm'],
      ['Weight', '38 kg'],
      ['Color', 'Walnut / Dark Oak'],
      ['Drawers', '3 Lockable Drawers'],
      ['Warranty', '5 Years']
    ])
  },
  {
    name: 'Student Study Table',
    sku: 'JE-ST-001',
    category: 'Study Tables',
    price: 4500,
    originalPrice: 5999,
    image: 'https://images.unsplash.com/photo-1611269154421-4e27233ac5c7?w=600',
    description: 'Compact and ergonomic study table with bookshelf attachment. Ideal for students and home offices.',
    stock: 60,
    tags: ['study', 'table', 'student', 'home', 'compact'],
    rating: 4.3,
    numReviews: 20,
    views: 520,
    purchaseCount: 150,
    isFeatured: true,
    specifications: new Map([
      ['Material', 'MDF Board + Steel Legs'],
      ['Dimensions', '100cm × 50cm × 75cm'],
      ['Shelf', 'Integrated Bookshelf'],
      ['Assembly', 'Easy DIY Assembly'],
      ['Color', 'White / Maple'],
      ['Warranty', '2 Years']
    ])
  },
  {
    name: 'Premium Executive Chair',
    sku: 'JE-OC-001',
    category: 'Office Chairs',
    price: 8999,
    originalPrice: 11999,
    image: 'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=600',
    description: 'High-back executive chair with breathable mesh, lumbar support, adjustable armrests, and chrome base. Engineered for all-day comfort.',
    stock: 25,
    tags: ['chair', 'office', 'executive', 'ergonomic', 'mesh'],
    rating: 4.7,
    numReviews: 18,
    views: 680,
    purchaseCount: 200,
    isFeatured: true,
    specifications: new Map([
      ['Material', 'Mesh Back + PU Leather Seat'],
      ['Max Load', '150 kg'],
      ['Adjustable Height', '42cm - 52cm'],
      ['Armrests', 'Adjustable 3D'],
      ['Base', 'Chrome Star Base'],
      ['Warranty', '3 Years']
    ])
  },
  {
    name: 'Steel Almirah 3-Door',
    sku: 'JE-SA-001',
    category: 'Steel Almirahs',
    price: 14999,
    originalPrice: 18999,
    image: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=600',
    description: 'Heavy-duty 3-door steel almirah with mirror, safe locker, and anti-rust powder coating. Perfect for bedroom and office storage.',
    stock: 18,
    tags: ['almirah', 'steel', 'storage', 'cupboard', 'locker'],
    rating: 4.6,
    numReviews: 15,
    views: 410,
    purchaseCount: 120,
    isFeatured: true,
    specifications: new Map([
      ['Material', 'Grade-A Cold Rolled Steel'],
      ['Dimensions', '180cm × 120cm × 55cm'],
      ['Doors', '3 Doors with Mirror'],
      ['Lock', '3-Point Locking System'],
      ['Shelves', '4 Adjustable + 2 Fixed'],
      ['Warranty', '10 Years']
    ])
  },
  {
    name: 'Wooden Almirah Classic',
    sku: 'JE-WA-001',
    category: 'Wooden Almirahs',
    price: 22000,
    originalPrice: 27999,
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600',
    description: 'Handcrafted solid wood almirah with carved detailing, multiple storage zones, and premium polish finish.',
    stock: 8,
    tags: ['almirah', 'wooden', 'wardrobe', 'handcrafted', 'premium'],
    rating: 4.8,
    numReviews: 6,
    views: 280,
    purchaseCount: 45,
    isFeatured: true,
    specifications: new Map([
      ['Material', 'Solid Sheesham Wood'],
      ['Dimensions', '190cm × 110cm × 60cm'],
      ['Finish', 'Honey / Walnut Polish'],
      ['Hanging Space', 'Full-Length Rod'],
      ['Drawers', '4 Bottom Drawers'],
      ['Warranty', '8 Years']
    ])
  },
  {
    name: 'Storage Cabinet Metal',
    sku: 'JE-SC-001',
    category: 'Storage Cabinets',
    price: 9800,
    originalPrice: 12000,
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600',
    description: 'Multi-purpose metal storage cabinet with adjustable shelves and key lock. Fire-resistant coating for industrial use.',
    stock: 30,
    tags: ['cabinet', 'storage', 'metal', 'industrial', 'fire-resistant'],
    rating: 4.4,
    numReviews: 10,
    views: 300,
    purchaseCount: 85,
    isFeatured: false,
    specifications: new Map([
      ['Material', 'Heavy Gauge Steel'],
      ['Fire Rating', '1 Hour Fire Resistant'],
      ['Lock', 'Dual Key Lock System'],
      ['Shelves', '4 Adjustable'],
      ['Dimensions', '180cm × 90cm × 45cm'],
      ['Warranty', '5 Years']
    ])
  },
  {
    name: 'Plastic Visitor Chair',
    sku: 'JE-PC-001',
    category: 'Plastic Chairs',
    price: 899,
    originalPrice: 1299,
    image: 'https://images.unsplash.com/photo-1503602642458-232111445657?w=600',
    description: 'Lightweight and stackable plastic visitor chair with steel legs. Available in multiple colors. Ideal for events, offices, and canteens.',
    stock: 200,
    tags: ['chair', 'plastic', 'visitor', 'stackable', 'lightweight'],
    rating: 4.0,
    numReviews: 35,
    views: 800,
    purchaseCount: 500,
    isFeatured: false,
    specifications: new Map([
      ['Material', 'Virgin PP Plastic + Steel Legs'],
      ['Max Load', '120 kg'],
      ['Stackable', 'Up to 10 chairs'],
      ['Colors', 'Red, Blue, Black, White'],
      ['Weight', '3.5 kg'],
      ['Warranty', '1 Year']
    ])
  },
  {
    name: 'Wooden Dining Chair',
    sku: 'JE-WC-001',
    category: 'Wooden Chairs',
    price: 3500,
    originalPrice: 4500,
    image: 'https://images.unsplash.com/photo-1551298370-9d3d53740c72?w=600',
    description: 'Elegant solid wood dining chair with cushioned seat and ergonomic backrest. Set of 2 available.',
    stock: 40,
    tags: ['chair', 'wooden', 'dining', 'home', 'cushioned'],
    rating: 4.5,
    numReviews: 14,
    views: 350,
    purchaseCount: 95,
    isFeatured: false,
    specifications: new Map([
      ['Material', 'Solid Mango Wood'],
      ['Seat', 'Foam Cushion with Fabric'],
      ['Max Load', '130 kg'],
      ['Finish', 'Natural / Walnut'],
      ['Height', '90cm'],
      ['Warranty', '3 Years']
    ])
  },
  {
    name: 'School Bench 3-Seater',
    sku: 'JE-SF-001',
    category: 'School Furniture',
    price: 3200,
    originalPrice: 3999,
    image: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=600',
    description: 'Durable 3-seater school bench with integrated desk. Anti-corrosion powder-coated steel frame and laminated plywood surface.',
    stock: 100,
    tags: ['school', 'bench', 'desk', 'classroom', 'education'],
    rating: 4.2,
    numReviews: 22,
    views: 450,
    purchaseCount: 300,
    isFeatured: true,
    specifications: new Map([
      ['Material', 'Steel Frame + Laminated Plywood'],
      ['Seating', '3 Students'],
      ['Dimensions', '120cm × 40cm × 75cm'],
      ['Finish', 'Powder Coated'],
      ['Foldable', 'No'],
      ['Warranty', '5 Years']
    ])
  },
  {
    name: 'Home Bookshelf Ladder',
    sku: 'JE-HF-001',
    category: 'Home Furniture',
    price: 5500,
    originalPrice: 6999,
    image: 'https://images.unsplash.com/photo-1594620302200-9a762244a156?w=600',
    description: 'Modern ladder-style bookshelf with 5 tiers. Metal frame with wooden shelves. Perfect for living rooms and bedrooms.',
    stock: 22,
    tags: ['bookshelf', 'home', 'ladder', 'modern', 'storage'],
    rating: 4.6,
    numReviews: 9,
    views: 290,
    purchaseCount: 60,
    isFeatured: false,
    specifications: new Map([
      ['Material', 'Metal Frame + Engineered Wood'],
      ['Tiers', '5 Open Tiers'],
      ['Max Load', '40 kg per tier'],
      ['Dimensions', '170cm × 60cm × 35cm'],
      ['Assembly', 'Easy DIY Assembly'],
      ['Warranty', '2 Years']
    ])
  },
  {
    name: 'Executive Conference Table',
    sku: 'JE-ET-001',
    category: 'Executive Tables',
    price: 35000,
    originalPrice: 42000,
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600',
    description: 'Premium 8-seater conference table with cable management, premium veneer finish, and chrome accents. Ideal for boardrooms.',
    stock: 5,
    tags: ['table', 'conference', 'executive', 'boardroom', 'premium'],
    rating: 4.9,
    numReviews: 4,
    views: 200,
    purchaseCount: 15,
    isFeatured: true,
    specifications: new Map([
      ['Material', 'Premium Veneer + Steel Base'],
      ['Seating', '8-10 People'],
      ['Dimensions', '240cm × 120cm × 75cm'],
      ['Cable Mgmt', 'Built-in Cable Tray + Power Outlets'],
      ['Finish', 'High Gloss Walnut'],
      ['Warranty', '5 Years']
    ])
  },
  {
    name: 'Modular Filing Cabinet',
    sku: 'JE-SC-002',
    category: 'Storage Cabinets',
    price: 6800,
    originalPrice: 8500,
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600',
    description: 'Compact 4-drawer filing cabinet with anti-tilt mechanism and central locking. Wheels for easy mobility.',
    stock: 45,
    tags: ['cabinet', 'filing', 'office', 'mobile', 'drawers'],
    rating: 4.3,
    numReviews: 11,
    views: 310,
    purchaseCount: 70,
    isFeatured: false,
    specifications: new Map([
      ['Material', 'Cold Rolled Steel'],
      ['Drawers', '4 Full Extension'],
      ['Lock', 'Central Lock System'],
      ['Anti-Tilt', 'Yes - Single Drawer Opening'],
      ['Wheels', '4 Castor Wheels'],
      ['Warranty', '3 Years']
    ])
  }
];

const sampleCoupons = [
  {
    code: 'WELCOME10',
    description: 'First order 10% off',
    discountType: 'percentage',
    discountValue: 10,
    minOrderAmount: 2000,
    maxDiscountAmount: 2000,
    maxUses: 0,
    expiresAt: new Date('2027-12-31'),
    isActive: true
  },
  {
    code: 'FLAT500',
    description: 'Flat ₹500 off on orders above ₹5000',
    discountType: 'flat',
    discountValue: 500,
    minOrderAmount: 5000,
    maxUses: 100,
    expiresAt: new Date('2027-06-30'),
    isActive: true
  },
  {
    code: 'BULK20',
    description: '20% off on bulk orders above ₹50,000',
    discountType: 'percentage',
    discountValue: 20,
    minOrderAmount: 50000,
    maxDiscountAmount: 15000,
    maxUses: 50,
    expiresAt: new Date('2027-12-31'),
    isActive: true
  }
];

const seedDatabase = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await Product.deleteMany({});
    await Coupon.deleteMany({});
    console.log('Cleared old products and coupons');

    // Seed products
    await Product.insertMany(sampleProducts);
    console.log(`✅ Seeded ${sampleProducts.length} products`);

    // Seed coupons
    await Coupon.insertMany(sampleCoupons);
    console.log(`✅ Seeded ${sampleCoupons.length} coupons`);

    // Ensure admin user exists
    const existingAdmin = await User.findOne({ email: 'admin@jagannath.com' });
    if (!existingAdmin) {
      await User.create({
        name: 'Admin',
        email: 'admin@jagannath.com',
        password: 'admin123',
        phone: '+91 98100 12345',
        role: 'admin'
      });
      console.log('✅ Created admin user (admin@jagannath.com / admin123)');
    } else {
      existingAdmin.role = 'admin';
      existingAdmin.password = 'admin123';
      await existingAdmin.save();
      console.log('✅ Updated existing admin user');
    }

    // Create demo user
    const existingUser = await User.findOne({ email: 'demo@test.com' });
    if (!existingUser) {
      await User.create({
        name: 'Demo User',
        email: 'demo@test.com',
        password: 'demo123',
        phone: '+91 99999 88888',
        role: 'user',
        addresses: [{
          label: 'Home',
          fullName: 'Demo User',
          phone: '+91 99999 88888',
          street: '123, Main Road, Sector 14',
          city: 'New Delhi',
          state: 'Delhi',
          pincode: '110020',
          isDefault: true
        }]
      });
      console.log('✅ Created demo user (demo@test.com / demo123)');
    }

    console.log('\n🎉 Database seeded successfully!');
    process.exit();
  } catch (err) {
    console.error('❌ Seeding Error:', err);
    process.exit(1);
  }
};

seedDatabase();
