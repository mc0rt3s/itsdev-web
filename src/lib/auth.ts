import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import prisma from './prisma';
import { authConfig } from './auth.config';

// Dummy hash: bcrypt de "dummy-password-never-matches" con salt 10
// Usado para prevenir user enumeration por timing en login
const DUMMY_HASH = '$2b$10$7YDKJ/3K2Z/6K0Z/6K0Z6uZzKZf6K0Z/6K0Z6K0Z6K0Z6K0Z6K0Z6';

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        // Usar dummy hash si el usuario no existe para mantener timing consistente
        const passwordHashToCheck = user?.password ?? DUMMY_HASH;

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          passwordHashToCheck
        );

        // Retornar null en ambos casos: usuario no existe o contraseña inválida
        if (!user || !isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
});
