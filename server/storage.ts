import { db } from "./db.js";
import { users, pharmacies, orders, bids, notifications } from "../shared/schema.js";
import { eq, and, sql, desc, asc } from "drizzle-orm";

export const storage = {
  async createUser(userData) {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  },

  async getUserByEmail(email) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  },

  async getUserById(id) {
    const [user] = await db.select().from(users).where(eq(users.user_id, id));
    return user;
  },

  async createPharmacy(pharmacyData) {
    const [pharmacy] = await db.insert(pharmacies).values(pharmacyData).returning();
    return pharmacy;
  },

  async getPharmacyByEmail(email) {
    const [pharmacy] = await db.select().from(pharmacies).where(eq(pharmacies.email, email));
    return pharmacy;
  },

  async getPharmacyById(id) {
    const [pharmacy] = await db.select().from(pharmacies).where(eq(pharmacies.pharmacy_id, id));
    return pharmacy;
  },

  async getNearbyPharmacies(latitude, longitude, radiusKm) {
    const haversineQuery = sql`
      (6371 * acos(
        cos(radians(${latitude})) * cos(radians(CAST(${pharmacies.latitude} AS FLOAT))) *
        cos(radians(CAST(${pharmacies.longitude} AS FLOAT)) - radians(${longitude})) +
        sin(radians(${latitude})) * sin(radians(CAST(${pharmacies.latitude} AS FLOAT)))
      ))
    `;
    
    const nearbyPharmacies = await db
      .select({
        pharmacy_id: pharmacies.pharmacy_id,
        pharmacy_name: pharmacies.pharmacy_name,
        email: pharmacies.email,
        phone: pharmacies.phone,
        address: pharmacies.address,
        city: pharmacies.city,
        latitude: pharmacies.latitude,
        longitude: pharmacies.longitude,
        rating_avg: pharmacies.rating_avg,
        distance: haversineQuery,
      })
      .from(pharmacies)
      .where(
        and(
          eq(pharmacies.status, "active"),
          sql`${haversineQuery} <= ${radiusKm}`
        )
      )
      .orderBy(asc(haversineQuery));
    
    return nearbyPharmacies;
  },

  async createOrder(orderData) {
    const [order] = await db.insert(orders).values(orderData).returning();
    return order;
  },

  async getOrderById(orderId) {
    const [order] = await db.select().from(orders).where(eq(orders.order_id, orderId));
    return order;
  },

  async getOrdersByUserId(userId) {
    return db
      .select()
      .from(orders)
      .where(eq(orders.user_id, userId))
      .orderBy(desc(orders.created_at));
  },

  async getOrdersForPharmacy(pharmacyId) {
    const pharmacy = await this.getPharmacyById(pharmacyId);
    if (!pharmacy || !pharmacy.latitude || !pharmacy.longitude) {
      return [];
    }

    const lat = parseFloat(pharmacy.latitude);
    const lng = parseFloat(pharmacy.longitude);

    const haversineQuery = sql`
      (6371 * acos(
        cos(radians(${lat})) * cos(radians(CAST(${orders.latitude} AS FLOAT))) *
        cos(radians(CAST(${orders.longitude} AS FLOAT)) - radians(${lng})) +
        sin(radians(${lat})) * sin(radians(CAST(${orders.latitude} AS FLOAT)))
      ))
    `;

    return db
      .select({
        order_id: orders.order_id,
        user_id: orders.user_id,
        image_url: orders.image_url,
        description: orders.description,
        radius_km: orders.radius_km,
        latitude: orders.latitude,
        longitude: orders.longitude,
        status: orders.status,
        created_at: orders.created_at,
        distance: haversineQuery,
      })
      .from(orders)
      .where(
        and(
          sql`${orders.status} IN ('pending', 'bidding')`,
          sql`${haversineQuery} <= CAST(${orders.radius_km} AS FLOAT)`
        )
      )
      .orderBy(desc(orders.created_at));
  },

  async updateOrderStatus(orderId, status) {
    const [order] = await db
      .update(orders)
      .set({ status })
      .where(eq(orders.order_id, orderId))
      .returning();
    return order;
  },

  async createBid(bidData) {
    const [bid] = await db.insert(bids).values(bidData).returning();
    
    await db
      .update(orders)
      .set({ status: "bidding" })
      .where(eq(orders.order_id, bidData.order_id));
    
    return bid;
  },

  async getBidsByOrderId(orderId) {
    return db
      .select({
        bid_id: bids.bid_id,
        order_id: bids.order_id,
        pharmacy_id: bids.pharmacy_id,
        price: bids.price,
        message: bids.message,
        status: bids.status,
        created_at: bids.created_at,
        pharmacy_name: pharmacies.pharmacy_name,
        pharmacy_phone: pharmacies.phone,
        pharmacy_address: pharmacies.address,
        pharmacy_rating: pharmacies.rating_avg,
      })
      .from(bids)
      .leftJoin(pharmacies, eq(bids.pharmacy_id, pharmacies.pharmacy_id))
      .where(eq(bids.order_id, orderId))
      .orderBy(asc(bids.price));
  },

  async getBidsByPharmacyId(pharmacyId) {
    return db
      .select({
        bid_id: bids.bid_id,
        order_id: bids.order_id,
        pharmacy_id: bids.pharmacy_id,
        price: bids.price,
        message: bids.message,
        status: bids.status,
        created_at: bids.created_at,
        order_image: orders.image_url,
        order_description: orders.description,
        order_status: orders.status,
      })
      .from(bids)
      .leftJoin(orders, eq(bids.order_id, orders.order_id))
      .where(eq(bids.pharmacy_id, pharmacyId))
      .orderBy(desc(bids.created_at));
  },

  async updateBidStatus(bidId, status) {
    const [bid] = await db
      .update(bids)
      .set({ status })
      .where(eq(bids.bid_id, bidId))
      .returning();
    return bid;
  },

  async acceptBid(bidId) {
    const [bid] = await db
      .update(bids)
      .set({ status: "accepted" })
      .where(eq(bids.bid_id, bidId))
      .returning();
    
    if (bid) {
      await db
        .update(bids)
        .set({ status: "rejected" })
        .where(and(eq(bids.order_id, bid.order_id), sql`${bids.bid_id} != ${bidId}`));
      
      await db
        .update(orders)
        .set({ status: "completed" })
        .where(eq(orders.order_id, bid.order_id));
    }
    
    return bid;
  },

  async createNotification(notificationData) {
    const [notification] = await db.insert(notifications).values(notificationData).returning();
    return notification;
  },

  async getNotifications(receiverId, receiverType) {
    return db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.receiver_id, receiverId),
          eq(notifications.receiver_type, receiverType)
        )
      )
      .orderBy(desc(notifications.created_at));
  },

  async markNotificationRead(notificationId) {
    const [notification] = await db
      .update(notifications)
      .set({ is_read: true })
      .where(eq(notifications.notification_id, notificationId))
      .returning();
    return notification;
  },

  async markAllNotificationsRead(receiverId, receiverType) {
    await db
      .update(notifications)
      .set({ is_read: true })
      .where(
        and(
          eq(notifications.receiver_id, receiverId),
          eq(notifications.receiver_type, receiverType)
        )
      );
  },

  async getUnreadNotificationCount(receiverId, receiverType) {
    const result = await db
      .select({ count: sql`count(*)` })
      .from(notifications)
      .where(
        and(
          eq(notifications.receiver_id, receiverId),
          eq(notifications.receiver_type, receiverType),
          eq(notifications.is_read, false)
        )
      );
    return parseInt(result[0]?.count || 0);
  },
};
