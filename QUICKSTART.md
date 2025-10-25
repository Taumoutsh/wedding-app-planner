# Quick Start Guide

Get your Wedding Planner app up and running in 5 minutes!

## Step 1: Install Dependencies

```bash
# Install root dependencies
npm install

# Install all workspace dependencies
cd shared && npm install && cd ..
cd server && npm install && cd ..
cd client && npm install && cd ..
```

## Step 2: Configure Environment

```bash
cd server
cp .env.example .env
```

The default `.env` settings work out of the box. No changes needed for local development!

## Step 3: Set Up Database

```bash
cd server

# Generate Prisma client
npx prisma generate

# Create and migrate database
npx prisma migrate dev --name init
```

## Step 4: Create Your First User

```bash
cd server
npm run create-user
```

Enter your desired username and password when prompted.

Example:
```
Enter username: admin
Enter password: password123
```

## Step 5: Start the Application

From the root directory:

```bash
npm run dev
```

This starts both the backend (port 3001) and frontend (port 3000).

## Step 6: Open in Browser

Navigate to: **http://localhost:3000**

Log in with the credentials you just created!

## Next Steps

1. Create your first category (e.g., "Venue")
2. Add a task to the category (e.g., "Book venue")
3. Add subtasks with progress percentages (e.g., "Research venues - 100%")
4. Watch the weighted averages calculate automatically!

## Troubleshooting

**Port already in use?**
- Frontend: Edit `client/vite.config.ts` to change the port
- Backend: Edit `server/.env` and change the PORT value

**Database errors?**
```bash
cd server
rm -f prisma/dev.db
npx prisma migrate dev
npm run create-user
```

**Module not found?**
```bash
cd shared
npm run build
```

## Need Help?

Check out the full [README.md](README.md) for detailed documentation.
