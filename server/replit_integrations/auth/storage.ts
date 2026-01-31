import { db } from "../../db";
import { usersTable, type User, type InsertUser } from "../../../shared/schema/schema";
import { eq } from "drizzle-orm";

export const authStorage = {
  async getUser(id: string): Promise<User | null> {
    const result = await db.select().from(usersTable).where(eq(usersTable.id, id));
    return result[0] || null;
  },

  async getUserByEmail(email: string): Promise<User | null> {
    const result = await db.select().from(usersTable).where(eq(usersTable.email, email));
    return result[0] || null;
  },

  async upsertUser(userData: {
    id: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    profileImageUrl?: string;
  }): Promise<{ user: User; isNewUser: boolean }> {
    // First, check if user exists by Google ID
    let existingUser = await this.getUser(userData.id);

    // If not found by ID, check by email (handles case where user registered with email/password first)
    if (!existingUser && userData.email) {
      existingUser = await this.getUserByEmail(userData.email);
    }

    if (existingUser) {
      // Update existing user - always use the existing user's ID to maintain consistency
      await db
        .update(usersTable)
        .set({
          email: userData.email || existingUser.email,
          firstName: userData.firstName || existingUser.firstName,
          lastName: userData.lastName || existingUser.lastName,
          profileImageUrl: userData.profileImageUrl || existingUser.profileImageUrl,
          updatedAt: new Date(),
        })
        .where(eq(usersTable.id, existingUser.id));
      return { user: (await this.getUser(existingUser.id))!, isNewUser: false };
    } else {
      // Create new user - email is required for new users
      if (!userData.email) {
        throw new Error("Email is required for new user registration");
      }
      const newUser: InsertUser = {
        id: userData.id,
        email: userData.email,
        firstName: userData.firstName || null,
        lastName: userData.lastName || null,
        profileImageUrl: userData.profileImageUrl || null,
      };
      await db.insert(usersTable).values(newUser);
      return { user: (await this.getUser(userData.id))!, isNewUser: true };
    }
  },
};
