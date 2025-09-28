# MyCopingMechanism Backend

The **backend API** for the MyCopingMechanism platform — a mental wellness and self‑care application.  
Built with **Express.js** and **PostgreSQL**, featuring JWT‑based authentication, real‑time messaging with Socket.IO, and secure REST endpoints.

---

## ✨ Features

- **Authentication**: Secure registration/login with hashed passwords (bcrypt) and JWT tokens.  
- **Users**: Role‑based access (admin/user).  
- **Posts & Comments**: CRUD operations with ownership checks.  
- **Daily Reflections**: 
  - Rotating daily prompts.  
  - Real‑time reflections (create, edit, delete) using Socket.IO.  
  - Ownership enforced with JWT.  
- **Sections CMS**: About, Hobbies, Nutrition, OT‑Things.  
- **Contact Form**: Email sending via Nodemailer.  
- **CORS Control**: Development + production origins allowlisted.  
- **Database Integrity**: 
  - Foreign keys with cascading deletes.  
  - Reflection messages tied to valid users only.  

---

## 🛠 Tech Stack

- **Runtime**: Node.js (Express.js)  
- **Database**: PostgreSQL  
- **Authentication**: bcrypt, JWT  
- **Real‑Time**: Socket.IO  
- **Email**: Nodemailer  
- **Env Management**: dotenv  
- **Other**: pg (connection pooling), CORS middleware  

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/your-username/MyCopingMechanism-backend.git
cd MyCopingMechanism-backend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment
Create a `.env` file in the project root:

```env
# App
PORT=5050
CLIENT_ORIGIN=http://localhost:5173

# Database
PGUSER=your_pg_user
PGPASSWORD=your_pg_password
PGHOST=localhost
PGPORT=5432
PGDATABASE=mycopingmechanism

# Auth
JWT_SECRET=your_jwt_secret

# Mailer
EMAIL_HOST=smtp.yourprovider.com
EMAIL_PORT=587
EMAIL_USER=your_email
EMAIL_PASS=your_password
```

### 4. Set up the database
Run migrations/schema and seed:

```bash
psql -U your_pg_user -d mycopingmechanism -f db/schema.sql
node db/seed.js
```

### 5. Start the server
```bash
node server.js
```
The backend will run on [http://localhost:5050](http://localhost:5050) by default.

---

## 📡 API Overview

### Auth
- `POST /api/auth/register` – Register new user  
- `POST /api/auth/login` – Authenticate and receive JWT  

### Users
- `GET /api/users/:id` – Fetch user profile  
- `PATCH /api/users/:id` – Update user (self or admin only)  

### Posts
- `GET /api/posts` – Fetch all posts  
- `POST /api/posts` – Create post (requires auth)  
- `PATCH /api/posts/:id` – Edit post (owner/admin)  
- `DELETE /api/posts/:id` – Delete post (owner/admin)  

### Comments
- `POST /api/comments` – Add comment to post (requires auth)  
- `DELETE /api/comments/:id` – Delete comment (owner/admin)  

### Reflections
- `GET /api/reflections/today` – Get/create today’s daily prompt  
- `GET /api/reflections/today/messages` – Get all reflections for today  
- `PATCH /api/reflections/messages/:id` – Edit reflection (owner/admin)  
- `DELETE /api/reflections/messages/:id` – Delete reflection (owner/admin)  

### Sections (CMS)
- `GET /api/sections/:key` – Get section content  
- `PATCH /api/sections/:key` – Update section (admin only)  

### Contact
- `POST /api/contact` – Send contact form email  

---

## 🔗 Socket.IO Events

- `reflections:joinToday` – Join today’s reflections room  
- `reflections:messageToday` – Add new reflection  
- `reflections:message:update` – Edit reflection  
- `reflections:message:delete` – Delete reflection  

---

## 🧪 Testing

Use Postman/Insomnia or curl to verify routes.  
JWT must be included as `Authorization: Bearer <token>` for protected routes.

---

## 🌱 Future Enhancements

- Admin dashboard for managing prompts, posts, and users.  
- Rich‑text editor for reflections (with BlockModal).  
- Notification system (email + in‑app).  
- Analytics for reflections and post engagement.  
- **Glassmorphic‑inspired API dashboard** (for future admin panel UI).  

---

## 📄 License

This project is for portfolio and educational purposes.  
Contact Claudia Arias for professional use or collaboration.
