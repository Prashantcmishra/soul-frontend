const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

// Convert base64 VAPID key to Uint8Array
const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return new Uint8Array([...rawData].map((char) => char.charCodeAt(0)))
}

export const registerPush = async (api) => {
  try {
    // Check browser support
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('Push not supported')
      return false
    }

    // Register service worker
    const reg = await navigator.serviceWorker.register('/sw.js')
    await navigator.serviceWorker.ready

    // Ask permission
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      console.log('Push permission denied')
      return false
    }

    // Check existing subscription
    let subscription = await reg.pushManager.getSubscription()

    // Create new subscription if none
    if (!subscription) {
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      })
    }

    // Send subscription to backend
    await api.post('/push/subscribe', { subscription })
    console.log('Push registered ✅')
    return true
  } catch (err) {
    console.error('Push registration error:', err)
    return false
  }
}

export const unregisterPush = async (api) => {
  try {
    if (!('serviceWorker' in navigator)) return

    await api.delete('/push/unsubscribe')

    const reg = await navigator.serviceWorker.getRegistration()
    if (reg) {
      const subscription = await reg.pushManager.getSubscription()
      if (subscription) await subscription.unsubscribe()
    }
  } catch (err) {
    console.error('Push unregister error:', err)
  }
}