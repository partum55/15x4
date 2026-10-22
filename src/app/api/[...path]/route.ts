// Demo branch: single catch-all replacing all Supabase-backed API routes.
import type { NextRequest } from 'next/server'
import { handleDemoApi } from '@/lib/demo-api'

type Ctx = { params: Promise<{ path: string[] }> }

const handler = async (req: NextRequest, { params }: Ctx) => handleDemoApi(req, (await params).path)

export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE }
