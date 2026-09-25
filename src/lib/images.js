export function getProductImages(product) {
  if (Array.isArray(product?.images) && product.images.length > 0) return product.images.filter(Boolean);
  return product?.image_url ? [product.image_url] : [];
}

export function normalizeImageList(images) {
  if (!Array.isArray(images)) return [];
  return images.map((image) => String(image).trim()).filter(Boolean);
}
