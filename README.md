
# MERN Task Manager

A full-stack Task Manager application built using the MERN stack with JWT authentication and MongoDB.

## Features

- User registration and login
- Password hashing using bcryptjs
- JWT-based authentication
- Protected user workspace
- Create, read, update and delete tasks
- Mark tasks as completed
- Task priority levels
- Due dates
- Search and filtering
- Sorting
- Task statistics dashboard
- Responsive React UI
- MongoDB database with Mongoose

## Tech Stack

### Frontend
- React
- Vite
- JavaScript
- CSS

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- bcryptjs
- CORS
- dotenv

## Project Structure

```text
task-manager-mern/
├── frontend/
│   ├── src/
│   ├── package.json
│   └── ...
├── backend/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── .env
│   ├── server.js
│   └── package.json
├── package.json
└── README.md

```
## Authentication Flow

1. User registers with name, email and password.
2. Password is securely hashed using bcryptjs.
3. User logs in with email and password.
4. Backend verifies the password and generates a JWT token.
5. Frontend stores the authentication token.
6. Protected API requests send the token using the Authorization header.
7. Backend middleware verifies the JWT and identifies the logged-in user.

## API Endpoints

Authentication
Method	Endpoint	Description
POST	/api/auth/register	Register a new user
POST	/api/auth/login	Login user


## Tasks

Method	Endpoint	Description
GET	/api/tasks	Get user's tasks
POST	/api/tasks	Create a task
PUT	/api/tasks/:id	Update a task
DELETE	/api/tasks/:id	Delete a task


## Database Schema
User
- name
- email
- password
- createdAt
- updatedAt
Task
- title
- description
- completed
- priority
- dueDate
- user
- createdAt
- updatedAt
Each task is associated with a specific user so users can only access their own tasks.
##Local Setup
- Backend
cd backend
npm install
Create a .env file:
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=5001
Start the backend:
npm start
- Frontend
Open another terminal:
cd frontend
npm install
npm run dev
The frontend will run on the Vite development server.

## Environment Variables

Do not commit .env files or database credentials to GitHub.
Required backend variables:
MONGO_URI
JWT_SECRET
PORT
- Frontend:
VITE_API_URL

## State Management

The React frontend manages authentication and task data using React state and browser localStorage. The JWT token is used for authenticated API requests, while task state is updated dynamically after create, update, complete and delete operations.

## Deployment

- Frontend
Hosted using Vercel.
- Backend
Hosted using Render.

## Database

MongoDB Atlas.

## Live Demo

- Frontend:
https://task-manager-mern-gamma.vercel.app/

## Backend API:

https://task-manager-mern-v4e1.onrender.com

## GitHub Repository

https://github.com/ASCE-88/task-manager-mern

## License

This project was developed as an internship project.
