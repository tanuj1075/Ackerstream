import bcrypt from 'bcryptjs';

export class AuthService {
  constructor(db) {
    this.db = db;
  }

  async registerUser(email, password) {
    // Check if user already exists
    const existing = await this.db.get('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) {
      throw new Error('User already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user into SQLite using raw SQL
    const result = await this.db.run(
      'INSERT INTO users (email, password) VALUES (?, ?)',
      [email, hashedPassword]
    );

    return { id: result.lastID, email };
  }

  async loginUser(email, password) {
    // Find user
    const user = await this.db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error('Invalid email or password');
    }

    return { id: user.id, email: user.email };
  }
}
