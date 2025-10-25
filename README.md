# Wedding Planner Application

A full-stack web application for organizing and tracking wedding planning tasks with real-time progress tracking.

## Features

- User authentication with encrypted passwords
- Create and manage categories, tasks, and subtasks
- Weighted average progress tracking
- Responsive design for mobile and desktop
- Modal-based editing interface
- Cascade deletion with confirmation dialogs
- Real-time progress visualization

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite (build tool)
- Tailwind CSS (styling)
- Axios (HTTP client)

### Backend
- Node.js with Express
- TypeScript
- Prisma ORM
- SQLite database
- bcrypt (password encryption)
- JWT (authentication)

## Project Structure

```
wedding-planner-app/
├── client/          # React frontend
├── server/          # Express backend
├── shared/          # Shared TypeScript types
└── CLAUDE.md        # Project specifications
```

## Prerequisites

- Node.js 18+ and npm
- Git (optional)

## Installation

1. Clone or navigate to the project directory:
```bash
cd wedding-planner-app
```

2. Install root dependencies:
```bash
npm install
```

3. Install dependencies for all packages:
```bash
cd shared && npm install && cd ..
cd server && npm install && cd ..
cd client && npm install && cd ..
```

4. Set up the server environment:
```bash
cd server
cp .env.example .env
```

Edit the `.env` file if needed. Default values:
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-key-change-this-in-production"
PORT=3001
```

5. Generate Prisma client and create the database:
```bash
cd server
npx prisma generate
npx prisma migrate dev --name init
```

6. Create a default user account:

You'll need to create a user manually. You can do this by creating a seed script or using Prisma Studio:

```bash
cd server
npx prisma studio
```

Then manually create a user in the `users` table. For the password, you'll need to hash it with bcrypt. Here's a quick Node.js script to generate a hashed password:

```javascript
// Create a file: server/scripts/hash-password.js
const bcrypt = require('bcrypt');

const password = 'your-password-here';
bcrypt.hash(password, 10).then(hash => {
  console.log('Hashed password:', hash);
});
```

Run it:
```bash
node server/scripts/hash-password.js
```

Copy the hashed password and create a user in Prisma Studio with:
- username: `admin` (or your choice)
- password: (the hashed password from above)

## Running the Application

### Development Mode

From the root directory, run both frontend and backend simultaneously:

```bash
npm run dev
```

This will start:
- Backend server on http://localhost:3001
- Frontend development server on http://localhost:3000

Or run them separately:

```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev
```

### Production Build

Build all packages:

```bash
npm run build
```

Start the production server:

```bash
cd server
npm start
```

The frontend build will be in `client/dist` and needs to be served by a web server.

## Usage

1. Open http://localhost:3000 in your browser
2. Log in with your created credentials
3. Create categories for different aspects of your wedding (e.g., "Venue", "Catering", "Photography")
4. Add tasks within each category (e.g., "Book venue", "Menu tasting")
5. Create subtasks with progress percentages and weights
6. Watch the weighted averages automatically calculate across tasks and categories

## Database Management

### View/Edit Data
```bash
cd server
npx prisma studio
```

### Reset Database
```bash
cd server
npx prisma migrate reset
```

### Create New Migration
```bash
cd server
npx prisma migrate dev --name migration_name
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with username and password

### Categories
- `GET /api/categories` - Get all categories with tasks and subtasks
- `POST /api/categories` - Create a new category
- `PUT /api/categories/:id` - Update a category
- `DELETE /api/categories/:id` - Delete a category (cascade)

### Tasks
- `POST /api/tasks` - Create a new task
- `PUT /api/tasks/:id` - Update a task
- `DELETE /api/tasks/:id` - Delete a task (cascade)

### Subtasks
- `POST /api/subtasks` - Create a new subtask
- `PUT /api/subtasks/:id` - Update a subtask
- `DELETE /api/subtasks/:id` - Delete a subtask

All endpoints except `/api/auth/login` require JWT authentication via the `Authorization: Bearer <token>` header.

## Development

### Shared Types

The `shared` package contains TypeScript interfaces used by both frontend and backend. After modifying types:

```bash
cd shared
npm run build
```

### Adding Dependencies

For shared types:
```bash
cd shared
npm install <package>
```

For backend:
```bash
cd server
npm install <package>
```

For frontend:
```bash
cd client
npm install <package>
```

## Troubleshooting

### Port Already in Use

If port 3000 or 3001 is already in use, you can change them:
- Frontend: Edit `client/vite.config.ts`
- Backend: Edit `server/.env` (PORT variable)

### Database Issues

If you encounter database errors, try resetting:
```bash
cd server
rm -f prisma/dev.db
npx prisma migrate dev
```

### Module Not Found Errors

Ensure all packages are built:
```bash
cd shared && npm run build
```

## License

MIT
