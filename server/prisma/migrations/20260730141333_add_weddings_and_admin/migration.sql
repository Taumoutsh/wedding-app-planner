-- CreateTable
CREATE TABLE "weddings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Seed a default wedding to hold all pre-existing data. Every existing user and
-- category is attached to it so nothing is orphaned by the new required scoping.
INSERT INTO "weddings" ("id", "name", "createdAt") VALUES (1, 'Mariage', CURRENT_TIMESTAMP);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_categories" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "weddingId" INTEGER NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "categories_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "weddings" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_categories" ("createdAt", "id", "name", "position", "updatedAt", "weddingId") SELECT "createdAt", "id", "name", "position", "updatedAt", 1 FROM "categories";
DROP TABLE "categories";
ALTER TABLE "new_categories" RENAME TO "categories";
CREATE TABLE "new_users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "weddingId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "users_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "weddings" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_users" ("createdAt", "id", "password", "username", "weddingId") SELECT "createdAt", "id", "password", "username", 1 FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
