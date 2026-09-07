export const dynamic = 'force-dynamic'

export async function GET() {
  return new Response('Kimai integration has been deprecated.', { status: 410 })
}
