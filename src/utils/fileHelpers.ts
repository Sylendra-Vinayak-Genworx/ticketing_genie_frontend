export function cleanFileName(name: string): string {
  return name.replace(/^[0-9a-f]{32}_/i, '').replace(/_/g, ' ')
}

export function isImageFile(name: string): boolean {
  return /\.(jpe?g|png|gif|webp)$/i.test(name)
}
