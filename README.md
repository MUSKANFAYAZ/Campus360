🚀 Campus360: Smart University Dashboard
Campus360 is a full-stack MERN (MongoDB, Express, React, Node.js) web application built to be a "one-stop-shop" for college students, faculty, and clubs. It replaces scattered WhatsApp groups and notice boards with a single, easy-to-use platform.

✨ Core Features

- Secure Authentication:

  - Full login and registration system using secure passwords (JWT + bcrypt).
    <br>
  - Google OAuth: Sign in or register with a single click using your Google account.
    <br>
  - Password Reset: A secure "Forgot Password" flow using SendGrid to email a reset link.

- Role-Based Dashboards:

  - When a user logs in, the app shows them a dashboard specific to their role: Student, Faculty, or Club.
    <br>
  - New users go through a one-time "Select Your Role" setup.

- Student Dashboard:

  - Attendance Tracker: A "Bunkwell-style" tracker. Students add their subjects and can mark daily attendance ("Present", "Absent", "Cancelled", "Extra").
    <br>
  - Smart Stats: Automatically calculates attendance percentage and "bunks left" to stay above the user's goal.
    <br>
  - Campus Feed: A central page to see all official notices and club announcements in one place.
    <br>
  - Club Directory: A page to browse all clubs and "Follow" or "Unfollow" them.

- Club Dashboard (for Club Reps):

  - Club Profile: A "Create Club Profile" form for new club reps to register their club (name, description, team members, etc.).
    <br>
  - Content Management: Club reps can post new announcements and create events for their followers.
    <br>
  - Follower Management: A dedicated page to see the list of all students following the club.
    <br>
  - Club Settings: A page to update the club's profile or delete the club.

- 🛠️ Tech Stack
- Frontend: React (using Vite for a fast development environment)
  <br>
- Backend: Node.js & Express (for building the REST API)
  <br>
- Database: MongoDB (with Mongoose to manage the data)
  <br>
- Authentication: JSON Web Tokens (JWT) & Google OAuth
  <br>
- Email Service: SendGrid (for password reset emails)
  <br>

- ⚙️ How to Run

  1.Backend:

  cd backend

  npm install

Create a .env file (copy .env.example if you have one) and add your MONGO_URI, JWT_SECRET, etc.

npm run dev (This will run the server, usually on localhost:5000)
