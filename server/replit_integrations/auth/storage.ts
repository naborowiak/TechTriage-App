import { db } from "../../db";
import { usersTable, type User, type InsertUser } from "../../../shared/schema/schema";
import { eq } from "drizzle-orm";

export const authStorage = {
  async getUser(id: string): Promise<User | null> {
    const result = await db.select().from(usersTable).where(eq(usersTable.id, id));
    return result[0] || null;
  },

  async upsertUser(userData: {
    id: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    profileImageUrl?: string;
  }): Promise<{ user: User; isNewUser: boolean }> {
    const existingUser = await this.getUser(userData.id);

    if (existingUser) {
      await db
        .update(usersTable)
        .set({
          email: userData.email || existingUser.email,
          firstName: userData.firstName || existingUser.firstName,
          lastName: userData.lastName || existingUser.lastName,
          profileImageUrl: userData.profileImageUrl || existingUser.profileImageUrl,
          updatedAt: new Date(),
        })
        .where(eq(usersTable.id, userData.id));
      return { user: (await this.getUser(userData.id))!, isNewUser: false };
    } else {
      const newUser: InsertUser = {
        id: userData.id,
        email: userData.email || null,
        firstName: userData.firstName || null,
        lastName: userData.lastName || null,
        profileImageUrl: userData.profileImageUrl || null,
      };
      await db.insert(usersTable).values(newUser);
      return { user: (await this.getUser(userData.id))!, isNewUser: true };
    }
  },
};
