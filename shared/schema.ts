import { pgTable, text, serial, integer, boolean, numeric, timestamp, varchar, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  user_id: serial("user_id").primaryKey(),
  full_name: varchar("full_name", { length: 100 }).notNull(),
  email: varchar("email", { length: 100 }).notNull().unique(),
  password_hash: varchar("password_hash", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  status: varchar("status", { length: 10 }).default("active").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  emailIdx: index("idx_users_email").on(table.email),
}));

export const pharmacies = pgTable("pharmacies", {
  pharmacy_id: serial("pharmacy_id").primaryKey(),
  pharmacy_name: varchar("pharmacy_name", { length: 150 }).notNull(),
  owner_name: varchar("owner_name", { length: 100 }),
  email: varchar("email", { length: 100 }).notNull().unique(),
  password_hash: varchar("password_hash", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  city: varchar("city", { length: 100 }),
  latitude: numeric("latitude", { precision: 10, scale: 7 }),
  longitude: numeric("longitude", { precision: 10, scale: 7 }),
  address: text("address"),
  opening_hours: varchar("opening_hours", { length: 255 }),
  license_no: varchar("license_no", { length: 50 }),
  rating_avg: numeric("rating_avg", { precision: 3, scale: 2 }).default("0.00"),
  status: varchar("status", { length: 10 }).default("active").notNull(),
  verified: boolean("verified").default(false),
  created_at: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  cityIdx: index("idx_pharmacies_city").on(table.city),
}));

export const orders = pgTable("orders", {
  order_id: serial("order_id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => users.user_id, { onDelete: "cascade" }),
  image_url: varchar("image_url", { length: 255 }).notNull(),
  description: text("description"),
  radius_km: numeric("radius_km", { precision: 5, scale: 2 }).default("5.00"),
  latitude: numeric("latitude", { precision: 10, scale: 7 }),
  longitude: numeric("longitude", { precision: 10, scale: 7 }),
  status: varchar("status", { length: 15 }).default("pending").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("idx_orders_user_id").on(table.user_id),
}));

export const bids = pgTable("bids", {
  bid_id: serial("bid_id").primaryKey(),
  order_id: integer("order_id").notNull().references(() => orders.order_id, { onDelete: "cascade" }),
  pharmacy_id: integer("pharmacy_id").notNull().references(() => pharmacies.pharmacy_id, { onDelete: "cascade" }),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  message: varchar("message", { length: 255 }),
  status: varchar("status", { length: 10 }).default("pending").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  orderIdx: index("idx_bids_order_id").on(table.order_id),
  pharmacyIdx: index("idx_bids_pharmacy_id").on(table.pharmacy_id),
}));

export const notifications = pgTable("notifications", {
  notification_id: serial("notification_id").primaryKey(),
  sender_id: integer("sender_id").notNull(),
  sender_type: varchar("sender_type", { length: 20 }).notNull(),
  receiver_id: integer("receiver_id").notNull(),
  receiver_type: varchar("receiver_type", { length: 20 }).notNull(),
  type: varchar("type", { length: 20 }).default("order").notNull(),
  message: text("message"),
  is_read: boolean("is_read").default(false),
  created_at: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  receiverIdx: index("idx_notifications_receiver").on(table.receiver_id),
}));

export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
}));

export const pharmaciesRelations = relations(pharmacies, ({ many }) => ({
  bids: many(bids),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.user_id],
    references: [users.user_id],
  }),
  bids: many(bids),
}));

export const bidsRelations = relations(bids, ({ one }) => ({
  order: one(orders, {
    fields: [bids.order_id],
    references: [orders.order_id],
  }),
  pharmacy: one(pharmacies, {
    fields: [bids.pharmacy_id],
    references: [pharmacies.pharmacy_id],
  }),
}));
