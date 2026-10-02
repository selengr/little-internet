import { NextRequest, NextResponse } from 'next/server'
import { createConversionJob, getJobStatus } from '@/lib/cloudconvert'
import { checkRateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

export async function POST(request: NextRequest) {
  const limited = checkRateLimit(request, {
    key: 'convert',
    limit: 10,
    windowMs: 60_000,
  })
  if (limited) return limited

  try {
    const formData = await request.formData()
    const file = formData.get('file')
    const outputFormat = formData.get('output_format')?.toString()?.trim()

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    if (!outputFormat) {
      return NextResponse.json({ error: 'Output format is required' }, { status: 400 })
    }
    if (file.size > 25 * 1024 * 1024) {
      return NextResponse.json({ error: 'File must be under 25 MB' }, { status: 400 })
    }

    const { jobId, status } = await createConversionJob(file, outputFormat)
    return NextResponse.json({ jobId, status })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Conversion failed to start'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}

export async function GET(request: NextRequest) {
  const jobId = request.nextUrl.searchParams.get('jobId')
  if (!jobId) {
    return NextResponse.json({ error: 'jobId is required' }, { status: 400 })
  }

  try {
    const status = await getJobStatus(jobId)
    return NextResponse.json(status)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to check job status'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
