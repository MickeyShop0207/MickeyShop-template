/**
 * 商品相關表結構定義
 * 統一商品管理系統標準化實現
 */

import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'
import { relations } from 'drizzle-orm'

// ============ 商品分類表 ============
export const productCategories = sqliteTable('product_categories', {
  categoryId: text('category_id').primaryKey(),
  parentId: text('parent_id'),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  image: text('image'),
  icon: text('icon'),
  sortOrder: integer('sort_order').default(0),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  seoTitle: text('seo_title'),
  seoDescription: text('seo_description'),
  seoKeywords: text('seo_keywords'),
  metadata: text('metadata', { mode: 'json' }),
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updated_at').default(sql`(CURRENT_TIMESTAMP)`)
}, (table) => ({
  parentIdx: index('idx_product_categories_parent').on(table.parentId),
  slugIdx: index('idx_product_categories_slug').on(table.slug),
  activeIdx: index('idx_product_categories_active').on(table.isActive),
  sortOrderIdx: index('idx_product_categories_sort_order').on(table.sortOrder)
}))

// ============ 商品品牌表 ============
export const productBrands = sqliteTable('product_brands', {
  brandId: text('brand_id').primaryKey(),
  name: text('name').notNull().unique(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  logo: text('logo'),
  website: text('website'),
  country: text('country'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  featured: integer('featured', { mode: 'boolean' }).default(false),
  sortOrder: integer('sort_order').default(0),
  seoTitle: text('seo_title'),
  seoDescription: text('seo_description'),
  metadata: text('metadata', { mode: 'json' }),
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updated_at').default(sql`(CURRENT_TIMESTAMP)`)
}, (table) => ({
  slugIdx: index('idx_product_brands_slug').on(table.slug),
  activeIdx: index('idx_product_brands_active').on(table.isActive),
  featuredIdx: index('idx_product_brands_featured').on(table.featured),
  sortOrderIdx: index('idx_product_brands_sort_order').on(table.sortOrder)
}))

// ============ 商品主表 ============
export const products = sqliteTable('products', {
  productId: text('product_id').primaryKey(),
  sku: text('sku').notNull().unique(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  shortDescription: text('short_description'),
  description: text('description'),
  brandId: text('brand_id'),
  categoryId: text('category_id'),
  type: text('type').notNull().default('simple'), // simple, variable, grouped, external
  status: text('status').notNull().default('draft'), // draft, published, archived, deleted
  visibility: text('visibility').notNull().default('visible'), // visible, hidden, catalog, search
  featured: integer('featured', { mode: 'boolean' }).default(false),
  virtual: integer('virtual', { mode: 'boolean' }).default(false),
  downloadable: integer('downloadable', { mode: 'boolean' }).default(false),
  price: real('price').notNull().default(0),
  salePrice: real('sale_price'),
  saleStart: text('sale_start'),
  saleEnd: text('sale_end'),
  costPrice: real('cost_price').default(0),
  weight: real('weight'),
  dimensions: text('dimensions', { mode: 'json' }), // {length, width, height}
  shippingClass: text('shipping_class'),
  taxStatus: text('tax_status').default('taxable'), // taxable, none
  taxClass: text('tax_class'),
  stockQuantity: integer('stock_quantity').default(0),
  stockStatus: text('stock_status').default('instock'), // instock, outofstock, onbackorder
  backorders: text('backorders').default('no'), // no, notify, yes
  lowStockThreshold: integer('low_stock_threshold').default(5),
  manageStock: integer('manage_stock', { mode: 'boolean' }).default(true),
  soldIndividually: integer('sold_individually', { mode: 'boolean' }).default(false),
  purchaseNote: text('purchase_note'),
  menuOrder: integer('menu_order').default(0),
  reviewsAllowed: integer('reviews_allowed', { mode: 'boolean' }).default(true),
  averageRating: real('average_rating').default(0),
  ratingCount: integer('rating_count').default(0),
  totalSales: integer('total_sales').default(0),
  imageGallery: text('image_gallery', { mode: 'json' }), // Array of image URLs
  attributes: text('attributes', { mode: 'json' }), // Product attributes
  tags: text('tags', { mode: 'json' }), // Array of tags
  relatedProductIds: text('related_product_ids', { mode: 'json' }),
  crossSellIds: text('cross_sell_ids', { mode: 'json' }),
  upsellIds: text('upsell_ids', { mode: 'json' }),
  seoTitle: text('seo_title'),
  seoDescription: text('seo_description'),
  seoKeywords: text('seo_keywords'),
  metadata: text('metadata', { mode: 'json' }),
  createdBy: text('created_by'),
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
  updatedBy: text('updated_by'),
  updatedAt: text('updated_at').default(sql`(CURRENT_TIMESTAMP)`),
  deletedAt: text('deleted_at')
}, (table) => ({
  skuIdx: index('idx_products_sku').on(table.sku),
  slugIdx: index('idx_products_slug').on(table.slug),
  brandIdx: index('idx_products_brand').on(table.brandId),
  categoryIdx: index('idx_products_category').on(table.categoryId),
  typeIdx: index('idx_products_type').on(table.type),
  statusIdx: index('idx_products_status').on(table.status),
  visibilityIdx: index('idx_products_visibility').on(table.visibility),
  featuredIdx: index('idx_products_featured').on(table.featured),
  priceIdx: index('idx_products_price').on(table.price),
  stockStatusIdx: index('idx_products_stock_status').on(table.stockStatus),
  createdAtIdx: index('idx_products_created_at').on(table.createdAt),
  deletedAtIdx: index('idx_products_deleted_at').on(table.deletedAt),
  averageRatingIdx: index('idx_products_rating').on(table.averageRating),
  totalSalesIdx: index('idx_products_sales').on(table.totalSales)
}))

// ============ 商品變化版本表（適用於可變商品）============
export const productVariations = sqliteTable('product_variations', {
  variationId: text('variation_id').primaryKey(),
  parentId: text('parent_id').notNull(), // Reference to parent product
  sku: text('sku').notNull().unique(),
  price: real('price').notNull().default(0),
  salePrice: real('sale_price'),
  saleStart: text('sale_start'),
  saleEnd: text('sale_end'),
  stockQuantity: integer('stock_quantity').default(0),
  stockStatus: text('stock_status').default('instock'),
  backorders: text('backorders').default('no'),
  weight: real('weight'),
  dimensions: text('dimensions', { mode: 'json' }),
  image: text('image'),
  attributes: text('attributes', { mode: 'json' }), // Variation-specific attributes
  status: text('status').default('published'), // published, private, deleted
  menuOrder: integer('menu_order').default(0),
  metadata: text('metadata', { mode: 'json' }),
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updated_at').default(sql`(CURRENT_TIMESTAMP)`)
}, (table) => ({
  parentIdx: index('idx_product_variations_parent').on(table.parentId),
  skuIdx: index('idx_product_variations_sku').on(table.sku),
  priceIdx: index('idx_product_variations_price').on(table.price),
  stockStatusIdx: index('idx_product_variations_stock_status').on(table.stockStatus),
  statusIdx: index('idx_product_variations_status').on(table.status)
}))

// ============ 商品庫存歷史表 ============
export const productInventoryHistory = sqliteTable('product_inventory_history', {
  historyId: text('history_id').primaryKey(),
  productId: text('product_id').notNull(),
  variationId: text('variation_id'),
  type: text('type').notNull(), // stock_in, stock_out, adjustment, sale, return
  quantity: integer('quantity').notNull(),
  previousQuantity: integer('previous_quantity').notNull(),
  newQuantity: integer('new_quantity').notNull(),
  reason: text('reason'),
  referenceType: text('reference_type'), // order, adjustment, purchase, etc.
  referenceId: text('reference_id'),
  notes: text('notes'),
  createdBy: text('created_by'),
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`)
}, (table) => ({
  productIdx: index('idx_inventory_history_product').on(table.productId),
  variationIdx: index('idx_inventory_history_variation').on(table.variationId),
  typeIdx: index('idx_inventory_history_type').on(table.type),
  createdAtIdx: index('idx_inventory_history_created_at').on(table.createdAt),
  referenceIdx: index('idx_inventory_history_reference').on(table.referenceType, table.referenceId)
}))

// ============ 關聯定義 ============
export const productCategoriesRelations = relations(productCategories, ({ one, many }) => ({
  parent: one(productCategories, {
    fields: [productCategories.parentId],
    references: [productCategories.categoryId],
    relationName: 'parent'
  }),
  children: many(productCategories, { relationName: 'parent' }),
  products: many(products)
}))

export const productBrandsRelations = relations(productBrands, ({ many }) => ({
  products: many(products)
}))

export const productsRelations = relations(products, ({ one, many }) => ({
  brand: one(productBrands, {
    fields: [products.brandId],
    references: [productBrands.brandId]
  }),
  category: one(productCategories, {
    fields: [products.categoryId],
    references: [productCategories.categoryId]
  }),
  variations: many(productVariations),
  inventoryHistory: many(productInventoryHistory)
}))

export const productVariationsRelations = relations(productVariations, ({ one, many }) => ({
  parent: one(products, {
    fields: [productVariations.parentId],
    references: [products.productId]
  }),
  inventoryHistory: many(productInventoryHistory)
}))

export const productInventoryHistoryRelations = relations(productInventoryHistory, ({ one }) => ({
  product: one(products, {
    fields: [productInventoryHistory.productId],
    references: [products.productId]
  }),
  variation: one(productVariations, {
    fields: [productInventoryHistory.variationId],
    references: [productVariations.variationId]
  })
}))

// ============ 類型導出 ============
export type ProductCategory = typeof productCategories.$inferSelect
export type NewProductCategory = typeof productCategories.$inferInsert

export type ProductBrand = typeof productBrands.$inferSelect
export type NewProductBrand = typeof productBrands.$inferInsert

export type Product = typeof products.$inferSelect
export type NewProduct = typeof products.$inferInsert

export type ProductVariation = typeof productVariations.$inferSelect
export type NewProductVariation = typeof productVariations.$inferInsert

export type ProductInventoryHistory = typeof productInventoryHistory.$inferSelect
export type NewProductInventoryHistory = typeof productInventoryHistory.$inferInsert