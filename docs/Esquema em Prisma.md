generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite" // Pode ser alterado para postgresql posteriormente
  url      = env("DATABASE_URL")
}

model User {
  id           String        @id @default(cuid())
  name         String
  email        String        @unique
  phone        String?
  cpf          String?       @unique
  passwordHash String
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
  appointments Appointment[]
}

model Service {
  id          String        @id @default(cuid())
  name        String
  description String?
  price       Float
  duration    Int           @default(30) // Em minutos
  createdAt   DateTime      @default(now())
  appointments Appointment[]
}

model Appointment {
  id        String   @id @default(cuid())
  date      DateTime
  status        String   @default("PENDING") // PENDING, CONFIRMED, CANCELLED, COMPLETED
  paymentStatus String   @default("PENDING") // PENDING, PAID, FAILED
  paymentId     String?  // ID da transação no PagSeguro
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  userId    String
  user      User     @relation(fields: [userId], references: [id])
  
  serviceId String
  service   Service  @relation(fields: [serviceId], references: [id])
}
