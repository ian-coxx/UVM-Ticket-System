import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')
  const origin = requestUrl.origin

  console.log('Auth callback called:', { code: code ? 'present' : 'missing', error, errorDescription })

  // Handle errors from Supabase
  if (error) {
    console.error('Auth error from Supabase:', error, errorDescription)
    const errorUrl = new URL(`${origin}/login`)
    errorUrl.searchParams.set('error', error)
    errorUrl.searchParams.set('error_description', errorDescription || 'Authentication failed')
    return NextResponse.redirect(errorUrl)
  }

  if (!code) {
    console.error('No code parameter in callback URL')
    const errorUrl = new URL(`${origin}/login`)
    errorUrl.searchParams.set('error', 'no_code')
    errorUrl.searchParams.set('error_description', 'No authentication code provided')
    return NextResponse.redirect(errorUrl)
  }

  try {
    const supabase = await createClient()
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (exchangeError) {
      console.error('Error exchanging code for session:', exchangeError)
      const errorUrl = new URL(`${origin}/login`)
      errorUrl.searchParams.set('error', 'exchange_failed')
      errorUrl.searchParams.set('error_description', exchangeError.message || 'Failed to exchange code for session')
      return NextResponse.redirect(errorUrl)
    }

      if (data?.user) {
      console.log('User authenticated successfully:', data.user.email, 'ID:', data.user.id)
      
      // Check if user profile exists, create if it doesn't
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single()

      console.log('Profile check result:', { userProfile, profileError: profileError?.code, profileErrorMsg: profileError?.message })

      if (profileError && (profileError.code === 'PGRST116' || profileError.message?.includes('No rows'))) {
        // User profile doesn't exist, try to create it
        console.log('User profile not found, creating...')
        const userEmail = data.user.email || ''
        const userName = data.user.user_metadata?.name || data.user.email?.split('@')[0] || null
        
        console.log('Inserting user profile:', { id: data.user.id, email: userEmail, name: userName })
        
        const { data: insertedUser, error: insertError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: userEmail,
            name: userName,
            role: 'user',
            department: 'student',
          })
          .select()
          .single()

        if (insertError) {
          console.error('Error creating user profile:', insertError)
          console.error('Insert error details:', JSON.stringify(insertError, null, 2))
          // Don't fail auth if profile creation fails, just log it
        } else {
          console.log('User profile created successfully:', insertedUser)
        }
      } else if (profileError) {
        console.error('Error checking user profile:', profileError)
      } else {
        console.log('User profile already exists:', userProfile)
      }
    }

    // URL to redirect to after sign in process completes
    return NextResponse.redirect(`${origin}/`)
  } catch (err: any) {
    console.error('Unexpected error in auth callback:', err)
    const errorUrl = new URL(`${origin}/login`)
    errorUrl.searchParams.set('error', 'unexpected_error')
    errorUrl.searchParams.set('error_description', err.message || 'An unexpected error occurred')
    return NextResponse.redirect(errorUrl)
  }
}
