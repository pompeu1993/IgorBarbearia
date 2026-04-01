generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql" // Refletindo o uso do Supabase
  url      = env("DATABASE_URL")
}

// Extensão do usuário autenticado no Supabase (auth.users)
model Profile {
  id         String   @id @default(uuid()) // Referência para auth.users(id)
  name       String?
  phone      String?
  cpf        String?  @unique
  avatarUrl  String?  @map("avatar_url")
  role       String?  @default("client") // 'admin' ou 'client'
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")

  appointments Appointment[]

  @@map("profiles")
}

// Serviços oferecidos
model Service {
  id          String   @id @default(uuid())
  name        String
  description String?
  price       Float    // Representando o tipo NUMERIC do postgres
  duration    Int      @default(30) // Em minutos
  createdAt   DateTime @default(now()) @map("created_at")

  appointments Appointment[]

  @@map("services")
}

// Agendamentos
model Appointment {
  id            String   @id @default(uuid())
  date          DateTime
  status        String   @default("PENDING") // PENDING, CONFIRMED, CANCELLED, COMPLETED
  paymentStatus String   @default("PENDING") @map("payment_status") // PENDING, PAID, FAILED, CANCELLED
  paymentId     String?  @map("payment_id") // ID da transação no Asaas
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  userId    String   @map("user_id")
  user      Profile  @relation(fields: [userId], references: [id])
  
  serviceId String   @map("service_id")
  service   Service  @relation(fields: [serviceId], references: [id])

  @@map("appointments")
}

// Configurações globais do sistema
model Setting {
  id                 Int      @id @default(autoincrement())
  allowRescheduling  Boolean? @default(true) @map("allow_rescheduling")
  operatingDays      Json?    @default("[1, 2, 3, 4, 5, 6]") @map("operating_days") // 0=Domingo, 1=Segunda...
  disabledDates      Json?    @default("[]") @map("disabled_dates") // Datas específicas bloqueadas
  updatedAt          DateTime @updatedAt @map("updated_at")

  @@map("settings")
}
