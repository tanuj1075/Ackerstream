import bcrypt from 'bcryptjs';

export class AuthService {
  constructor(db) {
    this.db = db;
  }

  async registerUser(email, password) {
    const existing = await this.db.get('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) {
      throw new Error('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await this.db.run(
      "INSERT INTO users (email, password, role) VALUES (?, ?, 'user')",
      [email, hashedPassword]
    );

    return { id: result.lastID, email, role: 'user' };
  }

  async loginUser(email, password) {
    const user = await this.db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    if (user.is_blocked) {
      throw new Error('This account is blocked. Contact support.');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error('Invalid email or password');
    }

    return { id: user.id, email: user.email, role: user.role };
  }
}
