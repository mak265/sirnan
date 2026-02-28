export async function imageUrlToPngDataUrl(url: string): Promise<string> {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to load image')
  const blob = await res.blob()

  const objectUrl = URL.createObjectURL(blob)
  try {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas')
          canvas.width = img.naturalWidth || img.width
          canvas.height = img.naturalHeight || img.height
          const ctx = canvas.getContext('2d')
          if (!ctx) throw new Error('Canvas not supported')
          ctx.drawImage(img, 0, 0)
          resolve(canvas.toDataURL('image/png'))
        } catch (e) {
          reject(e)
        }
      }
      img.onerror = () => reject(new Error('Image decode failed'))
      img.src = objectUrl
    })
    return dataUrl
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

