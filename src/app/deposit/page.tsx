import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getAppBranding } from '@/config/appBranding'
import DepositClient from './DepositClient'

export default async function DepositPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const appCode = typeof params.app === 'string' ? params.app : 'wallet'
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    // Redirect to login with next parameter
    redirect(`/?next=/deposit?app=${appCode}`)
  }

  const branding = getAppBranding(appCode)

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <DepositClient branding={branding} appCode={appCode} />
      </div>
    </div>
  )
}
