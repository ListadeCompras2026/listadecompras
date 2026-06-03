import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const mongoose = await connectToDatabase()
    const db = mongoose.connection.db

    if (!db) {
      throw new Error('Conexao sem referencia de banco')
    }

    const pingResult = await db.admin().ping()

    return NextResponse.json({
      ok: true,
      database: mongoose.connection.name,
      ping: pingResult.ok === 1,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Falha ao conectar no MongoDB',
      },
      { status: 500 }
    )
  }
}
