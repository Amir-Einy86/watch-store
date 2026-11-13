// Product model: name, description, price, category (men/women/smart), strapType (leather/steel), image.
// Product model (Mongoose). A "model" = a schema (the shape + rules of one document)
// turned into a class that talks to the "products" collection.
const mongoose = require('mongoose');

const CATEGORIES = ['men', 'women', 'smart'];
const STRAP_TYPES = ['leather', 'steel', 'silicone', 'fabric'];

const productSchema = new mongoose.Schema(
  {
    // URL-friendly unique name, e.g. "men-rolex-submariner". Used in product page links.
    slug: {
      type: String,
      required: [true, 'slug is required'],
      unique: true, // creates a unique index: two products can never share a slug
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug may contain only a-z, 0-9 and "-"'],
    },
    name: { type: String, required: [true, 'name is required'], trim: true, maxlength: 120 },
    // Smart watches have no brand yet, so null is allowed.
    brand: { type: String, trim: true, maxlength: 60, default: null },
    category: {
      type: String,
      required: [true, 'category is required'],
      enum: { values: CATEGORIES, message: 'category must be one of: ' + CATEGORIES.join(', ') },
    },
    // Price in toman as a whole number (no decimals, so no rounding surprises).
    price: {
      type: Number,
      required: [true, 'price is required'],
      min: [0, 'price cannot be negative'],
      validate: { validator: Number.isInteger, message: 'price must be a whole number' },
    },
    // null = unknown / not applicable (smart watches).
    strapType: {
      type: String,
      enum: { values: STRAP_TYPES, message: 'strapType must be one of: ' + STRAP_TYPES.join(', ') },
      default: null,
    },
    // Path of the picture under /public, or null when there is no photo yet.
    image: { type: String, trim: true, default: null },
    description: { type: String, trim: true, maxlength: 2000, default: null },
    stock: {
      type: Number,
      required: [true, 'stock is required'],
      min: [0, 'stock cannot be negative'],
      validate: { validator: Number.isInteger, message: 'stock must be a whole number' },
    },
    // false = hidden from the shop (soft delete) but kept in the database.
    active: { type: Boolean, default: true },
  },
  {
    timestamps: true, // Mongoose adds createdAt and updatedAt by itself
    toJSON: {
      virtuals: true,
      // Shape of the JSON we will send to the browser later: "id" instead of "_id", no "__v".
      transform(doc, ret) {
        ret.id = String(ret._id);
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Computed on the fly, not stored in the database.
productSchema.virtual('inStock').get(function () {
  return this.stock > 0;
});

// Indexes that match the shop's queries (category page: filter by category, sort by price).
productSchema.index({ category: 1, active: 1, price: 1 });
productSchema.index({ category: 1, active: 1, strapType: 1, price: 1 });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
module.exports.CATEGORIES = CATEGORIES;
module.exports.STRAP_TYPES = STRAP_TYPES;
